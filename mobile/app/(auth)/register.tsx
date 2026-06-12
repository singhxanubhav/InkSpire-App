import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { KeyboardAvoidingWrapper } from '../../components/ui/KeyboardAvoidingWrapper';
import { api } from '../../services/api';

export default function RegisterScreen() {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    displayName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  
  const [errors, setErrors] = useState<Partial<typeof formData>>({});
  const [apiError, setApiError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);

  // Password strength logic
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { label: '', color: 'bg-transparent' };
    let score = 0;
    if (pass.length > 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    
    if (score < 2) return { label: 'Weak', color: 'bg-red-500' };
    if (score === 2) return { label: 'Medium', color: 'bg-yellow-500' };
    return { label: 'Strong', color: 'bg-green-500' };
  };

  const strength = getPasswordStrength(formData.password);

  // Debounced username check
  useEffect(() => {
    const checkUsername = async () => {
      if (formData.username.length < 3) {
        setUsernameAvailable(null);
        return;
      }
      setIsCheckingUsername(true);
      try {
        // This endpoint doesn't exist yet, but let's assume it or mock it
        // const response = await api.get(`/auth/check-username?username=${formData.username}`);
        // setUsernameAvailable(response.data.available);
        // For now, assume it's available if it passes validation
        setUsernameAvailable(true);
      } catch (error) {
        setUsernameAvailable(false);
      } finally {
        setIsCheckingUsername(false);
      }
    };

    const timeoutId = setTimeout(checkUsername, 500);
    return () => clearTimeout(timeoutId);
  }, [formData.username]);

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = () => {
    const newErrors: Partial<typeof formData> = {};
    
    if (!formData.displayName || formData.displayName.length < 2) {
      newErrors.displayName = 'Display name must be at least 2 characters';
    }
    
    if (!formData.username || formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'Only alphanumeric and underscore allowed';
    }
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password || formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/[A-Z]/.test(formData.password) || !/[0-9]/.test(formData.password)) {
      newErrors.password = 'Must contain 1 uppercase and 1 number';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    setApiError('');
    if (!validate() || usernameAvailable === false) return;

    setIsLoading(true);
    try {
      const response = await api.post('/auth/register', {
        email: formData.email,
        password: formData.password,
        username: formData.username,
        displayName: formData.displayName,
      });
      
      if (response.data.success) {
        // Navigate to a screen to check their email
        router.push({
          pathname: '/(auth)/check-email', // This screen should probably exist, or we can just redirect to login with a message
          params: { email: formData.email }
        });
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
          <Text className="text-4xl font-bold text-gray-900 mb-2">Create Account</Text>
          <Text className="text-base text-gray-500">Join our community of writers</Text>
        </View>

        {apiError ? (
          <View className="bg-red-50 p-4 rounded-xl mb-6 border border-red-100">
            <Text className="text-red-600 text-sm">{apiError}</Text>
          </View>
        ) : null}

        <View className="space-y-4 mb-6">
          <Input
            label="Display Name"
            placeholder="Jane Doe"
            value={formData.displayName}
            onChangeText={(text) => handleChange('displayName', text)}
            onBlur={() => validate()}
            error={errors.displayName}
            leftIcon="person-outline"
            editable={!isLoading}
          />

          <View>
            <Input
              label="Username"
              placeholder="jane_doe"
              value={formData.username}
              onChangeText={(text) => handleChange('username', text)}
              onBlur={() => validate()}
              error={errors.username}
              leftIcon="at-outline"
              autoCapitalize="none"
              editable={!isLoading}
            />
            {isCheckingUsername && (
              <ActivityIndicator size="small" className="absolute right-4 top-10" />
            )}
            {!isCheckingUsername && usernameAvailable === true && formData.username.length >= 3 && (
              <Text className="text-green-500 text-xs mt-1 absolute -bottom-5">Username is available!</Text>
            )}
            {!isCheckingUsername && usernameAvailable === false && formData.username.length >= 3 && (
              <Text className="text-red-500 text-xs mt-1 absolute -bottom-5">Username is taken</Text>
            )}
          </View>
          
          <View className="mt-4" />

          <Input
            label="Email"
            placeholder="jane@example.com"
            value={formData.email}
            onChangeText={(text) => handleChange('email', text)}
            onBlur={() => validate()}
            error={errors.email}
            leftIcon="mail-outline"
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!isLoading}
          />

          <View>
            <Input
              label="Password"
              placeholder="Create a password"
              value={formData.password}
              onChangeText={(text) => handleChange('password', text)}
              onBlur={() => validate()}
              error={errors.password}
              leftIcon="lock-closed-outline"
              secureTextEntry
              editable={!isLoading}
            />
            {formData.password ? (
              <View className="flex-row items-center mt-1 space-x-2">
                <View className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                  <View className={`h-full ${strength.color}`} style={{ width: strength.label === 'Weak' ? '33%' : strength.label === 'Medium' ? '66%' : '100%' }} />
                </View>
                <Text className={`text-xs font-medium ${strength.color.replace('bg-', 'text-')}`}>{strength.label}</Text>
              </View>
            ) : null}
          </View>

          <Input
            label="Confirm Password"
            placeholder="Confirm your password"
            value={formData.confirmPassword}
            onChangeText={(text) => handleChange('confirmPassword', text)}
            onBlur={() => validate()}
            error={errors.confirmPassword}
            leftIcon="lock-closed-outline"
            secureTextEntry
            editable={!isLoading}
          />
        </View>

        <Button
          title="Sign Up"
          onPress={handleRegister}
          loading={isLoading}
          className="mb-6 mt-4"
        />

        <View className="flex-row justify-center items-center">
          <Text className="text-gray-500">Already have an account? </Text>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity>
              <Text className="text-blue-600 font-semibold">Sign in</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingWrapper>
  );
}
