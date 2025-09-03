import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { Text } from '~/src/components/ui/text';
import { useColorScheme } from '~/src/hooks/ui/useColorScheme';
import { ChevronRight } from '~/src/components/ui/icons/ChevronRight';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  rightComponent?: React.ReactNode;
  showBreadcrumbs?: boolean;
}

interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Header({ 
  title, 
  subtitle, 
  rightComponent, 
  showBreadcrumbs = true 
}: HeaderProps) {
  const { isDarkColorScheme } = useColorScheme();
  const pathname = usePathname();
  const router = useRouter();

  const getBreadcrumbs = (): BreadcrumbItem[] => {
    const segments = pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [];

    // Always start with Home
    breadcrumbs.push({ label: 'Inicio', href: '/(protected)' });

    // Parse the segments
    if (segments.includes('escuelas')) {
      breadcrumbs.push({ label: 'Escuelas', href: '/(protected)/escuelas' });
      
      // Check for specific school
      const schoolIndex = segments.indexOf('escuelas') + 1;
      if (segments[schoolIndex] && segments[schoolIndex] !== 'undefined') {
        breadcrumbs.push({ 
          label: `Escuela ${segments[schoolIndex].substring(0, 8)}...`,
          href: `/(protected)/escuelas/${segments[schoolIndex]}`
        });
        
        // Check for grades
        if (segments.includes('grados')) {
          const gradeIndex = segments.indexOf('grados') + 1;
          if (segments[gradeIndex] && segments[gradeIndex] !== 'undefined') {
            breadcrumbs.push({ 
              label: `Grado ${segments[gradeIndex].substring(0, 8)}...`
            });
            
            // Check for student
            if (segments.includes('estudiante')) {
              const studentIndex = segments.indexOf('estudiante') + 1;
              if (segments[studentIndex] && segments[studentIndex] !== 'undefined') {
                breadcrumbs.push({ 
                  label: `Estudiante ${segments[studentIndex].substring(0, 8)}...`
                });
              }
            }
          }
        }
      }
    } else if (segments.includes('pagos')) {
      breadcrumbs.push({ label: 'Pagos' });
    } else if (segments.includes('perfil')) {
      breadcrumbs.push({ label: 'Perfil' });
    }

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();
  const headerBg = isDarkColorScheme ? 'bg-slate-900' : 'bg-white';
  const borderColor = isDarkColorScheme ? 'border-slate-700' : 'border-slate-200';

  return (
    <View className={`${headerBg} ${borderColor} border-b px-6 py-4`}>
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          {/* Breadcrumbs */}
          {showBreadcrumbs && breadcrumbs.length > 1 && (
            <View className="flex-row items-center mb-2">
              {breadcrumbs.map((crumb, index) => (
                <View key={index} className="flex-row items-center">
                  {crumb.href ? (
                    <TouchableOpacity
                      onPress={() => router.push(crumb.href!)}
                      className="px-2 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
                      accessibilityRole="button"
                      accessibilityLabel={`Navigate to ${crumb.label}`}
                    >
                      <Text className="text-sm text-muted-foreground hover:text-foreground">
                        {crumb.label}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <View className="px-2 py-1">
                      <Text className="text-sm font-medium text-foreground">
                        {crumb.label}
                      </Text>
                    </View>
                  )}
                  {index < breadcrumbs.length - 1 && (
                    <ChevronRight 
                      size={14} 
                      className="mx-1 text-muted-foreground" 
                    />
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Title and Subtitle */}
          {title && (
            <Text className="text-2xl font-bold text-foreground">
              {title}
            </Text>
          )}
          {subtitle && (
            <Text className="text-muted-foreground mt-1">
              {subtitle}
            </Text>
          )}
        </View>

        {/* Right Component */}
        {rightComponent && (
          <View className="ml-4">
            {rightComponent}
          </View>
        )}
      </View>
    </View>
  );
}