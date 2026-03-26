const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content } = await req.json();

    if (!content || !Array.isArray(content) || content.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Content array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare a compact summary of content for AI analysis
    const contentSummary = content.slice(0, 50).map((item: any) => ({
      title: item.title,
      domain: item.domain || 'ai-tech',
      type: item.content_type,
      tags: (item.tags || []).slice(0, 5),
      engagement: item.engagement_score,
      date: item.published_at,
    }));

    const systemPrompt = `You are the Trend Discovery Agent for TrendScope AI. Analyze content items across multiple domains and detect trends.

Respond ONLY with valid JSON (no markdown, no code fences) matching this schema:
{
  "trends": [
    {
      "keyword": "string (trend topic)",
      "domain": "ai-tech|healthcare|agriculture|finance|climate|education",
      "status": "emerging|growing|saturated",
      "growth_score": "number 0-100",
      "frequency": "number (how many items mention this)",
      "description": "string (1-2 sentences)",
      "related_content_types": ["paper","article","repo","tool","video"],
      "emoji": "string (single emoji)"
    }
  ],
  "cross_domain_trends": [
    {
      "keyword": "string",
      "domains": ["ai-tech", "healthcare"],
      "description": "string (1-2 sentences on cross-domain impact)",
      "growth_score": "number 0-100",
      "emoji": "string"
    }
  ],
  "domain_summary": {
    "ai-tech": { "total": "number", "top_trend": "string", "health": "strong|moderate|weak" },
    "healthcare": { "total": "number", "top_trend": "string", "health": "strong|moderate|weak" },
    "agriculture": { "total": "number", "top_trend": "string", "health": "strong|moderate|weak" },
    "finance": { "total": "number", "top_trend": "string", "health": "strong|moderate|weak" },
    "climate": { "total": "number", "top_trend": "string", "health": "strong|moderate|weak" },
    "education": { "total": "number", "top_trend": "string", "health": "strong|moderate|weak" }
  }
}

Rules:
- Detect 5-15 trends across domains
- Classify as emerging (new/low frequency), growing (increasing), or saturated (widespread/plateauing)
- Identify 1-5 cross-domain trends (topics spanning multiple sectors)
- Be specific and insightful, not generic`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Analyze these ${contentSummary.length} content items and detect trends:\n\n${JSON.stringify(contentSummary)}` },
        ],
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted' }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      return new Response(JSON.stringify({ error: 'AI analysis failed' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const aiData = await response.json();
    const rawContent = aiData.choices?.[0]?.message?.content || '';

    let analysis;
    try {
      const jsonStr = rawContent.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      analysis = JSON.parse(jsonStr);
    } catch {
      console.error('Failed to parse trend discovery response:', rawContent.slice(0, 500));
      return new Response(JSON.stringify({ error: 'Failed to parse analysis' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    analysis.trends = analysis.trends || [];
    analysis.cross_domain_trends = analysis.cross_domain_trends || [];
    analysis.domain_summary = analysis.domain_summary || {};

    return new Response(
      JSON.stringify({ success: true, data: analysis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Trend discovery error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
