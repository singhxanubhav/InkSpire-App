import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, PanResponder, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../components/ui/Button';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { ActionModal } from '../../components/ui/ActionModal';

const AVAILABILITY = [
  { id: 'DAILY', label: 'Daily' },
  { id: 'FEW_TIMES_WEEK', label: 'A few times/week' },
  { id: 'WEEKLY', label: 'Weekly' },
  { id: 'FLEXIBLE', label: 'Flexible' },
];

export default function Step3AvailabilityScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const updateUser = useAuthStore((state) => state.updateUser);
  
  const [availability, setAvailability] = useState<string>('FLEXIBLE');
  const [wordCount, setWordCount] = useState(500);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  const handleBack = () => {
    setShowDiscardConfirm(true);
  };

  const handleFinish = async () => {
    setApiError('');
    setIsLoading(true);

    const payload = {
      genres: params.genres ? JSON.parse(params.genres as string) : [],
      experienceLevel: (params.experienceLevel as string) || undefined,
      writingGoals: params.writingGoals ? JSON.parse(params.writingGoals as string) : [],
      bio: (params.bio as string) || undefined,
      availability,
      dailyWordCount: wordCount,
    };

    try {
      await api.patch('/users/me', payload);
      
      // Update local store
      updateUser(payload);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)/home');
    } catch (error: any) {
      if (error.response?.data?.message) {
        setApiError(error.response.data.message);
      } else {
        setApiError('Failed to save your preferences. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const selectAvailability = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAvailability(id);
  };

  // Simple custom slider logic using layout width
  const [sliderWidth, setSliderWidth] = useState(0);
  const sliderWidthRef = useRef(0);
  const wordCountRef = useRef(wordCount);
  const initialDragValueRef = useRef(500);

  wordCountRef.current = wordCount;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        initialDragValueRef.current = wordCountRef.current;
        
        if (sliderWidthRef.current > 0 && evt.nativeEvent.locationX) {
           const rawPercentage = Math.max(0, Math.min(1, evt.nativeEvent.locationX / sliderWidthRef.current));
           const value = 100 + rawPercentage * (4900); // 5000 - 100
           const snappedValue = Math.round(value / 50) * 50;
           setWordCount(snappedValue);
           initialDragValueRef.current = snappedValue;
        }
      },
      onPanResponderMove: (evt, gestureState) => {
        if (sliderWidthRef.current > 0) {
          const percentageChange = gestureState.dx / sliderWidthRef.current;
          const valueChange = percentageChange * (4900);
          const newValue = initialDragValueRef.current + valueChange;
          const clampedValue = Math.max(100, Math.min(5000, newValue));
          const snappedValue = Math.round(clampedValue / 50) * 50;
          setWordCount(snappedValue);
        }
      },
      onPanResponderRelease: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      },
    })
  ).current;

  const getPercentage = () => {
    return ((wordCount - 100) / (4900)) * 100;
  };

  return (
    <View className="flex-1 bg-white pt-12">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 mb-4">
        <TouchableOpacity onPress={handleBack} className="p-2">
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text className="text-sm font-medium text-gray-500">Step 3 of 3</Text>
        <View className="p-2 w-10" /> {/* Spacer */}
      </View>

      {/* Progress Bar */}
      <View className="h-1 bg-gray-200 w-full mb-6">
        <View className="h-full bg-blue-600 w-full" />
      </View>

      <View className="flex-1 px-6">
        <Text className="text-3xl font-bold text-gray-900 mb-2">Writing Routine</Text>
        <Text className="text-base text-gray-500 mb-8">
          Set your writing goals and availability.
        </Text>

        {apiError ? (
          <View className="bg-red-50 p-4 rounded-xl mb-6 border border-red-100">
            <Text className="text-red-600 text-sm">{apiError}</Text>
          </View>
        ) : null}

        {/* Availability */}
        <Text className="text-lg font-bold text-gray-900 mb-3">Availability</Text>
        <View className="flex-row flex-wrap justify-between mb-8">
          {AVAILABILITY.map((item) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => selectAvailability(item.id)}
              className={`w-[48%] py-4 px-2 rounded-xl border items-center mb-3 ${
                availability === item.id ? 'bg-blue-50 border-blue-500' : 'bg-white border-gray-200'
              }`}
            >
              <Text className={`font-semibold text-center ${availability === item.id ? 'text-blue-900' : 'text-gray-700'}`}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Daily Word Count */}
        <View className="flex-row justify-between items-center mb-6">
          <Text className="text-lg font-bold text-gray-900">Daily Word Count Goal</Text>
          <Text className="text-xl font-bold text-blue-600">{wordCount}</Text>
        </View>

        <View 
          className="h-10 justify-center mb-10" 
          onLayout={(e) => {
            const w = e.nativeEvent.layout.width;
            setSliderWidth(w);
            sliderWidthRef.current = w;
          }}
          {...panResponder.panHandlers}
        >
          <View className="h-2 bg-gray-200 rounded-full w-full absolute" />
          <View className="h-2 bg-blue-600 rounded-full absolute" style={{ width: `${getPercentage()}%` }} />
          <View 
            className="w-6 h-6 bg-white border-4 border-blue-600 rounded-full shadow absolute" 
            style={{ left: `${getPercentage()}%`, marginLeft: -12 }} 
          />
        </View>

      </View>

      <View className="p-6 border-t border-gray-100 pb-10">
        <Button
          title="Finish Setup"
          onPress={handleFinish}
          loading={isLoading}
        />
      </View>

      <ActionModal
        visible={showDiscardConfirm}
        title="You have unsaved changes. Are you sure you want to go back?"
        onClose={() => setShowDiscardConfirm(false)}
        options={[
          { label: 'Discard Changes', icon: 'trash-outline', destructive: true, onPress: () => router.back() }
        ]}
      />
    </View>
  );
}
