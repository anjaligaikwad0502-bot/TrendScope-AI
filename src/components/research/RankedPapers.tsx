import { Trophy, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ResearchAnalysis } from './types';

interface RankedPapersProps {
  papers: ResearchAnalysis['ranked_papers'];
}

export function RankedPapers({ papers }: RankedPapersProps) {
  if (!papers || papers.length === 0) return null;

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
        <Trophy className="w-3.5 h-3.5 text-primary" />
        Top Ranked Papers
      </h4>
      <div className="space-y-2">
        {papers.slice(0, 5).map((p, i) => (
          <div
            key={i}
            className="p-3 rounded-lg bg-secondary/20 border border-border/30 flex items-start gap-3"
          >
            <div className={cn(
              'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0',
              i === 0 ? 'bg-primary text-primary-foreground' :
              i === 1 ? 'bg-primary/60 text-primary-foreground' :
              'bg-muted text-muted-foreground'
            )}>
              {i + 1}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium line-clamp-2">{p.title}</p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {p.author && (
                  <span className="text-xs text-muted-foreground">{p.author}</span>
                )}
                <Badge variant="outline" className="text-[10px]">
                  {Math.round(p.relevance_score * 100)}% relevant
                </Badge>
                {p.published_at && (
                  <span className="text-[10px] text-muted-foreground">{p.published_at}</span>
                )}
              </div>
            </div>
            {p.url && (
              <a
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 text-primary hover:text-primary/80"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
