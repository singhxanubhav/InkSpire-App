import React, { useState, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, Keyboard, Platform } from 'react-native';
import BottomSheet, { BottomSheetScrollView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../../../services/api';
import { Button } from '../../ui/Button';
import { Toast } from '../../ui/Toast';

interface PromptResponseModalProps {
  isVisible: boolean;
  prompt: any;
  onClose: () => void;
}

export default function PromptResponseModal({ isVisible, prompt, onClose }: PromptResponseModalProps) {
  const [content, setContent] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' as 'success'|'error'|'info' });
  const bottomSheetRef = useRef<BottomSheet>(null);
  const queryClient = useQueryClient();

  const snapPoints = useMemo(() => ['90%', '100%'], []);

  React.useEffect(() => {
    if (isVisible) {
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
      setContent('');
    }
  }, [isVisible]);

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const isEnabled = wordCount >= 50;

  const handlePublish = async () => {
    if (!isEnabled) {
      setToast({ visible: true, message: `Please write at least 50 words. You have ${wordCount}.`, type: 'error' });
      return;
    }

    setIsPublishing(true);
    Keyboard.dismiss();

    try {
      await api.post(`/prompts/${prompt.id}/submissions`, { content });
      
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['communityPrompts'] });
      queryClient.invalidateQueries({ queryKey: ['myResponses'] });
      queryClient.invalidateQueries({ queryKey: ['dailyPrompt'] });

      onClose();
      // A global toast would be better here, but we'll let the user see the change on the My Responses tab
    } catch (e: any) {
      setToast({ visible: true, message: e.response?.data?.message || 'Failed to publish response.', type: 'error' });
    } finally {
      setIsPublishing(false);
    }
  };

  const renderBackdrop = (props: any) => (
    <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} onPress={onClose} />
  );

  if (!prompt) return null;

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={onClose}
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={{ backgroundColor: '#e5e7eb', width: 40 }}
      backgroundStyle={{ backgroundColor: '#ffffff', borderRadius: 24 }}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
    >
      <View style={styles.header}>
        <Text style={styles.title}>Write Response</Text>
        <Ionicons name="close" size={24} color="#6b7280" onPress={onClose} />
      </View>

      <BottomSheetScrollView contentContainerStyle={styles.content}>
        <View style={styles.promptReference}>
          <Text style={styles.promptLabel}>Prompt</Text>
          <Text style={styles.promptText}>"{prompt.content}"</Text>
        </View>

        <TextInput
          style={styles.editor}
          multiline
          placeholder="Start writing your story..."
          placeholderTextColor="#9ca3af"
          value={content}
          onChangeText={setContent}
          textAlignVertical="top"
          autoFocus
        />
      </BottomSheetScrollView>

      <View style={styles.footer}>
        <View style={styles.footerInfo}>
          <Text style={[styles.wordCount, wordCount >= 50 && styles.wordCountValid]}>
            {wordCount} {wordCount === 1 ? 'word' : 'words'}
          </Text>
          {wordCount < 50 && (
            <Text style={styles.wordCountReq}>(50 min)</Text>
          )}
        </View>
        <Button 
          title="Publish" 
          onPress={handlePublish} 
          disabled={!isEnabled || isPublishing}
          loading={isPublishing}
          style={styles.publishBtn}
        />
      </View>

      <Toast 
        visible={toast.visible} 
        message={toast.message} 
        type={toast.type} 
        onHide={() => setToast(prev => ({ ...prev, visible: false }))} 
      />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  content: {
    padding: 20,
    paddingBottom: 100, // Make room for footer
  },
  promptReference: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#8b5cf6',
    marginBottom: 24,
  },
  promptLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8b5cf6',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  promptText: {
    fontSize: 15,
    color: '#334155',
    lineHeight: 22,
    fontStyle: 'italic',
  },
  editor: {
    fontSize: 16,
    lineHeight: 24,
    color: '#1e293b',
    minHeight: 300,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  footerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  wordCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94a3b8',
  },
  wordCountValid: {
    color: '#10b981',
  },
  wordCountReq: {
    fontSize: 12,
    color: '#ef4444',
  },
  publishBtn: {
    paddingHorizontal: 24,
  }
});
