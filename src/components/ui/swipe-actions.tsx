import React from 'react';
import { View, Pressable, Animated, PanGestureHandler, State } from 'react-native';
import { Text } from './text';
import { useColorScheme } from '~/src/hooks/ui/useColorScheme';

interface SwipeAction {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onPress: () => void;
  backgroundColor?: string;
  color?: 'primary' | 'danger' | 'success' | 'warning';
}

interface SwipeActionsProps {
  children: React.ReactNode;
  leftActions?: SwipeAction[];
  rightActions?: SwipeAction[];
  threshold?: number;
  className?: string;
}

export function SwipeActions({
  children,
  leftActions = [],
  rightActions = [],
  threshold = 100,
  className = '',
}: SwipeActionsProps) {
  const { isDarkColorScheme } = useColorScheme();
  const translateX = new Animated.Value(0);
  const scale = new Animated.Value(1);

  const getActionColor = (color?: SwipeAction['color']) => {
    switch (color) {
      case 'danger':
        return isDarkColorScheme ? '#DC2626' : '#EF4444';
      case 'success':
        return isDarkColorScheme ? '#059669' : '#10B981';
      case 'warning':
        return isDarkColorScheme ? '#D97706' : '#F59E0B';
      case 'primary':
      default:
        return isDarkColorScheme ? '#3B82F6' : '#2563EB';
    }
  };

  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX } }],
    { useNativeDriver: false }
  );

  const onHandlerStateChange = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      const { translationX: x } = event.nativeEvent;
      
      if (Math.abs(x) > threshold) {
        // Action triggered - animate to reveal actions
        Animated.timing(translateX, {
          toValue: x > 0 ? threshold : -threshold,
          duration: 200,
          useNativeDriver: false,
        }).start();
      } else {
        // Return to center
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: false,
        }).start();
      }
    }
  };

  const renderActions = (actions: SwipeAction[], side: 'left' | 'right') => {
    if (actions.length === 0) return null;

    return (
      <View
        className={`absolute top-0 bottom-0 flex-row ${
          side === 'left' ? 'left-0' : 'right-0'
        }`}
        style={{ width: threshold }}
      >
        {actions.map((action, index) => (
          <Pressable
            key={action.id}
            onPress={() => {
              action.onPress();
              // Reset position after action
              Animated.spring(translateX, {
                toValue: 0,
                useNativeDriver: false,
              }).start();
            }}
            className="flex-1 items-center justify-center"
            style={{
              backgroundColor: action.backgroundColor || getActionColor(action.color),
            }}
          >
            {action.icon && (
              <View className="mb-1">
                {action.icon}
              </View>
            )}
            <Text className="text-white text-xs font-medium">
              {action.label}
            </Text>
          </Pressable>
        ))}
      </View>
    );
  };

  return (
    <View className={`relative overflow-hidden ${className}`}>
      {renderActions(leftActions, 'left')}
      {renderActions(rightActions, 'right')}
      
      <PanGestureHandler
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
        activeOffsetX={[-10, 10]}
      >
        <Animated.View
          style={{
            transform: [
              { translateX },
              { scale },
            ],
          }}
        >
          {children}
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
}