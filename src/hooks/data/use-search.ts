/**
 * Search and Filtering System
 * 
 * Advanced search hooks with intelligent caching, fuzzy search,
 * faceted filtering, and search analytics.
 */

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { enhancedDatabaseService } from '../../services/enhanced-database-service';
import { useAuthUser } from '../../store/auth-store';
import { useAppStore, useAppSettings } from '../../store/app-store';
import { queryKeys } from '../../lib/query-keys';
import { useCacheCoordination } from '../../lib/state-sync';
import type { 
  Photo, 
  Collection, 
  PhotoFilters, 
  CollectionFilters, 
  PaginationOptions,
  SearchResult,
  SearchOptions 
} from '../../types/database';
import React, { useCallback, useMemo, useEffect } from 'react';

// Search types
export interface GlobalSearchFilters {
  entityTypes?: ('photo' | 'collection' | 'user')[];
  dateRange?: {
    from: string;
    to: string;
  };
  tags?: string[];
  category?: string;
  userId?: string;
  isPublic?: boolean;
}

export interface SearchSuggestion {
  query: string;
  type: 'recent' | 'popular' | 'auto-complete';
  count?: number;
  timestamp?: number;
}

export interface SearchAnalytics {
  query: string;
  entityType: string;
  resultCount: number;
  clickThroughRate: number;
  timestamp: number;
}

// Re-export search query keys
export const searchKeys = queryKeys.search;

// Hook for global search across all entities
export function useGlobalSearch(
  query: string,
  filters: GlobalSearchFilters = {},
  options: {
    enabled?: boolean;
    fuzzy?: boolean;
    highlight?: boolean;
    priority?: 'low' | 'medium' | 'high';
    debounceMs?: number;
  } = {}
) {
  const {
    enabled = true,
    fuzzy = true,
    highlight = true,
    priority = 'medium',
    debounceMs = 300,
  } = options;
  
  const settings = useAppSettings();
  const authUser = useAuthUser();
  const appActions = useAppStore(state => ({
    addToSearchHistory: state.addToSearchHistory,
    setSearchQuery: state.setSearchQuery,
  }));

  // Debounced query
  const [debouncedQuery, setDebouncedQuery] = React.useState(query);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, debounceMs);
    
    return () => clearTimeout(timer);
  }, [query, debounceMs]);

  const staleTime = useMemo(() => {
    // Search results can be cached longer for static queries
    const baseTime = 60000; // 1 minute base
    const multiplier = priority === 'high' ? 0.5 : priority === 'low' ? 2 : 1;
    return baseTime * multiplier;
  }, [priority]);

  return useQuery({
    queryKey: searchKeys.global(debouncedQuery, { ...filters, fuzzy, highlight }),
    queryFn: async () => {
      if (!debouncedQuery.trim()) {
        return { 
          items: [], 
          total: 0, 
          facets: {}, 
          suggestions: [], 
          executionTime: 0 
        };
      }

      const searchOptions: SearchOptions = {
        fuzzy,
        fields: ['title', 'description', 'tags'],
        limit: 50,
        highlight,
      };

      // Search photos
      const photoResults = await enhancedDatabaseService.searchPhotos(
        debouncedQuery,
        {
          userId: filters.userId,
          dateFrom: filters.dateRange?.from,
          dateTo: filters.dateRange?.to,
        } as PhotoFilters,
        searchOptions
      );

      // Search collections (placeholder)
      const collectionResults: SearchResult<Collection> = {
        items: [],
        total: 0,
        executionTime: 0,
      };

      // Combine results
      const combinedResults = {
        photos: photoResults.data || { items: [], total: 0, executionTime: 0 },
        collections: collectionResults,
        total: (photoResults.data?.total || 0) + collectionResults.total,
        executionTime: Math.max(
          photoResults.data?.executionTime || 0,
          collectionResults.executionTime
        ),
        facets: {
          entityTypes: {
            photos: photoResults.data?.total || 0,
            collections: collectionResults.total,
          },
          ...photoResults.data?.facets,
        },
      };

      // Track search analytics
      if (authUser?.id) {
        trackSearchAnalytics(debouncedQuery, 'global', combinedResults.total);
      }

      // Add to search history
      if (debouncedQuery.trim()) {
        appActions.addToSearchHistory(debouncedQuery);
      }

      return combinedResults;
    },
    enabled: enabled && Boolean(debouncedQuery.trim()),
    staleTime,
    gcTime: staleTime * 3,
    refetchOnWindowFocus: false, // Don't refetch search results on focus
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
    select: useCallback((data) => {
      // Apply additional client-side filtering
      let filteredData = { ...data };
      
      if (filters.entityTypes && filters.entityTypes.length > 0) {
        if (!filters.entityTypes.includes('photo')) {
          filteredData.photos = { items: [], total: 0, executionTime: 0 };
        }
        if (!filters.entityTypes.includes('collection')) {
          filteredData.collections = { items: [], total: 0, executionTime: 0 };
        }
      }
      
      return filteredData;
    }, [filters.entityTypes]),
  });
}

