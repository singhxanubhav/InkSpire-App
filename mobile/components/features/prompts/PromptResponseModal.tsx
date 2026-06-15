import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Keyboard, Platform, Modal, ScrollView, SafeAreaView, KeyboardAvoidingView, TouchableOpacity } from 'react-native';
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
  const queryClient = useQueryClient();

  React.useEffect(() => {
    if (!isVisible) {
      setContent('');
    }
  }, [isVisible]);

  const isEnabled = content.trim().length > 0;

  const handlePublish = async () => {
    if (!isEnabled) return;

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
    } catch (e: any) {
      setToast({ visible: true, message: e.response?.data?.message || 'Failed to publish response.', type: 'error' });
    } finally {
      setIsPublishing(false);
    }
  };

  if (!prompt) return null;

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        
        <View style={styles.modalContent}>
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>

          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Ionicons name="close" size={24} color="#6b7280" onPress={onClose} />
              <Text style={styles.title}>Write Response</Text>
            </View>
            <Button 
              title="Publish" 
              onPress={handlePublish} 
              disabled={!isEnabled || isPublishing}
              loading={isPublishing}
              style={styles.publishBtn}
            />
          </View>

          <ScrollView contentContainerStyle={styles.content}>
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
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      <Toast 
        visible={toast.visible} 
        message={toast.message} 
        type={toast.type} 
        onHide={() => setToast(prev => ({ ...prev, visible: false }))} 
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '95%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#e5e7eb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  publishBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 36,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
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
  }
});
