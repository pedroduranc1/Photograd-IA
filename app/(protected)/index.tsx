import React from 'react';
import { View, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../../src/components/ui/button';
import { Text } from '../../src/components/ui/text';
import { Card } from '../../src/components/ui/card';
import { useAuthUser } from '../../src/store/auth-store';
import { useUserProfile } from '../../src/hooks/data/use-user-profile';

export default function HomeScreen() {
  const router = useRouter();
  const authUser = useAuthUser();
  const { data: profile, isLoading } = useUserProfile();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const displayName = profile?.firstName 
    ? `${profile.firstName} ${profile.lastName || ''}`.trim()
    : authUser?.email?.split('@')[0] || 'User';

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 px-6 pt-6">
          {/* Welcome Section */}
          <View className="mb-8">
            <Text className="text-2xl font-bold text-foreground mb-2">
              {getGreeting()}, {displayName}!
            </Text>
            <Text className="text-muted-foreground">
              Welcome to Photograd-IA. Ready to enhance your photos?
            </Text>
          </View>

          {/* Quick Actions */}
          <Card className="p-6 mb-6">
            <Text className="text-lg font-semibold text-foreground mb-4">
              Quick Actions
            </Text>
            <View className="space-y-3">
              <Button
                onPress={() => {
                  // TODO: Navigate to photo upload screen
                  alert('Photo upload feature coming soon!');
                }}
                className="w-full"
              >
                <Text className="text-primary-foreground">Upload Photo</Text>
              </Button>
              
              <Button
                onPress={() => {
                  // TODO: Navigate to gallery screen
                  alert('Gallery feature coming soon!');
                }}
                variant="outline"
                className="w-full"
              >
                <Text>View Gallery</Text>
              </Button>
            </View>
          </Card>

          {/* Profile Section */}
          <Card className="p-6 mb-6">
            <Text className="text-lg font-semibold text-foreground mb-4">
              Account
            </Text>
            <View className="space-y-3">
              <Button
                onPress={() => router.push('/(protected)/perfil')}
                variant="outline"
                className="w-full"
              >
                <Text>View Profile</Text>
              </Button>
            </View>
          </Card>

          {/* Stats Section */}
          <Card className="p-6">
            <Text className="text-lg font-semibold text-foreground mb-4">
              Your Stats
            </Text>
            <View className="flex-row justify-around">
              <View className="items-center">
                <Text className="text-2xl font-bold text-primary">0</Text>
                <Text className="text-sm text-muted-foreground">Photos</Text>
              </View>
              <View className="items-center">
                <Text className="text-2xl font-bold text-primary">0</Text>
                <Text className="text-sm text-muted-foreground">Processed</Text>
              </View>
              <View className="items-center">
                <Text className="text-2xl font-bold text-primary">0</Text>
                <Text className="text-sm text-muted-foreground">Saved</Text>
              </View>
            </View>
          </Card>
        </View>
      </ScrollView>
    </View>
  );
}