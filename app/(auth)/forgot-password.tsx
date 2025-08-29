import React from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ForgotPasswordForm } from '~/src/components/forms/ForgotPasswordForm';
import { Text } from '~/src/components/ui/text';
import { Card } from '~/src/components/ui/card';

export default function ForgotPasswordScreen() {
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
            <Card className="p-6">
              <ForgotPasswordForm />
            </Card>

            <View className="mt-8">
              <Text className="text-xs text-center text-muted-foreground">
                Remember your password? Go back to sign in
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}