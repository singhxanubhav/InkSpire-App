import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInRight, FadeOutLeft } from 'react-native-reanimated';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { KeyboardAvoidingWrapper } from '../../components/ui/KeyboardAvoidingWrapper';
import { api } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);

  const otpInputs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSendEmail = async () => {
    setError('');
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setStep(2);
      setCountdown(60);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (value: string, index: number) => {
    if (value.length > 1) {
      // Handle paste
      const pastedOtp = value.slice(0, 6).split('');
      const newOtp = [...otp];
      pastedOtp.forEach((char, i) => {
        if (i < 6) newOtp[i] = char;
      });
      setOtp(newOtp);
      
      // Focus last filled or the next empty
      const nextIndex = Math.min(pastedOtp.length, 5);
      otpInputs.current[nextIndex]?.focus();
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Move to next input
    if (value && index < 5) {
      otpInputs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = () => {
    setError('');
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      setError('Please enter the 6-digit code');
      return;
    }
    setStep(3);
  };

  const handleResetPassword = async () => {
    setError('');
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      const token = otp.join('');
      await api.post(`/auth/reset-password?email=${encodeURIComponent(email)}`, {
        token,
        newPassword: password,
      });
      
      router.replace('/(auth)/login');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingWrapper className="flex-1 bg-white">
      <View className="flex-1 px-6 pt-12 pb-6">
        <TouchableOpacity onPress={() => step > 1 ? setStep(step - 1) : router.back()} className="mb-6 h-10 w-10 justify-center">
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>

        {error ? (
          <View className="bg-red-50 p-4 rounded-xl mb-6 border border-red-100">
            <Text className="text-red-600 text-sm">{error}</Text>
          </View>
        ) : null}

        {step === 1 && (
          <Animated.View entering={FadeInRight} exiting={FadeOutLeft} className="flex-1">
            <Text className="text-3xl font-bold text-gray-900 mb-2">Reset Password</Text>
            <Text className="text-base text-gray-500 mb-8">
              Enter your email address and we'll send you a 6-digit code to reset your password.
            </Text>

            <Input
              label="Email"
              placeholder="Enter your email"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setError('');
              }}
              leftIcon="mail-outline"
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isLoading}
            />

            <Button
              title="Send Code"
              onPress={handleSendEmail}
              loading={isLoading}
              className="mt-4"
            />
          </Animated.View>
        )}

        {step === 2 && (
          <Animated.View entering={FadeInRight} exiting={FadeOutLeft} className="flex-1">
            <Text className="text-3xl font-bold text-gray-900 mb-2">Check your email</Text>
            <Text className="text-base text-gray-500 mb-8">
              We've sent a 6-digit code to <Text className="font-semibold text-gray-900">{email}</Text>
            </Text>

            <View className="flex-row justify-between mb-8">
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => { otpInputs.current[index] = ref; }}
                  value={digit}
                  onChangeText={(val) => handleOtpChange(val, index)}
                  onKeyPress={(e) => handleOtpKeyPress(e, index)}
                  keyboardType="number-pad"
                  maxLength={6} // To allow pasting
                  className={`w-12 h-14 border rounded-xl text-center text-2xl font-bold bg-white
                    ${digit ? 'border-blue-500 text-blue-600' : 'border-gray-300 text-gray-900'}`}
                />
              ))}
            </View>

            <Button
              title="Verify Code"
              onPress={handleVerifyOtp}
              disabled={otp.join('').length !== 6}
            />

            <View className="flex-row justify-center mt-6">
              <Text className="text-gray-500">Didn't receive the code? </Text>
              <TouchableOpacity onPress={handleSendEmail} disabled={countdown > 0 || isLoading}>
                <Text className={`font-semibold ${countdown > 0 ? 'text-gray-400' : 'text-blue-600'}`}>
                  {countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {step === 3 && (
          <Animated.View entering={FadeInRight} exiting={FadeOutLeft} className="flex-1">
            <Text className="text-3xl font-bold text-gray-900 mb-2">Create New Password</Text>
            <Text className="text-base text-gray-500 mb-8">
              Your new password must be different from previous used passwords.
            </Text>

            <Input
              label="New Password"
              placeholder="Enter new password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setError('');
              }}
              leftIcon="lock-closed-outline"
              secureTextEntry
              editable={!isLoading}
            />

            <Input
              label="Confirm Password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                setError('');
              }}
              leftIcon="lock-closed-outline"
              secureTextEntry
              editable={!isLoading}
            />

            <Button
              title="Reset Password"
              onPress={handleResetPassword}
              loading={isLoading}
              className="mt-4"
            />
          </Animated.View>
        )}
      </View>
    </KeyboardAvoidingWrapper>
  );
}
