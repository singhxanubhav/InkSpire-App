import React, { useState, useEffect } from 'react';
import 'react-native-reanimated';
import 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { LogBox, View, StyleSheet } from 'react-native';
import { ErrorBoundary } from '../components/ui/ErrorBoundary';
import { NetworkBanner } from '../components/ui/NetworkBanner';
import { AnimatedSplashScreen } from '../components/ui/AnimatedSplashScreen';
import { useAuthStore, initAuth } from '../store/authStore';
import '../global.css';

const queryClient = new QueryClient();

// Suppress the Expo Go push notification warning/error since we gracefully handle it
LogBox.ignoreLogs([
  'expo-notifications: Android Push notifications',
  '`expo-notifications` functionality is not fully supported in Expo Go'
]);

export default function RootLayout() {
  const [splashAnimationFinished, setSplashAnimationFinished] = useState(false);
  const { isAuthenticated, isLoading } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  // Initialize auth on app mount
  useEffect(() => {
    initAuth();
  }, []);

  // Handle global auth routing
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const isIndex = segments.length === 0 || (segments.length === 1 && segments[0] === '');

    if (!isAuthenticated && !inAuthGroup && !isIndex) {
      // Redirect to login if trying to access protected routes while logged out
      router.replace('/(auth)/login');
    } else if (isAuthenticated && (inAuthGroup || isIndex)) {
      // Redirect to home if logged in and trying to access auth screens or index
      router.replace('/(tabs)/home');
    }
  }, [isAuthenticated, isLoading, segments]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <BottomSheetModalProvider>
          <ErrorBoundary>
            <View style={StyleSheet.absoluteFill}>
              <NetworkBanner />
              <StatusBar style="auto" />
              <Stack screenOptions={{ 
                headerShown: false,
                animation: 'slide_from_right',
                gestureEnabled: true,
                fullScreenGestureEnabled: true,
              }}>
                <Stack.Screen name="index" options={{ title: 'InkSpire', animation: 'fade' }} />
                <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
                <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
              </Stack>
              
              {!splashAnimationFinished && (
                <AnimatedSplashScreen 
                  onAnimationComplete={() => setSplashAnimationFinished(true)} 
                />
              )}
            </View>
          </ErrorBoundary>
        </BottomSheetModalProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
