import React, { useState } from 'react';
import { View, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { Button } from '../ui/button';
import { Text } from '../ui/text';
import { Input } from '../ui/input';
import { useAuthActions } from '../../store/auth-store';
import type { ResetPasswordCredentials } from '../../types/auth';

export function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const router = useRouter();
  const { resetPassword } = useAuthActions();
  
  const {
    control,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<ResetPasswordCredentials>({
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ResetPasswordCredentials) => {
    setIsLoading(true);
    try {
      await resetPassword(data);
      setIsSubmitted(true);
    } catch (error: any) {
      Alert.alert(
        'Reset Failed',
        error.message || 'An error occurred while sending the reset email. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <View className="space-y-4 text-center">
        <Text className="text-lg font-semibold text-foreground text-center">
          Check Your Email
        </Text>
        <Text className="text-muted-foreground text-center">
          We've sent a password reset link to {getValues('email')}
        </Text>
        <Text className="text-sm text-muted-foreground text-center">
          If you don't see the email, check your spam folder.
        </Text>
        
        <View className="space-y-3 mt-6">
          <Button
            onPress={() => router.push('/(auth)/sign-in')}
            variant="outline"
            className="w-full"
          >
            <Text>Back to Sign In</Text>
          </Button>
          
          <Text
            className="text-sm text-primary text-center"
            onPress={() => setIsSubmitted(false)}
          >
            Try a different email
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="space-y-4">
      <View className="mb-4">
        <Text className="text-lg font-semibold text-foreground text-center mb-2">
          Forgot Password?
        </Text>
        <Text className="text-muted-foreground text-center">
          Enter your email address and we'll send you a link to reset your password.
        </Text>
      </View>

      <View>
        <Text className="text-sm font-medium text-foreground mb-2">Email</Text>
        <Controller
          control={control}
          name="email"
          rules={{
            required: 'Email is required',
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: 'Invalid email address',
            },
          }}
          render={({ field: { onChange, value } }) => (
            <Input
              placeholder="Enter your email"
              value={value}
              onChangeText={onChange}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          )}
        />
        {errors.email && (
          <Text className="text-sm text-destructive mt-1">
            {errors.email.message}
          </Text>
        )}
      </View>

      <Button
        onPress={handleSubmit(onSubmit)}
        disabled={isLoading}
        className="w-full"
      >
        <Text className="text-primary-foreground font-medium">
          {isLoading ? 'Sending...' : 'Send Reset Link'}
        </Text>
      </Button>

      <Text
        className="text-sm text-primary text-center"
        onPress={() => router.push('/(auth)/sign-in')}
      >
        Back to Sign In
      </Text>
    </View>
  );
}