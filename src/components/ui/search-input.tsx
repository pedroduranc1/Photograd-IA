import React, { useState, useEffect } from 'react';
import { View, Pressable, TextInput } from 'react-native';
import { Search, X } from 'lucide-react-native';
import { cn } from '~/src/utils/utils';
import { useColorScheme } from '~/src/hooks/ui/useColorScheme';

interface SearchInputProps {
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  onClear?: () => void;
  className?: string;
  autoFocus?: boolean;
}

export function SearchInput({
  placeholder = 'Buscar escuelas...',
  value,
  onChangeText,
  onClear,
  className,
  autoFocus = false,
}: SearchInputProps) {
  const { isDarkColorScheme } = useColorScheme();
  const [isFocused, setIsFocused] = useState(false);

  const iconColor = isDarkColorScheme ? '#CBD5E1' : '#64748B';
  const placeholderColor = isDarkColorScheme ? '#64748B' : '#94A3B8';

  return (
    <View 
      className={cn(
        'flex-row items-center bg-background border rounded-lg px-3 h-12',
        isFocused ? 'border-primary' : 'border-border',
        className
      )}
    >
      <Search size={20} color={iconColor} />
      
      <TextInput
        className="flex-1 ml-3 text-foreground text-base"
        placeholder={placeholder}
        placeholderTextColor={placeholderColor}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        autoFocus={autoFocus}
        returnKeyType="search"
      />
      
      {value.length > 0 && (
        <Pressable
          onPress={() => {
            onChangeText('');
            onClear?.();
          }}
          className="ml-2 p-1"
          accessibilityLabel="Limpiar búsqueda"
        >
          <X size={18} color={iconColor} />
        </Pressable>
      )}
    </View>
  );
}