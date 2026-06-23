import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Keyboard, Platform, Modal, ScrollView, KeyboardAvoidingView, TouchableOpacity, Animated, PanResponder } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../../../services/api';
import { Button } from '../../ui/Button';
import { Toast } from '../../ui/Toast';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  const insets = useSafeAreaInsets();

  const panY = useRef(new Animated.Value(0)).current;

  const resetPositionAnim = Animated.timing(panY, {
    toValue: 0,
    duration: 300,
    useNativeDriver: true,
  });

  const closeAnim = Animated.timing(panY, {
    toValue: 1000,
    duration: 300,
    useNativeDriver: true,
  });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dy > 0 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          panY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 150 || gestureState.vy > 1.5) {
          Keyboard.dismiss();
          closeAnim.start(() => {
            onClose();
          });
        } else {
          resetPositionAnim.start();
        }
      },
    })
  ).current;

  useEffect(() => {
    if (isVisible) {
      panY.setValue(0);
    } else {
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
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => { Keyboard.dismiss(); onClose(); }} />
        
        <Animated.View style={[styles.modalContent, { paddingBottom: insets.bottom, transform: [{ translateY: panY }] }]}>
          <View {...panResponder.panHandlers}>
            <View style={styles.handleContainer}>
              <View style={styles.handle} />
            </View>

            <View style={styles.header}>
              <Text style={styles.title}>Write Response</Text>
              <Button 
                title="Publish" 
                onPress={handlePublish} 
                disabled={!isEnabled || isPublishing}
                loading={isPublishing}
                style={styles.publishBtn}
              />
            </View>
          </View>

          <View style={styles.scrollContainer}>
            <ScrollView 
              contentContainerStyle={styles.content}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.promptReference}>
                <View style={styles.promptHeader}>
                  <Ionicons name="bulb-outline" size={16} color="#8b5cf6" />
                  <Text style={styles.promptLabel}>The Prompt</Text>
                </View>
                <Text style={styles.promptText}>"{prompt.content}"</Text>
              </View>

              <TextInput
                style={styles.editor}
                multiline
                placeholder="Start writing your story..."
                placeholderTextColor="#94a3b8"
                value={content}
                onChangeText={setContent}
                textAlignVertical="top"
                autoFocus
              />
            </ScrollView>
          </View>
        </Animated.View>
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    height: '92%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  scrollContainer: {
    flex: 1, // Crucial for scrolling
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#ffffff',
  },
  handle: {
    width: 48,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#d1d5db',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  closeBtn: {
    display: 'none', // kept for TS compatibility, no longer shown
  },
  headerLeft: {
    display: 'none',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
  },
  publishBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    minHeight: 40,
    borderRadius: 20,
  },
  content: {
    padding: 24,
    paddingBottom: 60,
  },
  promptReference: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 24,
  },
  promptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  promptLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8b5cf6',
    textTransform: 'uppercase',
  },
  promptText: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 24,
    fontStyle: 'italic',
  },
  editor: {
    fontSize: 18,
    lineHeight: 28,
    color: '#1e293b',
    minHeight: 300,
  }
});
