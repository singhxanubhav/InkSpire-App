import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../services/api';
import * as Haptics from 'expo-haptics';
import { RubricSlider } from '../../../components/features/feedback/RubricSlider';
import { ConfirmModal } from '../../../components/ui/ConfirmModal';
import { Toast } from '../../../components/ui/Toast';

export default function GiveFeedbackScreen() {
  const { id } = useLocalSearchParams();
  const queryClient = useQueryClient();

  const [overallImpression, setOverallImpression] = useState('');
  const [clarityScore, setClarityScore] = useState(3);
  const [pacingScore, setPacingScore] = useState(3);
  const [dialogueScore, setDialogueScore] = useState(3);
  const [structureScore, setStructureScore] = useState(3);
  const [detailedNotes, setDetailedNotes] = useState('');
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'error' as 'success'|'error'|'info' });

  const { data: request, isLoading } = useQuery({
    queryKey: ['feedbackRequest', id],
    queryFn: async () => {
      const res = await api.get(`/feedback/${id}`);
      return res.data.data;
    }
  });

  const overallWordCount = overallImpression.trim() ? overallImpression.trim().split(/\s+/).length : 0;
  const detailedWordCount = detailedNotes.trim() ? detailedNotes.trim().split(/\s+/).length : 0;

  const isFormValid = true;

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post(`/feedback/${id}/feedback`, data);
      return res.data;
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ['feedbackRequests'] });
      queryClient.invalidateQueries({ queryKey: ['feedbackRequest', id] });
      router.back();
    },
    onError: (err: any) => {
      setToast({ visible: true, message: err.response?.data?.message || err.message || 'Failed to submit feedback', type: 'error' });
    }
  });

  const handleSubmit = () => {
    setShowSubmitConfirm(true);
  };

  const confirmSubmit = () => {
    setShowSubmitConfirm(false);
    mutation.mutate({
      overallImpression,
      clarityScore,
      pacingScore,
      dialogueScore,
      structureScore,
      detailedNotes
    });
  };

  if (isLoading || !request) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#8b5cf6" />
      </View>
    );
  }

  return (
    <>
      <KeyboardAvoidingView 
        style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Original Excerpt Display */}
        <View style={styles.excerptCard}>
          <Text style={styles.excerptTitle}>{request.title}</Text>
          <Text style={styles.excerptText}>{request.excerpt}</Text>
          
          {request.context && (
            <View style={styles.contextBox}>
              <Text style={styles.contextTitle}>Author's Note:</Text>
              <Text style={styles.contextText}>{request.context}</Text>
            </View>
          )}

          <View style={styles.focusContainer}>
            <Text style={styles.focusLabel}>Requested Focus:</Text>
            <View style={styles.focusRow}>
              {request.focusAreas.map((focus: string) => (
                <View key={focus} style={styles.focusTag}>
                  <Text style={styles.focusTagText}>{focus}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Your Critique</Text>

        <View style={styles.labelRow}>
          <Text style={styles.label}>Overall Impression</Text>
        </View>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="What are your high-level thoughts on this piece?"
          multiline
          value={overallImpression}
          onChangeText={setOverallImpression}
          textAlignVertical="top"
        />

        <View style={styles.rubricContainer}>
          <Text style={styles.label}>Detailed Rubric</Text>
          <RubricSlider label="Clarity" value={clarityScore} onValueChange={setClarityScore} />
          <RubricSlider label="Pacing" value={pacingScore} onValueChange={setPacingScore} />
          <RubricSlider label="Dialogue" value={dialogueScore} onValueChange={setDialogueScore} />
          <RubricSlider label="Structure" value={structureScore} onValueChange={setStructureScore} />
        </View>

        <View style={styles.labelRow}>
          <Text style={styles.label}>Detailed Notes</Text>
        </View>
        <TextInput
          style={[styles.input, styles.textArea, { height: 200 }]}
          placeholder="Break down your feedback based on the rubric scores and requested focus areas..."
          multiline
          value={detailedNotes}
          onChangeText={setDetailedNotes}
          textAlignVertical="top"
        />

        <TouchableOpacity 
          style={[styles.submitBtn, !isFormValid && styles.submitBtnDisabled]}
          disabled={!isFormValid || mutation.isPending}
          onPress={handleSubmit}
        >
          {mutation.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>Submit Feedback</Text>
          )}
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>

    <ConfirmModal
      visible={showSubmitConfirm}
      title="Submit Feedback"
      message="Are you sure you want to submit? This cannot be edited later."
      confirmLabel="Submit"
      cancelLabel="Cancel"
      variant="success"
      onConfirm={confirmSubmit}
      onCancel={() => setShowSubmitConfirm(false)}
    />

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
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  excerptCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  excerptTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
  },
  excerptText: {
    fontSize: 15,
    color: '#334155',
    lineHeight: 24,
    marginBottom: 20,
  },
  contextBox: {
    backgroundColor: '#fffbeb', // amber-50
    padding: 12,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b', // amber-500
    marginBottom: 16,
  },
  contextTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#b45309',
    marginBottom: 4,
  },
  contextText: {
    fontSize: 14,
    color: '#78350f',
    lineHeight: 20,
  },
  focusContainer: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 16,
  },
  focusLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
  },
  focusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  focusTag: {
    backgroundColor: '#f3f0ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  focusTagText: {
    fontSize: 11,
    color: '#6d28d9',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: 8,
    marginBottom: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#334155',
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
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#1e293b',
  },
  textArea: {
    height: 120,
    marginBottom: 24,
  },
  rubricContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  submitBtn: {
    backgroundColor: '#8b5cf6',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 16,
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
