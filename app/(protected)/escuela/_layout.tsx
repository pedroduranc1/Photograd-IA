import { Stack } from 'expo-router';
import { useColorScheme } from '../../../src/hooks/ui/useColorScheme';
import { ThemeToggle } from '~/src/components/layout/ThemeToggle';

export default function EscuelasLayout() {
  const { isDarkColorScheme } = useColorScheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: isDarkColorScheme ? '#1E293B' : '#F8FAFC',
          borderBottomColor: isDarkColorScheme ? '#334155' : '#F1F5F9',
        },
        headerTintColor: isDarkColorScheme ? '#FAFAFA' : '#1E293B',
        headerTitleStyle: {
          fontWeight: '600',
        },
        headerRight: () => <ThemeToggle />,
      }}
    >
      <Stack.Screen
        name="[id]"
        options={{
          title: 'Detalle de Escuela',
          headerBackTitle: 'Escuelas',
          presentation: 'card',
        }}
      />
    </Stack>
  );
}