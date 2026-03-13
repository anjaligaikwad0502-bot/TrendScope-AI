import { motion } from 'framer-motion';
import { Search, FileStack, ArrowRight } from 'lucide-react';

interface ConflictAnalyzerProps {
  onSelectMode: (mode: 'topic' | 'paper') => void;
}

const modes = [
  {
    id: 'topic' as const,
    title: 'Topic Analyzer',
    description: 'Enter a research topic and we\'ll automatically find and compare papers for contradictions and agreements.',
    icon: Search,
    gradient: 'from-blue-500/20 to-cyan-500/20',
    iconColor: 'text-blue-500',
    borderColor: 'border-blue-500/20 hover:border-blue-500/40',
  },
  {
    id: 'paper' as const,
    title: 'Paper Analyzer',
    description: 'Select and compare specific papers side-by-side to identify conflicts, agreements, and evidence gaps.',
    icon: FileStack,
    gradient: 'from-purple-500/20 to-pink-500/20',
    iconColor: 'text-purple-500',
    borderColor: 'border-purple-500/20 hover:border-purple-500/40',
  },
];

export function ConflictAnalyzer({ onSelectMode }: ConflictAnalyzerProps) {
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-2xl font-bold text-foreground mb-1">Conflict Analyzer</h2>
        <p className="text-sm text-muted-foreground">
          Discover contradictions and agreements across research papers using AI.
        </p>
      </motion.div>

      <div className="grid gap-4 md:grid-cols-2">
        {modes.map((mode, index) => {
          const Icon = mode.icon;
          return (
            <motion.button
              key={mode.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => onSelectMode(mode.id)}
              className={`group relative text-left p-6 rounded-2xl border ${mode.borderColor} bg-card transition-all hover:shadow-lg`}
            >
              <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${mode.gradient} opacity-0 group-hover:opacity-100 transition-opacity`} />
              <div className="relative space-y-4">
                <div className={`w-12 h-12 rounded-xl bg-secondary/50 flex items-center justify-center ${mode.iconColor}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">{mode.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{mode.description}</p>
                </div>
                <div className="flex items-center gap-2 text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  Get started <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
