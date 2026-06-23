import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Pressable, StyleSheet } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { api } from '../../services/api';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInRight, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

// Custom Animated Pressable for Micro-Interactions
const AnimatedPressable = ({ children, onPress, style, className }: any) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  return (
    <Pressable
      onPressIn={() => { scale.value = withSpring(0.95); }}
      onPressOut={() => { scale.value = withSpring(1); }}
      onPress={onPress}
      className={className}
    >
      <Animated.View style={[animatedStyle, style]}>
        {children}
      </Animated.View>
    </Pressable>
  );
};

export default function HomeScreen() {
  const user = useAuthStore((state) => state.user);
  const router = useRouter();
  const [pendingRequests, setPendingRequests] = useState(0);
  const [activeMatches, setActiveMatches] = useState<any[]>([]);

  const { data: unreadData } = useQuery({
    queryKey: ['unreadCount'],
    queryFn: async () => {
      const res = await api.get('/notifications/unread-count');
      return res.data?.data?.count || 0;
    },
    refetchInterval: 30000,
  });

  const unreadCount = unreadData || 0;

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const [reqs, matchesRes] = await Promise.all([
          api.get('/matches/requests'),
          api.get('/matches')
        ]);
        if (reqs.data?.incoming) setPendingRequests(reqs.data.incoming.length);
        if (matchesRes.data) setActiveMatches(matchesRes.data);
      } catch (e) {
        // silently fail
      }
    };
    fetchMatches();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      {/* Header */}
      <Animated.View entering={FadeInDown.duration(600).delay(100)} className="px-6 py-5 flex-row justify-between items-center bg-transparent">
        <View>
          <Text className="text-sm font-bold text-indigo-500 uppercase tracking-widest mb-1">{getGreeting()}</Text>
          <Text className="text-3xl font-extrabold text-slate-900 tracking-tight">{user?.displayName || 'Writer'}</Text>
        </View>
        <AnimatedPressable 
          onPress={() => router.push('/notifications')}
        >
          <View className="w-12 h-12 bg-white rounded-full items-center justify-center shadow-sm border border-slate-100">
            <Ionicons name="notifications-outline" size={24} color="#334155" />
            {unreadCount > 0 && (
              <View className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
            )}
          </View>
        </AnimatedPressable>
      </Animated.View>

      <ScrollView className="flex-1 px-6 pt-2" showsVerticalScrollIndicator={false}>
        {/* Match Requests Alert */}
        {pendingRequests > 0 && (
          <AnimatedPressable onPress={() => router.push('/match/requests')}>
            <Animated.View entering={FadeInDown.duration(600).delay(200)}>
              <LinearGradient
                colors={['#4f46e5', '#8b5cf6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.alertCard}
                className="rounded-3xl p-5 mb-8 flex-row items-center justify-between"
              >
                <View className="flex-row items-center gap-4">
                  <View className="w-12 h-12 bg-white/20 rounded-2xl items-center justify-center">
                    <Ionicons name="people" size={24} color="#fff" />
                  </View>
                  <View>
                    <Text className="text-white font-extrabold text-lg">Match Requests</Text>
                    <Text className="text-indigo-100 font-medium">You have {pendingRequests} pending request{pendingRequests > 1 ? 's' : ''}</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#fff" />
              </LinearGradient>
            </Animated.View>
          </AnimatedPressable>
        )}

        {/* Daily Goal Card Premium */}
        <Animated.View entering={FadeInDown.duration(600).delay(pendingRequests > 0 ? 300 : 200)}>
          <View className="bg-white rounded-[32px] p-6 mb-8 border border-slate-100 shadow-sm relative overflow-hidden">
            <LinearGradient
              colors={['rgba(59, 130, 246, 0.05)', 'rgba(139, 92, 246, 0.05)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />
            
            <View className="flex-row justify-between items-end mb-6 relative z-10">
              <View>
                <Text className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Daily Progress</Text>
                <Text className="text-4xl font-black text-slate-900 tracking-tighter">0 <Text className="text-xl text-slate-300 font-bold">/ {user?.dailyWordCount || 500}</Text></Text>
              </View>
              <View className="w-14 h-14 bg-white rounded-full items-center justify-center shadow-sm border border-slate-100">
                <Ionicons name="pencil" size={24} color="#6366f1" />
              </View>
            </View>

            <View className="h-4 bg-slate-100 rounded-full w-full overflow-hidden">
              <LinearGradient
                colors={['#3b82f6', '#8b5cf6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ width: '5%', height: '100%', borderRadius: 999 }}
              />
            </View>
          </View>
        </Animated.View>

        {/* Quick Actions Grid */}
        <Animated.View entering={FadeInDown.duration(600).delay(400)}>
          <Text className="text-xl font-extrabold text-slate-900 mb-5 tracking-tight">Quick Actions</Text>
          <View className="flex-row justify-between mb-8 gap-4">
            <AnimatedPressable onPress={() => router.push('/discover')} className="flex-1">
              <View className="bg-white border border-slate-100 rounded-[24px] p-5 shadow-sm items-center">
                <LinearGradient
                  colors={['#eff6ff', '#dbeafe']}
                  className="w-14 h-14 rounded-full items-center justify-center mb-4"
                >
                  <Ionicons name="search" size={24} color="#3b82f6" />
                </LinearGradient>
                <Text className="font-bold text-slate-900 text-center text-sm">Find Writers</Text>
              </View>
            </AnimatedPressable>

            <AnimatedPressable onPress={() => router.push('/events')} className="flex-1">
              <View className="bg-white border border-slate-100 rounded-[24px] p-5 shadow-sm items-center">
                <LinearGradient
                  colors={['#faf5ff', '#f3e8ff']}
                  className="w-14 h-14 rounded-full items-center justify-center mb-4"
                >
                  <Ionicons name="flash" size={24} color="#8b5cf6" />
                </LinearGradient>
                <Text className="font-bold text-slate-900 text-center text-sm">Live Sprints</Text>
              </View>
            </AnimatedPressable>

            <AnimatedPressable onPress={() => router.push('/feedback')} className="flex-1">
              <View className="bg-white border border-slate-100 rounded-[24px] p-5 shadow-sm items-center">
                <LinearGradient
                  colors={['#ecfdf5', '#d1fae5']}
                  className="w-14 h-14 rounded-full items-center justify-center mb-4"
                >
                  <Ionicons name="chatbubbles" size={24} color="#10b981" />
                </LinearGradient>
                <Text className="font-bold text-slate-900 text-center text-sm">Feedback</Text>
              </View>
            </AnimatedPressable>
          </View>
        </Animated.View>

        {/* Active Workspaces / Matches */}
        <Animated.View entering={FadeInDown.duration(600).delay(500)} className="mb-12">
          <View className="flex-row justify-between items-center mb-5">
            <Text className="text-xl font-extrabold text-slate-900 tracking-tight">Your Workspaces</Text>
            {activeMatches.length > 0 && (
              <View className="bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                <Text className="text-xs font-bold text-indigo-600 tracking-wide">{activeMatches.length} Active</Text>
              </View>
            )}
          </View>

          {activeMatches.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {activeMatches.map((match, index) => (
                <Animated.View key={match.matchId} entering={FadeInRight.duration(500).delay(600 + (index * 100))}>
                  <AnimatedPressable onPress={() => router.push(`/match/${match.matchId}`)}>
                    <View className="bg-white border border-slate-100 rounded-[28px] p-5 mr-4 items-center w-36 shadow-sm">
                      <LinearGradient 
                        colors={['#6366f1', '#a855f7']} 
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        className="w-16 h-16 rounded-full mb-4 items-center justify-center shadow-md border-2 border-white"
                      >
                        <Text className="text-2xl font-black text-white">
                          {match.partner?.displayName?.charAt(0).toUpperCase()}
                        </Text>
                      </LinearGradient>
                      <Text className="font-bold text-slate-900 text-center mb-1 text-base" numberOfLines={1}>
                        {match.partner?.displayName}
                      </Text>
                      <Text className="text-xs font-medium text-slate-400">Workspace</Text>
                    </View>
                  </AnimatedPressable>
                </Animated.View>
              ))}
            </ScrollView>
          ) : (
            <View className="bg-white border border-slate-100 rounded-[32px] p-8 items-center justify-center shadow-sm">
              <View className="w-20 h-20 bg-slate-50 rounded-full items-center justify-center mb-4">
                <Ionicons name="folder-open-outline" size={32} color="#94a3b8" />
              </View>
              <Text className="text-slate-900 font-extrabold text-lg mb-2">No Active Workspaces</Text>
              <Text className="text-slate-500 text-sm text-center mb-6 px-4 leading-relaxed">Match with a co-writer to start collaborating and reviewing drafts.</Text>
              <AnimatedPressable onPress={() => router.push('/discover')}>
                <LinearGradient
                  colors={['#4f46e5', '#6366f1']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  className="px-8 py-3 rounded-full shadow-sm"
                >
                  <Text className="text-white font-bold tracking-wide">Find a Match</Text>
                </LinearGradient>
              </AnimatedPressable>
            </View>
          )}
        </Animated.View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  alertCard: {
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  }
});
