const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface PaperInput {
  id: string;
  title: string;
  summary: string;
  tags: string[];
  author: string;
  source: string;
  arxiv_id?: string;
  published_at?: string;
  url?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { paper, relatedPapers } = await req.json() as {
      paper: PaperInput;
      relatedPapers: PaperInput[];
    };

    if (!paper) {
      return new Response(
        JSON.stringify({ error: 'Paper data is required' }),
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

    const relatedContext = (relatedPapers || []).slice(0, 8).map((p, i) =>
      `[Paper ${i + 1}] "${p.title}" by ${p.author} (Published: ${p.published_at || 'unknown'})\nSource: ${p.source}\nSummary: ${p.summary}\nTags: ${p.tags.join(', ')}`
    ).join('\n\n');

    const systemPrompt = `You are ResearchMind, an autonomous academic reasoning engine. Analyze the given research paper by:
1. Ranking the most relevant related papers (Top 5)
2. Extracting structured key claims
3. Comparing cross-paper claims for agreements & contradictions
4. Running devil's advocate reasoning (weak evidence, missing validation, logical gaps)
5. Computing a weighted confidence score based on recency, relevance, and agreement

You MUST respond with a valid JSON object matching this exact schema (no markdown, no code fences):
{
  "ranked_papers": [
    { "title": "string", "author": "string", "relevance_score": 0.0-1.0, "url": "string or null", "published_at": "string or null" }
  ],
  "claims": [
    { "text": "string", "type": "hypothesis|finding|methodology|conclusion", "strength": "strong|moderate|weak" }
  ],
  "supporting_papers": [
    { "title": "string", "relation": "string explaining how it supports" }
  ],
  "conflicting_papers": [
    { "title": "string", "contradiction": "string explaining the contradiction" }
  ],
  "contradictions": [
    { "description": "string", "severity": "high|medium|low" }
  ],
  "evidence_gaps": ["string describing a gap"],
  "devils_advocate": [
    { "challenge": "string", "target_claim": "string" }
  ],
  "confidence_score": 0.0-1.0,
  "confidence_breakdown": {
    "recency": 0.0-1.0,
    "relevance": 0.0-1.0,
    "agreement": 0.0-1.0
  },
  "confidence_explanation": "string explaining the score",
  "confidence_signals": {
    "positive": ["string - strong agreement across papers", "recent publications", etc.],
    "negative": ["string - contradictory claims", "weak evidence", etc.],
    "neutral": ["string - emerging research", "mixed interpretations", etc.]
  },
  "reasoning_summary": "string with overall assessment"
}

For confidence_breakdown:
- recency: How recent are the supporting papers? (1.0 = very recent, 0.0 = outdated)
- relevance: How directly relevant are the related papers? (1.0 = highly relevant)
- agreement: How much do papers agree? (1.0 = strong consensus, 0.0 = heavy contradiction)

For confidence_signals, categorize your reasoning:
- positive: Factors that increase confidence (strong agreement, recent data, consistent findings, robust methodology)
- negative: Factors that decrease confidence (contradictions, weak evidence, limited validation, small samples)
- neutral: Context factors (emerging field, mixed interpretations, context-dependent conclusions)

Always provide at least 2 items in each signal category.`;

    const userPrompt = `Analyze this paper and cross-reference with related work:

## Target Paper
Title: ${paper.title}
Author: ${paper.author}
Published: ${paper.published_at || 'unknown'}
Summary: ${paper.summary}
Tags: ${paper.tags.join(', ')}
Source: ${paper.source}

## Related Papers for Cross-Reference
${relatedContext || 'No related papers available for comparison.'}

Perform deep analysis: rank the top 5 most relevant papers, extract key claims, identify supporting/conflicting papers, detect contradictions, find evidence gaps, generate devil's advocate challenges, and compute a confidence score with breakdown. Return ONLY valid JSON.`;

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
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again shortly.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errText = await response.text();
      console.error('AI gateway error:', status, errText);
      return new Response(
        JSON.stringify({ error: 'AI analysis failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await response.json();
    const rawContent = aiData.choices?.[0]?.message?.content || '';

    let analysis;
    try {
      const jsonStr = rawContent.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      analysis = JSON.parse(jsonStr);
    } catch {
      console.error('Failed to parse AI response:', rawContent.slice(0, 500));
      return new Response(
        JSON.stringify({ error: 'Failed to parse analysis results' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Ensure defaults for new fields
    analysis.ranked_papers = analysis.ranked_papers || [];
    analysis.confidence_breakdown = analysis.confidence_breakdown || { recency: 0.5, relevance: 0.5, agreement: 0.5 };
    analysis.confidence_signals = analysis.confidence_signals || { positive: [], negative: [], neutral: [] };

    return new Response(
      JSON.stringify({ success: true, data: analysis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('ResearchMind error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
