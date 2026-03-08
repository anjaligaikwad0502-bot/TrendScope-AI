import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Github, 
  GraduationCap, 
  Video, 
  Wrench,
  Bookmark, 
  TrendingUp,
  BarChart3,
  Zap,
  Filter,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MobileFiltersProps {
  activeFilter: string;
  setActiveFilter: (filter: string) => void;
}

const filters = [
  { id: 'all', label: 'All', icon: Zap },
  { id: 'article', label: 'Articles', icon: FileText },
  { id: 'repo', label: 'Repos', icon: Github },
  { id: 'paper', label: 'Papers', icon: GraduationCap },
  { id: 'video', label: 'Videos', icon: Video },
  { id: 'tool', label: 'Tools', icon: Wrench },
  { id: 'saved', label: 'Saved', icon: Bookmark },
  { id: 'trending', label: 'Trending', icon: TrendingUp },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
];

export function MobileFilters({ activeFilter, setActiveFilter }: MobileFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="lg:hidden mb-4">
      {/* Filter Button */}
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full justify-between"
      >
        <span className="flex items-center gap-2">
          <Filter className="w-4 h-4" />
          {filters.find(f => f.id === activeFilter)?.label || 'Filter'}
        </span>
        {isOpen ? <X className="w-4 h-4" /> : null}
      </Button>

      {/* Filter Options */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-4 gap-2 mt-3">
              {filters.map((filter) => {
                const Icon = filter.icon;
                const isActive = activeFilter === filter.id;
                
                return (
                  <button
                    key={filter.id}
                    onClick={() => {
                      setActiveFilter(filter.id);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "flex flex-col items-center gap-1 p-3 rounded-xl text-xs font-medium transition-all",
                      isActive 
                        ? "bg-primary/10 text-primary border border-primary/30" 
                        : "bg-secondary/30 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    {filter.label}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}