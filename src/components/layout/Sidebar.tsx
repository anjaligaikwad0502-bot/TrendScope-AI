import { motion } from 'framer-motion';
import { 
  FileText, 
  Github, 
  GraduationCap, 
  Video, 
  Wrench,
  Bookmark, 
  TrendingUp,
  BarChart3,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  activeFilter: string;
  setActiveFilter: (filter: string) => void;
}

const filters = [
  { id: 'all', label: 'All Content', icon: Zap, color: 'text-primary' },
  { id: 'article', label: 'Articles', icon: FileText, color: 'text-blue-500' },
  { id: 'repo', label: 'Repositories', icon: Github, color: 'text-green-500' },
  { id: 'paper', label: 'Papers', icon: GraduationCap, color: 'text-purple-500' },
  { id: 'video', label: 'Videos', icon: Video, color: 'text-red-500' },
  { id: 'tool', label: 'Tools', icon: Wrench, color: 'text-orange-500' },
];

const extras = [
  { id: 'saved', label: 'Saved', icon: Bookmark },
  { id: 'trending', label: 'Trending', icon: TrendingUp },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
];

export function Sidebar({ activeFilter, setActiveFilter }: SidebarProps) {
  return (
    <motion.aside 
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: 0.1 }}
      className="hidden lg:block w-64 shrink-0"
    >
      <div className="sticky top-20 space-y-6">
        {/* Content Types */}
        <div className="glass rounded-xl p-4">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Content Types
          </h3>
          <nav className="space-y-1">
            {filters.map((filter) => {
              const Icon = filter.icon;
              const isActive = activeFilter === filter.id;
              
              return (
                <button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                    isActive 
                      ? "bg-primary/10 text-primary" 
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute left-0 w-1 h-6 bg-primary rounded-r-full"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <Icon className={cn("w-4 h-4", isActive ? "text-primary" : filter.color)} />
                  {filter.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Extras */}
        <div className="glass rounded-xl p-4">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Quick Access
          </h3>
          <nav className="space-y-1">
            {extras.map((item) => {
              const Icon = item.icon;
              const isActive = activeFilter === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveFilter(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                    isActive 
                      ? "bg-primary/10 text-primary" 
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* AI Stats */}
        <div className="glass rounded-xl p-4 gradient-border">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Zap className="w-4 h-4 text-primary" />
            </div>
            <div>
            <p className="text-xs font-medium text-muted-foreground">AI Agents Active</p>
              <p className="text-lg font-bold text-foreground">5 / 5</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Trend Hunter</span>
              <span className="text-green-500">● Active</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Content Processor</span>
              <span className="text-green-500">● Active</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Personalizer</span>
              <span className="text-green-500">● Active</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Notifier</span>
              <span className="text-green-500">● Active</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Tool Tracker</span>
              <span className="text-green-500">● Active</span>
            </div>
          </div>
        </div>
      </div>
    </motion.aside>
  );
}