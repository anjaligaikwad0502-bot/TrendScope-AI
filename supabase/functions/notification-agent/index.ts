import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface ContentItem {
  id: string;
  title: string;
  content_type: string;
  summary: string;
  tags: string[];
  engagement_score: number;
  author: string;
  published_at: string;
}

interface NotificationCandidate {
  contentId: string;
  title: string;
  message: string;
  type: 'new_content' | 'trending' | 'personalized' | 'conflict_alert' | 'insight';
  contentType: string;
  importanceScore: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  emoji: string;
  reason: string;
}

function computeImportanceScore(
  item: ContentItem,
  userInterests: string[],
  isNew: boolean,
  isTrending: boolean,
): { score: number; factors: string[] } {
  let score = 0;
  const factors: string[] = [];

  // Growth factor: high engagement
  if (item.engagement_score >= 95) {
    score += 35;
    factors.push('exceptional_engagement');
  } else if (item.engagement_score >= 85) {
    score += 25;
    factors.push('high_engagement');
  } else if (item.engagement_score >= 70) {
    score += 15;
    factors.push('good_engagement');
  }

  // Relevance factor: matches user interests
  if (userInterests.length > 0) {
    const matchCount = item.tags.filter(tag =>
      userInterests.some(interest =>
        tag.toLowerCase().includes(interest.toLowerCase()) ||
        interest.toLowerCase().includes(tag.toLowerCase())
      )
    ).length;

    if (matchCount >= 3) {
      score += 30;
      factors.push('strong_interest_match');
    } else if (matchCount >= 2) {
      score += 20;
      factors.push('good_interest_match');
    } else if (matchCount >= 1) {
      score += 10;
      factors.push('partial_interest_match');
    }
  }

  // Freshness factor
  if (isNew) {
    score += 15;
    factors.push('fresh_content');
  }

  // Trending factor
  if (isTrending) {
    score += 20;
    factors.push('trending');
  }

  // Content type bonus (papers and tools get slight boost for research value)
  if (item.content_type === 'paper') {
    score += 5;
    factors.push('research_paper');
  } else if (item.content_type === 'tool') {
    score += 5;
    factors.push('new_tool');
  }

  return { score: Math.min(score, 100), factors };
}

function getPriority(score: number): 'critical' | 'high' | 'medium' | 'low' {
  if (score >= 80) return 'critical';
  if (score >= 60) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

function getEmoji(type: string, priority: string, contentType: string): string {
  if (priority === 'critical') return '🚨';
  if (type === 'trending') return '🔥';
  if (type === 'personalized') return '🎯';
  if (type === 'conflict_alert') return '⚡';
  if (type === 'insight') return '💡';
  if (contentType === 'paper') return '📄';
  if (contentType === 'repo') return '⭐';
  if (contentType === 'video') return '🎬';
  if (contentType === 'tool') return '🛠️';
  return '📰';
}

function formatMessage(item: ContentItem, factors: string[]): string {
  const parts: string[] = [];

  if (factors.includes('strong_interest_match')) {
    parts.push('Highly relevant to your interests');
  } else if (factors.includes('good_interest_match')) {
    parts.push('Matches your interests');
  }

  if (factors.includes('exceptional_engagement')) {
    parts.push('exceptional community engagement');
  } else if (factors.includes('trending')) {
    parts.push('trending now');
  }

  if (factors.includes('research_paper')) {
    parts.push('new research findings');
  }

  const reason = parts.length > 0 ? ` — ${parts.join(', ')}` : '';
  const truncTitle = item.title.length > 55 ? item.title.slice(0, 55) + '…' : item.title;
  return `${truncTitle}${reason}`;
}

function formatTitle(type: string, emoji: string, contentType: string): string {
  switch (type) {
    case 'personalized': return `${emoji} Matches your interests`;
    case 'trending': return `${emoji} Trending in ${contentType}s`;
    case 'conflict_alert': return `${emoji} Research conflict detected`;
    case 'insight': return `${emoji} New insight available`;
    default: return `${emoji} New ${contentType} discovered`;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      newItems = [],
      allItems = [],
      userInterests = [],
      recentNotificationIds = [],
      maxNotifications = 5,
      minImportanceScore = 35,
    } = await req.json();

    const candidates: NotificationCandidate[] = [];

    // Process new items
    for (const item of newItems as ContentItem[]) {
      // Spam control: skip if already notified
      if (recentNotificationIds.includes(item.id)) continue;

      const isTrending = item.engagement_score >= 90;
      const { score, factors } = computeImportanceScore(item, userInterests, true, isTrending);

      // Only notify if above threshold
      if (score < minImportanceScore) continue;

      const priority = getPriority(score);
      const type = factors.includes('strong_interest_match') || factors.includes('good_interest_match')
        ? 'personalized'
        : isTrending ? 'trending' : 'new_content';
      const emoji = getEmoji(type, priority, item.content_type);

      candidates.push({
        contentId: item.id,
        title: formatTitle(type, emoji, item.content_type),
        message: formatMessage(item, factors),
        type,
        contentType: item.content_type,
        importanceScore: score,
        priority,
        emoji,
        reason: factors.join(', '),
      });
    }

    // Check for newly trending items from existing content
    const trendingItems = (allItems as ContentItem[])
      .filter(item =>
        item.engagement_score >= 92 &&
        !recentNotificationIds.includes(`trending-${item.id}`) &&
        !newItems.some((n: ContentItem) => n.id === item.id)
      );

    for (const item of trendingItems) {
      const { score, factors } = computeImportanceScore(item, userInterests, false, true);
      if (score < minImportanceScore) continue;

      const priority = getPriority(score);
      const emoji = getEmoji('trending', priority, item.content_type);

      candidates.push({
        contentId: item.id,
        title: `${emoji} Trending now`,
        message: formatMessage(item, factors),
        type: 'trending',
        contentType: item.content_type,
        importanceScore: score,
        priority,
        emoji,
        reason: factors.join(', '),
      });
    }

    // Sort by importance and limit
    candidates.sort((a, b) => b.importanceScore - a.importanceScore);
    const finalNotifications = candidates.slice(0, maxNotifications);

    return new Response(
      JSON.stringify({
        success: true,
        notifications: finalNotifications,
        stats: {
          candidatesEvaluated: newItems.length + trendingItems.length,
          filtered: candidates.length - finalNotifications.length,
          sent: finalNotifications.length,
          avgImportance: finalNotifications.length > 0
            ? Math.round(finalNotifications.reduce((s: number, n: NotificationCandidate) => s + n.importanceScore, 0) / finalNotifications.length)
            : 0,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
