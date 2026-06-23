import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import * as Haptics from 'expo-haptics';

const GENRES = ['FANTASY', 'SCI_FI', 'ROMANCE', 'MYSTERY', 'THRILLER', 'HORROR', 'LITERARY_FICTION', 'HISTORICAL_FICTION', 'NON_FICTION', 'POETRY', 'OTHER'];
const FOCUS_AREAS = ['CLARITY', 'PACING', 'DIALOGUE', 'STRUCTURE', 'VOICE', 'CHARACTER'];
const MAX_WORDS = 1000;

export default function SubmitRequestScreen() {
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [focusAreas, setFocusAreas] = useState<string[]>([]);
  const [context, setContext] = useState('');
  
  const queryClient = useQueryClient();

  const wordCount = excerpt.trim() ? excerpt.trim().split(/\s+/).length : 0;
  const isFormValid = true;

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/feedback', data);
      return res.data;
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ['feedbackRequests'] });
      router.replace('/feedback'); // Go back to browse, ideally toast here
    },
    onError: (err: any) => {
      Alert.alert('Error', err.response?.data?.message || err.message || 'Failed to submit request');
    }
  });

  const toggleFocus = (focus: string) => {
    setFocusAreas(prev => 
      prev.includes(focus) ? prev.filter(f => f !== focus) : [...prev, focus]
    );
  };

  const handleSubmit = () => {
    // if (!isFormValid) return;
    mutation.mutate({
      title,
      genre,
      excerpt,
      focusAreas,
      context
    });
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <Text style={styles.label}>Title</Text>
        <TextInput
          style={styles.input}
          placeholder="What is this piece called?"
          value={title}
          onChangeText={setTitle}
        />

        <Text style={styles.label}>Genre</Text>
        <View style={styles.chipContainer}>
          {GENRES.map(g => (
            <TouchableOpacity 
              key={g} 
              style={[styles.chip, genre === g && styles.chipActive]}
              onPress={() => setGenre(g)}
            >
              <Text style={[styles.chipText, genre === g && styles.chipTextActive]}>
                {g.replace(/_/g, ' ')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.labelRow}>
          <Text style={styles.label}>Excerpt</Text>
        </View>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Paste your text here..."
          multiline
          value={excerpt}
          onChangeText={setExcerpt}
          textAlignVertical="top"
        />

        <Text style={styles.label}>What should reviewers focus on? (Select at least 1)</Text>
        <View style={styles.chipContainer}>
          {FOCUS_AREAS.map(f => (
            <TouchableOpacity 
              key={f} 
              style={[styles.chip, focusAreas.includes(f) && styles.chipActive]}
              onPress={() => toggleFocus(f)}
            >
              <Text style={[styles.chipText, focusAreas.includes(f) && styles.chipTextActive]}>
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Additional Context (Optional)</Text>
        <TextInput
          style={[styles.input, { height: 80 }]}
          placeholder="Any specific questions? E.g., 'Does the ending feel rushed?'"
          multiline
          value={context}
          onChangeText={setContext}
          textAlignVertical="top"
        />

        <TouchableOpacity 
          style={[styles.submitBtn, !isFormValid && styles.submitBtnDisabled]}
          disabled={!isFormValid || mutation.isPending}
          onPress={handleSubmit}
        >
          {mutation.isPending ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <ActivityIndicator color="#fff" />
              <Text style={styles.submitBtnText}>Submitting...</Text>
            </View>
          ) : (
            <Text style={styles.submitBtnText}>Submit for Feedback</Text>
          )}
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: 16,
    marginBottom: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#334155',
    marginTop: 16,
    marginBottom: 8,
  },
  wordCount: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  wordCountError: {
    color: '#ef4444',
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1e293b',
  },
  inputError: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  textArea: {
    height: 200,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  chipActive: {
    backgroundColor: '#e0e7ff',
    borderColor: '#8b5cf6',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748b',
  },
  chipTextActive: {
    color: '#4f46e5',
    fontWeight: '600',
  },
  submitBtn: {
    backgroundColor: '#8b5cf6',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 32,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnDisabled: {
    backgroundColor: '#cbd5e1',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  }
});
