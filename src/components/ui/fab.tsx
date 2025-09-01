import React from 'react';
import { Pressable, Platform, StyleSheet } from 'react-native';
import { Plus } from 'lucide-react-native';
import { useColorScheme } from '~/src/hooks/ui/useColorScheme';
import { cn } from '~/src/utils/utils';

interface FabProps {
  onPress: () => void;
  className?: string;
  size?: 'default' | 'small' | 'large';
  disabled?: boolean;
}

export function Fab({ onPress, className, size = 'default', disabled = false }: FabProps) {
  const { isDarkColorScheme } = useColorScheme();

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return 'w-12 h-12';
      case 'large':
        return 'w-16 h-16';
      default:
        return 'w-14 h-14';
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'small':
        return 20;
      case 'large':
        return 28;
      default:
        return 24;
    }
  };

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      style={[
        styles.fab,
        {
          backgroundColor: disabled 
            ? (isDarkColorScheme ? '#64748B' : '#94A3B8')
            : (isDarkColorScheme ? '#22C55E' : '#16A34A'),
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 4,
          },
          shadowOpacity: disabled ? 0.1 : 0.3,
          shadowRadius: 8,
          elevation: disabled ? 4 : 8,
        }
      ]}
      className={cn(
        'absolute bottom-20 right-4 rounded-full items-center justify-center',
        getSizeStyles(),
        disabled && 'opacity-50',
        className
      )}
      accessibilityLabel="Agregar nueva escuela"
      accessibilityRole="button"
    >
      <Plus 
        size={getIconSize()} 
        color="white" 
        strokeWidth={2.5}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
});