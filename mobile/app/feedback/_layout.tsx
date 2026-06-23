import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { BackButton } from '../../components/ui/BackButton';

export default function FeedbackLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#fff',
        },
        headerTintColor: '#334155',
        headerTitleStyle: {
          fontWeight: '600',
        },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: '#f8fafc' }, // slate-50
        headerLeft: ({ canGoBack }) => canGoBack ? (
          <BackButton style={{ marginLeft: Platform.OS === 'ios' ? -15 : 0, marginRight: 10 }} />
        ) : undefined,
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'Peer Feedback',
          headerLargeTitle: true,
        }} 
      />
      <Stack.Screen 
        name="submit" 
        options={{ 
          title: 'Request Feedback',
          presentation: 'modal'
        }} 
      />
      <Stack.Screen 
        name="[id]/index" 
        options={{ 
          title: 'Feedback Details'
        }} 
      />
      <Stack.Screen 
        name="[id]/give-feedback" 
        options={{ 
          title: 'Give Feedback',
          presentation: 'modal'
        }} 
      />
    </Stack>
  );
}
