import React, { useState } from 'react';
import { View, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { Button } from '../ui/button';
import { Text } from '../ui/text';
import { Input } from '../ui/input';
import { useAuthActions } from '../../store/auth-store';
import type { SignInCredentials } from '../../types/auth';

interface SignInFormProps {
  onSuccess?: () => void;
}

export function SignInForm({ onSuccess }: SignInFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { signIn } = useAuthActions();
  
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInCredentials>({
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: SignInCredentials) => {
    setIsLoading(true);
    try {
      await signIn(data);
      onSuccess?.();
    } catch (error: any) {
      Alert.alert(
        'Sign In Failed',
        error.message || 'An error occurred while signing in. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="space-y-4">
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

      <View>
        <Text className="text-sm font-medium text-foreground mb-2">Password</Text>
        <Controller
          control={control}
          name="password"
          rules={{
            required: 'Password is required',
            minLength: {
              value: 6,
              message: 'Password must be at least 6 characters',
            },
          }}
          render={({ field: { onChange, value } }) => (
            <Input
              placeholder="Enter your password"
              value={value}
              onChangeText={onChange}
              secureTextEntry
              autoComplete="current-password"
            />
          )}
        />
        {errors.password && (
          <Text className="text-sm text-destructive mt-1">
            {errors.password.message}
          </Text>
        )}
      </View>

      <Button
        onPress={handleSubmit(onSubmit)}
        disabled={isLoading}
        className="w-full mt-3"
      >
        <Text className="text-primary-foreground font-medium">
          {isLoading ? 'Signing In...' : 'Sign In'}
        </Text>
      </Button>

      <View className="flex-row justify-center space-x-1">
        <Text className="text-sm text-muted-foreground">
          Don't have an account?
        </Text>
        <Text
          className="text-sm text-primary font-medium"
          onPress={() => router.push('/(auth)/sign-up')}
        >
          Sign Up
        </Text>
      </View>

      <Text
        className="text-sm text-primary text-center"
        onPress={() => router.push('/(auth)/forgot-password')}
      >
        Forgot Password?
      </Text>
    </View>
  );
}