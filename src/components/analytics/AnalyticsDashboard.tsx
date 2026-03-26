import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Video, 
  GraduationCap, 
  Github, 
  Clock,
  TrendingUp,
  BarChart3,
  Wrench,
  Loader2,
  Sparkles,
  ArrowUpRight,
  Zap
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { contentApi, ContentItem } from '@/lib/api/content';
import { DOMAINS, type ContentDomain } from '@/lib/domainClassifier';
import { supabase } from '@/integrations/supabase/client';

interface TrendItem {
  keyword: string;
  domain: ContentDomain;
  status: 'emerging' | 'growing' | 'saturated';
  growth_score: number;
  frequency: number;
  description: string;
  emoji: string;
}

interface CrossDomainTrend {
  keyword: string;
  domains: string[];
  description: string;
  growth_score: number;
  emoji: string;
}

interface InsightItem {
  title: string;
  domain: string;
  type: 'prediction' | 'impact' | 'opportunity' | 'warning';
  importance: number;
  summary: string;
  emoji: string;
}

interface TrendData {
  trends: TrendItem[];
  cross_domain_trends: CrossDomainTrend[];
  domain_summary: Record<string, { total: number; top_trend: string; health: string }>;
}

interface InsightData {
  insights: InsightItem[];
  cross_domain_insights: { title: string; domains: string[]; summary: string; importance: number; emoji: string }[];
  executive_summary: string;
}

