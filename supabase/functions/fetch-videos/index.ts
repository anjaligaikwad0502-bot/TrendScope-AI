const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Video {
  id: string;
  title: string;
  content_type: 'video';
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
  thumbnail?: string;
  video_id?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('YOUTUBE_API_KEY');
    
    if (!apiKey) {
      console.error('YOUTUBE_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'YouTube API not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    const query = url.searchParams.get('query') || 'artificial intelligence tutorial';
    
    // Search for videos
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=15&order=relevance&key=${apiKey}`;
    
    const searchResponse = await fetch(searchUrl);
    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error('YouTube API error:', errorText);
      
      // Check if it's a quota error - return curated fallback videos
      if (searchResponse.status === 403 && errorText.includes('quotaExceeded')) {
        console.log('YouTube API quota exceeded, returning curated fallback videos');
        const fallbackVideos = getCuratedFallbackVideos();
        return new Response(
          JSON.stringify({ success: true, data: fallbackVideos, quotaExceeded: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to fetch videos' }),
        { status: searchResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const searchData = await searchResponse.json();
    
    // Get video statistics for engagement scores
    const videoIds = searchData.items?.map((item: any) => item.id.videoId).join(',');
    
    let videoStats: Record<string, any> = {};
    if (videoIds) {
      const statsUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics,contentDetails&id=${videoIds}&key=${apiKey}`;
      const statsResponse = await fetch(statsUrl);
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        videoStats = statsData.items?.reduce((acc: any, item: any) => {
          acc[item.id] = {
            viewCount: parseInt(item.statistics?.viewCount || '0'),
            likeCount: parseInt(item.statistics?.likeCount || '0'),
            duration: item.contentDetails?.duration
          };
          return acc;
        }, {});
      }
    }

    const videos: Video[] = searchData.items?.map((item: any) => {
      const videoId = item.id.videoId;
      const stats = videoStats[videoId] || {};
      const snippet = item.snippet;
      
      return {
        id: `yt-${videoId}`,
        title: snippet.title,
        content_type: 'video' as const,
        summary: snippet.description?.slice(0, 300) || 'No description available',
        key_insights: [
          `${formatNumber(stats.viewCount || 0)} views`,
          `${formatNumber(stats.likeCount || 0)} likes`,
          `By ${snippet.channelTitle}`
        ],
        tags: extractTags(snippet.title, snippet.description),
        difficulty_level: getDifficultyFromContent(snippet.title, snippet.description),
        estimated_read_time: parseDuration(stats.duration),
        engagement_score: calculateEngagement(stats),
        source: 'YouTube',
        author: snippet.channelTitle,
        published_at: snippet.publishedAt?.split('T')[0] || new Date().toISOString().split('T')[0],
        url: `https://www.youtube.com/watch?v=${videoId}`,
        thumbnail: snippet.thumbnails?.high?.url || snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url,
        video_id: videoId
      };
    }) || [];

    return new Response(
      JSON.stringify({ success: true, data: videos }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching videos:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to fetch videos' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

function parseDuration(duration: string | undefined): string {
  if (!duration) return '10 min';
  
  // Parse ISO 8601 duration (PT1H2M3S)
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return '10 min';
  
  const hours = parseInt(match[1] || '0');
  const minutes = parseInt(match[2] || '0');
  const seconds = parseInt(match[3] || '0');
  
  const totalMinutes = hours * 60 + minutes + Math.ceil(seconds / 60);
  return `${totalMinutes} min`;
}

function extractTags(title: string, description: string): string[] {
  const keywords = ['AI', 'Machine Learning', 'Deep Learning', 'Tutorial', 'Python', 'TensorFlow', 'PyTorch', 'GPT', 'LLM', 'Neural Network'];
  const content = `${title} ${description}`.toLowerCase();
  
  return keywords.filter(k => content.includes(k.toLowerCase())).slice(0, 5);
}

function getDifficultyFromContent(title: string, description: string): 'beginner' | 'intermediate' | 'advanced' {
  const content = `${title} ${description}`.toLowerCase();
  
  if (content.includes('beginner') || content.includes('introduction') || content.includes('basics') || content.includes('getting started')) {
    return 'beginner';
  }
  if (content.includes('advanced') || content.includes('deep dive') || content.includes('research') || content.includes('architecture')) {
    return 'advanced';
  }
  return 'intermediate';
}

function calculateEngagement(stats: any): number {
  const views = stats.viewCount || 0;
  const likes = stats.likeCount || 0;
  
  // Calculate engagement based on views and like ratio
  const viewScore = Math.min(50, Math.log10(views + 1) * 10);
  const likeRatio = views > 0 ? (likes / views) * 100 : 0;
  const likeScore = Math.min(50, likeRatio * 10);
  
  return Math.floor(viewScore + likeScore);
}

function getCuratedFallbackVideos(): Video[] {
  // Using real popular AI/ML tutorial video IDs for embedding
  const curatedVideos: Video[] = [
    {
      id: 'yt-i_LwzRVP7bg',
      title: 'Machine Learning for Everybody – Full Course',
      content_type: 'video',
      summary: 'A comprehensive introduction to machine learning concepts for beginners. Learn the fundamentals of ML algorithms, data preprocessing, and model evaluation in this complete course.',
      key_insights: ['Beginner friendly', 'Complete course', 'Hands-on examples'],
      tags: ['Machine Learning', 'AI', 'Tutorial', 'Beginner'],
      difficulty_level: 'beginner',
      estimated_read_time: '240 min',
      engagement_score: 95,
      source: 'YouTube',
      author: 'freeCodeCamp',
      published_at: new Date().toISOString().split('T')[0],
      url: 'https://www.youtube.com/watch?v=i_LwzRVP7bg',
      thumbnail: 'https://img.youtube.com/vi/i_LwzRVP7bg/hqdefault.jpg',
      video_id: 'i_LwzRVP7bg'
    },
    {
      id: 'yt-aircAruvnKk',
      title: 'But what is a Neural Network? | Deep Learning Chapter 1',
      content_type: 'video',
      summary: 'An intuitive visual introduction to neural networks. Understand how neural networks learn patterns from data through beautiful animations and clear explanations.',
      key_insights: ['Visual explanations', 'Neural network basics', 'Mathematical intuition'],
      tags: ['Deep Learning', 'Neural Networks', 'AI'],
      difficulty_level: 'intermediate',
      estimated_read_time: '19 min',
      engagement_score: 98,
      source: 'YouTube',
      author: '3Blue1Brown',
      published_at: new Date().toISOString().split('T')[0],
      url: 'https://www.youtube.com/watch?v=aircAruvnKk',
      thumbnail: 'https://img.youtube.com/vi/aircAruvnKk/hqdefault.jpg',
      video_id: 'aircAruvnKk'
    },
    {
      id: 'yt-zjkBMFhNj_g',
      title: 'Intro to Large Language Models',
      content_type: 'video',
      summary: 'Andrej Karpathy explains the fundamentals of large language models like GPT. Learn about transformers, training, and the future of AI from a leading expert.',
      key_insights: ['LLM fundamentals', 'Transformer architecture', 'Expert insights'],
      tags: ['GPT', 'LLM', 'Transformers', 'NLP'],
      difficulty_level: 'intermediate',
      estimated_read_time: '60 min',
      engagement_score: 96,
      source: 'YouTube',
      author: 'Andrej Karpathy',
      published_at: new Date().toISOString().split('T')[0],
      url: 'https://www.youtube.com/watch?v=zjkBMFhNj_g',
      thumbnail: 'https://img.youtube.com/vi/zjkBMFhNj_g/hqdefault.jpg',
      video_id: 'zjkBMFhNj_g'
    },
    {
      id: 'yt-WUvTyaaNkzM',
      title: 'PyTorch for Deep Learning - Full Course',
      content_type: 'video',
      summary: 'Master PyTorch for deep learning in this comprehensive course. Build neural networks, implement CNNs, RNNs, and more with hands-on coding exercises.',
      key_insights: ['Complete PyTorch guide', 'Practical coding', 'Real projects'],
      tags: ['PyTorch', 'Deep Learning', 'Python', 'Tutorial'],
      difficulty_level: 'intermediate',
      estimated_read_time: '300 min',
      engagement_score: 92,
      source: 'YouTube',
      author: 'freeCodeCamp',
      published_at: new Date().toISOString().split('T')[0],
      url: 'https://www.youtube.com/watch?v=WUvTyaaNkzM',
      thumbnail: 'https://img.youtube.com/vi/WUvTyaaNkzM/hqdefault.jpg',
      video_id: 'WUvTyaaNkzM'
    },
    {
      id: 'yt-kCc8FmEb1nY',
      title: 'Let\'s build GPT: from scratch, in code, spelled out',
      content_type: 'video',
      summary: 'Build a GPT language model from scratch with Andrej Karpathy. Understand every component of transformers through hands-on implementation.',
      key_insights: ['Build GPT from scratch', 'Code walkthrough', 'Deep understanding'],
      tags: ['GPT', 'Transformers', 'Coding', 'Advanced'],
      difficulty_level: 'advanced',
      estimated_read_time: '120 min',
      engagement_score: 97,
      source: 'YouTube',
      author: 'Andrej Karpathy',
      published_at: new Date().toISOString().split('T')[0],
      url: 'https://www.youtube.com/watch?v=kCc8FmEb1nY',
      thumbnail: 'https://img.youtube.com/vi/kCc8FmEb1nY/hqdefault.jpg',
      video_id: 'kCc8FmEb1nY'
    },
    {
      id: 'yt-VMj-3S1tku0',
      title: 'TensorFlow 2.0 Complete Course - Python Neural Networks',
      content_type: 'video',
      summary: 'Learn TensorFlow 2.0 from beginner to advanced. Build neural networks, work with real datasets, and deploy ML models with this full course.',
      key_insights: ['TensorFlow basics', 'Neural network projects', 'Model deployment'],
      tags: ['TensorFlow', 'Python', 'Neural Networks', 'Tutorial'],
      difficulty_level: 'beginner',
      estimated_read_time: '400 min',
      engagement_score: 90,
      source: 'YouTube',
      author: 'freeCodeCamp',
      published_at: new Date().toISOString().split('T')[0],
      url: 'https://www.youtube.com/watch?v=VMj-3S1tku0',
      thumbnail: 'https://img.youtube.com/vi/VMj-3S1tku0/hqdefault.jpg',
      video_id: 'VMj-3S1tku0'
    }
  ];
  
  return curatedVideos;
}
