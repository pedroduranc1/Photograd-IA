import { Character } from '../store/character-store';

const BASE_URL = 'https://rickandmortyapi.com/api';

export interface ApiResponse<T> {
  info: {
    count: number;
    pages: number;
    next: string | null;
    prev: string | null;
  };
  results: T[];
}

export class RickMortyApiService {
  /**
   * Get a character by ID
   */
  static async getCharacter(id: number): Promise<Character> {
    const response = await fetch(`${BASE_URL}/character/${id}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch character: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  /**
   * Get multiple characters by IDs
   */
  static async getCharacters(ids: number[]): Promise<Character[]> {
    const idsString = ids.join(',');
    const response = await fetch(`${BASE_URL}/character/${idsString}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch characters: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // API returns single object for single ID, array for multiple IDs
    return Array.isArray(data) ? data : [data];
  }
  
  /**
   * Search characters with filters
   */
  static async searchCharacters(params?: {
    name?: string;
    status?: 'alive' | 'dead' | 'unknown';
    species?: string;
    gender?: 'female' | 'male' | 'genderless' | 'unknown';
    page?: number;
  }): Promise<ApiResponse<Character>> {
    const searchParams = new URLSearchParams();
    
    if (params?.name) searchParams.append('name', params.name);
    if (params?.status) searchParams.append('status', params.status);
    if (params?.species) searchParams.append('species', params.species);
    if (params?.gender) searchParams.append('gender', params.gender);
    if (params?.page) searchParams.append('page', params.page.toString());
    
    const url = `${BASE_URL}/character${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to search characters: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  /**
   * Get random character
   */
  static async getRandomCharacter(): Promise<Character> {
    // Rick and Morty API has 826 characters as of now
    const randomId = Math.floor(Math.random() * 826) + 1;
    return this.getCharacter(randomId);
  }
  
  /**
   * Get popular characters (first page, most likely to be main characters)
   */
  static async getPopularCharacters(): Promise<Character[]> {
    const response = await this.searchCharacters({ page: 1 });
    return response.results.slice(0, 6); // Return first 6 characters
  }
}