const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, platformContext } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: 'Messages array required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'AI not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build a rich system prompt with platform awareness
    const contentSummary = platformContext?.contentSummary || '';
    const trendingTags = platformContext?.trendingTags?.join(', ') || '';
    const contentTypes = platformContext?.contentTypes || '';
    const totalItems = platformContext?.totalItems || 0;

    const systemPrompt = `You are TrendScope AI Assistant — a Personal AI Research Companion embedded in TrendScope AI, a platform that aggregates trending tech content (articles, GitHub repos, research papers, and videos) into one interface.

## Your Roles:
🧠 **Personal AI Research Companion** — Help users understand complex topics, suggest learning paths, and connect ideas across content.
📚 **Content Explainer** — Break down technical articles, papers, and repos into digestible insights. Explain jargon, concepts, and methodologies.
📊 **Insight Generator** — Synthesize patterns across multiple content items, identify emerging themes, and provide actionable takeaways.
🔎 **Smart Navigator** — Guide users to relevant content on the platform. Suggest filters, searches, and content types based on their interests.
📈 **Trend Analyst** — Analyze what's trending in tech, predict upcoming trends, and contextualize why certain topics are gaining traction.

## Platform Context (Live Data):
- Total content items currently loaded: ${totalItems}
- Content types available: ${contentTypes}
- Trending tags: ${trendingTags}
${contentSummary ? `- Content snapshot:\n${contentSummary}` : ''}

## Guidelines:
- Reference actual content on the platform when possible (mention titles, authors, topics you see in the context).
- When users ask about a topic, connect it to relevant content available on the platform.
- Suggest specific search queries or filters the user can try on TrendScope.
- For technical explanations, use analogies and layered depth (start simple, offer to go deeper).
- Format responses with markdown: use headers, bullet points, bold text, and code blocks when appropriate.
- Keep responses focused and actionable — users are here to learn and discover.
- If asked about content not on the platform, still help but mention they can search for related content.
- Be conversational, enthusiastic about tech, and proactive in suggesting next steps.
- Use emojis sparingly for visual appeal (1-2 per response max).`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please wait a moment and try again.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: 'AI service temporarily unavailable' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });
  } catch (error) {
    console.error('AI assistant error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
