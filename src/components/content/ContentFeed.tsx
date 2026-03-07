import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ContentCard } from './ContentCard';
import { contentApi, ContentItem, SemanticSearchResult } from '@/lib/api/content';
import { Loader2, Sparkles, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useDebounce } from '@/hooks/useDebounce';
import { supabase } from '@/integrations/supabase/client';
import { ResearchMindPanel } from '@/components/research/ResearchMindPanel';
import { useResearchMind } from '@/hooks/useResearchMind';

interface ContentFeedProps {
  activeFilter: string;
  searchQuery: string;
}

export function ContentFeed({ activeFilter, searchQuery }: ContentFeedProps) {
  const [savedItems, setSavedItems] = useState<Set<string>>(new Set());
  const [content, setContent] = useState<ContentItem[]>([]);
  const [searchResult, setSearchResult] = useState<SemanticSearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const researchMind = useResearchMind();

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Load saved items from database
  useEffect(() => {
    const loadSavedItems = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('saved_items')
        .select('content_id')
        .eq('user_id', user.id);

      if (!error && data) {
        setSavedItems(new Set(data.map(item => item.content_id)));
      }
    };
    loadSavedItems();
  }, []);

  // Fetch content based on filter
  useEffect(() => {
    const fetchContent = async () => {
      setIsLoading(true);
      setError(null);
      setSearchResult(null);
      
      try {
        let data: ContentItem[] = [];
        
        if (activeFilter === 'all' || activeFilter === 'trending') {
          data = await contentApi.fetchAllContent();
        } else if (activeFilter === 'article') {
          data = await contentApi.fetchArticles();
        } else if (activeFilter === 'repo') {
          data = await contentApi.fetchRepos();
        } else if (activeFilter === 'paper') {
          data = await contentApi.fetchPapers();
        } else if (activeFilter === 'video') {
          data = await contentApi.fetchVideos();
        } else if (activeFilter === 'tool') {
          data = await contentApi.fetchTools();
        } else if (activeFilter === 'saved') {
          data = await contentApi.fetchAllContent();
        }
        
        setContent(data);
      } catch (err) {
        console.error('Error fetching content:', err);
        setError('Failed to load content. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    if (activeFilter !== 'analytics') {
      fetchContent();
    }
  }, [activeFilter]);

  // Perform semantic search when query changes
  useEffect(() => {
    const performSearch = async () => {
      if (!debouncedSearchQuery || debouncedSearchQuery.trim().length < 2) {
        setSearchResult(null);
        return;
      }

      setIsSearching(true);
      try {
        const result = await contentApi.semanticSearch(debouncedSearchQuery, content);
        setSearchResult(result);
      } catch (err) {
        console.error('Search error:', err);
        // Fallback to basic search on error
        setSearchResult(contentApi.basicSearch(debouncedSearchQuery, content));
      } finally {
        setIsSearching(false);
      }
    };

    if (content.length > 0) {
      performSearch();
    }
  }, [debouncedSearchQuery, content]);

  const filteredContent = useMemo(() => {
    // If we have a semantic search result, use it
    if (searchResult && debouncedSearchQuery) {
      let items = searchResult.items;
      
      // Filter saved items if on saved tab
      if (activeFilter === 'saved') {
        items = items.filter(item => savedItems.has(item.id));
      }
      
      return items;
    }

    let items = content;

    // Filter saved items
    if (activeFilter === 'saved') {
      items = items.filter(item => savedItems.has(item.id));
    }

    // Sort by engagement for trending
    if (activeFilter === 'trending') {
      items = [...items].sort((a, b) => b.engagement_score - a.engagement_score);
    }

    return items;
  }, [content, searchResult, debouncedSearchQuery, activeFilter, savedItems]);

  const toggleSave = useCallback(async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const isSaved = savedItems.has(id);

    if (isSaved) {
      await supabase
        .from('saved_items')
        .delete()
        .eq('user_id', user.id)
        .eq('content_id', id);
    } else {
      await supabase
        .from('saved_items')
        .insert({ user_id: user.id, content_id: id });
    }

    setSavedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, [savedItems]);

  const handleAnalyze = useCallback((item: ContentItem) => {
    researchMind.analyze(item, content);
  }, [researchMind.analyze, content]);

  if (activeFilter === 'analytics') {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading fresh content...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-destructive/10 flex items-center justify-center">
          <span className="text-3xl">⚠️</span>
        </div>
        <h3 className="text-lg font-semibold mb-2">Something went wrong</h3>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Semantic search info */}
      {searchResult && debouncedSearchQuery && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-primary/5 border border-primary/20"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium">AI-Powered Search</span>
                {isSearching && <Loader2 className="h-3 w-3 animate-spin" />}
              </div>
              <p className="text-xs text-muted-foreground mb-2">
                {searchResult.expandedQuery.intent}
              </p>
              
              {/* Show expanded terms */}
              <div className="flex flex-wrap gap-1.5">
                {searchResult.expandedQuery.synonyms.slice(0, 3).map((term, i) => (
                  <Badge key={`syn-${i}`} variant="secondary" className="text-xs">
                    {term}
                  </Badge>
                ))}
                {searchResult.expandedQuery.relatedTopics.slice(0, 3).map((topic, i) => (
                  <Badge key={`topic-${i}`} variant="outline" className="text-xs">
                    {topic}
                  </Badge>
                ))}
              </div>

              {/* Show if showing related content instead of exact matches */}
              {!searchResult.hasExactMatches && searchResult.items.length > 0 && (
                <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3" />
                  <span>Showing related content based on your search</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing <span className="font-medium text-foreground">{filteredContent.length}</span> results
          {searchResult && debouncedSearchQuery && !searchResult.hasExactMatches && filteredContent.length > 0 && (
            <span className="ml-1">(related content)</span>
          )}
        </p>
      </div>

      {/* Content Grid */}
      <AnimatePresence mode="popLayout">
        {filteredContent.length > 0 ? (
          <motion.div 
            layout
            className="grid gap-4 md:grid-cols-2"
          >
            {filteredContent.map((item, index) => (
              <ContentCard
                key={item.id}
                item={item}
                index={index}
                isSaved={savedItems.has(item.id)}
                onToggleSave={toggleSave}
              />
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-secondary/50 flex items-center justify-center">
              <span className="text-3xl">🔍</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">No content found</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              {activeFilter === 'saved' 
                ? "You haven't saved any items yet. Start exploring and save content for later!"
                : "Try adjusting your filters or search query to find more content."}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ResearchMind Panel */}
      <ResearchMindPanel
        isOpen={researchMind.isOpen}
        onClose={researchMind.close}
        paperTitle={researchMind.activePaper?.title || ''}
        analysis={researchMind.analysis}
        stage={researchMind.stage}
        error={researchMind.error}
        youtubeVideo={researchMind.youtubeVideo}
        youtubeLoading={researchMind.youtubeLoading}
      />
    </div>
  );
}
