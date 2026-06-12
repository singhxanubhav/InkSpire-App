import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { Stack, useRouter, usePathname } from 'react-native-router-flux'; // Wait, it's expo-router
import { Stack as ExpoStack } from 'expo-router'; // Correct import
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

export default function OnboardingLayout() {
  // Let's use standard Expo Router Stack and configure the header
  return (
    <ExpoStack screenOptions={{ headerShown: false }}>
      <ExpoStack.Screen name="step1-genres" />
      <ExpoStack.Screen name="step2-goals" />
      <ExpoStack.Screen name="step3-availability" />
    </ExpoStack>
  );
}
