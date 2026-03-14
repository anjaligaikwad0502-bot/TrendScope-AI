import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, FileStack, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TopicAnalyzer } from './TopicAnalyzer';
import { PaperAnalyzer } from './PaperAnalyzer';

export function ConflictAnalyzer() {
  const [selectedMode, setSelectedMode] = useState<'topic' | 'paper' | null>(null);
  const [activeView, setActiveView] = useState<'select' | 'topic' | 'paper'>('select');

  const modes = [
    {
      id: 'topic' as const,
      title: 'Topic Analyzer',
      description: 'Enter a research topic and let AI automatically find, rank, and analyze papers for conflicts and contradictions.',
      icon: Search,
      features: ['Auto-discover papers', 'Detect contradictions', 'Confidence scoring'],
    },
    {
      id: 'paper' as const,
      title: 'Paper Analyzer',
      description: 'Select specific papers you want to compare and analyze for conflicting claims, methodology differences, and evidence gaps.',
      icon: FileStack,
      features: ['Compare selected papers', 'Side-by-side analysis', 'Methodology review'],
    },
  ];

  if (activeView === 'topic') {
    return <TopicAnalyzer onBack={() => setActiveView('select')} />;
  }

  if (activeView === 'paper') {
    return <PaperAnalyzer onBack={() => setActiveView('select')} />;
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Conflict Analyzer</h2>
            <p className="text-sm text-muted-foreground">
              Discover contradictions and conflicts across research papers
            </p>
          </div>
        </div>
      </motion.div>

      <div className="grid gap-4 md:grid-cols-2">
        {modes.map((mode, index) => {
          const Icon = mode.icon;
          const isSelected = selectedMode === mode.id;

          return (
            <motion.div
              key={mode.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card
                className={`relative cursor-pointer p-6 transition-all hover:shadow-lg border-2 ${
                  isSelected
                    ? 'border-primary bg-primary/5 shadow-lg'
                    : 'border-border hover:border-primary/40'
                }`}
                onClick={() => setSelectedMode(mode.id)}
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className={`p-3 rounded-xl ${isSelected ? 'bg-primary/15' : 'bg-muted'}`}>
                      <Icon className={`w-6 h-6 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-3 h-3 rounded-full bg-primary"
                      />
                    )}
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-1">{mode.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{mode.description}</p>
                  </div>

                  <div className="space-y-1.5">
                    {mode.features.map((feature) => (
                      <div key={feature} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <div className="w-1 h-1 rounded-full bg-primary" />
                        {feature}
                      </div>
                    ))}
                  </div>

                  <Button
                    variant={isSelected ? 'default' : 'outline'}
                    className="w-full mt-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isSelected) {
                        setActiveView(mode.id);
                      } else {
                        setSelectedMode(mode.id);
                      }
                    }}
                  >
                    {isSelected ? 'Continue' : 'Select'}
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {selectedMode && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-muted/50 border border-border text-center"
        >
          <p className="text-sm text-muted-foreground">
            {selectedMode === 'topic'
              ? '🔍 Topic Analyzer mode selected — click "Continue" to enter a topic and auto-discover papers.'
              : '📄 Paper Analyzer mode selected — click "Continue" to select papers to compare.'}
          </p>
        </motion.div>
      )}
    </div>
  );
}
