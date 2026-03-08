import { motion } from 'framer-motion';
import { 
  FileText, 
  Github, 
  GraduationCap, 
  Video,
  Wrench,
  ArrowRight,
  Sparkles,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface HeroSectionProps {
  onExplore: () => void;
}

const contentTypes = [
  { icon: FileText, label: 'Articles', color: 'text-blue-400', bg: 'bg-blue-500/10 border border-blue-500/20' },
  { icon: Github, label: 'Repos', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border border-emerald-500/20' },
  { icon: GraduationCap, label: 'Papers', color: 'text-violet-400', bg: 'bg-violet-500/10 border border-violet-500/20' },
  { icon: Video, label: 'Videos', color: 'text-rose-400', bg: 'bg-rose-500/10 border border-rose-500/20' },
  { icon: Wrench, label: 'Tools', color: 'text-orange-400', bg: 'bg-orange-500/10 border border-orange-500/20' },
];

export function HeroSection({ onExplore }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden min-h-[calc(100vh-4rem)] flex items-center justify-center">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] animate-pulse-glow" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-accent/15 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[80px]" />
      </div>

      <div className="relative z-10 text-center max-w-3xl mx-auto px-4">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6"
        >
          <Zap className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">Powered by 4 AI Agents</span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs text-green-500">Active</span>
          </span>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 tracking-tight leading-tight"
        >
          Your Personal
          <br />
          <span className="gradient-text">Tech Radar</span>
        </motion.h1>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed"
        >
          TrendScope AI aggregates, processes, and personalizes the latest AI & tech content. 
          Stay ahead with intelligent summaries, curated insights, and smart notifications.
        </motion.p>

        {/* Content Types */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-center gap-4 flex-wrap mb-12"
        >
          {contentTypes.map((type, index) => {
            const Icon = type.icon;
            return (
              <motion.div
                key={type.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl glass",
                  "hover:border-primary/30 transition-colors cursor-pointer"
                )}
              >
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", type.bg)}>
                  <Icon className={cn("w-4 h-4", type.color)} />
                </div>
                <span className="text-sm font-medium">{type.label}</span>
              </motion.div>
            );
          })}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="flex items-center justify-center gap-4"
        >
          <Button 
            size="lg" 
            onClick={onExplore}
            className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground px-8 glow"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Explore Feed
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="flex items-center justify-center gap-8 mt-12 pt-8 border-t border-border/50"
        >
          <div className="text-center">
            <p className="text-2xl font-bold gradient-text">50K+</p>
            <p className="text-xs text-muted-foreground">Articles Processed</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold gradient-text">10K+</p>
            <p className="text-xs text-muted-foreground">Repos Tracked</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold gradient-text">5K+</p>
            <p className="text-xs text-muted-foreground">Papers Analyzed</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}