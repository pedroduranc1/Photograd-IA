import { create } from 'zustand';

export interface Character {
  id: number;
  name: string;
  status: 'Alive' | 'Dead' | 'unknown';
  species: string;
  type: string;
  gender: string;
  origin: {
    name: string;
    url: string;
  };
  location: {
    name: string;
    url: string;
  };
  image: string;
  episode: string[];
  url: string;
  created: string;
}

interface CharacterState {
  // Current selected character
  selectedCharacter: Character | null;
  setSelectedCharacter: (character: Character | null) => void;
  
  // Productivity tracking
  productivity: number;
  setProductivity: (value: number) => void;
  updateProductivityRandomly: () => void;
  
  // Favorite characters
  favoriteCharacters: Character[];
  addToFavorites: (character: Character) => void;
  removeFromFavorites: (characterId: number) => void;
  isFavorite: (characterId: number) => boolean;
  
  // Loading states
  isLoadingCharacter: boolean;
  setIsLoadingCharacter: (loading: boolean) => void;
}

export const useCharacterStore = create<CharacterState>((set, get) => ({
  // Character state
  selectedCharacter: null,
  setSelectedCharacter: (character) => set({ selectedCharacter: character }),
  
  // Productivity state
  productivity: 78,
  setProductivity: (value) => set({ productivity: value }),
  updateProductivityRandomly: () => {
    const newValue = Math.floor(Math.random() * 100);
    set({ productivity: newValue });
  },
  
  // Favorites state
  favoriteCharacters: [],
  addToFavorites: (character) => {
    const { favoriteCharacters } = get();
    if (!favoriteCharacters.find(fav => fav.id === character.id)) {
      set({ favoriteCharacters: [...favoriteCharacters, character] });
    }
  },
  removeFromFavorites: (characterId) => {
    const { favoriteCharacters } = get();
    set({ 
      favoriteCharacters: favoriteCharacters.filter(fav => fav.id !== characterId) 
    });
  },
  isFavorite: (characterId) => {
    const { favoriteCharacters } = get();
    return favoriteCharacters.some(fav => fav.id === characterId);
  },
  
  // Loading states
  isLoadingCharacter: false,
  setIsLoadingCharacter: (loading) => set({ isLoadingCharacter: loading }),
}));