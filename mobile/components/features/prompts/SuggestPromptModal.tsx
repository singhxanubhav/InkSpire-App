import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Keyboard, TouchableOpacity, Modal, ScrollView, SafeAreaView, KeyboardAvoidingView, Platform, Animated, PanResponder } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../../../services/api';
import { Button } from '../../ui/Button';
import { Toast } from '../../ui/Toast';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface SuggestPromptModalProps {
  isVisible: boolean;
  onClose: () => void;
}

const GENRES = [
  'FANTASY', 'SCI_FI', 'ROMANCE', 'MYSTERY', 'THRILLER',
  'HORROR', 'LITERARY_FICTION', 'HISTORICAL_FICTION', 'NON_FICTION', 'POETRY', 'OTHER'
];

export default function SuggestPromptModal({ isVisible, onClose }: SuggestPromptModalProps) {
  const [content, setContent] = useState('');
  const [genre, setGenre] = useState('');
  const [theme, setTheme] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
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
      setGenre('');
      setTheme('');
    }
  }, [isVisible]);

  const charCount = content.length;
  const isEnabled = true;

  const handleSubmit = async () => {
    // if (!isEnabled) return;

    setIsSubmitting(true);
    Keyboard.dismiss();

    try {
      await api.post('/prompts/community', { content: content.trim(), genre, theme: theme.trim() });
      queryClient.invalidateQueries({ queryKey: ['communityPrompts'] });
      onClose();
    } catch (e: any) {
      setToast({ 
        visible: true, 
        message: e.response?.data?.message || 'Failed to submit prompt. You may have reached your daily limit.', 
        type: 'error' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => { Keyboard.dismiss(); onClose(); }} />
        
        <Animated.View style={[styles.modalContent, { paddingBottom: insets.bottom, transform: [{ translateY: panY }] }]}>
          <View {...panResponder.panHandlers}>
            <View style={styles.handleContainer}>
              <View style={styles.handle} />
            </View>
            
            <View style={styles.header}>
              <Text style={styles.title}>Suggest a Prompt</Text>
              <TouchableOpacity onPress={onClose} hitSlop={15} style={styles.closeBtn}>
                <Ionicons name="close-circle" size={26} color="#9ca3af" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.scrollContainer}>
            <ScrollView 
              contentContainerStyle={styles.content}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              
              {/* Prompt Content */}
              <View style={styles.field}>
                <Text style={styles.label}>The Prompt</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  multiline
                  placeholder="E.g. A time traveler goes back to fix a mistake, but..."
                  placeholderTextColor="#94a3b8"
                  value={content}
                  onChangeText={setContent}
                  textAlignVertical="top"
                />
              </View>

              {/* Genre */}
              <View style={styles.field}>
                <Text style={styles.label}>Genre</Text>
                <View style={styles.genreContainer}>
                  {GENRES.map(g => (
                    <TouchableOpacity
                      key={g}
                      style={[styles.genreChip, genre === g && styles.genreChipActive]}
                      onPress={() => setGenre(g)}
                    >
                      <Text style={[styles.genreText, genre === g && styles.genreTextActive]}>
                        {g.replace(/_/g, ' ')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Theme (Optional) */}
              <View style={styles.field}>
                <Text style={styles.label}>Theme <Text style={styles.optional}>(Optional)</Text></Text>
                <TextInput
                  style={styles.input}
                  placeholder="E.g. Betrayal, Magic, Cyberpunk"
                  placeholderTextColor="#94a3b8"
                  value={theme}
                  onChangeText={setTheme}
                  maxLength={50}
                />
              </View>

              <Button 
                title="Submit Prompt" 
                onPress={handleSubmit} 
                disabled={!isEnabled || isSubmitting}
                loading={isSubmitting}
                style={styles.submitBtn}
              />
              
              <Text style={styles.disclaimer}>
                You can suggest up to 3 prompts per day. Prompts with 10 upvotes are automatically published.
              </Text>

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
    paddingHorizontal: 24,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
  },
  closeBtn: {
    backgroundColor: '#f1f5f9',
    borderRadius: 16,
  },
  content: {
    padding: 24,
    paddingBottom: 60,
  },
  field: {
    marginBottom: 28,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 10,
  },
  optional: {
    fontWeight: '400',
    color: '#94a3b8',
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: '#0f172a',
  },
  textArea: {
    minHeight: 140,
    paddingTop: 16,
  },
  charCountContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  charCount: {
    fontSize: 12,
    fontWeight: '600',
  },
  charCountInvalid: {
    color: '#ef4444',
  },
  charCountValid: {
    color: '#10b981',
  },
  charCountReq: {
    fontSize: 12,
    color: '#ef4444',
    fontWeight: '500',
  },
  genreContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  genreChip: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  genreChipActive: {
    backgroundColor: '#e0e7ff',
    borderColor: '#6366f1',
  },
  genreText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'capitalize',
  },
  genreTextActive: {
    color: '#4f46e5',
  },
  submitBtn: {
    marginTop: 8,
    marginBottom: 20,
    borderRadius: 16,
    height: 54,
  },
  disclaimer: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
  }
});
