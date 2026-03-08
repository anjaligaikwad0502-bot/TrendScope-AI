import { Video, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { YouTubeResult } from './types';

interface YouTubeExplanationProps {
  video: YouTubeResult | null;
  isLoading: boolean;
}

export function YouTubeExplanation({ video, isLoading }: YouTubeExplanationProps) {
  if (isLoading) {
    return (
      <div className="p-4 rounded-xl bg-secondary/20 border border-border/50 flex items-center gap-3">
        <Loader2 className="w-4 h-4 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">Searching for video explanations…</span>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="p-4 rounded-xl bg-secondary/20 border border-border/50">
        <div className="flex items-center gap-2 mb-1">
          <Video className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Video Explanation</span>
        </div>
        <p className="text-xs text-muted-foreground">
          No related video explanation found for this topic.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/50 overflow-hidden">
      <div className="p-3 flex items-center gap-2 border-b border-border/50">
        <Video className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium">🎥 Video Explanation</span>
      </div>

      {/* Embedded Player */}
      <div className="aspect-video bg-black">
        <iframe
          src={`https://www.youtube.com/embed/${video.videoId}`}
          title={video.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
          loading="lazy"
        />
      </div>

      <div className="p-3 space-y-2">
        <p className="text-sm font-medium line-clamp-2">{video.title}</p>
        <p className="text-xs text-muted-foreground">{video.channel}</p>
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-2"
          asChild
        >
          <a
            href={`https://www.youtube.com/watch?v=${video.videoId}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Watch on YouTube
          </a>
        </Button>
      </div>
    </div>
  );
}
