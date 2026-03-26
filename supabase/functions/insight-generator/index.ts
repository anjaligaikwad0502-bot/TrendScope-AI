const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { trends, conflicts, content } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'AI service not configured' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const systemPrompt = `You are the Insight Generation Agent for TrendScope AI. Combine trend signals, conflict analysis, and content data to generate actionable intelligence.

Respond ONLY with valid JSON (no markdown, no code fences):
{
  "insights": [
    {
      "title": "string (concise insight title)",
      "domain": "ai-tech|healthcare|agriculture|finance|climate|education",
      "type": "prediction|impact|opportunity|warning",
      "importance": "number 0-100",
      "summary": "string (2-3 sentences)",
      "evidence": ["string (supporting data points)"],
      "action_items": ["string (what users should do)"],
      "emoji": "string"
    }
  ],
  "cross_domain_insights": [
    {
      "title": "string",
      "domains": ["string"],
      "summary": "string (2-3 sentences on cross-domain opportunity)",
      "importance": "number 0-100",
      "emoji": "string"
    }
  ],
  "executive_summary": "string (3-4 sentences high-level overview)"
}

Rules:
- Generate 3-8 insights combining trend + conflict signals
- Each insight must be actionable and specific
- Identify cross-domain opportunities
- Prioritize by importance score
- Include predictions about future developments`;

    const inputData = {
      trends: trends?.slice(0, 15) || [],
      conflicts: conflicts?.slice(0, 10) || [],
      contentSample: (content || []).slice(0, 20).map((c: any) => ({
        title: c.title,
        domain: c.domain,
        type: c.content_type,
        engagement: c.engagement_score,
      })),
    };

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
          { role: 'user', content: `Generate insights from this data:\n\n${JSON.stringify(inputData)}` },
        ],
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      if (status === 402) return new Response(JSON.stringify({ error: 'AI credits exhausted' }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      return new Response(JSON.stringify({ error: 'AI analysis failed' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const aiData = await response.json();
    const rawContent = aiData.choices?.[0]?.message?.content || '';

    let analysis;
    try {
      const jsonStr = rawContent.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      analysis = JSON.parse(jsonStr);
    } catch {
      console.error('Failed to parse insight response:', rawContent.slice(0, 500));
      return new Response(JSON.stringify({ error: 'Failed to parse insights' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(
      JSON.stringify({ success: true, data: analysis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Insight generation error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
