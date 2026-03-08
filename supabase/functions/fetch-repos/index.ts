const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Repo {
  id: string;
  title: string;
  content_type: 'repo';
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
  stars: number;
  forks: number;
  language: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const query = url.searchParams.get('query') || 'artificial intelligence machine learning';
    
    const response = await fetch(
      `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=15`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'LumenFeed-AI'
        }
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('GitHub API error:', errorText);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to fetch repositories' }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    
    const repos: Repo[] = data.items?.map((repo: any) => ({
      id: `gh-${repo.id}`,
      title: repo.full_name,
      content_type: 'repo' as const,
      summary: repo.description || 'No description available',
      key_insights: [
        `${formatNumber(repo.stargazers_count)} stars`,
        `${formatNumber(repo.forks_count)} forks`,
        repo.license?.name || 'No license specified'
      ].filter(Boolean),
      tags: repo.topics?.slice(0, 5) || [repo.language].filter(Boolean),
      difficulty_level: getDifficultyFromRepo(repo),
      estimated_read_time: `${Math.ceil(repo.size / 100)} min`,
      engagement_score: Math.min(100, Math.floor(Math.log10(repo.stargazers_count + 1) * 20)),
      source: 'GitHub',
      author: repo.owner?.login || 'Unknown',
      published_at: repo.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
      url: repo.html_url,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      language: repo.language || 'Unknown'
    })) || [];

    return new Response(
      JSON.stringify({ success: true, data: repos }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching repos:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to fetch repositories' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

function getDifficultyFromRepo(repo: any): 'beginner' | 'intermediate' | 'advanced' {
  const topics = repo.topics || [];
  const description = (repo.description || '').toLowerCase();
  
  const advancedKeywords = ['research', 'neural', 'deep-learning', 'transformer', 'llm', 'gpt'];
  const beginnerKeywords = ['tutorial', 'beginner', 'example', 'starter', 'template', 'boilerplate'];
  
  if (advancedKeywords.some(k => topics.includes(k) || description.includes(k))) return 'advanced';
  if (beginnerKeywords.some(k => topics.includes(k) || description.includes(k))) return 'beginner';
  return 'intermediate';
}
