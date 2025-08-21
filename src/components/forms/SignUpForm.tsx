import React, { useState } from 'react';
import { View, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { Button } from '../ui/button';
import { Text } from '../ui/text';
import { Input } from '../ui/input';
import { useAuthActions } from '../../store/auth-store';
import type { SignUpCredentials } from '../../types/auth';

interface SignUpFormProps {
  onSuccess?: () => void;
}

export function SignUpForm({ onSuccess }: SignUpFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { signUp } = useAuthActions();
  
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignUpCredentials & { confirmPassword: string }>({
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
    },
  });

  const password = watch('password');

  const onSubmit = async (data: SignUpCredentials & { confirmPassword: string }) => {
    setIsLoading(true);
    try {
      await signUp({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
      });
      
      Alert.alert(
        'Sign Up Successful',
        'Please check your email to verify your account.',
        [
          {
            text: 'OK',
            onPress: () => {
              onSuccess?.();
              router.push('/(auth)/sign-in');
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert(
        'Sign Up Failed',
        error.message || 'An error occurred while creating your account. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="space-y-4">
      <View className="flex-row space-x-2">
        <View className="flex-1">
          <Text className="text-sm font-medium text-foreground mb-2">First Name</Text>
          <Controller
            control={control}
            name="firstName"
            render={({ field: { onChange, value } }) => (
              <Input
                placeholder="First name"
                value={value}
                onChangeText={onChange}
                autoCapitalize="words"
                autoComplete="given-name"
              />
            )}
          />
        </View>
        
        <View className="flex-1">
          <Text className="text-sm font-medium text-foreground mb-2">Last Name</Text>
          <Controller
            control={control}
            name="lastName"
            render={({ field: { onChange, value } }) => (
              <Input
                placeholder="Last name"
                value={value}
                onChangeText={onChange}
                autoCapitalize="words"
                autoComplete="family-name"
              />
            )}
          />
        </View>
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

      <View>
        <Text className="text-sm font-medium text-foreground mb-2">Password</Text>
        <Controller
          control={control}
          name="password"
          rules={{
            required: 'Password is required',
            minLength: {
              value: 8,
              message: 'Password must be at least 8 characters',
            },
            pattern: {
              value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
              message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
            },
          }}
          render={({ field: { onChange, value } }) => (
            <Input
              placeholder="Create a password"
              value={value}
              onChangeText={onChange}
              secureTextEntry
              autoComplete="new-password"
            />
          )}
        />
        {errors.password && (
          <Text className="text-sm text-destructive mt-1">
            {errors.password.message}
          </Text>
        )}
      </View>

      <View>
        <Text className="text-sm font-medium text-foreground mb-2">Confirm Password</Text>
        <Controller
          control={control}
          name="confirmPassword"
          rules={{
            required: 'Please confirm your password',
            validate: (value) => value === password || 'Passwords do not match',
          }}
          render={({ field: { onChange, value } }) => (
            <Input
              placeholder="Confirm your password"
              value={value}
              onChangeText={onChange}
              secureTextEntry
              autoComplete="new-password"
            />
          )}
        />
        {errors.confirmPassword && (
          <Text className="text-sm text-destructive mt-1">
            {errors.confirmPassword.message}
          </Text>
        )}
      </View>

      <Button
        onPress={handleSubmit(onSubmit)}
        disabled={isLoading}
        className="w-full"
      >
        <Text className="text-primary-foreground font-medium">
          {isLoading ? 'Creating Account...' : 'Create Account'}
        </Text>
      </Button>

      <View className="flex-row justify-center space-x-1">
        <Text className="text-sm text-muted-foreground">
          Already have an account?
        </Text>
        <Text
          className="text-sm text-primary font-medium"
          onPress={() => router.push('/(auth)/sign-in')}
        >
          Sign In
        </Text>
      </View>
    </View>
  );
}