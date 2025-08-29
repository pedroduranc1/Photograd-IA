import React from 'react';
import { View, Pressable } from 'react-native';
import { ChevronRight, Home } from 'lucide-react-native';
import { Text } from './text';
import { useColorScheme } from '~/src/hooks/ui/useColorScheme';

interface BreadcrumbItem {
  label: string;
  onPress?: () => void;
  isActive?: boolean;
}

interface BreadcrumbNavigationProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function BreadcrumbNavigation({ items, className = '' }: BreadcrumbNavigationProps) {
  const { isDarkColorScheme } = useColorScheme();
  const iconColor = isDarkColorScheme ? '#94A3B8' : '#64748B';
  const activeColor = isDarkColorScheme ? '#F1F5F9' : '#0F172A';
  const inactiveColor = isDarkColorScheme ? '#64748B' : '#94A3B8';

  return (
    <View className={`flex-row items-center px-6 py-3 bg-background ${className}`}>
      <Pressable 
        onPress={items[0]?.onPress}
        className="flex-row items-center mr-2"
      >
        <Home size={16} color={iconColor} />
      </Pressable>
      
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <ChevronRight 
              size={14} 
              color={inactiveColor} 
              style={{ marginHorizontal: 8 }}
            />
          )}
          <Pressable
            onPress={item.onPress}
            disabled={!item.onPress || item.isActive}
            className={`px-2 py-1 rounded-md ${
              item.isActive 
                ? 'bg-muted' 
                : item.onPress 
                  ? 'active:bg-muted/50' 
                  : ''
            }`}
          >
            <Text 
              className={`text-sm font-medium ${
                item.isActive 
                  ? 'text-foreground' 
                  : item.onPress 
                    ? 'text-muted-foreground' 
                    : 'text-muted-foreground'
              }`}
              numberOfLines={1}
            >
              {item.label}
            </Text>
          </Pressable>
        </React.Fragment>
      ))}
    </View>
  );
}