// Hook for photo-specific search with advanced filtering
export function usePhotoSearch(
  query: string,
  filters: PhotoFilters = {},
  options: {
    enabled?: boolean;
    fuzzy?: boolean;
    sortBy?: 'relevance' | 'date' | 'popularity';
    priority?: 'low' | 'medium' | 'high';
  } = {}
) {
  const {
    enabled = true,
    fuzzy = true,
    sortBy = 'relevance',
    priority = 'medium',
  } = options;
  
  const settings = useAppSettings();
  const authUser = useAuthUser();

  const staleTime = useMemo(() => {
    const baseTime = settings.cachePreferences.photosStaleTime;
    return priority === 'high' ? baseTime * 0.5 : baseTime;
  }, [settings.cachePreferences.photosStaleTime, priority]);

  return useQuery({
    queryKey: searchKeys.photos(query, { ...filters, fuzzy, sortBy }),
    queryFn: async () => {
      if (!query.trim()) {
        return { items: [], total: 0, executionTime: 0 };
      }

      const searchOptions: SearchOptions = {
        fuzzy,
        fields: ['title', 'description', 'tags'],
        limit: 30,
        highlight: true,
      };

      const result = await enhancedDatabaseService.searchPhotos(
        query,
        filters,
        searchOptions
      );

      if (!result.success) {
        throw new Error(result.error?.message || 'Search failed');
      }

      return result.data || { items: [], total: 0, executionTime: 0 };
    },
    enabled: enabled && Boolean(query.trim()),
    staleTime,
    gcTime: staleTime * 2,
    select: useCallback((data) => {
      let sortedItems = [...data.items];
      
      // Apply sorting
      switch (sortBy) {
        case 'date':
          sortedItems.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          break;
        case 'popularity':
          sortedItems.sort((a, b) => 
            ((b as any).viewCount || 0) - ((a as any).viewCount || 0)
          );
          break;
        case 'relevance':
        default:
          // Already sorted by relevance from search
          break;
      }
      
      return { ...data, items: sortedItems };
    }, [sortBy]),
  });
}

// Hook for collection search
export function useCollectionSearch(
  query: string,
  filters: CollectionFilters = {},
  options: {
    enabled?: boolean;
    includePrivate?: boolean;
    sortBy?: 'relevance' | 'date' | 'popularity';
  } = {}
) {
  const {
    enabled = true,
    includePrivate = true,
    sortBy = 'relevance',
  } = options;
  
  const authUser = useAuthUser();
  const settings = useAppSettings();

  return useQuery({
    queryKey: searchKeys.collections(query, { ...filters, includePrivate, sortBy }),
    queryFn: async () => {
      if (!query.trim()) {
        return { items: [], total: 0, executionTime: 0 };
      }

      // Placeholder for collection search
      const collections: Collection[] = [];
      
      return {
        items: collections,
        total: collections.length,
        executionTime: 0,
      };
    },
    enabled: enabled && Boolean(query.trim()),
    staleTime: settings.cachePreferences.photosStaleTime * 2, // Collections change less
    gcTime: settings.cachePreferences.photosStaleTime * 4,
  });
}

