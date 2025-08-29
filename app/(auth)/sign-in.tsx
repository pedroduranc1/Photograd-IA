import React from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SignInForm } from '~/src/components/forms/SignInForm';
import { Text } from '~/src/components/ui/text';
import { Card } from '~/src/components/ui/card';

export default function SignInScreen() {
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
                Welcome Back
              </Text>
              <Text className="text-center text-muted-foreground">
                Sign in to your account to continue
              </Text>
            </View>

            <Card className="p-6">
              <SignInForm />
            </Card>

            <View className="mt-8">
              <Text className="text-xs text-center text-muted-foreground">
                By signing in, you agree to our Terms of Service and Privacy Policy
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}