import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileFilters } from '@/components/layout/MobileFilters';
import { HeroSection } from '@/components/home/HeroSection';
import { ContentFeed } from '@/components/content/ContentFeed';
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard';
import { ConflictAnalyzer } from '@/components/analyzer/ConflictAnalyzer';
import { AuthModal } from '@/components/auth/AuthModal';
import { AIAssistant } from '@/components/ai/AIAssistant';
import { ThemeProvider } from '@/lib/theme';
import { supabase } from '@/integrations/supabase/client';
import { contentApi } from '@/lib/api/content';
import { useNotifications } from '@/hooks/useNotifications';
import type { User } from '@supabase/supabase-js';

function AppContent() {
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  // Check if coming back from content detail (state.fromFeed) or URL has ?feed=true
  const shouldShowFeed = location.state?.fromFeed || new URLSearchParams(location.search).get('feed') === 'true';
  const [showHero, setShowHero] = useState(!shouldShowFeed);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const feedRef = useRef<HTMLDivElement>(null);
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAll,
  } = useNotifications({
    enabled: true,
    pollInterval: 60000,
    userInterests: [],
  });
  const [platformContext, setPlatformContext] = useState<{
    contentSummary: string;
    trendingTags: string[];
    contentTypes: string;
    totalItems: number;
  }>({ contentSummary: '', trendingTags: [], contentTypes: 'Articles, GitHub Repos, Research Papers, Videos, AI Tools', totalItems: 0 });

  // Fetch platform context for AI assistant
  useEffect(() => {
    if (showHero) return;
    const loadContext = async () => {
      try {
        const items = await contentApi.fetchAllContent();
        const tags = new Map<string, number>();
        items.forEach(item => item.tags?.forEach(t => tags.set(t, (tags.get(t) || 0) + 1)));
        const topTags = [...tags.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15).map(([t]) => t);
        const summary = items.slice(0, 10).map(i => `- [${i.content_type}] "${i.title}" by ${i.author}`).join('\n');
        setPlatformContext({
          contentSummary: summary,
          trendingTags: topTags,
          contentTypes: 'Articles, GitHub Repos, Research Papers, Videos',
          totalItems: items.length,
        });
      } catch (e) {
        console.error('Failed to load platform context:', e);
      }
    };
    loadContext();
  }, [showHero]);

  useEffect(() => {
    // Set up auth state listener BEFORE checking session
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleExplore = () => {
    if (user) {
      // User is authenticated, show feed
      setShowHero(false);
      setTimeout(() => {
        feedRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      // User not authenticated, show auth modal
      setShowAuthModal(true);
    }
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    setShowHero(false);
    setTimeout(() => {
      feedRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        user={user}
        notifications={notifications}
        unreadCount={unreadCount}
        onMarkAsRead={markAsRead}
        onMarkAllAsRead={markAllAsRead}
        onClearAll={clearAll}
      />
      
      {showHero ? (
        <HeroSection onExplore={handleExplore} />
      ) : (
        <div ref={feedRef} className="container mx-auto px-4 py-8">
          <div className="flex gap-8">
            <Sidebar activeFilter={activeFilter} setActiveFilter={setActiveFilter} />
            
            <main className="flex-1 min-w-0">
              <MobileFilters activeFilter={activeFilter} setActiveFilter={setActiveFilter} />
              
              {activeFilter === 'analytics' ? (
                <AnalyticsDashboard />
              ) : activeFilter === 'conflict-analyzer' ? (
                <ConflictAnalyzer />
              ) : (
                <ContentFeed activeFilter={activeFilter} searchQuery={searchQuery} />
              )}
            </main>
          </div>
        </div>
      )}

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
        onSuccess={handleAuthSuccess}
      />

      {!showHero && <AIAssistant platformContext={platformContext} />}
    </div>
  );
}

const Index = () => {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
};

export default Index;