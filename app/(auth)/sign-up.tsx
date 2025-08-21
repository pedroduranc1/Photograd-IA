import React from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SignUpForm } from '../../src/components/forms/SignUpForm';
import { Text } from '../../src/components/ui/text';
import { Card } from '../../src/components/ui/card';

export default function SignUpScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 justify-center px-6 py-12">
            <View className="mb-8">
              <Text className="text-3xl font-bold text-center text-foreground mb-2">
                Create Account
              </Text>
              <Text className="text-center text-muted-foreground">
                Join us and start your journey today
              </Text>
            </View>

            <Card className="p-6">
              <SignUpForm />
            </Card>

            <View className="mt-8">
              <Text className="text-xs text-center text-muted-foreground">
                By creating an account, you agree to our Terms of Service and Privacy Policy
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}