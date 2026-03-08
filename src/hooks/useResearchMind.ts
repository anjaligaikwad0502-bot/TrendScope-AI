import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ContentItem } from '@/lib/api/content';
import type { ResearchAnalysis, PipelineStage, YouTubeResult } from '@/components/research/types';

export function useResearchMind() {
  const [isOpen, setIsOpen] = useState(false);
  const [stage, setStage] = useState<PipelineStage>('idle');
  const [analysis, setAnalysis] = useState<ResearchAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activePaper, setActivePaper] = useState<ContentItem | null>(null);
  const [youtubeVideo, setYoutubeVideo] = useState<YouTubeResult | null>(null);
  const [youtubeLoading, setYoutubeLoading] = useState(false);

  const fetchYouTubeVideo = useCallback(async (title: string) => {
    setYoutubeLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('youtube-research', {
        body: { query: title },
      });
      if (!fnError && data?.data) {
        setYoutubeVideo(data.data);
      }
    } catch (err) {
      console.error('YouTube fetch error:', err);
    } finally {
      setYoutubeLoading(false);
    }
  }, []);

  const analyze = useCallback(async (paper: ContentItem, allContent: ContentItem[]) => {
    setActivePaper(paper);
    setIsOpen(true);
    setAnalysis(null);
    setError(null);
    setYoutubeVideo(null);

    // 7 pipeline stages
    const stages: PipelineStage[] = [
      'searching', 'ranking', 'extracting', 'contradictions',
      'devils_advocate', 'confidence', 'report'
    ];

    const relatedPapers = allContent
      .filter(item =>
        item.id !== paper.id &&
        (item.content_type === 'paper' || item.tags.some(t => paper.tags.includes(t)))
      )
      .slice(0, 8);

    let currentStageIndex = 0;
    const advanceStage = () => {
      if (currentStageIndex < stages.length) {
        setStage(stages[currentStageIndex]);
        currentStageIndex++;
      }
    };

    advanceStage();
    const stageInterval = setInterval(advanceStage, 2000);

    try {
      // Start YouTube search in parallel
      fetchYouTubeVideo(paper.title);

      const { data, error: fnError } = await supabase.functions.invoke('research-mind', {
        body: {
          paper: {
            id: paper.id,
            title: paper.title,
            summary: paper.summary,
            tags: paper.tags,
            author: paper.author,
            source: paper.source,
            arxiv_id: paper.arxiv_id,
            published_at: paper.published_at,
            url: paper.url,
          },
          relatedPapers: relatedPapers.map(p => ({
            id: p.id,
            title: p.title,
            summary: p.summary,
            tags: p.tags,
            author: p.author,
            source: p.source,
            published_at: p.published_at,
            url: p.url,
          })),
        },
      });

      clearInterval(stageInterval);

      if (fnError) {
        setStage('error');
        setError(fnError.message || 'Analysis failed');
        return;
      }

      if (data?.error) {
        setStage('error');
        setError(data.error);
        return;
      }

      setAnalysis(data.data);
      setStage('done');
    } catch (err) {
      clearInterval(stageInterval);
      setStage('error');
      setError(err instanceof Error ? err.message : 'Unexpected error');
    }
  }, [fetchYouTubeVideo]);

  const close = useCallback(() => {
    setIsOpen(false);
    setTimeout(() => {
      setStage('idle');
      setAnalysis(null);
      setError(null);
      setActivePaper(null);
      setYoutubeVideo(null);
    }, 300);
  }, []);

  return {
    isOpen, stage, analysis, error, activePaper,
    youtubeVideo, youtubeLoading,
    analyze, close,
  };
}
