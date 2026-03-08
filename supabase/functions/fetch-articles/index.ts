const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Article {
  id: string;
  title: string;
  content_type: 'article';
  summary: string;
  key_insights: string[];
  tags: string[];
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  estimated_read_time: string;
  engagement_score: number;
  source: string;
  author: string;
  published_at: string;
  url: string;
  image?: string;
}

async function fetchDevTo(): Promise<Article[]> {
  try {
    const response = await fetch('https://dev.to/api/articles?tag=ai&per_page=10');
    if (!response.ok) return [];
    
    const data = await response.json();
    return data.map((article: any) => ({
      id: `devto-${article.id}`,
      title: article.title,
      content_type: 'article' as const,
      summary: article.description || 'No description available',
      key_insights: article.tag_list?.slice(0, 3).map((tag: string) => `Tagged with ${tag}`) || [],
      tags: article.tag_list || [],
      difficulty_level: getDifficultyFromTags(article.tag_list || []),
      estimated_read_time: `${article.reading_time_minutes || 5} min`,
      engagement_score: Math.min(100, Math.floor((article.public_reactions_count || 0) / 10) + 50),
      source: 'Dev.to',
      author: article.user?.name || article.user?.username || 'Unknown',
      published_at: article.published_at?.split('T')[0] || new Date().toISOString().split('T')[0],
      url: article.url,
      image: article.cover_image || article.social_image,
    }));
  } catch (error) {
    console.error('Error fetching Dev.to:', error);
    return [];
  }
}

async function fetchHackerNews(): Promise<Article[]> {
  try {
    const topStoriesRes = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json');
    if (!topStoriesRes.ok) return [];
    
    const topStoryIds = await topStoriesRes.json();
    const storyPromises = topStoryIds.slice(0, 10).map(async (id: number) => {
      const storyRes = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
      return storyRes.json();
    });
    
    const stories = await Promise.all(storyPromises);
    
    return stories
      .filter((story: any) => story && story.title && (story.url || story.text))
      .map((story: any) => ({
        id: `hn-${story.id}`,
        title: story.title,
        content_type: 'article' as const,
        summary: story.text?.slice(0, 200) || `Discussion on Hacker News with ${story.descendants || 0} comments`,
        key_insights: [
          `${story.score || 0} points`,
          `${story.descendants || 0} comments`,
          `Posted by ${story.by || 'anonymous'}`
        ],
        tags: ['Hacker News', 'Tech', 'Discussion'],
        difficulty_level: 'intermediate' as const,
        estimated_read_time: '5 min',
        engagement_score: Math.min(100, Math.floor((story.score || 0) / 5) + 50),
        source: 'Hacker News',
        author: story.by || 'anonymous',
        published_at: new Date(story.time * 1000).toISOString().split('T')[0],
        url: story.url || `https://news.ycombinator.com/item?id=${story.id}`,
      }));
  } catch (error) {
    console.error('Error fetching Hacker News:', error);
    return [];
  }
}

function getDifficultyFromTags(tags: string[]): 'beginner' | 'intermediate' | 'advanced' {
  const advancedKeywords = ['advanced', 'deep-learning', 'neural-network', 'transformer', 'research'];
  const beginnerKeywords = ['beginner', 'tutorial', 'introduction', 'getting-started', 'basics'];
  
  const lowerTags = tags.map(t => t.toLowerCase());
  
  if (advancedKeywords.some(k => lowerTags.includes(k))) return 'advanced';
  if (beginnerKeywords.some(k => lowerTags.includes(k))) return 'beginner';
  return 'intermediate';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const [devToArticles, hackerNewsArticles] = await Promise.all([
      fetchDevTo(),
      fetchHackerNews()
    ]);

    const allArticles = [...devToArticles, ...hackerNewsArticles]
      .sort((a, b) => b.engagement_score - a.engagement_score);

    return new Response(
      JSON.stringify({ success: true, data: allArticles }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching articles:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to fetch articles' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
