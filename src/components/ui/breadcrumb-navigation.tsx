import React from 'react';
import { View, Pressable, ScrollView, Dimensions } from 'react-native';
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
  
  // Get screen width for responsive behavior
  const screenWidth = Dimensions.get('window').width;
  
  // Calculate max width for each breadcrumb item based on number of items
  // Reserve space for home icon (32px), chevrons (22px each), padding (48px), and margins
  const reservedSpace = 32 + (Math.max(0, items.length - 1) * 22) + 48 + (items.length * 16);
  const availableSpace = screenWidth - reservedSpace;
  const maxItemWidth = Math.max(80, availableSpace / items.length);

  return (
    <View className={`bg-background ${className}`}>
      <ScrollView 
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingVertical: 12,
          alignItems: 'center',
        }}
        className="flex-row"
      >
        {/* Home Icon */}
        <Pressable 
          onPress={items[0]?.onPress}
          className="flex-row items-center mr-2 px-1 py-1 rounded-md active:bg-muted/50"
        >
          <Home size={16} color={iconColor} />
        </Pressable>
        
        {items.map((item, index) => (
          <React.Fragment key={index}>
            {index > 0 && (
              <ChevronRight 
                size={14} 
                color={inactiveColor} 
                style={{ marginHorizontal: 6 }}
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
              style={{ maxWidth: maxItemWidth }}
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
                ellipsizeMode="middle"
              >
                {item.label}
              </Text>
            </Pressable>
          </React.Fragment>
        ))}
      </ScrollView>
    </View>
  );
}