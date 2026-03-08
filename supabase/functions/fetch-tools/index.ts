const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ToolItem {
  id: string;
  title: string;
  content_type: 'tool';
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
  stars?: number;
  forks?: number;
  language?: string;
  tool_category?: string;
  pricing?: string;
}

function getDifficultyFromDescription(desc: string): 'beginner' | 'intermediate' | 'advanced' {
  const lower = desc.toLowerCase();
  const advancedKeywords = ['advanced', 'enterprise', 'infrastructure', 'orchestration', 'distributed'];
  const beginnerKeywords = ['easy', 'simple', 'beginner', 'no-code', 'drag-and-drop', 'getting started'];
  if (advancedKeywords.some(k => lower.includes(k))) return 'advanced';
  if (beginnerKeywords.some(k => lower.includes(k))) return 'beginner';
  return 'intermediate';
}

function categorizeRepo(topics: string[], description: string): string {
  const text = [...topics, description].join(' ').toLowerCase();
  if (text.match(/llm|language.model|gpt|chat|completion/)) return 'LLM Framework';
  if (text.match(/agent|autonomous|tool.use/)) return 'AI Agent';
  if (text.match(/vector|embedding|search|rag|retrieval/)) return 'Vector & RAG';
  if (text.match(/image|vision|diffusion|stable/)) return 'Image AI';
  if (text.match(/audio|speech|voice|tts|stt/)) return 'Audio AI';
  if (text.match(/code|copilot|ide|developer/)) return 'Dev Tool';
  if (text.match(/deploy|serve|inference|mlops/)) return 'MLOps';
  if (text.match(/data|dataset|label|annotation/)) return 'Data Tool';
  if (text.match(/monitor|observ|eval|benchmark/)) return 'Evaluation';
  if (text.match(/fine.tun|train|lora/)) return 'Training';
  return 'AI Tool';
}

async function fetchGitHubAITools(): Promise<ToolItem[]> {
  try {
    const queries = [
      'ai+tool+framework',
      'llm+developer+tool',
      'machine+learning+toolkit',
    ];
    const query = queries[Math.floor(Math.random() * queries.length)];

    const response = await fetch(
      `https://api.github.com/search/repositories?q=${query}+stars:>500&sort=stars&order=desc&per_page=12`,
      { headers: { 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'TrendScope-AI' } }
    );
    if (!response.ok) return [];

    const data = await response.json();
    return (data.items || []).map((repo: any) => {
      const topics: string[] = repo.topics || [];
      const category = categorizeRepo(topics, repo.description || '');
      return {
        id: `tool-gh-${repo.id}`,
        title: repo.full_name,
        content_type: 'tool' as const,
        summary: repo.description || 'An AI/developer tool hosted on GitHub.',
        key_insights: [
          `${(repo.stargazers_count || 0).toLocaleString()} stars on GitHub`,
          `Category: ${category}`,
          repo.license?.spdx_id ? `License: ${repo.license.spdx_id}` : 'Open source tool',
        ],
        tags: [...topics.slice(0, 4), category].filter(Boolean),
        difficulty_level: getDifficultyFromDescription(repo.description || ''),
        estimated_read_time: '5 min',
        engagement_score: Math.min(100, Math.floor(Math.log10(repo.stargazers_count || 1) * 20) + 30),
        source: 'GitHub',
        author: repo.owner?.login || 'Unknown',
        published_at: (repo.pushed_at || repo.created_at || new Date().toISOString()).split('T')[0],
        url: repo.html_url,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        language: repo.language,
        tool_category: category,
        pricing: 'Open Source',
      };
    });
  } catch (error) {
    console.error('Error fetching GitHub AI tools:', error);
    return [];
  }
}

