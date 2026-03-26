import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Github, 
  GraduationCap, 
  Video, 
  Wrench,
  Bookmark, 
  BookmarkCheck,
  Star,
  GitFork,
  Clock,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { ContentItem } from '@/lib/api/content';
import { getDomainInfo } from '@/lib/domainClassifier';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ContentCardProps {
  item: ContentItem;
  index: number;
  isSaved: boolean;
  onToggleSave: (id: string) => void;
}

const typeIcons = {
  article: FileText,
  repo: Github,
  paper: GraduationCap,
  video: Video,
  tool: Wrench,
};

const typeColors = {
  article: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  repo: 'bg-green-500/10 text-green-500 border-green-500/20',
  paper: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  video: 'bg-red-500/10 text-red-500 border-red-500/20',
  tool: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
};

const difficultyColors = {
  beginner: 'bg-emerald-500/10 text-emerald-500',
  intermediate: 'bg-amber-500/10 text-amber-500',
  advanced: 'bg-rose-500/10 text-rose-500',
};

export function ContentCard({ item, index, isSaved, onToggleSave }: ContentCardProps) {
  const navigate = useNavigate();
  const TypeIcon = typeIcons[item.content_type];

  const handleCardClick = () => {
    navigate(`/content/${item.id}`);
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -4 }}
      onClick={handleCardClick}
      className="group glass rounded-2xl p-5 transition-all duration-300 hover:shadow-lg hover:border-primary/30 glow-hover cursor-pointer"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center border",
            typeColors[item.content_type]
          )}>
            <TypeIcon className="w-5 h-5" />
          </div>
          <div>
            <Badge variant="outline" className={cn("text-xs", difficultyColors[item.difficulty_level])}>
              {item.difficulty_level}
            </Badge>
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
              <span>{item.source}</span>
              <span>•</span>
              <span>{item.author}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/10 text-primary text-xs font-medium">
            <TrendingUp className="w-3 h-3" />
            {item.engagement_score}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              onToggleSave(item.id);
            }}
          >
            {isSaved ? (
              <BookmarkCheck className="w-4 h-4 text-primary" />
            ) : (
              <Bookmark className="w-4 h-4 text-muted-foreground" />
            )}
          </Button>
        </div>
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors line-clamp-2">
        {item.title}
      </h3>

      {/* Domain Badge */}
      {item.domain && (
        <div className="mb-3">
          <Badge variant="outline" className="text-xs border-border/50">
            {getDomainInfo(item.domain).emoji} {getDomainInfo(item.domain).label}
          </Badge>
        </div>
      )}

      {/* Summary */}
      <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
        {item.summary}
      </p>

      {/* Key Insights */}
      <div className="mb-4 space-y-2">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Sparkles className="w-3 h-3 text-primary" />
          AI Insights
        </div>
        <ul className="space-y-1">
          {item.key_insights.slice(0, 2).map((insight, i) => (
            <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
              <span className="w-1 h-1 rounded-full bg-primary mt-1.5 shrink-0" />
              <span className="line-clamp-1">{insight}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Repo Stats */}
      {item.content_type === 'repo' && (
        <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-500" />
            <span>{(item.stars || 0).toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1">
            <GitFork className="w-4 h-4" />
            <span>{(item.forks || 0).toLocaleString()}</span>
          </div>
          {item.language && (
            <Badge variant="secondary" className="text-xs">
              {item.language}
            </Badge>
          )}
        </div>
      )}


      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-border/50">
        <div className="flex flex-wrap gap-1">
          {item.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs bg-secondary/50">
              {tag}
            </Badge>
          ))}
          {item.tags.length > 3 && (
            <Badge variant="secondary" className="text-xs bg-secondary/50">
              +{item.tags.length - 3}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          {item.estimated_read_time}
        </div>
      </div>
    </motion.article>
  );
}