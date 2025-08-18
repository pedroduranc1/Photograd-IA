import * as React from 'react';
import { View, ActivityIndicator } from 'react-native';
import Animated, { FadeInUp, FadeOutDown, LayoutAnimationConfig } from 'react-native-reanimated';
import { Info } from '~/src/components/ui/icons/Info';
import { Avatar, AvatarFallback, AvatarImage } from '~/src/components/ui/avatar';
import { Button } from '~/src/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '~/src/components/ui/card';
import { Progress } from '~/src/components/ui/progress';
import { Text } from '~/src/components/ui/text';
import { Tooltip, TooltipContent, TooltipTrigger } from '~/src/components/ui/tooltip';

// Zustand store
import { useCharacterStore } from '~/src/store/character-store';

// React Query hooks
import { useLoadRandomCharacter } from '~/src/hooks/data/use-character-queries';

const RICK_SANCHEZ_FALLBACK = {
  id: 1,
  name: 'Rick Sanchez',
  status: 'Alive' as const,
  species: 'Human',
  type: '',
  gender: 'Male',
  origin: { name: 'Earth (C-137)', url: '' },
  location: { name: 'Citadel of Ricks', url: '' },
  image: 'https://i.pinimg.com/originals/ef/a2/8d/efa28d18a04e7fa40ed49eeb0ab660db.jpg',
  episode: [],
  url: '',
  created: '',
};

