const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { papers } = await req.json();
    if (!papers || !Array.isArray(papers) || papers.length < 2) {
      return new Response(JSON.stringify({ error: 'Please provide at least 2 papers' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'AI not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const paperList = papers.map((p: string, i: number) => `${i + 1}. ${p}`).join('\n');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
            content: `You are an expert research analyst specializing in comparative paper analysis. Given specific paper titles/links/DOIs, simulate retrieving and analyzing them in detail. Always respond in valid JSON only, no markdown.`
          },
          {
            role: 'user',
            content: `Analyze the following research papers for conflicts, agreements, and contradictions:

${paperList}

For each paper:
1. Retrieve and understand the paper's content
2. Extract key claims, methodologies, and conclusions
3. Identify strengths and limitations

Then compare all papers:
1. Detect contradictions between papers
2. Find agreements across papers
3. Identify neutral/independent findings
4. Highlight positive and negative points of each

Respond with JSON in this exact format:
{
  "papers": [
    {
      "index": 1,
      "title": "Full paper title",
      "authors": "Author names",
      "year": "2024",
      "source": "Journal/Conference",
      "key_claims": ["claim 1", "claim 2"],
      "methodology": "Brief methodology description",
      "conclusions": "Key conclusions",
      "strengths": ["strength 1", "strength 2"],
      "limitations": ["limitation 1", "limitation 2"],
      "positive_points": ["positive 1"],
      "negative_points": ["negative 1"]
    }
  ],
  "conflicts": [
    {
      "description": "Description of the conflict",
      "papers_involved": ["Paper A title", "Paper B title"],
      "severity": "high|medium|low",
      "details": "Detailed explanation of the contradiction",
      "type": "methodological|empirical|theoretical|interpretive"
    }
  ],
  "agreements": [
    {
      "description": "Description of the agreement",
      "papers_involved": ["Paper A title", "Paper B title"],
      "strength": "strong|moderate|weak"
    }
  ],
  "neutral_findings": [
    {
      "description": "Independent finding not directly conflicting or agreeing",
      "paper": "Paper title"
    }
  ],
  "key_claims_comparison": [
    {
      "claim": "The claim text",
      "supporting_papers": ["Paper titles that support"],
      "opposing_papers": ["Paper titles that oppose"],
      "confidence": "high|medium|low"
    }
  ],
  "research_insight": "A comprehensive 2-3 paragraph summary synthesizing all findings, highlighting key conflicts, agreements, and the overall state of knowledge.",
  "overall_confidence": 0.78,
  "recommendation": "Brief recommendation for researchers based on this analysis"
}`
          }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Usage limit reached. Please add credits.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI error:', response.status, errorText);
      return new Response(JSON.stringify({ error: 'AI analysis failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content || '';

    let analysis;
    try {
      const cleaned = content.replace(/```json\n?|\n?```/g, '').trim();
      analysis = JSON.parse(cleaned);
    } catch (e) {
      console.error('Failed to parse AI response:', e, content);
      return new Response(JSON.stringify({ error: 'Failed to parse analysis results' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true, data: analysis }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Paper analyzer error:', error);
    return new Response(JSON.stringify({ error: 'Analysis failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