// Hook for infinite search results
export function useInfiniteSearch(
  query: string,
  entityType: 'photo' | 'collection' | 'all',
  filters: GlobalSearchFilters = {},
  options: {
    pageSize?: number;
    fuzzy?: boolean;
    sortBy?: 'relevance' | 'date' | 'popularity';
  } = {}
) {
  const { pageSize = 20, fuzzy = true, sortBy = 'relevance' } = options;
  const queryClient = useQueryClient();

  return useInfiniteQuery({
    queryKey: searchKeys.global(query, { ...filters, entityType, fuzzy, sortBy, infinite: true }),
    queryFn: async ({ pageParam = 0 }) => {
      if (!query.trim()) {
        return { items: [], hasMore: false, nextOffset: undefined };
      }

      let searchResult;
      
      switch (entityType) {
        case 'photo':
          searchResult = await enhancedDatabaseService.searchPhotos(
            query,
            filters as PhotoFilters,
            {
              fuzzy,
              limit: pageSize,
              highlight: true,
            }
          );
          break;
        case 'collection':
          // Placeholder for collection search
          searchResult = { 
            data: { items: [], total: 0, executionTime: 0 } as SearchResult<Collection>,
            success: true,
            error: null 
          };
          break;
        case 'all':
        default:
          // Placeholder for combined search
          searchResult = { 
            data: { items: [], total: 0, executionTime: 0 },
            success: true,
            error: null 
          };
          break;
      }

      if (!searchResult.success) {
        throw new Error(searchResult.error?.message || 'Search failed');
      }

      const items = searchResult.data?.items || [];
      
      // Cache individual items
      items.forEach((item: any) => {
        if (entityType === 'photo' || (entityType === 'all' && item.type === 'photo')) {
          queryClient.setQueryData(queryKeys.photos.detail(item.id), item);
        } else if (entityType === 'collection' || (entityType === 'all' && item.type === 'collection')) {
          queryClient.setQueryData(queryKeys.collections.detail(item.id), item);
        }
      });

      return {
        items,
        hasMore: items.length === pageSize,
        nextOffset: pageParam + pageSize,
      };
    },
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.nextOffset : undefined;
    },
    enabled: Boolean(query.trim()),
    staleTime: 60000, // 1 minute
    gcTime: 300000, // 5 minutes
    initialPageParam: 0,
    select: useCallback((data) => {
      const allItems = data.pages.flatMap(page => page.items);
      return {
        ...data,
        flatData: allItems,
        totalCount: allItems.length,
      };
    }, []),
  });
}

// Hook for search suggestions and autocomplete
export function useSearchSuggestions(
  query: string,
  entityType: 'photo' | 'collection' | 'all' = 'all',
  options: {
    enabled?: boolean;
    maxSuggestions?: number;
    includeRecent?: boolean;
    includePopular?: boolean;
  } = {}
) {
  const {
    enabled = true,
    maxSuggestions = 10,
    includeRecent = true,
    includePopular = true,
  } = options;
  
  const appStore = useAppStore();
  const authUser = useAuthUser();

  return useQuery({
    queryKey: searchKeys.suggestions(query, entityType),
    queryFn: async () => {
      const suggestions: SearchSuggestion[] = [];
      
      // Add recent searches
      if (includeRecent && query.length >= 1) {
        const recentSearches = appStore.ui.searchHistory
          .filter(search => search.toLowerCase().includes(query.toLowerCase()))
          .slice(0, 5)
          .map(search => ({
            query: search,
            type: 'recent' as const,
          }));
        
        suggestions.push(...recentSearches);
      }
      
      // Add popular/trending suggestions (placeholder)
      if (includePopular && query.length >= 2) {
        const popularSuggestions: SearchSuggestion[] = [
          { query: 'landscape photography', type: 'popular', count: 150 },
          { query: 'portrait photography', type: 'popular', count: 120 },
          { query: 'street photography', type: 'popular', count: 98 },
        ].filter(suggestion => 
          suggestion.query.toLowerCase().includes(query.toLowerCase())
        );
        
        suggestions.push(...popularSuggestions.slice(0, 3));
      }
      
      // Auto-complete suggestions based on existing content (placeholder)
      if (query.length >= 3) {
        // This would query the database for matching titles/tags
        const autoCompleteSuggestions: SearchSuggestion[] = [];
        suggestions.push(...autoCompleteSuggestions);
      }
      
      return suggestions.slice(0, maxSuggestions);
    },
    enabled: enabled && Boolean(query.trim()),
    staleTime: 300000, // 5 minutes - suggestions can be cached longer
    gcTime: 600000, // 10 minutes
  });
}

// Hook for search analytics and insights
export function useSearchAnalytics(timeframe: 'day' | 'week' | 'month' = 'week') {
  const authUser = useAuthUser();

  return useQuery({
    queryKey: ['searchAnalytics', authUser?.id, timeframe],
    queryFn: async () => {
      if (!authUser?.id) {
        throw new Error('User not authenticated');
      }

      // Placeholder for search analytics
      const analytics = {
        totalSearches: 0,
        topQueries: [] as { query: string; count: number }[],
        averageResultsPerSearch: 0,
        clickThroughRate: 0,
        popularFilters: {} as Record<string, number>,
        searchTrends: [] as { date: string; searches: number }[],
      };

      return analytics;
    },
    enabled: !!authUser?.id,
    staleTime: 3600000, // 1 hour
    gcTime: 7200000, // 2 hours
  });
}

