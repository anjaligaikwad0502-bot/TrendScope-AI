const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ContentItem {
  id: string;
  title: string;
  content_type: 'article' | 'repo' | 'paper' | 'video';
  summary: string;
  tags: string[];
  engagement_score: number;
}

interface SearchResult {
  items: ContentItem[];
  expandedQuery: {
    original: string;
    synonyms: string[];
    relatedTopics: string[];
    intent: string;
  };
  hasExactMatches: boolean;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, content } = await req.json();
    
    if (!query || !content || !Array.isArray(content)) {
      return new Response(
        JSON.stringify({ error: 'Missing query or content array' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      // Fallback to basic search if AI not available
      return fallbackSearch(query, content);
    }

    // Use AI to understand the query intent and expand it
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          {
            role: 'system',
            content: `You are a semantic search assistant for a tech content discovery platform. 
Given a user's search query, analyze it and provide:
1. The user's intent (what they're really looking for)
2. Synonyms and alternative terms for the query
3. Related topics that might interest them
4. Broader and narrower concepts

Always respond in valid JSON format only, no markdown.`
          },
          {
            role: 'user',
            content: `Analyze this search query: "${query}"

Respond with JSON in this exact format:
{
  "intent": "brief description of what the user is looking for",
  "synonyms": ["term1", "term2", "term3"],
  "relatedTopics": ["topic1", "topic2", "topic3"],
  "broaderConcepts": ["concept1", "concept2"],
  "narrowerConcepts": ["concept1", "concept2"]
}`
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        console.warn('Rate limited, using fallback search');
        return fallbackSearch(query, content);
      }
      if (aiResponse.status === 402) {
        console.warn('Payment required, using fallback search');
        return fallbackSearch(query, content);
      }
      console.error('AI gateway error:', aiResponse.status);
      return fallbackSearch(query, content);
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content || '';
    
    let queryAnalysis;
    try {
      // Clean up potential markdown code blocks
      const cleanedContent = aiContent.replace(/```json\n?|\n?```/g, '').trim();
      queryAnalysis = JSON.parse(cleanedContent);
    } catch (e) {
      console.error('Failed to parse AI response:', e);
      return fallbackSearch(query, content);
    }

    // Build search terms from AI analysis
    const searchTerms = new Set<string>();
    searchTerms.add(query.toLowerCase());
    
    queryAnalysis.synonyms?.forEach((s: string) => searchTerms.add(s.toLowerCase()));
    queryAnalysis.relatedTopics?.forEach((t: string) => searchTerms.add(t.toLowerCase()));
    queryAnalysis.broaderConcepts?.forEach((c: string) => searchTerms.add(c.toLowerCase()));
    queryAnalysis.narrowerConcepts?.forEach((c: string) => searchTerms.add(c.toLowerCase()));

    // Score each content item based on semantic relevance
    const scoredContent = content.map((item: ContentItem) => {
      let relevanceScore = 0;
      const titleLower = item.title.toLowerCase();
      const summaryLower = item.summary.toLowerCase();
      const tagsLower = item.tags.map(t => t.toLowerCase());

      for (const term of searchTerms) {
        // Exact match in title (highest weight)
        if (titleLower.includes(term)) {
          relevanceScore += term === query.toLowerCase() ? 100 : 50;
        }
        // Match in summary
        if (summaryLower.includes(term)) {
          relevanceScore += term === query.toLowerCase() ? 40 : 20;
        }
        // Match in tags
        if (tagsLower.some(tag => tag.includes(term) || term.includes(tag))) {
          relevanceScore += term === query.toLowerCase() ? 60 : 30;
        }
      }

      // Boost by engagement
      relevanceScore += item.engagement_score * 0.1;

      return { ...item, relevanceScore };
    });

    // Sort by relevance and filter out zero-score items (but keep some if no matches)
    const sortedContent = scoredContent.sort((a, b) => b.relevanceScore - a.relevanceScore);
    
    // Check if we have exact matches
    const exactMatches = sortedContent.filter(item => {
      const titleLower = item.title.toLowerCase();
      const summaryLower = item.summary.toLowerCase();
      return titleLower.includes(query.toLowerCase()) || summaryLower.includes(query.toLowerCase());
    });

    interface ScoredContentItem extends ContentItem {
      relevanceScore: number;
    }

    let results: ScoredContentItem[];
    if (exactMatches.length > 0) {
      // We have exact matches, prioritize them but include related content
      results = sortedContent.filter(item => item.relevanceScore > 0);
    } else {
      // No exact matches - return semantically related content or top trending
      results = sortedContent.filter(item => item.relevanceScore > 0);
      if (results.length < 5) {
        // Add top trending content as fallback
        const topTrending = content
          .sort((a: ContentItem, b: ContentItem) => b.engagement_score - a.engagement_score)
          .slice(0, 10);
        results = [...results, ...topTrending
          .filter((item: ContentItem) => !results.some((r: ScoredContentItem) => r.id === item.id))
          .map((item: ContentItem) => ({ ...item, relevanceScore: 0 }))
        ];
      }
    }

    // Remove the relevanceScore from output
    const cleanResults = results.map(({ relevanceScore: _score, ...item }) => item);

    const response: SearchResult = {
      items: cleanResults,
      expandedQuery: {
        original: query,
        synonyms: queryAnalysis.synonyms || [],
        relatedTopics: queryAnalysis.relatedTopics || [],
        intent: queryAnalysis.intent || 'General search'
      },
      hasExactMatches: exactMatches.length > 0
    };

    return new Response(
      JSON.stringify({ success: true, data: response }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Semantic search error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Search failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function fallbackSearch(query: string, content: ContentItem[]) {
  const queryLower = query.toLowerCase();
  
  // Simple keyword matching
  const matched = content.filter((item: ContentItem) => {
    const titleLower = item.title.toLowerCase();
    const summaryLower = item.summary.toLowerCase();
    const tagsLower = item.tags.map(t => t.toLowerCase());
    
    return titleLower.includes(queryLower) ||
           summaryLower.includes(queryLower) ||
           tagsLower.some(tag => tag.includes(queryLower));
  });

  // If no matches, return trending content
  let results = matched.length > 0 ? matched : 
    content.sort((a: ContentItem, b: ContentItem) => b.engagement_score - a.engagement_score).slice(0, 15);

  const response: SearchResult = {
    items: results,
    expandedQuery: {
      original: query,
      synonyms: [],
      relatedTopics: [],
      intent: 'Basic search (AI unavailable)'
    },
    hasExactMatches: matched.length > 0
  };

  return new Response(
    JSON.stringify({ success: true, data: response }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
