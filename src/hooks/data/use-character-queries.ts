import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RickMortyApiService } from '../../services/rick-morty-api';
import { Character } from '../../store/character-store';

// Query keys for consistent caching
export const characterQueryKeys = {
  all: ['characters'] as const,
  character: (id: number) => [...characterQueryKeys.all, 'character', id] as const,
  characters: (ids: number[]) => [...characterQueryKeys.all, 'characters', ids] as const,
  search: (params: any) => [...characterQueryKeys.all, 'search', params] as const,
  random: () => [...characterQueryKeys.all, 'random'] as const,
  popular: () => [...characterQueryKeys.all, 'popular'] as const,
};

/**
 * Hook to fetch a single character by ID
 */
export function useCharacter(id: number) {
  return useQuery({
    queryKey: characterQueryKeys.character(id),
    queryFn: () => RickMortyApiService.getCharacter(id),
    enabled: !!id && id > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to fetch multiple characters by IDs
 */
export function useCharacters(ids: number[]) {
  return useQuery({
    queryKey: characterQueryKeys.characters(ids),
    queryFn: () => RickMortyApiService.getCharacters(ids),
    enabled: ids.length > 0,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Hook to search characters with filters
 */
export function useSearchCharacters(params?: {
  name?: string;
  status?: 'alive' | 'dead' | 'unknown';
  species?: string;
  gender?: 'female' | 'male' | 'genderless' | 'unknown';
  page?: number;
}) {
  return useQuery({
    queryKey: characterQueryKeys.search(params),
    queryFn: () => RickMortyApiService.searchCharacters(params),
    enabled: !!params,
    staleTime: 2 * 60 * 1000, // 2 minutes for search results
    gcTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to get a random character
 */
export function useRandomCharacter() {
  return useQuery({
    queryKey: characterQueryKeys.random(),
    queryFn: () => RickMortyApiService.getRandomCharacter(),
    staleTime: 0, // Always refetch for random character
    gcTime: 2 * 60 * 1000,
  });
}

/**
 * Hook to get popular characters
 */
export function usePopularCharacters() {
  return useQuery({
    queryKey: characterQueryKeys.popular(),
    queryFn: () => RickMortyApiService.getPopularCharacters(),
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

/**
 * Mutation hook to load a random character
 * This integrates with Zustand store to update selected character
 */
export function useLoadRandomCharacter() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => RickMortyApiService.getRandomCharacter(),
    onSuccess: (character: Character) => {
      // Update the query cache with the new character
      queryClient.setQueryData(
        characterQueryKeys.character(character.id),
        character
      );
      
      // Invalidate random character query to allow fresh fetches
      queryClient.invalidateQueries({
        queryKey: characterQueryKeys.random(),
      });
    },
    onError: (error) => {
      console.error('Failed to load random character:', error);
    },
  });
}

/**
 * Mutation hook to preload characters for better UX
 */
export function usePreloadCharacters() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (ids: number[]) => RickMortyApiService.getCharacters(ids),
    onSuccess: (characters: Character[]) => {
      // Cache each character individually for faster access
      characters.forEach(character => {
        queryClient.setQueryData(
          characterQueryKeys.character(character.id),
          character
        );
      });
    },
  });
}