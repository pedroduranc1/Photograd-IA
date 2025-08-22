import React from 'react';
import { View, ScrollView } from 'react-native';
import { UserProfile } from '../../src/components/common/UserProfile';

export default function ProfileScreen() {
  return (
    <View className="flex-1 bg-background">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="pt-6">
          <UserProfile />
        </View>
      </ScrollView>
    </View>
  );
}