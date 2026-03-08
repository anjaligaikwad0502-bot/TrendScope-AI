import { CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ResearchAnalysis } from './types';

interface ConfidenceExplanationProps {
  signals: ResearchAnalysis['confidence_signals'];
}

const signalConfig = {
  positive: {
    icon: CheckCircle2,
    label: 'Positive Signals',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/5 border-emerald-500/10',
    dot: 'bg-emerald-500',
  },
  negative: {
    icon: AlertTriangle,
    label: 'Negative Signals',
    color: 'text-rose-500',
    bg: 'bg-rose-500/5 border-rose-500/10',
    dot: 'bg-rose-500',
  },
  neutral: {
    icon: Info,
    label: 'Neutral Observations',
    color: 'text-muted-foreground',
    bg: 'bg-secondary/30 border-border/50',
    dot: 'bg-muted-foreground',
  },
};

export function ConfidenceExplanation({ signals }: ConfidenceExplanationProps) {
  if (!signals) return null;

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Confidence Analysis Explanation
      </h4>
      {(Object.keys(signalConfig) as Array<keyof typeof signalConfig>).map(key => {
        const items = signals[key];
        if (!items || items.length === 0) return null;
        const config = signalConfig[key];
        const Icon = config.icon;

        return (
          <div key={key} className={cn('p-3 rounded-lg border', config.bg)}>
            <div className="flex items-center gap-2 mb-2">
              <Icon className={cn('w-4 h-4', config.color)} />
              <span className={cn('text-xs font-medium', config.color)}>{config.label}</span>
            </div>
            <ul className="space-y-1">
              {items.map((item, i) => (
                <li key={i} className="text-xs flex items-start gap-2 text-muted-foreground">
                  <span className={cn('w-1.5 h-1.5 rounded-full mt-1.5 shrink-0', config.dot)} />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
