const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topic } = await req.json();
    if (!topic) {
      return new Response(JSON.stringify({ error: 'Missing topic' }), {
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

    // Step 1: Search and rank papers
    const searchResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
            content: `You are an expert research analyst. Given a research topic, simulate searching for and analyzing academic papers. You must return realistic, detailed analysis as if you have access to real papers. Always respond in valid JSON only, no markdown.`
          },
          {
            role: 'user',
            content: `Research topic: "${topic}"

Perform a comprehensive research analysis:

1. Find the Top 5 most relevant research papers/articles on this topic
2. Extract key claims, methodologies, and conclusions from each
3. Detect conflicts and agreements between the papers
4. Identify strengths and limitations of each study
5. Generate a final research insight summary

Respond with JSON in this exact format:
{
  "top_papers": [
    {
      "rank": 1,
      "title": "Paper title",
      "authors": "Author names",
      "year": "2024",
      "source": "Journal/Conference name",
      "relevance_score": 0.95,
      "key_claims": ["claim 1", "claim 2"],
      "methodology": "Brief methodology description",
      "conclusions": "Key conclusions",
      "strengths": ["strength 1", "strength 2"],
      "limitations": ["limitation 1", "limitation 2"]
    }
  ],
  "conflicts": [
    {
      "description": "Description of the conflict",
      "papers_involved": ["Paper A title", "Paper B title"],
      "severity": "high|medium|low",
      "details": "Detailed explanation of the contradiction"
    }
  ],
  "agreements": [
    {
      "description": "Description of the agreement",
      "papers_involved": ["Paper A title", "Paper B title"],
      "strength": "strong|moderate|weak"
    }
  ],
  "key_claims_summary": [
    {
      "claim": "The claim text",
      "supporting_papers": ["Paper titles that support"],
      "opposing_papers": ["Paper titles that oppose"],
      "confidence": "high|medium|low"
    }
  ],
  "research_insight": "A comprehensive 2-3 paragraph summary synthesizing all findings, highlighting key conflicts, agreements, and the current state of research on this topic.",
  "overall_confidence": 0.78,
  "recommendation": "Brief recommendation for future research direction"
}`
          }
        ],
      }),
    });

    if (!searchResponse.ok) {
      if (searchResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (searchResponse.status === 402) {
        return new Response(JSON.stringify({ error: 'Usage limit reached. Please add credits.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await searchResponse.text();
      console.error('AI error:', searchResponse.status, errorText);
      return new Response(JSON.stringify({ error: 'AI analysis failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiData = await searchResponse.json();
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
    console.error('Topic analyzer error:', error);
    return new Response(JSON.stringify({ error: 'Analysis failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