// Hook for saved searches
export function useSavedSearches() {
  const authUser = useAuthUser();
  const queryClient = useQueryClient();

  const getSavedSearches = useQuery({
    queryKey: ['savedSearches', authUser?.id],
    queryFn: async () => {
      // Placeholder for getting saved searches
      const savedSearches: Array<{
        id: string;
        query: string;
        filters: GlobalSearchFilters;
        name: string;
        createdAt: string;
        lastExecuted: string;
      }> = [];
      
      return savedSearches;
    },
    enabled: !!authUser?.id,
    staleTime: 300000, // 5 minutes
  });

  const saveSearch = useMutation({
    mutationFn: async ({
      query,
      filters,
      name,
    }: {
      query: string;
      filters: GlobalSearchFilters;
      name: string;
    }) => {
      // Placeholder for saving search
      const savedSearch = {
        id: crypto.randomUUID(),
        query,
        filters,
        name,
        createdAt: new Date().toISOString(),
        lastExecuted: new Date().toISOString(),
      };
      
      return savedSearch;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['savedSearches', authUser?.id],
      });
    },
  });

  const deleteSavedSearch = useMutation({
    mutationFn: async (searchId: string) => {
      // Placeholder for deleting saved search
      return searchId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['savedSearches', authUser?.id],
      });
    },
  });

  const executeSavedSearch = useMutation({
    mutationFn: async (searchId: string) => {
      // Placeholder for executing saved search and updating last executed time
      return searchId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['savedSearches', authUser?.id],
      });
    },
  });

  return {
    savedSearches: getSavedSearches.data || [],
    isLoading: getSavedSearches.isLoading,
    saveSearch,
    deleteSavedSearch,
    executeSavedSearch,
  };
}

// Hook for smart search filters
export function useSmartFilters(
  query: string,
  entityType: 'photo' | 'collection' | 'all' = 'all'
) {
  const authUser = useAuthUser();

  return useQuery({
    queryKey: ['smartFilters', query, entityType, authUser?.id],
    queryFn: async () => {
      if (!query.trim()) {
        return {
          suggestedFilters: [],
          autoDetectedFilters: {},
        };
      }

      // Analyze query for potential filters
      const suggestedFilters = [];
      const autoDetectedFilters: Record<string, any> = {};

      // Date detection
      const dateRegex = /(\d{4}|\d{1,2}\/\d{1,2}\/\d{4})/g;
      const dateMatches = query.match(dateRegex);
      if (dateMatches) {
        suggestedFilters.push({
          type: 'dateRange',
          label: 'Filter by date',
          value: dateMatches[0],
        });
      }

      // Tag detection (words starting with #)
      const tagRegex = /#(\w+)/g;
      const tagMatches = query.match(tagRegex);
      if (tagMatches) {
        autoDetectedFilters.tags = tagMatches.map(tag => tag.substring(1));
        suggestedFilters.push({
          type: 'tags',
          label: 'Filter by tags',
          value: autoDetectedFilters.tags,
        });
      }

      // Category detection based on common keywords
      const categoryKeywords = {
        'landscape': ['landscape', 'nature', 'outdoor', 'mountain', 'forest'],
        'portrait': ['portrait', 'person', 'face', 'headshot'],
        'street': ['street', 'urban', 'city', 'building'],
        'macro': ['macro', 'close-up', 'detail', 'flower'],
      };

      for (const [category, keywords] of Object.entries(categoryKeywords)) {
        if (keywords.some(keyword => query.toLowerCase().includes(keyword))) {
          autoDetectedFilters.category = category;
          suggestedFilters.push({
            type: 'category',
            label: `Filter by ${category}`,
            value: category,
          });
          break;
        }
      }

      return {
        suggestedFilters,
        autoDetectedFilters,
      };
    },
    enabled: Boolean(query.trim()),
    staleTime: 60000, // 1 minute
    gcTime: 300000, // 5 minutes
  });
}

// Utility function to track search analytics
function trackSearchAnalytics(query: string, entityType: string, resultCount: number) {
  // This would typically send analytics to your tracking service
  console.log('Search Analytics:', {
    query,
    entityType,
    resultCount,
    timestamp: new Date().toISOString(),
  });
}

// Hook for clearing search history
export function useClearSearchHistory() {
  const appActions = useAppStore(state => ({
    setSearchQuery: state.setSearchQuery,
  }));

  return useCallback(() => {
    // Clear search history from app store
    useAppStore.setState(state => ({
      ui: {
        ...state.ui,
        searchHistory: [],
        searchQuery: '',
      },
    }));
    
    appActions.setSearchQuery('');
  }, [appActions]);
}

export default {
  useGlobalSearch,
  usePhotoSearch,
  useCollectionSearch,
  useInfiniteSearch,
  useSearchSuggestions,
  useSearchAnalytics,
  useSavedSearches,
  useSmartFilters,
  useClearSearchHistory,
};