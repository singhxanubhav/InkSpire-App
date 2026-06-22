import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform } from 'react-native';
import { useNotifications } from '../../hooks/useNotifications';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';

export default function TabsLayout() {
  const user = useAuthStore((state) => state.user);
  const insets = useSafeAreaInsets();
  
  useNotifications(); // Initialize push notifications

  const { data: unreadData } = useQuery({
    queryKey: ['unreadCount'],
    queryFn: async () => {
      const res = await api.get('/notifications/unread-count');
      return res.data?.data?.count || 0;
    },
    refetchInterval: 30000, // Poll every 30s as fallback
  });

  const unreadCount = unreadData || 0;

  const bottomPadding = Platform.OS === 'android' ? Math.max(insets.bottom, 16) : Math.max(insets.bottom, 24);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#8b5cf6', // Premium Purple
        tabBarInactiveTintColor: '#94a3b8', // Slate 400
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#f1f5f9',
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          backgroundColor: '#ffffff',
          paddingTop: 8,
          paddingBottom: bottomPadding,
          height: 56 + bottomPadding,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="prompts"
        options={{
          title: 'Prompts',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'bulb' : 'bulb-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progress',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'stats-chart' : 'stats-chart-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
