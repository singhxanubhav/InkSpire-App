import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../components/ui/Button';
import { ActionModal } from '../../components/ui/ActionModal';
import { Toast } from '../../components/ui/Toast';

const GENRES = [
  { id: 'FANTASY', label: 'Fantasy' },
  { id: 'SCI_FI', label: 'Science Fiction' },
  { id: 'ROMANCE', label: 'Romance' },
  { id: 'MYSTERY', label: 'Mystery' },
  { id: 'THRILLER', label: 'Thriller' },
  { id: 'HORROR', label: 'Horror' },
  { id: 'LITERARY_FICTION', label: 'Literary Fiction' },
  { id: 'HISTORICAL_FICTION', label: 'Historical Fiction' },
  { id: 'NON_FICTION', label: 'Non-Fiction' },
  { id: 'POETRY', label: 'Poetry' },
  { id: 'OTHER', label: 'Other' },
];

export default function Step1GenresScreen() {
  const router = useRouter();
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' as 'success'|'error'|'info' });

  const toggleGenre = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (selectedGenres.includes(id)) {
      setSelectedGenres(selectedGenres.filter((g) => g !== id));
    } else {
      if (selectedGenres.length < 5) {
        setSelectedGenres([...selectedGenres, id]);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        setToast({ visible: true, message: 'You can select up to 5 genres.', type: 'info' });
      }
    }
  };

  const handleBack = () => {
    if (selectedGenres.length > 0) {
      setShowDiscardConfirm(true);
    } else {
      router.back();
    }
  };

  const handleSkip = () => {
    router.push({
      pathname: '/onboarding/step2-goals',
      params: { genres: JSON.stringify([]) }
    });
  };

  const handleContinue = () => {
    router.push({
      pathname: '/onboarding/step2-goals',
      params: { genres: JSON.stringify(selectedGenres) }
    });
  };

  return (
    <View className="flex-1 bg-white pt-12">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 mb-4">
        <TouchableOpacity onPress={handleBack} className="p-2">
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text className="text-sm font-medium text-gray-500">Step 1 of 3</Text>
        <TouchableOpacity onPress={handleSkip} className="p-2">
          <Text className="text-blue-600 font-medium">Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Progress Bar */}
      <View className="h-1 bg-gray-200 w-full mb-6">
        <View className="h-full bg-blue-600 w-1/3" />
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        <Text className="text-3xl font-bold text-gray-900 mb-2">What do you write?</Text>
        <Text className="text-base text-gray-500 mb-8">
          Select up to 5 genres to help us personalize your experience.
        </Text>

        <View className="flex-row flex-wrap justify-start -mx-1">
          {GENRES.map((genre) => {
            const isSelected = selectedGenres.includes(genre.id);
            return (
              <TouchableOpacity
                key={genre.id}
                onPress={() => toggleGenre(genre.id)}
                className={`m-1 px-4 py-3 rounded-full border ${
                  isSelected ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    isSelected ? 'text-white' : 'text-gray-700'
                  }`}
                >
                  {genre.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View className="p-6 border-t border-gray-100 pb-10">
        <Button
          title="Continue"
          onPress={handleContinue}
          disabled={selectedGenres.length === 0}
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

      <Toast 
        visible={toast.visible} 
        message={toast.message} 
        type={toast.type} 
        onHide={() => setToast(prev => ({ ...prev, visible: false }))} 
      />
    </View>
  );
}
