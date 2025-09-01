import React from 'react';
import { View, Alert } from 'react-native';
import { Button } from '../ui/button';
import { Text } from '../ui/text';
import { useAuthUser, useAuthActions } from '../../store/auth-store';
import { useUserProfile } from '../../hooks/data/use-user-profile';
import { ensureUserProfile, debugProfileIssues } from '../../utils/profile-utils';

export function UserProfile() {
  const authUser = useAuthUser();
  const { signOut } = useAuthActions();
  const { data: profile, isLoading, error } = useUserProfile();

  // Debug logging and profile creation - optimized to prevent loops
  React.useEffect(() => {
    console.log('UserProfile Debug Info:', {
      hasAuthUser: !!authUser,
      hasProfile: !!profile,
      isLoading,
      hasError: !!error
    });
  }, [!!authUser, !!profile, isLoading, !!error]); // Use boolean values to prevent object comparison loops
  
  // Separate effect for profile creation to avoid cascading loops
  React.useEffect(() => {
    // Only attempt profile creation if we have a clear error and authenticated user
    if (error && authUser && !isLoading && !profile) {
      console.log('Attempting to create missing user profile...');
      const createProfile = async () => {
        try {
          await ensureUserProfile(authUser);
        } catch (err) {
          console.error('Failed to ensure user profile:', err);
        }
      };
      createProfile();
    }
  }, [!!error, !!authUser, isLoading, !!profile]); // Stable dependencies

  const handleDebugProfile = async () => {
    if (!authUser) return;
    
    try {
      const debugInfo = await debugProfileIssues(authUser.id);
      const details = debugInfo.details.join('\n');
      Alert.alert(
        'Profile Debug Info',
        `Environment: ${debugInfo.envCheck ? '✅' : '❌'}\nDatabase: ${debugInfo.dbConnection ? '✅' : '❌'}\nProfile: ${debugInfo.profileExists ? '✅' : '❌'}\n\nDetails:\n${details}`,
        [{ text: 'OK' }]
      );
    } catch (err: any) {
      Alert.alert('Debug Error', err.message);
    }
  };

  const handleCreateProfile = async () => {
    if (!authUser) return;
    
    try {
      await ensureUserProfile(authUser);
      Alert.alert('Success', 'Profile created/verified successfully!');
      // The query should automatically refetch due to React Query
    } catch (err: any) {
      Alert.alert('Error', `Failed to create profile: ${err.message}`);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error: any) {
              Alert.alert(
                'Error',
                error.message || 'Failed to sign out. Please try again.'
              );
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View className="px-6">
        <Text className="text-muted-foreground">Loading profile...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="px-6 space-y-4">
        <Text className="text-destructive text-lg font-semibold">Failed to load profile</Text>
        <View className="bg-destructive/10 p-3 rounded-lg">
          <Text className="text-sm text-destructive-foreground font-medium mb-2">Error Details:</Text>
          <Text className="text-sm text-muted-foreground">{error.message || 'Unknown error occurred'}</Text>
          {authUser && (
            <Text className="text-sm text-muted-foreground mt-2">
              Authenticated as: {authUser.email}
            </Text>
          )}
        </View>
        <View className="space-y-2">
          <Button
            onPress={handleCreateProfile}
            variant="default"
            className="w-full"
          >
            <Text className="text-primary-foreground">Create Profile</Text>
          </Button>
          <Button
            onPress={handleDebugProfile}
            variant="outline"
            className="w-full"
          >
            <Text>Debug Info</Text>
          </Button>
        </View>
      </View>
    );
  }

  return (
    <View className="px-6 space-y-4">
      <View className="space-y-2">
        <Text className="text-lg font-semibold text-foreground">Profile</Text>
        
        <View className="space-y-1">
          <Text className="text-sm text-muted-foreground">Email</Text>
          <Text className="text-foreground">{authUser?.email}</Text>
        </View>
        
        {profile?.firstName && (
          <View className="space-y-1">
            <Text className="text-sm text-muted-foreground">First Name</Text>
            <Text className="text-foreground">{profile.firstName}</Text>
          </View>
        )}
        
        {profile?.lastName && (
          <View className="space-y-1">
            <Text className="text-sm text-muted-foreground">Last Name</Text>
            <Text className="text-foreground">{profile.lastName}</Text>
          </View>
        )}
        
        <View className="space-y-1">
          <Text className="text-sm text-muted-foreground">Member Since</Text>
          <Text className="text-foreground">
            {authUser?.created_at ? new Date(authUser.created_at).toLocaleDateString() : 'Unknown'}
          </Text>
        </View>
      </View>

      <View className="pt-4 border-t border-border">
        <Button
          onPress={handleSignOut}
          variant="destructive"
          className="w-full"
        >
          <Text className="text-destructive-foreground">Sign Out</Text>
        </Button>
      </View>
    </View>
  );
}