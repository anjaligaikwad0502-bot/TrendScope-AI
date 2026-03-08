import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { ContentItem, contentApi } from '@/lib/api/content';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'new_content' | 'trending' | 'personalized';
  contentType: ContentItem['content_type'];
  contentId: string;
  timestamp: Date;
  read: boolean;
}

interface UseNotificationsOptions {
  enabled?: boolean;
  pollInterval?: number; // in ms
  userInterests?: string[]; // tags/topics user has interacted with
}

export function useNotifications(options: UseNotificationsOptions = {}) {
  const { enabled = true, pollInterval = 60000, userInterests = [] } = options;
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const lastContentIdsRef = useRef<Set<string>>(new Set());
  const isFirstLoadRef = useRef(true);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      read: false,
    };

    setNotifications(prev => [newNotification, ...prev].slice(0, 50)); // Keep last 50
    setUnreadCount(prev => prev + 1);

    // Show toast for new content
    toast(notification.title, {
      description: notification.message,
      action: {
        label: 'View',
        onClick: () => {
          window.location.href = `/content/${notification.contentId}`;
        },
      },
    });
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

  // Check for new content periodically
  useEffect(() => {
    if (!enabled) return;

    const checkForNewContent = async () => {
      try {
        const allContent = await contentApi.fetchAllContent();
        
        if (isFirstLoadRef.current) {
          // On first load, just save the IDs without notifying
          lastContentIdsRef.current = new Set(allContent.map(c => c.id));
          isFirstLoadRef.current = false;
          return;
        }

        // Find new content items
        const newItems = allContent.filter(item => !lastContentIdsRef.current.has(item.id));
        
        if (newItems.length > 0) {
          // Update the known IDs
          newItems.forEach(item => lastContentIdsRef.current.add(item.id));

          // Check if any new items match user interests
          const matchingItems = userInterests.length > 0
            ? newItems.filter(item => 
                item.tags.some(tag => 
                  userInterests.some(interest => 
                    tag.toLowerCase().includes(interest.toLowerCase()) ||
                    interest.toLowerCase().includes(tag.toLowerCase())
                  )
                )
              )
            : [];

          // Notify about matching content first
          matchingItems.slice(0, 3).forEach(item => {
            addNotification({
              title: `New ${item.content_type} matches your interests!`,
              message: item.title.slice(0, 60) + (item.title.length > 60 ? '...' : ''),
              type: 'personalized',
              contentType: item.content_type,
              contentId: item.id,
            });
          });

          // If there are many new items, show a summary
          const remainingNew = newItems.filter(item => !matchingItems.includes(item));
          if (remainingNew.length >= 5) {
            addNotification({
              title: `${remainingNew.length} new items available`,
              message: 'Fresh content has been added to your feed',
              type: 'new_content',
              contentType: 'article', // Default type for summary
              contentId: remainingNew[0]?.id || '',
            });
          } else if (remainingNew.length > 0 && matchingItems.length === 0) {
            // Show individual notifications for small batches
            remainingNew.slice(0, 2).forEach(item => {
              addNotification({
                title: `New ${item.content_type} added`,
                message: item.title.slice(0, 60) + (item.title.length > 60 ? '...' : ''),
                type: 'new_content',
                contentType: item.content_type,
                contentId: item.id,
              });
            });
          }
        }

        // Also check for trending content (high engagement)
        const trendingItems = allContent
          .filter(item => item.engagement_score >= 90 && !lastContentIdsRef.current.has(`trending-${item.id}`))
          .slice(0, 1);

        trendingItems.forEach(item => {
          lastContentIdsRef.current.add(`trending-${item.id}`);
          addNotification({
            title: '🔥 Trending now',
            message: item.title.slice(0, 60) + (item.title.length > 60 ? '...' : ''),
            type: 'trending',
            contentType: item.content_type,
            contentId: item.id,
          });
        });
      } catch (error) {
        console.error('Error checking for new content:', error);
      }
    };

    // Initial check
    checkForNewContent();

    // Set up polling
    const intervalId = setInterval(checkForNewContent, pollInterval);

    return () => clearInterval(intervalId);
  }, [enabled, pollInterval, userInterests, addNotification]);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAll,
    addNotification,
  };
}
