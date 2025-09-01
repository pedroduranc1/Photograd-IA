import React, { useState } from 'react';
import { View, Pressable, LayoutAnimation, Platform, UIManager } from 'react-native';
import { ChevronDown, ChevronRight } from 'lucide-react-native';
import { Text } from './text';
import { useColorScheme } from '~/src/hooks/ui/useColorScheme';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface ExpandableSectionProps {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  icon?: React.ReactNode;
  badge?: string | number;
  className?: string;
}

export function ExpandableSection({
  title,
  children,
  defaultExpanded = false,
  icon,
  badge,
  className = '',
}: ExpandableSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const { isDarkColorScheme } = useColorScheme();
  const iconColor = isDarkColorScheme ? '#94A3B8' : '#64748B';

  const toggleExpanded = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(!isExpanded);
  };

  return (
    <View className={`bg-card rounded-lg border border-border overflow-hidden ${className}`}>
      <Pressable
        onPress={toggleExpanded}
        className="flex-row items-center justify-between p-4 active:bg-muted/50"
      >
        <View className="flex-row items-center flex-1">
          {icon && (
            <View className="mr-3">
              {icon}
            </View>
          )}
          <Text className="text-lg font-semibold text-foreground flex-1">
            {title}
          </Text>
          {badge && (
            <View className="bg-muted rounded-full px-2 py-1 mr-3">
              <Text className="text-xs font-medium text-muted-foreground">
                {badge}
              </Text>
            </View>
          )}
        </View>
        
        <View>
          {isExpanded ? (
            <ChevronDown size={20} color={iconColor} />
          ) : (
            <ChevronRight size={20} color={iconColor} />
          )}
        </View>
      </Pressable>

      {isExpanded && (
        <View className="px-4 pb-4 border-t border-border/50">
          {children}
        </View>
      )}
    </View>
  );
}