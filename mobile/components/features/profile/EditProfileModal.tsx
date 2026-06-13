import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import BottomSheet, { BottomSheetScrollView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../ui/Button';
import { ActionModal } from '../../ui/ActionModal';
import { Toast } from '../../ui/Toast';

interface EditProfileModalProps {
  isVisible: boolean;
  onClose: () => void;
  initialData: {
    displayName: string;
    bio: string;
    genres: string[];
    writingGoals: string[];
  };
  onSave: (data: any) => Promise<void>;
}

const ALL_GENRES = [
  'FANTASY', 'SCI_FI', 'ROMANCE', 'MYSTERY', 'THRILLER',
  'HORROR', 'LITERARY_FICTION', 'HISTORICAL_FICTION', 'NON_FICTION', 'POETRY'
];

export function EditProfileModal({ isVisible, onClose, initialData, onSave }: EditProfileModalProps) {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['80%', '90%'], []);
  
  const [displayName, setDisplayName] = useState(initialData.displayName || '');
  const [bio, setBio] = useState(initialData.bio || '');
  const [genres, setGenres] = useState<string[]>(initialData.genres || []);
  const [isSaving, setIsSaving] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' as 'success'|'error'|'info' });

  const hasUnsavedChanges = useMemo(() => {
    return displayName !== initialData.displayName || 
           bio !== initialData.bio || 
           JSON.stringify(genres) !== JSON.stringify(initialData.genres);
  }, [displayName, bio, genres, initialData]);

  useEffect(() => {
    if (isVisible) {
      bottomSheetRef.current?.expand();
      setDisplayName(initialData.displayName || '');
      setBio(initialData.bio || '');
      setGenres(initialData.genres || []);
    } else {
      bottomSheetRef.current?.close();
    }
  }, [isVisible, initialData]);

  const handleClose = useCallback(() => {
    if (hasUnsavedChanges) {
      setShowDiscardConfirm(true);
    } else {
      onClose();
    }
  }, [hasUnsavedChanges, onClose]);

  const toggleGenre = (genre: string) => {
    setGenres(prev => {
      if (prev.includes(genre)) return prev.filter(g => g !== genre);
      if (prev.length >= 5) {
        setToast({ visible: true, message: 'You can select up to 5 genres.', type: 'info' });
        return prev;
      }
      return [...prev, genre];
    });
  };

  const handleSave = async () => {
    if (!displayName.trim()) {
      setToast({ visible: true, message: 'Display name is required.', type: 'error' });
      return;
    }
    
    setIsSaving(true);
    try {
      await onSave({ displayName, bio, genres });
      onClose();
    } catch (error) {
      setToast({ visible: true, message: 'Failed to save profile. Please try again.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} onPress={handleClose} />
    ),
    [handleClose]
  );

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={handleClose}
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={{ backgroundColor: '#e5e7eb', width: 40 }}
      backgroundStyle={{ backgroundColor: '#ffffff', borderRadius: 24 }}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Edit Profile</Text>
        <TouchableOpacity onPress={handleClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="close" size={24} color="#6b7280" />
        </TouchableOpacity>
      </View>
      
      <BottomSheetScrollView contentContainerStyle={styles.content}>
        <View style={styles.field}>
          <Text style={styles.label}>Display Name</Text>
          <TextInput
            style={styles.input}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Your pen name"
            maxLength={50}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Bio</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={bio}
            onChangeText={setBio}
            placeholder="Tell us about your writing journey..."
            multiline
            numberOfLines={4}
            maxLength={500}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{bio.length}/500</Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Genres (Select up to 5)</Text>
          <View style={styles.chipsContainer}>
            {ALL_GENRES.map(genre => {
              const isSelected = genres.includes(genre);
              return (
                <TouchableOpacity
                  key={genre}
                  style={[styles.chip, isSelected && styles.chipSelected]}
                  onPress={() => toggleGenre(genre)}
                >
                  <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                    {genre.replace('_', ' ')}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <Button
          title="Save Changes"
          onPress={handleSave}
          disabled={isSaving || !hasUnsavedChanges}
          loading={isSaving}
          style={styles.saveButton}
        />
      </BottomSheetScrollView>

      <ActionModal
        visible={showDiscardConfirm}
        title="You have unsaved changes. Are you sure you want to discard them?"
        onClose={() => setShowDiscardConfirm(false)}
        options={[
          { label: 'Discard Changes', icon: 'trash-outline', destructive: true, onPress: onClose }
        ]}
      />

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
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  content: {
    padding: 20,
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
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: '#111827',
  },
  textArea: {
    minHeight: 100,
  },
  charCount: {
    textAlign: 'right',
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipSelected: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
  },
  chipText: {
    color: '#4b5563',
    fontSize: 14,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  chipTextSelected: {
    color: '#2563eb',
  },
  saveButton: {
    marginTop: 12,
    marginBottom: 40,
  },
});
