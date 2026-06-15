import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Keyboard, TouchableOpacity, Modal, ScrollView, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../../../services/api';
import { Button } from '../../ui/Button';
import { Toast } from '../../ui/Toast';

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

  React.useEffect(() => {
    if (!isVisible) {
      setContent('');
      setGenre('');
      setTheme('');
    }
  }, [isVisible]);

  const charCount = content.length;
  const isEnabled = charCount >= 20 && charCount <= 200 && genre !== '';

  const handleSubmit = async () => {
    if (!isEnabled) {
      setToast({ visible: true, message: 'Please write a valid prompt and select a genre.', type: 'error' });
      return;
    }

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
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        
        <View style={styles.modalContent}>
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>
          
          <View style={styles.header}>
            <Text style={styles.title}>Suggest a Prompt</Text>
            <Ionicons name="close" size={24} color="#6b7280" onPress={onClose} />
          </View>

          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            
            {/* Prompt Content */}
            <View style={styles.field}>
              <Text style={styles.label}>The Prompt</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                multiline
                placeholder="E.g. A time traveler goes back to fix a mistake, but..."
                value={content}
                onChangeText={setContent}
                maxLength={200}
                textAlignVertical="top"
              />
              <View style={styles.charCountContainer}>
                <Text style={[styles.charCount, (charCount < 20 || charCount > 200) ? styles.charCountInvalid : styles.charCountValid]}>
                  {charCount} / 200
                </Text>
                {charCount < 20 && <Text style={styles.charCountReq}>(Min 20)</Text>}
              </View>
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
                      {g.replace('_', ' ')}
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
    paddingBottom: 40,
  },
  field: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  optional: {
    fontWeight: '400',
    color: '#9ca3af',
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#111827',
  },
  textArea: {
    minHeight: 120,
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
    fontWeight: '500',
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
  },
  genreContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  genreChip: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  genreChipActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
  },
  genreText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#4b5563',
    textTransform: 'capitalize',
  },
  genreTextActive: {
    color: '#2563eb',
  },
  submitBtn: {
    marginTop: 8,
    marginBottom: 16,
  },
  disclaimer: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 18,
  },
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
    height: '90%',
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
});