async function fetchProductHuntAITools(): Promise<ToolItem[]> {
  // Curated list of well-known AI tools as fallback / supplementary data
  const curatedTools: ToolItem[] = [
    {
      id: 'tool-curated-cursor',
      title: 'Cursor',
      content_type: 'tool',
      summary: 'AI-first code editor built on VS Code. Uses GPT-4 and Claude to help you write, edit, and debug code faster with natural language instructions.',
      key_insights: ['AI-powered code generation & editing', 'Chat with your codebase', 'Multi-file editing in one prompt'],
      tags: ['Code Editor', 'AI Coding', 'Dev Tool', 'Productivity'],
      difficulty_level: 'beginner',
      estimated_read_time: '3 min',
      engagement_score: 97,
      source: 'cursor.com',
      author: 'Cursor Inc.',
      published_at: new Date().toISOString().split('T')[0],
      url: 'https://cursor.com',
      tool_category: 'Dev Tool',
      pricing: 'Freemium',
    },
    {
      id: 'tool-curated-v0',
      title: 'v0 by Vercel',
      content_type: 'tool',
      summary: 'AI-powered UI generation tool that creates React components from text descriptions. Generates production-ready code using shadcn/ui and Tailwind CSS.',
      key_insights: ['Text-to-UI generation', 'Exports clean React + Tailwind code', 'Iterative refinement via chat'],
      tags: ['UI Generation', 'React', 'AI Coding', 'Frontend'],
      difficulty_level: 'beginner',
      estimated_read_time: '3 min',
      engagement_score: 94,
      source: 'v0.dev',
      author: 'Vercel',
      published_at: new Date().toISOString().split('T')[0],
      url: 'https://v0.dev',
      tool_category: 'Dev Tool',
      pricing: 'Freemium',
    },
    {
      id: 'tool-curated-huggingface',
      title: 'Hugging Face Hub',
      content_type: 'tool',
      summary: 'The platform for sharing and discovering ML models, datasets, and demos. Home to 500K+ models and 100K+ datasets with one-line inference APIs.',
      key_insights: ['500K+ pre-trained models', 'One-line inference API', 'Free model hosting & Spaces'],
      tags: ['Model Hub', 'ML Platform', 'Open Source', 'Inference'],
      difficulty_level: 'intermediate',
      estimated_read_time: '5 min',
      engagement_score: 98,
      source: 'huggingface.co',
      author: 'Hugging Face',
      published_at: new Date().toISOString().split('T')[0],
      url: 'https://huggingface.co',
      tool_category: 'ML Platform',
      pricing: 'Freemium',
    },
    {
      id: 'tool-curated-replicate',
      title: 'Replicate',
      content_type: 'tool',
      summary: 'Run open-source AI models in the cloud with a single API call. Supports image generation, LLMs, audio, and video models with auto-scaling infrastructure.',
      key_insights: ['Pay-per-use pricing', 'One API call to run any model', 'Supports custom model deployment'],
      tags: ['Model Hosting', 'API', 'Cloud AI', 'Inference'],
      difficulty_level: 'intermediate',
      estimated_read_time: '4 min',
      engagement_score: 91,
      source: 'replicate.com',
      author: 'Replicate',
      published_at: new Date().toISOString().split('T')[0],
      url: 'https://replicate.com',
      tool_category: 'MLOps',
      pricing: 'Pay-per-use',
    },
    {
      id: 'tool-curated-perplexity',
      title: 'Perplexity AI',
      content_type: 'tool',
      summary: 'AI-powered search engine that provides direct answers with citations. Combines real-time web search with LLM reasoning for accurate, sourced responses.',
      key_insights: ['Real-time web search + AI', 'Source citations for every answer', 'Pro Search for deep research'],
      tags: ['AI Search', 'Research', 'Productivity', 'LLM'],
      difficulty_level: 'beginner',
      estimated_read_time: '3 min',
      engagement_score: 95,
      source: 'perplexity.ai',
      author: 'Perplexity AI',
      published_at: new Date().toISOString().split('T')[0],
      url: 'https://perplexity.ai',
      tool_category: 'AI Search',
      pricing: 'Freemium',
    },
  ];
  return curatedTools;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const [githubTools, curatedTools] = await Promise.all([
      fetchGitHubAITools(),
      fetchProductHuntAITools(),
    ]);

    // Deduplicate by id
    const seen = new Set<string>();
    const allTools: ToolItem[] = [];
    for (const tool of [...curatedTools, ...githubTools]) {
      if (!seen.has(tool.id)) {
        seen.add(tool.id);
        allTools.push(tool);
      }
    }

    allTools.sort((a, b) => b.engagement_score - a.engagement_score);

    return new Response(
      JSON.stringify({ success: true, data: allTools }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching tools:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to fetch tools' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
