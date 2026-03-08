import { Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import type { ResearchAnalysis } from './types';

interface ConfidencePanelProps {
  analysis: ResearchAnalysis;
}

const breakdownLabels: Record<string, string> = {
  recency: 'Recency',
  relevance: 'Relevance',
  agreement: 'Agreement',
};

export function ConfidencePanel({ analysis }: ConfidencePanelProps) {
  const score = analysis.confidence_score;
  const breakdown = analysis.confidence_breakdown;

  return (
    <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-4">
      {/* Overall Score */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          Confidence Score
        </span>
        <span className={cn(
          'text-2xl font-bold',
          score >= 0.7 ? 'text-emerald-500' :
          score >= 0.4 ? 'text-amber-500' : 'text-rose-500'
        )}>
          {Math.round(score * 100)}%
        </span>
      </div>
      <Progress value={score * 100} className="h-2" />
      <p className="text-xs text-muted-foreground">{analysis.confidence_explanation}</p>

      {/* Breakdown Bars */}
      {breakdown && (
        <div className="space-y-2.5 pt-2 border-t border-border/50">
          {Object.entries(breakdown).map(([key, value]) => (
            <div key={key} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{breakdownLabels[key] || key}</span>
                <span className="font-medium">{Math.round((value as number) * 100)}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    (value as number) >= 0.7 ? 'bg-emerald-500' :
                    (value as number) >= 0.4 ? 'bg-amber-500' : 'bg-rose-500'
                  )}
                  style={{ width: `${(value as number) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
