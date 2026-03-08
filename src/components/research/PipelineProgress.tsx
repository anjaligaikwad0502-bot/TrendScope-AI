import { motion } from 'framer-motion';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PipelineStage } from './types';
import { PIPELINE_STAGES } from './types';

interface PipelineProgressProps {
  stage: PipelineStage;
}

export function PipelineProgress({ stage }: PipelineProgressProps) {
  const currentIndex = PIPELINE_STAGES.findIndex(s => s.key === stage);

  return (
    <div className="px-4 py-3 border-b border-border/50 space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Loader2 className="w-4 h-4 animate-spin text-primary" />
        <span>{PIPELINE_STAGES[currentIndex]?.label || 'Processing…'}</span>
      </div>
      <div className="space-y-1.5">
        {PIPELINE_STAGES.map((s, i) => {
          const isDone = i < currentIndex;
          const isActive = i === currentIndex;
          return (
            <motion.div
              key={s.key}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-2"
            >
              <div className={cn(
                'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors',
                isDone ? 'bg-primary text-primary-foreground' :
                isActive ? 'bg-primary/20 text-primary ring-2 ring-primary/50' :
                'bg-muted text-muted-foreground'
              )}>
                {isDone ? <CheckCircle2 className="w-3 h-3" /> : i + 1}
              </div>
              <span className={cn(
                'text-xs transition-colors',
                isDone ? 'text-foreground' :
                isActive ? 'text-primary font-medium' :
                'text-muted-foreground'
              )}>
                {s.label}
              </span>
              {isActive && (
                <motion.div
                  className="w-2 h-2 rounded-full bg-primary"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                />
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
