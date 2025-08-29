import React from 'react';
import { View, Pressable } from 'react-native';
import { Text } from './text';
import { useColorScheme } from '~/src/hooks/ui/useColorScheme';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
}

interface QuickActionsProps {
  actions: QuickAction[];
  layout?: 'horizontal' | 'grid';
  className?: string;
}

export function QuickActions({ 
  actions, 
  layout = 'horizontal', 
  className = '' 
}: QuickActionsProps) {
  const { isDarkColorScheme } = useColorScheme();

  const getActionStyles = (variant: QuickAction['variant'], disabled?: boolean) => {
    if (disabled) {
      return 'bg-muted border-muted';
    }

    switch (variant) {
      case 'primary':
        return 'bg-primary border-primary';
      case 'danger':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'secondary':
      default:
        return 'bg-card border-border';
    }
  };

  const getTextStyles = (variant: QuickAction['variant'], disabled?: boolean) => {
    if (disabled) {
      return 'text-muted-foreground';
    }

    switch (variant) {
      case 'primary':
        return 'text-primary-foreground';
      case 'danger':
        return 'text-red-800 dark:text-red-200';
      case 'secondary':
      default:
        return 'text-foreground';
    }
  };

  const containerClass = layout === 'grid' 
    ? 'flex-row flex-wrap -mx-2' 
    : 'flex-row space-x-3';

  const itemClass = layout === 'grid' 
    ? 'w-1/2 px-2 mb-3' 
    : 'flex-1';

  return (
    <View className={`${containerClass} ${className}`}>
      {actions.map((action) => (
        <View key={action.id} className={itemClass}>
          <Pressable
            onPress={action.onPress}
            disabled={action.disabled}
            className={`
              flex-row items-center justify-center
              px-4 py-3 rounded-lg border
              ${getActionStyles(action.variant, action.disabled)}
              ${!action.disabled ? 'active:scale-95' : ''}
            `}
          >
            <View className="mr-2">
              {action.icon}
            </View>
            <Text 
              className={`font-medium text-center flex-1 ${getTextStyles(action.variant, action.disabled)}`}
              numberOfLines={2}
            >
              {action.label}
            </Text>
          </Pressable>
        </View>
      ))}
    </View>
  );
}