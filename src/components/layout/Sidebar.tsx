import React from 'react';
import { View, TouchableOpacity, ScrollView } from 'react-native';
import { Link, usePathname } from 'expo-router';
import { Text } from '~/src/components/ui/text';
import { ThemeToggle } from '~/src/components/layout/ThemeToggle';
import { useColorScheme } from '~/src/hooks/ui/useColorScheme';
import { Home } from '~/src/components/ui/icons/Home';
import { GraduationCap } from '~/src/components/ui/icons/GraduationCap';
import { CreditCard } from '~/src/components/ui/icons/CreditCard';
import { User } from '~/src/components/ui/icons/User';
import { useAuthStore } from '~/src/store/auth-store';

interface SidebarProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const navigationItems = [
  {
    name: 'Inicio',
    href: '/(protected)',
    icon: Home,
  },
  {
    name: 'Escuelas',
    href: '/(protected)/escuelas',
    icon: GraduationCap,
  },
  {
    name: 'Pagos',
    href: '/(protected)/pagos',
    icon: CreditCard,
  },
  {
    name: 'Perfil',
    href: '/(protected)/perfil',
    icon: User,
  },
];

export function Sidebar({ isCollapsed = false, onToggleCollapse }: SidebarProps) {
  const { isDarkColorScheme } = useColorScheme();
  const pathname = usePathname();
  const { user, signOut } = useAuthStore();

  const sidebarWidth = isCollapsed ? 'w-16' : 'w-64';
  const sidebarBg = isDarkColorScheme ? 'bg-slate-900' : 'bg-white';
  const borderColor = isDarkColorScheme ? 'border-slate-700' : 'border-slate-200';

  return (
    <View className={`${sidebarWidth} ${sidebarBg} ${borderColor} border-r flex-col h-full transition-all duration-300`}>
      {/* Header */}
      <View className="p-4 border-b border-slate-200 dark:border-slate-700">
        <View className="flex-row items-center justify-between">
          {!isCollapsed && (
            <Text className="text-xl font-bold text-foreground">
              Photograd-IA
            </Text>
          )}
          <TouchableOpacity 
            onPress={onToggleCollapse}
            className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
            accessibilityRole="button"
            accessibilityLabel={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <Text className="text-foreground">☰</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Navigation */}
      <ScrollView className="flex-1 p-2">
        <View className="space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const activeClasses = isActive 
              ? 'bg-primary text-primary-foreground' 
              : 'text-muted-foreground hover:bg-slate-100 hover:text-foreground dark:hover:bg-slate-800';

            return (
              <Link key={item.href} href={item.href} asChild>
                <TouchableOpacity
                  className={`flex-row items-center p-3 rounded-md transition-colors ${activeClasses}`}
                  accessibilityRole="button"
                  accessibilityLabel={`Navigate to ${item.name}`}
                >
                  <Icon 
                    size={20} 
                    className={`${isActive ? 'text-primary-foreground' : 'text-current'}`}
                  />
                  {!isCollapsed && (
                    <Text className={`ml-3 font-medium ${isActive ? 'text-primary-foreground' : 'text-current'}`}>
                      {item.name}
                    </Text>
                  )}
                </TouchableOpacity>
              </Link>
            );
          })}
        </View>
      </ScrollView>

      {/* Footer */}
      <View className="p-4 border-t border-slate-200 dark:border-slate-700">
        <View className="flex-row items-center justify-between mb-3">
          {!isCollapsed && (
            <View className="flex-1">
              <Text className="text-sm font-medium text-foreground truncate">
                {user?.email || 'User'}
              </Text>
              <Text className="text-xs text-muted-foreground">
                Authenticated
              </Text>
            </View>
          )}
          <ThemeToggle />
        </View>
        
        {!isCollapsed && (
          <TouchableOpacity
            onPress={signOut}
            className="w-full p-2 bg-red-100 dark:bg-red-900/20 rounded-md"
            accessibilityRole="button"
            accessibilityLabel="Sign out"
          >
            <Text className="text-center text-red-600 dark:text-red-400 font-medium">
              Cerrar Sesión
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}