import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  FileText, 
  Github, 
  GraduationCap, 
  Video,
  Wrench,
  Star,
  GitFork,
  Clock,
  TrendingUp,
  Bookmark,
  BookmarkCheck,
  Share2,
  Sparkles,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { contentApi, ContentItem } from '@/lib/api/content';
import { cn } from '@/lib/utils';
import { ThemeProvider } from '@/lib/theme';
import { Header } from '@/components/layout/Header';
import { toast } from 'sonner';
import { useAutoConflictAnalysis } from '@/hooks/useAutoConflictAnalysis';
import { AutoConflictOverlay } from '@/components/content/AutoConflictOverlay';

const typeIcons = {
  article: FileText,
  repo: Github,
  paper: GraduationCap,
  video: Video,
  tool: Wrench,
};

const typeColors = {
  article: { bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-500/20' },
  repo: { bg: 'bg-green-500/10', text: 'text-green-500', border: 'border-green-500/20' },
  paper: { bg: 'bg-purple-500/10', text: 'text-purple-500', border: 'border-purple-500/20' },
  video: { bg: 'bg-red-500/10', text: 'text-red-500', border: 'border-red-500/20' },
  tool: { bg: 'bg-orange-500/10', text: 'text-orange-500', border: 'border-orange-500/20' },
};

const difficultyColors = {
  beginner: 'bg-emerald-500/10 text-emerald-500',
  intermediate: 'bg-amber-500/10 text-amber-500',
  advanced: 'bg-rose-500/10 text-rose-500',
};

function ContentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [item, setItem] = useState<ContentItem | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const conflictAnalysis = useAutoConflictAnalysis(item);

  useEffect(() => {
    const fetchItem = async () => {
      if (!id) return;
      
      setIsLoading(true);
      try {
        // Determine content type from ID prefix
        let contentType: 'article' | 'repo' | 'paper' | 'video' | 'tool' | null = null;
        if (id.startsWith('devto-') || id.startsWith('hn-')) {
          contentType = 'article';
        } else if (id.startsWith('gh-')) {
          contentType = 'repo';
        } else if (id.startsWith('arxiv-')) {
          contentType = 'paper';
        } else if (id.startsWith('yt-')) {
          contentType = 'video';
        } else if (id.startsWith('tool-')) {
          contentType = 'tool';
        }

        if (contentType) {
          const items = await contentApi.fetchByType(contentType);
          const foundItem = items.find(c => c.id === id);
          setItem(foundItem || null);
        } else {
          // Fallback: fetch all and search
          const allContent = await contentApi.fetchAllContent();
          const foundItem = allContent.find(c => c.id === id);
          setItem(foundItem || null);
        }
      } catch (error) {
        console.error('Error fetching content:', error);
        setItem(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchItem();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading content...</p>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Content not found</h2>
          <Button onClick={() => navigate('/')}>Go back home</Button>
        </div>
      </div>
    );
  }

  const TypeIcon = typeIcons[item.content_type];
  const colors = typeColors[item.content_type];

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-background">
      <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} notifications={[]} unreadCount={0} onMarkAsRead={() => {}} onMarkAllAsRead={() => {}} onClearAll={() => {}} />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-6"
        >
          <Button 
            variant="ghost" 
            onClick={() => navigate('/', { state: { fromFeed: true } })}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Feed
          </Button>
        </motion.div>

        {/* Content Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-8 mb-6"
        >
          <div className="flex items-start gap-4 mb-6">
            <div className={cn(
              "w-14 h-14 rounded-xl flex items-center justify-center border",
              colors.bg, colors.border
            )}>
              <TypeIcon className={cn("w-7 h-7", colors.text)} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge className={cn("capitalize", colors.bg, colors.text, colors.border)}>
                  {item.content_type}
                </Badge>
                <Badge variant="outline" className={difficultyColors[item.difficulty_level]}>
                  {item.difficulty_level}
                </Badge>
                <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/10 text-primary text-xs font-medium">
                  <TrendingUp className="w-3 h-3" />
                  {item.engagement_score}% engagement
                </div>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">{item.title}</h1>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span>{item.source}</span>
                <span>•</span>
                <span>{item.author}</span>
                <span>•</span>
                <span>{item.published_at}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-4 border-t border-border/50">
            <Button
              variant={isSaved ? "default" : "outline"}
              onClick={() => {
                setIsSaved(!isSaved);
                toast.success(isSaved ? 'Removed from saved' : 'Saved for later!');
              }}
              className="gap-2"
            >
              {isSaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
              {isSaved ? 'Saved' : 'Save for Later'}
            </Button>
            <Button variant="outline" onClick={handleShare} className="gap-2">
              <Share2 className="w-4 h-4" />
              Share
            </Button>
            {item.url && (
              <Button 
                variant="outline" 
                onClick={() => window.open(item.url, '_blank')} 
                className="gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                View Source
              </Button>
            )}
            <div className="flex-1" />
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              {item.estimated_read_time}
            </div>
          </div>
        </motion.div>

        {/* Repo Stats */}
        {item.content_type === 'repo' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass rounded-2xl p-6 mb-6"
          >
            <h3 className="text-lg font-semibold mb-4">Repository Stats</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                <Star className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">{(item.stars || 0).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Stars</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <GitFork className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">{(item.forks || 0).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Forks</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                <FileText className="w-6 h-6 text-purple-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">{item.language}</p>
                <p className="text-xs text-muted-foreground">Language</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Video Player */}
        {item.content_type === 'video' && item.video_id && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass rounded-2xl p-6 mb-6"
          >
            <div className="aspect-video rounded-xl overflow-hidden">
              <iframe
                src={`https://www.youtube.com/embed/${item.video_id}`}
                title={item.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          </motion.div>
        )}

        {/* AI Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass rounded-2xl p-6 mb-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">AI Summary</h3>
          </div>
          <p className="text-muted-foreground leading-relaxed">{item.summary}</p>
        </motion.div>

        {/* Key Insights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-2xl p-6 mb-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Key Insights</h3>
          </div>
          <ul className="space-y-3">
            {item.key_insights.map((insight, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span className="text-muted-foreground">{insight}</span>
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Full Content Placeholder */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="glass rounded-2xl p-6 mb-6"
        >
          <h3 className="text-lg font-semibold mb-4">
            {item.content_type === 'article' && 'Full Article'}
            {item.content_type === 'repo' && 'README Preview'}
            {item.content_type === 'paper' && 'Paper Abstract'}
            {item.content_type === 'video' && 'Video Transcript'}
            {item.content_type === 'tool' && 'Tool Overview'}
          </h3>
          <div className="prose prose-invert max-w-none">
            <p className="text-muted-foreground leading-relaxed">
              {item.summary}
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              This is where the full content would be rendered. For articles, this would include the complete text with formatting. 
              For repositories, this would show the README.md content. For papers, this would display the abstract and key sections. 
              For videos, this would show an AI-generated transcript with timestamps.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              The content is processed by our AI agents to provide summaries, extract key insights, and categorize the material 
              based on difficulty level and relevance to your interests.
            </p>
          </div>
        </motion.div>

        {/* Auto Conflict Analysis - above Tags */}
        {(item.content_type === 'paper' || item.content_type === 'article') && (
          <AutoConflictOverlay
            result={conflictAnalysis.result}
            loading={conflictAnalysis.loading}
            error={conflictAnalysis.error}
          />
        )}

        {/* Tags */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold mb-4">Tags & Topics</h3>
          <div className="flex flex-wrap gap-2">
            {item.tags.map((tag) => (
              <Badge 
                key={tag} 
                variant="secondary" 
                className="text-sm cursor-pointer hover:bg-primary/20 transition-colors"
              >
                {tag}
              </Badge>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function ContentDetail() {
  return (
    <ThemeProvider>
      <ContentDetailPage />
    </ThemeProvider>
  );
}
