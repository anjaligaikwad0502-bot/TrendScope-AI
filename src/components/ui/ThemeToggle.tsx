import { motion } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { cn } from '@/lib/utils';

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const options = [
    { value: 'light' as const, icon: Sun, label: 'Light' },
    { value: 'dark' as const, icon: Moon, label: 'Dark' },
  ];

  return (
    <div className="flex items-center gap-1 p-1 rounded-lg bg-secondary/50 border border-border/50">
      {options.map((option) => {
        const Icon = option.icon;
        const isActive = theme === option.value;
        
        return (
          <button
            key={option.value}
            onClick={() => setTheme(option.value)}
            className={cn(
              "relative p-2 rounded-md transition-colors",
              isActive 
                ? "text-primary" 
                : "text-muted-foreground hover:text-foreground"
            )}
            title={option.label}
          >
            {isActive && (
              <motion.div
                layoutId="theme-toggle-bg"
                className="absolute inset-0 bg-primary/10 rounded-md"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <Icon className="relative z-10 w-4 h-4" />
          </button>
        );
      })}
    </div>
  );
}