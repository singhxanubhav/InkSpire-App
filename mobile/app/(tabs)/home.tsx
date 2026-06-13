import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { api } from '../../services/api';
import { useState, useEffect } from 'react';
export default function HomeScreen() {
  const user = useAuthStore((state) => state.user);
  const router = useRouter();
  const [pendingRequests, setPendingRequests] = useState(0);
  const [activeMatches, setActiveMatches] = useState<any[]>([]);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const [reqs, matchesRes] = await Promise.all([
          api.get('/matches/requests'),
          api.get('/matches')
        ]);
        if (reqs.data?.incoming) {
          setPendingRequests(reqs.data.incoming.length);
        }
        if (matchesRes.data) {
          setActiveMatches(matchesRes.data);
        }
      } catch (e) {
        // silently fail
      }
    };
    fetchMatches();
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      {/* Header */}
      <View className="px-6 py-4 flex-row justify-between items-center bg-white border-b border-gray-100">
        <View>
          <Text className="text-2xl font-extrabold text-gray-900">InkSpire</Text>
          <Text className="text-sm text-gray-500 font-medium">Hello, {user?.displayName || 'Writer'}</Text>
        </View>
        <TouchableOpacity className="w-10 h-10 bg-blue-50 rounded-full items-center justify-center">
          <Ionicons name="notifications-outline" size={20} color="#2563eb" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
        {/* Match Requests Alert */}
        {pendingRequests > 0 && (
          <TouchableOpacity 
            className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 mb-6 flex-row items-center justify-between"
            onPress={() => router.push('/match/requests')}
          >
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 bg-indigo-100 rounded-full items-center justify-center">
                <Ionicons name="people" size={20} color="#4f46e5" />
              </View>
              <View>
                <Text className="text-indigo-900 font-bold">Match Requests</Text>
                <Text className="text-indigo-700 text-sm">You have {pendingRequests} pending request{pendingRequests > 1 ? 's' : ''}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#4f46e5" />
          </TouchableOpacity>
        )}

        {/* Active Matches */}
        {activeMatches.length > 0 && (
          <View className="mb-6">
            <Text className="text-lg font-bold text-gray-900 mb-4">Your Co-Writers</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {activeMatches.map((match) => (
                <TouchableOpacity 
                  key={match.matchId}
                  className="bg-white border border-gray-200 rounded-2xl p-4 mr-4 items-center w-32 shadow-sm"
                  onPress={() => router.push(`/match/${match.matchId}`)}
                >
                  <View className="w-16 h-16 bg-indigo-100 rounded-full mb-3 items-center justify-center">
                    <Text className="text-xl font-bold text-indigo-700">
                      {match.partner?.displayName?.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <Text className="font-bold text-gray-900 text-center" numberOfLines={1}>
                    {match.partner?.displayName}
                  </Text>
                  <Text className="text-xs text-indigo-600 mt-1">Workspace</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Daily Goal Card */}
        <View className="bg-white rounded-2xl p-5 mb-6 border border-gray-100 shadow-sm">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-lg font-bold text-gray-900">Daily Goal</Text>
            <View className="bg-blue-100 px-3 py-1 rounded-full">
              <Text className="text-blue-700 font-semibold text-xs">0 / {user?.dailyWordCount || 500} words</Text>
            </View>
          </View>
          <View className="h-2 bg-gray-100 rounded-full w-full mb-4">
            <View className="h-full bg-blue-500 rounded-full w-2" />
          </View>
          <TouchableOpacity className="bg-blue-600 py-3 rounded-xl items-center">
            <Text className="text-white font-bold">Start Writing</Text>
          </TouchableOpacity>
        </View>

        {/* Your Genres */}
        <Text className="text-lg font-bold text-gray-900 mb-4">Your Genres</Text>
        <View className="flex-row flex-wrap gap-2 mb-8">
          {user?.genres?.map((genre) => (
            <View key={genre} className="bg-indigo-50 px-4 py-2 rounded-lg border border-indigo-100">
              <Text className="text-indigo-700 font-medium capitalize">
                {genre.replace('_', ' ').toLowerCase()}
              </Text>
            </View>
          ))}
          {(!user?.genres || user.genres.length === 0) && (
            <Text className="text-gray-500 italic">No genres selected yet.</Text>
          )}
        </View>
        
        {/* Placeholder Feed */}
        <Text className="text-lg font-bold text-gray-900 mb-4">Community Feed</Text>
        {[1, 2, 3].map((i) => (
          <View key={i} className="bg-white p-5 rounded-2xl mb-4 border border-gray-100 shadow-sm">
            <View className="flex-row items-center mb-3">
              <View className="w-10 h-10 bg-gray-200 rounded-full mr-3 items-center justify-center">
                <Ionicons name="person" size={20} color="#9ca3af" />
              </View>
              <View>
                <Text className="font-bold text-gray-900">Fellow Writer</Text>
                <Text className="text-xs text-gray-500">2 hours ago</Text>
              </View>
            </View>
            <Text className="text-gray-700 leading-relaxed mb-4">
              Just hit my daily word count goal! The secret is to just start typing, even if it feels like nonsense at first. Editing comes later! ✨
            </Text>
            <View className="flex-row gap-6">
              <View className="flex-row items-center gap-1">
                <Ionicons name="heart-outline" size={20} color="#6b7280" />
                <Text className="text-gray-500 text-sm">24</Text>
              </View>
              <View className="flex-row items-center gap-1">
                <Ionicons name="chatbubble-outline" size={20} color="#6b7280" />
                <Text className="text-gray-500 text-sm">5</Text>
              </View>
            </View>
          </View>
        ))}
        
        <View className="h-10" />
      </ScrollView>
    </SafeAreaView>
  );
}
