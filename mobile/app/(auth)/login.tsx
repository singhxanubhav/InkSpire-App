import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { KeyboardAvoidingWrapper } from '../../components/ui/KeyboardAvoidingWrapper';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

export default function LoginScreen() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [apiError, setApiError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};
    if (!email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Email is invalid';
    
    if (!password) newErrors.password = 'Password is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    setApiError('');
    if (!validate()) return;

    setIsLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      
      if (response.data.success) {
        const { user, accessToken, refreshToken } = response.data.data;
        await login(user, accessToken, refreshToken);
        
        // If not verified or no genres, go to onboarding, else home
        if (!user.isVerified) {
           router.replace('/(auth)/check-email'); // We'll skip this for now or navigate to verify
        }
        if (!user.genres || user.genres.length === 0) {
          router.replace('/onboarding');
        } else {
          router.replace('/(tabs)/home');
        }
      }
    } catch (error: any) {
      if (error.response?.data?.message) {
        setApiError(error.response.data.message);
      } else {
        setApiError(error.message || 'An unexpected error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingWrapper className="flex-1 bg-white">
      <View className="flex-1 px-6 justify-center py-12">
        <View className="mb-8">
          <Text className="text-4xl font-bold text-gray-900 mb-2">Welcome Back</Text>
          <Text className="text-base text-gray-500">Sign in to continue your writing journey</Text>
        </View>

        {apiError ? (
          <View className="bg-red-50 p-4 rounded-xl mb-6 border border-red-100">
            <Text className="text-red-600 text-sm">{apiError}</Text>
          </View>
        ) : null}

        <View className="space-y-4 mb-6">
          <Input
            label="Email"
            placeholder="Enter your email"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (errors.email) setErrors({ ...errors, email: undefined });
            }}
            onBlur={() => validate()}
            error={errors.email}
            leftIcon="mail-outline"
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!isLoading}
          />

          <Input
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (errors.password) setErrors({ ...errors, password: undefined });
            }}
            onBlur={() => validate()}
            error={errors.password}
            leftIcon="lock-closed-outline"
            secureTextEntry
            editable={!isLoading}
          />

          <View className="flex-row justify-end mt-2 mb-4">
            <Link href="/(auth)/forgot-password" asChild>
              <TouchableOpacity>
                <Text className="text-blue-600 font-medium text-sm">Forgot password?</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>

        <Button
          title="Sign In"
          onPress={handleLogin}
          loading={isLoading}
          className="mb-6"
        />

        <View className="flex-row justify-center items-center">
          <Text className="text-gray-500">Don't have an account? </Text>
          <Link href="/(auth)/register" asChild>
            <TouchableOpacity>
              <Text className="text-blue-600 font-semibold">Sign up</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingWrapper>
  );
}
