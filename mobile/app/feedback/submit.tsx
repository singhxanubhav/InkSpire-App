import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, Keyboard } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import * as Haptics from 'expo-haptics';
import { Toast } from '../../components/ui/Toast';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const GENRES = ['FANTASY', 'SCI_FI', 'ROMANCE', 'MYSTERY', 'THRILLER', 'HORROR', 'LITERARY_FICTION', 'HISTORICAL_FICTION', 'NON_FICTION', 'POETRY', 'OTHER'];
const FOCUS_AREAS = ['CLARITY', 'PACING', 'DIALOGUE', 'STRUCTURE', 'VOICE', 'CHARACTER'];

export default function SubmitRequestScreen() {
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [focusAreas, setFocusAreas] = useState<string[]>([]);
  const [context, setContext] = useState('');
  const [toast, setToast] = useState({ visible: false, message: '', type: 'error' as 'success'|'error'|'info' });
  
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();

  const wordCount = excerpt.trim() ? excerpt.trim().split(/\s+/).length : 0;

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/feedback', data);
      return res.data;
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ['feedbackRequests'] });
      router.replace('/feedback');
    },
    onError: (err: any) => {
      setToast({ visible: true, message: err.response?.data?.message || err.message || 'Failed to submit request', type: 'error' });
    }
  });

  const toggleFocus = (focus: string) => {
    setFocusAreas(prev => 
      prev.includes(focus) ? prev.filter(f => f !== focus) : [...prev, focus]
    );
  };

  const handleSubmit = () => {
    Keyboard.dismiss();
    mutation.mutate({ title, genre, excerpt, focusAreas, context });
  };

  return (
    <>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
      >
        {/* Scrollable form content */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.input}
            placeholder="What is this piece called?"
            placeholderTextColor="#94a3b8"
            value={title}
            onChangeText={setTitle}
            returnKeyType="next"
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
            <Text style={[styles.wordCount, wordCount > 1000 && styles.wordCountError]}>
              {wordCount} / 1000 words
            </Text>
          </View>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Paste your text here..."
            placeholderTextColor="#94a3b8"
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
            placeholderTextColor="#94a3b8"
            multiline
            value={context}
            onChangeText={setContext}
            textAlignVertical="top"
            returnKeyType="done"
            onSubmitEditing={Keyboard.dismiss}
          />

          {/* Bottom padding so last field isn't hidden on short screens */}
          <View style={{ height: 16 }} />
        </ScrollView>

        {/* Sticky Submit Button — always above keyboard */}
        <View style={[styles.stickyFooter, { paddingBottom: insets.bottom + 12 }]}>
          <TouchableOpacity
            style={[styles.submitBtn, mutation.isPending && styles.submitBtnDisabled]}
            disabled={mutation.isPending}
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
        </View>
      </KeyboardAvoidingView>

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast(prev => ({ ...prev, visible: false }))}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 8,
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
  stickyFooter: {
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  submitBtn: {
    backgroundColor: '#8b5cf6',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
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
