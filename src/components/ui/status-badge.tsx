import React from 'react';
import { View } from 'react-native';
import { Text } from './text';

interface StatusBadgeProps {
  status: 'active' | 'inactive' | 'pending' | 'success' | 'warning' | 'danger';
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'solid' | 'outline' | 'soft';
  className?: string;
}

export function StatusBadge({
  status,
  label,
  size = 'md',
  variant = 'soft',
  className = '',
}: StatusBadgeProps) {
  
  const getStatusConfig = (status: StatusBadgeProps['status']) => {
    const configs = {
      active: {
        colors: {
          solid: 'bg-green-500 text-white',
          outline: 'bg-transparent border-green-500 text-green-600 dark:text-green-400',
          soft: 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200',
        },
        defaultLabel: 'Activo',
      },
      inactive: {
        colors: {
          solid: 'bg-gray-500 text-white',
          outline: 'bg-transparent border-gray-500 text-gray-600 dark:text-gray-400',
          soft: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
        },
        defaultLabel: 'Inactivo',
      },
      pending: {
        colors: {
          solid: 'bg-yellow-500 text-white',
          outline: 'bg-transparent border-yellow-500 text-yellow-600 dark:text-yellow-400',
          soft: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200',
        },
        defaultLabel: 'Pendiente',
      },
      success: {
        colors: {
          solid: 'bg-green-500 text-white',
          outline: 'bg-transparent border-green-500 text-green-600 dark:text-green-400',
          soft: 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200',
        },
        defaultLabel: 'Exitoso',
      },
      warning: {
        colors: {
          solid: 'bg-amber-500 text-white',
          outline: 'bg-transparent border-amber-500 text-amber-600 dark:text-amber-400',
          soft: 'bg-amber-100 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200',
        },
        defaultLabel: 'Advertencia',
      },
      danger: {
        colors: {
          solid: 'bg-red-500 text-white',
          outline: 'bg-transparent border-red-500 text-red-600 dark:text-red-400',
          soft: 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200',
        },
        defaultLabel: 'Peligro',
      },
    };

    return configs[status];
  };

  const getSizeClasses = (size: StatusBadgeProps['size']) => {
    const sizes = {
      sm: {
        container: 'px-2 py-0.5 rounded-full',
        text: 'text-xs',
      },
      md: {
        container: 'px-2.5 py-1 rounded-full',
        text: 'text-sm',
      },
      lg: {
        container: 'px-3 py-1.5 rounded-lg',
        text: 'text-base',
      },
    };

    return sizes[size];
  };

  const config = getStatusConfig(status);
  const sizeClasses = getSizeClasses(size);
  const borderClass = variant === 'outline' ? 'border' : '';

  return (
    <View 
      className={`
        ${sizeClasses.container} 
        ${borderClass}
        ${config.colors[variant]}
        self-start
        ${className}
      `}
    >
      <Text 
        className={`
          ${sizeClasses.text} 
          font-medium 
          ${config.colors[variant]}
        `}
      >
        {label || config.defaultLabel}
      </Text>
    </View>
  );
}