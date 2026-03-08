import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Brain, Zap, CheckCircle2, XCircle, HelpCircle,
  ChevronDown, ChevronUp, AlertTriangle, Scale, Search, FileWarning
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { ResearchAnalysis, PipelineStage, YouTubeResult } from './types';
import { PipelineProgress } from './PipelineProgress';
import { ConfidencePanel } from './ConfidencePanel';
import { ConfidenceExplanation } from './ConfidenceExplanation';
import { RankedPapers } from './RankedPapers';
import { YouTubeExplanation } from './YouTubeExplanation';
import { ReportDownload } from './ReportDownload';

interface ResearchMindPanelProps {
  isOpen: boolean;
  onClose: () => void;
  paperTitle: string;
  analysis: ResearchAnalysis | null;
  stage: PipelineStage;
  error?: string | null;
  youtubeVideo: YouTubeResult | null;
  youtubeLoading: boolean;
}

const strengthColor: Record<string, string> = {
  strong: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  moderate: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  weak: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
};

const severityColor: Record<string, string> = {
  high: 'text-rose-500',
  medium: 'text-amber-500',
  low: 'text-muted-foreground',
};

export function ResearchMindPanel({
  isOpen, onClose, paperTitle, analysis, stage, error,
  youtubeVideo, youtubeLoading
}: ResearchMindPanelProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>('ranked');
  const toggle = (section: string) => setExpandedSection(prev => prev === section ? null : section);

  const isLoading = stage !== 'idle' && stage !== 'done' && stage !== 'error';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-lg glass-strong border-l border-border/50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border/50">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Brain className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold">ResearchMind</h2>
                  <p className="text-xs text-muted-foreground truncate">{paperTitle}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Pipeline Progress */}
            {isLoading && <PipelineProgress stage={stage} />}

            {/* Error */}
            {stage === 'error' && (
              <div className="p-4 m-4 rounded-xl bg-destructive/10 border border-destructive/20 flex items-start gap-3">
                <FileWarning className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Analysis failed</p>
                  <p className="text-xs text-muted-foreground mt-1">{error || 'An unexpected error occurred.'}</p>
                </div>
              </div>
            )}

            {/* Results */}
            {analysis && stage === 'done' && (
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-4">
                  {/* Confidence Panel */}
                  <ConfidencePanel analysis={analysis} />

                  {/* Confidence Explanation */}
                  <ConfidenceExplanation signals={analysis.confidence_signals} />

                  {/* Summary */}
                  <div className="p-3 rounded-xl bg-secondary/30 text-sm text-muted-foreground">
                    {analysis.reasoning_summary}
                  </div>

                  {/* Top Ranked Papers */}
                  <CollapsibleSection
                    title="Top 5 Ranked Papers"
                    icon={Search}
                    count={analysis.ranked_papers?.length || 0}
                    isOpen={expandedSection === 'ranked'}
                    onToggle={() => toggle('ranked')}
                  >
                    <RankedPapers papers={analysis.ranked_papers} />
                  </CollapsibleSection>

                  {/* Claims */}
                  <CollapsibleSection
                    title="Key Claims"
                    icon={Zap}
                    count={analysis.claims.length}
                    isOpen={expandedSection === 'claims'}
                    onToggle={() => toggle('claims')}
                  >
                    <div className="space-y-2">
                      {analysis.claims.map((c, i) => (
                        <div key={i} className="p-3 rounded-lg bg-secondary/20 space-y-1.5">
                          <div className="flex items-start gap-2">
                            <Badge variant="outline" className={cn('text-[10px] shrink-0 mt-0.5', strengthColor[c.strength] || '')}>
                              {c.strength}
                            </Badge>
                            <p className="text-sm">{c.text}</p>
                          </div>
                          <Badge variant="secondary" className="text-[10px]">{c.type}</Badge>
                        </div>
                      ))}
                    </div>
                  </CollapsibleSection>

                  {/* Agreements (Supporting Papers) */}
                  {analysis.supporting_papers.length > 0 && (
                    <CollapsibleSection
                      title="Agreements"
                      icon={CheckCircle2}
                      count={analysis.supporting_papers.length}
                      isOpen={expandedSection === 'supporting'}
                      onToggle={() => toggle('supporting')}
                    >
                      <div className="space-y-2">
                        {analysis.supporting_papers.map((p, i) => (
                          <div key={i} className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                            <p className="text-sm font-medium">{p.title}</p>
                            <p className="text-xs text-muted-foreground mt-1">{p.relation}</p>
                          </div>
                        ))}
                      </div>
                    </CollapsibleSection>
                  )}

                  {/* Contradictions */}
                  {(analysis.conflicting_papers.length > 0 || analysis.contradictions.length > 0) && (
                    <CollapsibleSection
                      title="Contradictions"
                      icon={XCircle}
                      count={analysis.conflicting_papers.length + analysis.contradictions.length}
                      isOpen={expandedSection === 'contradictions'}
                      onToggle={() => toggle('contradictions')}
                    >
                      <div className="space-y-2">
                        {analysis.conflicting_papers.map((p, i) => (
                          <div key={`cp-${i}`} className="p-3 rounded-lg bg-rose-500/5 border border-rose-500/10">
                            <p className="text-sm font-medium">{p.title}</p>
                            <p className="text-xs text-muted-foreground mt-1">{p.contradiction}</p>
                          </div>
                        ))}
                        {analysis.contradictions.map((c, i) => (
                          <div key={`ct-${i}`} className="p-3 rounded-lg bg-secondary/20 flex items-start gap-2">
                            <AlertTriangle className={cn('w-4 h-4 mt-0.5 shrink-0', severityColor[c.severity])} />
                            <div>
                              <p className="text-sm">{c.description}</p>
                              <Badge variant="outline" className="text-[10px] mt-1">{c.severity} severity</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CollapsibleSection>
                  )}

                  {/* Devil's Advocate */}
                  {analysis.devils_advocate.length > 0 && (
                    <CollapsibleSection
                      title="Devil's Advocate Review"
                      icon={Scale}
                      count={analysis.devils_advocate.length}
                      isOpen={expandedSection === 'devils'}
                      onToggle={() => toggle('devils')}
                    >
                      <div className="space-y-2">
                        {analysis.devils_advocate.map((d, i) => (
                          <div key={i} className="p-3 rounded-lg bg-secondary/20 space-y-1">
                            <p className="text-sm font-medium">{d.challenge}</p>
                            <p className="text-xs text-muted-foreground">
                              Re: <span className="italic">{d.target_claim}</span>
                            </p>
                          </div>
                        ))}
                      </div>
                    </CollapsibleSection>
                  )}

                  {/* Evidence Gaps */}
                  {analysis.evidence_gaps.length > 0 && (
                    <CollapsibleSection
                      title="Evidence Gaps"
                      icon={HelpCircle}
                      count={analysis.evidence_gaps.length}
                      isOpen={expandedSection === 'gaps'}
                      onToggle={() => toggle('gaps')}
                    >
                      <ul className="space-y-1.5">
                        {analysis.evidence_gaps.map((g, i) => (
                          <li key={i} className="text-sm flex items-start gap-2 text-muted-foreground">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                            {g}
                          </li>
                        ))}
                      </ul>
                    </CollapsibleSection>
                  )}

                  {/* YouTube Explanation */}
                  <YouTubeExplanation video={youtubeVideo} isLoading={youtubeLoading} />

                  {/* Download Report */}
                  <ReportDownload
                    paperTitle={paperTitle}
                    analysis={analysis}
                    video={youtubeVideo}
                  />
                </div>
              </ScrollArea>
            )}

            {/* Loading placeholder */}
            {isLoading && !analysis && (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center space-y-3">
                  <Brain className="w-12 h-12 text-primary/30 mx-auto animate-pulse" />
                  <p className="text-sm text-muted-foreground">ResearchMind is thinking…</p>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function CollapsibleSection({
  title, icon: Icon, count, isOpen, onToggle, children
}: {
  title: string;
  icon: typeof Search;
  count: number;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border/50 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 hover:bg-secondary/20 transition-colors"
      >
        <div className="flex items-center gap-2 text-sm font-medium">
          <Icon className="w-4 h-4 text-primary" />
          {title}
          <Badge variant="secondary" className="text-[10px] ml-1">{count}</Badge>
        </div>
        {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-3 pt-0">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