export default function Screen() {
  // Zustand state
  const {
    selectedCharacter,
    setSelectedCharacter,
    productivity,
    updateProductivityRandomly,
    addToFavorites,
    removeFromFavorites,
    isFavorite,
  } = useCharacterStore();

  // React Query mutation for loading random characters
  const {
    mutate: loadRandomCharacter,
    isPending: isLoadingRandom,
    error: randomCharacterError,
  } = useLoadRandomCharacter();

  // Initialize with Rick Sanchez or use selected character
  const currentCharacter = selectedCharacter || RICK_SANCHEZ_FALLBACK;
  const isCharacterFavorite = isFavorite(currentCharacter.id);

  // Handle loading a new random character
  const handleLoadRandomCharacter = React.useCallback(() => {
    loadRandomCharacter(undefined, {
      onSuccess: (character) => {
        setSelectedCharacter(character);
      },
    });
  }, [loadRandomCharacter, setSelectedCharacter]);

  // Handle favorite toggle
  const handleToggleFavorite = React.useCallback(() => {
    if (isCharacterFavorite) {
      removeFromFavorites(currentCharacter.id);
    } else {
      addToFavorites(currentCharacter);
    }
  }, [isCharacterFavorite, currentCharacter, addToFavorites, removeFromFavorites]);

  // Get character info for display
  const getCharacterAge = (character: typeof currentCharacter) => {
    // Extract age from character name or use species info
    if (character.name.includes('Rick')) return '70';
    if (character.name.includes('Morty')) return '14';
    if (character.name.includes('Beth')) return '34';
    if (character.name.includes('Jerry')) return '34';
    if (character.name.includes('Summer')) return '17';
    return 'Unknown';
  };

  const getCharacterDimension = (character: typeof currentCharacter) => {
    // Extract dimension from origin or location
    const origin = character.origin.name;
    if (origin.includes('C-137')) return 'C-137';
    if (origin.includes('Dimension')) {
      const match = origin.match(/Dimension (\w+-\w+)/);
      if (match) return match[1];
    }
    return 'Unknown';
  };

  const getCharacterRole = (character: typeof currentCharacter) => {
    const name = character.name.toLowerCase();
    if (name.includes('rick')) return 'Scientist';
    if (name.includes('morty')) return 'Student';
    if (name.includes('beth')) return 'Doctor';
    if (name.includes('jerry')) return 'Unemployed';
    if (name.includes('summer')) return 'Student';
    return character.species;
  };
  return (
    <View className='flex-1 justify-center items-center gap-5 p-6 bg-secondary/30'>
      <Card className='w-full max-w-sm p-6 rounded-2xl'>
        <CardHeader className='items-center'>
          <Avatar alt={`${currentCharacter.name}'s Avatar`} className='w-24 h-24'>
            <AvatarImage source={{ uri: currentCharacter.image }} />
            <AvatarFallback>
              <Text>{currentCharacter.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</Text>
            </AvatarFallback>
          </Avatar>
          <View className='p-3' />
          <CardTitle className='pb-2 text-center'>{currentCharacter.name}</CardTitle>
          <View className='flex-row items-center'>
            <CardDescription className='text-base font-semibold'>
              {getCharacterRole(currentCharacter)}
            </CardDescription>
            <Tooltip delayDuration={150}>
              <TooltipTrigger className='px-2 pb-0.5 active:opacity-50'>
                <Info size={14} strokeWidth={2.5} className='w-4 h-4 text-foreground/70' />
              </TooltipTrigger>
              <TooltipContent className='py-2 px-4 shadow'>
                <Text className='native:text-lg'>Status: {currentCharacter.status}</Text>
              </TooltipContent>
            </Tooltip>
          </View>
        </CardHeader>
        <CardContent>
          <View className='flex-row justify-around gap-3'>
            <View className='items-center'>
              <Text className='text-sm text-muted-foreground'>Dimension</Text>
              <Text className='text-xl font-semibold'>{getCharacterDimension(currentCharacter)}</Text>
            </View>
            <View className='items-center'>
              <Text className='text-sm text-muted-foreground'>Age</Text>
              <Text className='text-xl font-semibold'>{getCharacterAge(currentCharacter)}</Text>
            </View>
            <View className='items-center'>
              <Text className='text-sm text-muted-foreground'>Species</Text>
              <Text className='text-xl font-semibold'>{currentCharacter.species}</Text>
            </View>
          </View>
        </CardContent>
        <CardFooter className='flex-col gap-3 pb-0'>
          <View className='flex-row items-center overflow-hidden'>
            <Text className='text-sm text-muted-foreground'>Productivity:</Text>
            <LayoutAnimationConfig skipEntering>
              <Animated.View
                key={productivity}
                entering={FadeInUp}
                exiting={FadeOutDown}
                className='w-11 items-center'
              >
                <Text className='text-sm font-bold text-sky-600'>{productivity}%</Text>
              </Animated.View>
            </LayoutAnimationConfig>
          </View>
          <Progress value={productivity} className='h-2' indicatorClassName='bg-sky-600' />
          <View className='h-2' />
          
          {/* Row of action buttons */}
          <View className='flex-row gap-2 w-full'>
            <Button
              variant='outline'
              className='flex-1 shadow shadow-foreground/5'
              onPress={updateProductivityRandomly}
            >
              <Text>Update Progress</Text>
            </Button>
            
            <Button
              variant={isCharacterFavorite ? 'default' : 'outline'}
              className='shadow shadow-foreground/5'
              onPress={handleToggleFavorite}
            >
              <Text>{isCharacterFavorite ? '★' : '☆'}</Text>
            </Button>
          </View>
          
          <Button
            variant='secondary'
            className='w-full shadow shadow-foreground/5'
            onPress={handleLoadRandomCharacter}
            disabled={isLoadingRandom}
          >
            <View className='flex-row items-center gap-2'>
              {isLoadingRandom && (
                <ActivityIndicator size="small" className='text-foreground' />
              )}
              <Text>
                {isLoadingRandom ? 'Loading Character...' : 'Load Random Character (React Query)'}
              </Text>
            </View>
          </Button>
          
          {randomCharacterError && (
            <Text className='text-sm text-red-500 text-center'>
              Failed to load character. Please try again.
            </Text>
          )}
        </CardFooter>
      </Card>
      
      {/* Status display showing Zustand state */}
      <Card className='w-full max-w-sm p-4 rounded-xl bg-muted/50'>
        <Text className='text-sm font-semibold text-center mb-2'>Zustand State Demo</Text>
        <View className='gap-1'>
          <Text className='text-xs text-muted-foreground'>
            Selected Character: {currentCharacter.name}
          </Text>
          <Text className='text-xs text-muted-foreground'>
            Productivity: {productivity}% (managed by Zustand)
          </Text>
          <Text className='text-xs text-muted-foreground'>
            Favorite: {isCharacterFavorite ? 'Yes' : 'No'} (stored in Zustand)
          </Text>
        </View>
      </Card>
    </View>
  );
}