export function AnalyticsDashboard() {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [trendData, setTrendData] = useState<TrendData | null>(null);
  const [insightData, setInsightData] = useState<InsightData | null>(null);
  const [agentsLoading, setAgentsLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const data = await contentApi.fetchAllContent();
        setContent(data);
      } catch (e) {
        console.error('Failed to load analytics data:', e);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  // Run trend discovery + insight generation after content loads
  useEffect(() => {
    if (content.length === 0) return;
    
    const runAgents = async () => {
      setAgentsLoading(true);
      try {
        // Run trend discovery
        const { data: trendResult } = await supabase.functions.invoke('trend-discovery', {
          body: { content }
        });
        if (trendResult?.data) {
          setTrendData(trendResult.data);
          
          // Run insight generation with trend data
          const { data: insightResult } = await supabase.functions.invoke('insight-generator', {
            body: { trends: trendResult.data.trends, content }
          });
          if (insightResult?.data) {
            setInsightData(insightResult.data);
          }
        }
      } catch (e) {
        console.error('Agent pipeline error:', e);
      } finally {
        setAgentsLoading(false);
      }
    };
    runAgents();
  }, [content]);

  const analytics = useMemo(() => {
    const articles = content.filter(c => c.content_type === 'article');
    const videos = content.filter(c => c.content_type === 'video');
    const papers = content.filter(c => c.content_type === 'paper');
    const repos = content.filter(c => c.content_type === 'repo');
    const tools = content.filter(c => c.content_type === 'tool');

    let totalMinutes = 0;
    content.forEach(item => {
      const match = item.estimated_read_time?.match(/(\d+)/);
      if (match) totalMinutes += parseInt(match[1], 10);
    });
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;

    const tagMap = new Map<string, number>();
    content.forEach(item => item.tags?.forEach(t => tagMap.set(t, (tagMap.get(t) || 0) + 1)));
    const topTags = [...tagMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag, count]) => ({ tag, count }));

    const typeBreakdown = [
      { day: 'Articles', count: articles.length },
      { day: 'Repos', count: repos.length },
      { day: 'Papers', count: papers.length },
      { day: 'Videos', count: videos.length },
      { day: 'Tools', count: tools.length },
    ];

    // Domain breakdown
    const domainCounts: Record<string, number> = {};
    content.forEach(item => {
      const d = item.domain || 'ai-tech';
      domainCounts[d] = (domainCounts[d] || 0) + 1;
    });

    return {
      articles: articles.length,
      videos: videos.length,
      papers: papers.length,
      repos: repos.length,
      tools: tools.length,
      totalReadingTime: `${hours}h ${mins}m`,
      topTags,
      typeBreakdown,
      domainCounts,
      maxTypeCount: Math.max(...typeBreakdown.map(t => t.count), 1),
      maxTagCount: Math.max(...(topTags.map(t => t.count)), 1),
    };
  }, [content]);

  const stats = [
    { label: 'Articles', value: analytics.articles, icon: FileText, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Videos', value: analytics.videos, icon: Video, color: 'text-red-500', bg: 'bg-red-500/10' },
    { label: 'Papers', value: analytics.papers, icon: GraduationCap, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { label: 'Repos', value: analytics.repos, icon: Github, color: 'text-green-500', bg: 'bg-green-500/10' },
    { label: 'Tools', value: analytics.tools, icon: Wrench, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  ];

  const statusColors = {
    emerging: 'bg-green-500/10 text-green-500 border-green-500/20',
    growing: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    saturated: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  };

  const insightTypeColors = {
    prediction: 'bg-purple-500/10 text-purple-500',
    impact: 'bg-blue-500/10 text-blue-500',
    opportunity: 'bg-green-500/10 text-green-500',
    warning: 'bg-red-500/10 text-red-500',
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Intelligence Dashboard</h2>
          <p className="text-sm text-muted-foreground">Multi-domain analytics across {content.length} items</p>
        </div>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
              <Card className="glass p-4 hover:border-primary/30 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", stat.bg)}>
                    <Icon className={cn("w-5 h-5", stat.color)} />
                  </div>
                </div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Domain Distribution */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card className="glass p-6">
          <h3 className="text-lg font-semibold mb-4">🌍 Domain Distribution</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {DOMAINS.map(domain => {
              const count = analytics.domainCounts[domain.id] || 0;
              const pct = content.length > 0 ? Math.round((count / content.length) * 100) : 0;
              const summary = trendData?.domain_summary?.[domain.id];
              return (
                <div key={domain.id} className="p-3 rounded-lg bg-secondary/30 border border-border/50">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{domain.emoji}</span>
                    <span className="text-sm font-medium">{domain.label}</span>
                  </div>
                  <p className="text-2xl font-bold">{count}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-muted-foreground">{pct}% of total</span>
                    {summary && (
                      <Badge variant="outline" className="text-xs">
                        {summary.health === 'strong' ? '🟢' : summary.health === 'moderate' ? '🟡' : '🔴'} {summary.health}
                      </Badge>
                    )}
                  </div>
                  {summary?.top_trend && (
                    <p className="text-xs text-muted-foreground mt-1 truncate">Top: {summary.top_trend}</p>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      </motion.div>

      {/* Trend Discovery */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Card className="glass p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">📊 Trend Discovery Agent</h3>
              <p className="text-xs text-muted-foreground">
                {agentsLoading ? 'Analyzing trends...' : `${trendData?.trends?.length || 0} trends detected`}
              </p>
            </div>
            {agentsLoading && <Loader2 className="h-4 w-4 animate-spin text-primary ml-auto" />}
          </div>
          
          {trendData?.trends && trendData.trends.length > 0 ? (
            <div className="space-y-3">
              {trendData.trends.slice(0, 10).map((trend, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/20 border border-border/30">
                  <span className="text-lg">{trend.emoji || '📈'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-medium">{trend.keyword}</span>
                      <Badge variant="outline" className={cn("text-xs border", statusColors[trend.status])}>
                        {trend.status === 'emerging' ? '🌱' : trend.status === 'growing' ? '📈' : '⚠️'} {trend.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">{trend.description}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-primary">{trend.growth_score}</p>
                    <p className="text-xs text-muted-foreground">score</p>
                  </div>
                </div>
              ))}
            </div>
          ) : !agentsLoading ? (
            <p className="text-sm text-muted-foreground text-center py-4">No trends detected yet</p>
          ) : null}
        </Card>
      </motion.div>

      {/* Cross-Domain Trends */}
      {trendData?.cross_domain_trends && trendData.cross_domain_trends.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card className="glass p-6 gradient-border">
            <h3 className="text-lg font-semibold mb-4">🔗 Cross-Domain Trends</h3>
            <div className="space-y-3">
              {trendData.cross_domain_trends.map((trend, i) => (
                <div key={i} className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <div className="flex items-center gap-2 mb-1">
                    <span>{trend.emoji || '🔗'}</span>
                    <span className="text-sm font-medium">{trend.keyword}</span>
                    <ArrowUpRight className="w-3 h-3 text-primary" />
                    <span className="text-xs font-bold text-primary ml-auto">{trend.growth_score}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{trend.description}</p>
                  <div className="flex gap-1">
                    {trend.domains.map(d => {
                      const info = DOMAINS.find(dd => dd.id === d);
                      return (
                        <Badge key={d} variant="secondary" className="text-xs">
                          {info?.emoji} {info?.label || d}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {/* AI Insights */}
      {insightData && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <Card className="glass p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">🧠 AI Insights</h3>
                <p className="text-xs text-muted-foreground">{insightData.insights?.length || 0} insights generated</p>
              </div>
            </div>

            {insightData.executive_summary && (
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 mb-4">
                <p className="text-sm">{insightData.executive_summary}</p>
              </div>
            )}

            <div className="space-y-3">
              {insightData.insights?.slice(0, 6).map((insight, i) => (
                <div key={i} className="p-3 rounded-lg bg-secondary/20 border border-border/30">
                  <div className="flex items-center gap-2 mb-1">
                    <span>{insight.emoji || '💡'}</span>
                    <span className="text-sm font-medium flex-1">{insight.title}</span>
                    <Badge variant="outline" className={cn("text-xs", insightTypeColors[insight.type] || '')}>
                      {insight.type}
                    </Badge>
                    <span className="text-xs font-bold text-primary">{insight.importance}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{insight.summary}</p>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Reading Time & Content Distribution */}
      <div className="grid gap-4 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
          <Card className="glass p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Estimated Read Time</p>
                <p className="text-2xl font-bold">{analytics.totalReadingTime}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Combined reading time across all {content.length} items.
            </p>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
          <Card className="glass p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Content Distribution</p>
                <p className="text-lg font-semibold">{content.length} total items</p>
              </div>
            </div>
            <div className="flex items-end justify-between gap-2 h-20">
              {analytics.typeBreakdown.map((item, i) => (
                <div key={item.day} className="flex flex-col items-center gap-1 flex-1">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(item.count / analytics.maxTypeCount) * 100}%` }}
                    transition={{ delay: 0.9 + i * 0.05, duration: 0.5 }}
                    className="w-full bg-primary/20 rounded-t-md relative overflow-hidden min-h-[4px]"
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-primary to-primary/50" style={{ height: '100%' }} />
                  </motion.div>
                  <span className="text-xs text-muted-foreground">{item.day}</span>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Top Tags */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}>
        <Card className="glass p-6">
          <h3 className="text-lg font-semibold mb-4">Top Tags</h3>
          {analytics.topTags.length > 0 ? (
            <div className="space-y-3">
              {analytics.topTags.map((tag, index) => (
                <div key={tag.tag} className="flex items-center gap-3">
                  <span className="text-sm font-medium w-28 truncate">{tag.tag}</span>
                  <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(tag.count / analytics.maxTagCount) * 100}%` }}
                      transition={{ delay: 1.0 + index * 0.1, duration: 0.5 }}
                      className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                    />
                  </div>
                  <span className="text-sm text-muted-foreground w-8 text-right">{tag.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No tags found in content.</p>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
