import { supabase } from '@/integrations/supabase/client';

export interface ContentItem {
  id: string;
  title: string;
  content_type: 'article' | 'repo' | 'paper' | 'video' | 'tool';
  summary: string;
  key_insights: string[];
  tags: string[];
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  estimated_read_time: string;
  engagement_score: number;
  source: string;
  author: string;
  published_at: string;
  url: string;
  image?: string;
  stars?: number;
  forks?: number;
  language?: string;
  thumbnail?: string;
  video_id?: string;
  arxiv_id?: string;
  tool_category?: string;
  pricing?: string;
}

export interface SemanticSearchResult {
  items: ContentItem[];
  expandedQuery: {
    original: string;
    synonyms: string[];
    relatedTopics: string[];
    intent: string;
  };
  hasExactMatches: boolean;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export const contentApi = {
  async fetchArticles(): Promise<ContentItem[]> {
    try {
      const { data, error } = await supabase.functions.invoke('fetch-articles');
      
      if (error) {
        console.error('Error fetching articles:', error);
        return [];
      }
      
      return data?.data || [];
    } catch (error) {
      console.error('Error fetching articles:', error);
      return [];
    }
  },

  async fetchRepos(query?: string): Promise<ContentItem[]> {
    try {
      const { data, error } = await supabase.functions.invoke('fetch-repos', {
        body: { query: query || 'artificial intelligence machine learning' }
      });
      
      if (error) {
        console.error('Error fetching repos:', error);
        return [];
      }
      
      return data?.data || [];
    } catch (error) {
      console.error('Error fetching repos:', error);
      return [];
    }
  },

  async fetchPapers(category?: string): Promise<ContentItem[]> {
    try {
      const { data, error } = await supabase.functions.invoke('fetch-papers', {
        body: { category: category || 'cs.AI' }
      });
      
      if (error) {
        console.error('Error fetching papers:', error);
        return [];
      }
      
      return data?.data || [];
    } catch (error) {
      console.error('Error fetching papers:', error);
      return [];
    }
  },

  async fetchVideos(query?: string): Promise<ContentItem[]> {
    try {
      const { data, error } = await supabase.functions.invoke('fetch-videos', {
        body: { query: query || 'artificial intelligence tutorial' }
      });
      
      if (error) {
        console.error('Error fetching videos:', error);
        return [];
      }
      
      return data?.data || [];
    } catch (error) {
      console.error('Error fetching videos:', error);
      return [];
    }
  },

  async fetchTools(): Promise<ContentItem[]> {
    try {
      const { data, error } = await supabase.functions.invoke('fetch-tools');
      
      if (error) {
        console.error('Error fetching tools:', error);
        return [];
      }
      
      return data?.data || [];
    } catch (error) {
      console.error('Error fetching tools:', error);
      return [];
    }
  },

  async fetchAllContent(): Promise<ContentItem[]> {
    try {
      const [articles, repos, papers, videos, tools] = await Promise.all([
        this.fetchArticles(),
        this.fetchRepos(),
        this.fetchPapers(),
        this.fetchVideos(),
        this.fetchTools()
      ]);

      return [...articles, ...repos, ...papers, ...videos, ...tools]
        .sort((a, b) => b.engagement_score - a.engagement_score);
    } catch (error) {
      console.error('Error fetching all content:', error);
      return [];
    }
  },

  async fetchByType(type: 'article' | 'repo' | 'paper' | 'video' | 'tool'): Promise<ContentItem[]> {
    switch (type) {
      case 'article':
        return this.fetchArticles();
      case 'repo':
        return this.fetchRepos();
      case 'paper':
        return this.fetchPapers();
      case 'video':
        return this.fetchVideos();
      case 'tool':
        return this.fetchTools();
      default:
        return [];
    }
  },

  async semanticSearch(query: string, content: ContentItem[]): Promise<SemanticSearchResult> {
    try {
      const { data, error } = await supabase.functions.invoke('semantic-search', {
        body: { query, content }
      });
      
      if (error) {
        console.error('Error in semantic search:', error);
        // Fallback to basic search
        return this.basicSearch(query, content);
      }
      
      return data?.data || this.basicSearch(query, content);
    } catch (error) {
      console.error('Error in semantic search:', error);
      return this.basicSearch(query, content);
    }
  },

  basicSearch(query: string, content: ContentItem[]): SemanticSearchResult {
    const queryLower = query.toLowerCase();
    
    const matched = content.filter(item => {
      const titleLower = item.title.toLowerCase();
      const summaryLower = item.summary.toLowerCase();
      const tagsLower = item.tags.map(t => t.toLowerCase());
      
      return titleLower.includes(queryLower) ||
             summaryLower.includes(queryLower) ||
             tagsLower.some(tag => tag.includes(queryLower));
    });

    // If no matches, return trending content
    const results = matched.length > 0 ? matched : 
      content.sort((a, b) => b.engagement_score - a.engagement_score).slice(0, 15);

    return {
      items: results,
      expandedQuery: {
        original: query,
        synonyms: [],
        relatedTopics: [],
        intent: 'Basic search'
      },
      hasExactMatches: matched.length > 0
    };
  }
};
