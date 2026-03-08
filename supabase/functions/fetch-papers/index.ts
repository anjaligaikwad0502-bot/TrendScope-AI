const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Paper {
  id: string;
  title: string;
  content_type: 'paper';
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
  arxiv_id?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const category = url.searchParams.get('category') || 'cs.AI';
    
    // Fetch from arXiv API - searching for recent AI/ML papers
    const arxivUrl = `https://export.arxiv.org/api/query?search_query=cat:${category}&sortBy=submittedDate&sortOrder=descending&max_results=15`;
    
    const response = await fetch(arxivUrl);
    if (!response.ok) {
      const errorText = await response.text();
      console.error('arXiv API error:', errorText);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to fetch papers' }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const xmlText = await response.text();
    const papers = parseArxivXml(xmlText);

    return new Response(
      JSON.stringify({ success: true, data: papers }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching papers:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to fetch papers' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function parseArxivXml(xml: string): Paper[] {
  const papers: Paper[] = [];
  
  // Simple XML parsing for arXiv feed
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  let match;
  
  while ((match = entryRegex.exec(xml)) !== null) {
    const entry = match[1];
    
    const id = extractTag(entry, 'id');
    const title = extractTag(entry, 'title')?.replace(/\s+/g, ' ').trim();
    const summary = extractTag(entry, 'summary')?.replace(/\s+/g, ' ').trim();
    const published = extractTag(entry, 'published');
    const authors = extractAuthors(entry);
    const categories = extractCategories(entry);
    
    if (id && title) {
      const arxivId = id.split('/abs/')[1] || id.split('/').pop() || '';
      
      papers.push({
        id: `arxiv-${arxivId}`,
        title,
        content_type: 'paper',
        summary: summary?.slice(0, 500) || 'No abstract available',
        key_insights: extractKeyInsights(summary || ''),
        tags: categories.slice(0, 5),
        difficulty_level: 'advanced',
        estimated_read_time: `${Math.ceil((summary?.length || 0) / 200) + 10} min`,
        engagement_score: Math.floor(Math.random() * 30) + 70, // arXiv doesn't provide engagement metrics
        source: 'arXiv',
        author: authors.slice(0, 3).join(', ') + (authors.length > 3 ? ' et al.' : ''),
        published_at: published?.split('T')[0] || new Date().toISOString().split('T')[0],
        url: id,
        arxiv_id: arxivId
      });
    }
  }
  
  return papers;
}

function extractTag(xml: string, tag: string): string | undefined {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`);
  const match = xml.match(regex);
  return match ? match[1].trim() : undefined;
}

function extractAuthors(entry: string): string[] {
  const authors: string[] = [];
  const authorRegex = /<author>[\s\S]*?<name>([^<]+)<\/name>[\s\S]*?<\/author>/g;
  let match;
  
  while ((match = authorRegex.exec(entry)) !== null) {
    authors.push(match[1].trim());
  }
  
  return authors;
}

function extractCategories(entry: string): string[] {
  const categories: string[] = [];
  const categoryRegex = /<category[^>]*term="([^"]+)"/g;
  let match;
  
  while ((match = categoryRegex.exec(entry)) !== null) {
    categories.push(match[1]);
  }
  
  return categories;
}

function extractKeyInsights(summary: string): string[] {
  // Extract first few sentences as key insights
  const sentences = summary.split(/[.!?]+/).filter(s => s.trim().length > 20);
  return sentences.slice(0, 3).map(s => s.trim());
}
