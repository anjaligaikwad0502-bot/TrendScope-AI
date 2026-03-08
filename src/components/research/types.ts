export interface ResearchAnalysis {
  claims: { text: string; type: string; strength: string }[];
  supporting_papers: { title: string; relation: string }[];
  conflicting_papers: { title: string; contradiction: string }[];
  contradictions: { description: string; severity: string }[];
  evidence_gaps: string[];
  devils_advocate: { challenge: string; target_claim: string }[];
  confidence_score: number;
  confidence_breakdown: {
    recency: number;
    relevance: number;
    agreement: number;
  };
  confidence_explanation: string;
  confidence_signals: {
    positive: string[];
    negative: string[];
    neutral: string[];
  };
  ranked_papers: {
    title: string;
    author: string;
    relevance_score: number;
    url?: string | null;
    published_at?: string | null;
  }[];
  reasoning_summary: string;
}

export interface YouTubeResult {
  videoId: string;
  title: string;
  channel: string;
  thumbnail: string;
}

export type PipelineStage =
  | 'idle'
  | 'searching'
  | 'ranking'
  | 'extracting'
  | 'contradictions'
  | 'devils_advocate'
  | 'confidence'
  | 'report'
  | 'done'
  | 'error';

export const PIPELINE_STAGES: { key: PipelineStage; label: string }[] = [
  { key: 'searching', label: 'Searching Papers' },
  { key: 'ranking', label: 'Ranking Top 5' },
  { key: 'extracting', label: 'Extracting Claims' },
  { key: 'contradictions', label: 'Detecting Contradictions' },
  { key: 'devils_advocate', label: 'Devil Advocate Review' },
  { key: 'confidence', label: 'Generating Confidence Score' },
  { key: 'report', label: 'Creating Report' },
];
