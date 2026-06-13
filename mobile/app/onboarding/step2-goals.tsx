import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../components/ui/Button';
import { KeyboardAvoidingWrapper } from '../../components/ui/KeyboardAvoidingWrapper';
import { ActionModal } from '../../components/ui/ActionModal';

const EXPERIENCE_LEVELS = [
  { id: 'BEGINNER', title: 'Beginner', desc: 'Just starting my writing journey' },
  { id: 'INTERMEDIATE', title: 'Intermediate', desc: 'Have written some pieces, looking to improve' },
  { id: 'ADVANCED', title: 'Advanced', desc: 'Experienced writer, focused on publishing/mastery' },
];

const WRITING_GOALS = [
  { id: 'FINISH_NOVEL', label: 'Finish my novel' },
  { id: 'IMPROVE_CRAFT', label: 'Improve craft' },
  { id: 'BUILD_HABIT', label: 'Build a habit' },
  { id: 'GET_FEEDBACK', label: 'Get feedback' },
  { id: 'PUBLISH', label: 'Get published' },
];

export default function Step2GoalsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const genres = params.genres ? JSON.parse(params.genres as string) : [];

  const [experienceLevel, setExperienceLevel] = useState<string>('');
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [bio, setBio] = useState('');
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  const toggleGoal = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (selectedGoals.includes(id)) {
      setSelectedGoals(selectedGoals.filter((g) => g !== id));
    } else {
      setSelectedGoals([...selectedGoals, id]);
    }
  };

  const selectExperience = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExperienceLevel(id);
  };

  const handleBack = () => {
    if (experienceLevel || selectedGoals.length > 0 || bio.length > 0) {
      setShowDiscardConfirm(true);
    } else {
      router.back();
    }
  };

  const handleSkip = () => {
    router.push({
      pathname: '/onboarding/step3-availability',
      params: { 
        genres: JSON.stringify(genres),
        experienceLevel: '',
        writingGoals: JSON.stringify([]),
        bio: ''
      }
    });
  };

  const handleContinue = () => {
    router.push({
      pathname: '/onboarding/step3-availability',
      params: { 
        genres: JSON.stringify(genres),
        experienceLevel,
        writingGoals: JSON.stringify(selectedGoals),
        bio
      }
    });
  };

  return (
    <View className="flex-1 bg-white pt-12">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 mb-4">
        <TouchableOpacity onPress={handleBack} className="p-2">
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text className="text-sm font-medium text-gray-500">Step 2 of 3</Text>
        <TouchableOpacity onPress={handleSkip} className="p-2">
          <Text className="text-blue-600 font-medium">Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Progress Bar */}
      <View className="h-1 bg-gray-200 w-full mb-6">
        <View className="h-full bg-blue-600 w-2/3" />
      </View>

      <KeyboardAvoidingWrapper className="flex-1 px-6">
        <Text className="text-3xl font-bold text-gray-900 mb-2">Tell us about yourself</Text>
        <Text className="text-base text-gray-500 mb-8">
          This helps us connect you with the right peers.
        </Text>

        {/* Experience Level */}
        <Text className="text-lg font-bold text-gray-900 mb-3">Experience Level</Text>
        <View className="space-y-3 mb-8">
          {EXPERIENCE_LEVELS.map((level) => (
            <TouchableOpacity
              key={level.id}
              onPress={() => selectExperience(level.id)}
              className={`p-4 rounded-xl border ${
                experienceLevel === level.id ? 'bg-blue-50 border-blue-500' : 'bg-white border-gray-200'
              }`}
            >
              <View className="flex-row items-center">
                <View className={`w-5 h-5 rounded-full border-2 items-center justify-center mr-3 ${
                  experienceLevel === level.id ? 'border-blue-500' : 'border-gray-300'
                }`}>
                  {experienceLevel === level.id && <View className="w-2.5 h-2.5 bg-blue-500 rounded-full" />}
                </View>
                <View className="flex-1">
                  <Text className={`font-semibold ${experienceLevel === level.id ? 'text-blue-900' : 'text-gray-900'}`}>{level.title}</Text>
                  <Text className="text-sm text-gray-500">{level.desc}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Writing Goals */}
        <Text className="text-lg font-bold text-gray-900 mb-3">Writing Goals</Text>
        <View className="flex-row flex-wrap justify-start -mx-1 mb-8">
          {WRITING_GOALS.map((goal) => {
            const isSelected = selectedGoals.includes(goal.id);
            return (
              <TouchableOpacity
                key={goal.id}
                onPress={() => toggleGoal(goal.id)}
                className={`m-1 px-4 py-2 rounded-full border ${
                  isSelected ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    isSelected ? 'text-white' : 'text-gray-700'
                  }`}
                >
                  {goal.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Bio */}
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-lg font-bold text-gray-900">Bio <Text className="text-sm font-normal text-gray-500">(Optional)</Text></Text>
          <Text className="text-sm text-gray-500">{bio.length}/300</Text>
        </View>
        <View className="border border-gray-300 rounded-xl bg-white p-3 mb-10 h-32">
          <TextInput
            multiline
            maxLength={300}
            className="flex-1 text-base text-gray-900"
            placeholder="A short intro about you and your writing..."
            placeholderTextColor="#9ca3af"
            value={bio}
            onChangeText={setBio}
            textAlignVertical="top"
          />
        </View>
      </KeyboardAvoidingWrapper>

      <View className="p-6 border-t border-gray-100 pb-10">
        <Button
          title="Continue"
          onPress={handleContinue}
          disabled={!experienceLevel} // Require at least experience level
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
