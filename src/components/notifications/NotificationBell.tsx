import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, Trash2, Shield, TrendingUp, Target, Zap, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Notification } from '@/hooks/useNotifications';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

interface NotificationBellProps {
  notifications: Notification[];
  unreadCount: number;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
}


const typeIcons: Record<string, any> = {
  new_content: Bell,
  trending: TrendingUp,
  personalized: Target,
  conflict_alert: Zap,
  insight: Lightbulb,
};

const priorityStyles: Record<string, string> = {
  critical: 'border-l-4 border-l-destructive bg-destructive/5',
  high: 'border-l-4 border-l-primary bg-primary/5',
  medium: 'border-l-2 border-l-muted-foreground/30',
  low: '',
};

const priorityBadgeVariant: Record<string, string> = {
  critical: 'bg-destructive/15 text-destructive',
  high: 'bg-primary/15 text-primary',
  medium: 'bg-muted text-muted-foreground',
  low: 'bg-muted text-muted-foreground',
};

const typeColors: Record<string, string> = {
  new_content: 'bg-blue-500/20 text-blue-400',
  trending: 'bg-orange-500/20 text-orange-400',
  personalized: 'bg-purple-500/20 text-purple-400',
  conflict_alert: 'bg-red-500/20 text-red-400',
  insight: 'bg-emerald-500/20 text-emerald-400',
};

export function NotificationBell({
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
}: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleNotificationClick = (notification: Notification) => {
    onMarkAsRead(notification.id);
    setIsOpen(false);
    navigate(`/content/${notification.contentId}`);
  };

  const criticalCount = notifications.filter(n => !n.read && n.priority === 'critical').length;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-full"
        >
          <Bell className="h-5 w-5" />
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className={`absolute -top-1 -right-1 h-4 w-4 rounded-full text-[10px] font-bold flex items-center justify-center ${
                  criticalCount > 0
                    ? 'bg-destructive text-destructive-foreground'
                    : 'bg-primary text-primary-foreground'
                }`}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end" side="bottom" sideOffset={8}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm">Smart Notifications</h3>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                {unreadCount} new
              </Badge>
            )}
          </div>
          <div className="flex gap-1">
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" className="text-xs h-7" onClick={onMarkAllAsRead}>
                <Check className="h-3 w-3 mr-1" />
                Read all
              </Button>
            )}
            {notifications.length > 0 && (
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClearAll}>
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="h-[420px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <Bell className="h-6 w-6 opacity-50" />
              </div>
              <p className="text-sm font-medium">No notifications yet</p>
              <p className="text-xs mt-1 text-center px-8">
                The notification agent monitors trends, conflicts & insights for you
              </p>
            </div>
          ) : (
            <div>
              {notifications.map((notification) => {
                const TypeIcon = typeIcons[notification.type] || Bell;
                return (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`p-3 cursor-pointer transition-colors hover:bg-muted/50 ${
                      priorityStyles[notification.priority] || ''
                    } ${!notification.read ? '' : 'opacity-60'}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex gap-3">
                      <div className={`p-1.5 rounded-lg shrink-0 ${typeColors[notification.type] || typeColors.new_content}`}>
                        <TypeIcon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-xs font-semibold ${!notification.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {notification.title}
                          </p>
                          <div className="flex items-center gap-1 shrink-0">
                            {notification.importanceScore >= 60 && (
                              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${priorityBadgeVariant[notification.priority]}`}>
                                {notification.importanceScore}
                              </span>
                            )}
                            {!notification.read && (
                              <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <p className="text-[10px] text-muted-foreground/60">
                            {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                          </p>
                          {notification.reason && notification.reason !== 'fallback' && (
                            <p className="text-[10px] text-muted-foreground/40 truncate">
                              • {notification.reason.split(',')[0]}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Footer with agent status */}
        {notifications.length > 0 && (
          <div className="border-t px-4 py-2 flex items-center justify-center gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] text-muted-foreground">
              Notification Agent active — filtering low-value alerts
            </span>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
