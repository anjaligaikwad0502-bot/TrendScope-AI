import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { ContentItem, contentApi } from '@/lib/api/content';
import { supabase } from '@/integrations/supabase/client';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'new_content' | 'trending' | 'personalized' | 'conflict_alert' | 'insight';
  contentType: ContentItem['content_type'];
  contentId: string;
  timestamp: Date;
  read: boolean;
  importanceScore: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  emoji: string;
  reason: string;
}

interface UseNotificationsOptions {
  enabled?: boolean;
  pollInterval?: number;
  userInterests?: string[];
  maxNotificationsPerCycle?: number;
  minImportanceScore?: number;
}


export function useNotifications(options: UseNotificationsOptions = {}) {
  const {
    enabled = true,
    pollInterval = 60000,
    userInterests = [],
    maxNotificationsPerCycle = 5,
    minImportanceScore = 35,
  } = options;

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [agentStats, setAgentStats] = useState<{
    candidatesEvaluated: number;
    filtered: number;
    sent: number;
    avgImportance: number;
  } | null>(null);
  const lastContentIdsRef = useRef<Set<string>>(new Set());
  const recentNotificationIdsRef = useRef<Set<string>>(new Set());
  const isFirstLoadRef = useRef(true);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      read: false,
    };

    // Track to prevent duplicates
    recentNotificationIdsRef.current.add(notification.contentId);

    setNotifications(prev => [newNotification, ...prev].slice(0, 50));
    setUnreadCount(prev => prev + 1);

    // Only show toast for high+ priority
    if (notification.priority === 'critical' || notification.priority === 'high') {
      toast(notification.title, {
        description: notification.message,
        action: {
          label: 'View',
          onClick: () => {
            window.location.href = `/content/${notification.contentId}`;
          },
        },
      });
    }
  }, []);

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  // Intelligent notification agent polling
  useEffect(() => {
    if (!enabled) return;

    const checkForNewContent = async () => {
      try {
        const allContent = await contentApi.fetchAllContent();

        if (isFirstLoadRef.current) {
          lastContentIdsRef.current = new Set(allContent.map(c => c.id));
          isFirstLoadRef.current = false;
          return;
        }

        // Find new content
        const newItems = allContent.filter(item => !lastContentIdsRef.current.has(item.id));
        newItems.forEach(item => lastContentIdsRef.current.add(item.id));

        // Call the notification agent to evaluate and filter
        const { data, error } = await supabase.functions.invoke('notification-agent', {
          body: {
            newItems,
            allItems: allContent,
            userInterests,
            recentNotificationIds: [...recentNotificationIdsRef.current],
            maxNotifications: maxNotificationsPerCycle,
            minImportanceScore,
          },
        });

        if (error) {
          console.error('Notification agent error:', error);
          // Fallback: basic notification for new items
          if (newItems.length > 0) {
            const top = newItems[0];
            addNotification({
              title: `📰 New ${top.content_type} added`,
              message: top.title.slice(0, 60),
              type: 'new_content',
              contentType: top.content_type,
              contentId: top.id,
              importanceScore: 50,
              priority: 'medium',
              emoji: '📰',
              reason: 'fallback',
            });
          }
          return;
        }

        if (data?.success && data.notifications) {
          // Process agent-approved notifications
          for (const notif of data.notifications) {
            addNotification({
              title: notif.title,
              message: notif.message,
              type: notif.type,
              contentType: notif.contentType as ContentItem['content_type'],
              contentId: notif.contentId,
              importanceScore: notif.importanceScore,
              priority: notif.priority,
              emoji: notif.emoji,
              reason: notif.reason,
            });
          }

          if (data.stats) {
            setAgentStats(data.stats);
          }
        }
      } catch (error) {
        console.error('Error in notification agent cycle:', error);
      }
    };

    checkForNewContent();
    const intervalId = setInterval(checkForNewContent, pollInterval);
    return () => clearInterval(intervalId);
  }, [enabled, pollInterval, userInterests, addNotification, maxNotificationsPerCycle, minImportanceScore]);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAll,
    addNotification,
    agentStats,
  };
}
