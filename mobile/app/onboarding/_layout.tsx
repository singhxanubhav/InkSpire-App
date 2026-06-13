import React from 'react';
import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  // Let's use standard Expo Router Stack and configure the header
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="step1-genres" />
      <Stack.Screen name="step2-goals" />
      <Stack.Screen name="step3-availability" />
    </Stack>
  );
}
