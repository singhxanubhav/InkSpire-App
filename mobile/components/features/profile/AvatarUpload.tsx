import React, { useState } from 'react';
import { View, Image, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { ActionModal } from '../../ui/ActionModal';
import { Toast } from '../../ui/Toast';
import { api } from '../../../services/api';

interface AvatarUploadProps {
  currentAvatarUrl?: string | null;
  onUploadSuccess: (url: string) => void;
}

export function AvatarUpload({ currentAvatarUrl, onUploadSuccess }: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [localUri, setLocalUri] = useState<string | null>(null);
  const [showOptions, setShowOptions] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' as 'success'|'error'|'info' });

  const handlePress = () => {
    setShowOptions(true);
  };

  const openCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      setToast({ visible: true, message: 'Sorry, we need camera permissions to make this work!', type: 'error' });
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      handleImageSelected(result.assets[0].uri);
    }
  };

  const openGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      setToast({ visible: true, message: 'Sorry, we need camera roll permissions to make this work!', type: 'error' });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      handleImageSelected(result.assets[0].uri);
    }
  };

  const handleImageSelected = async (uri: string) => {
    setLocalUri(uri); // Optimistic UI
    setIsUploading(true);

    try {
      // Create FormData
      const formData = new FormData();
      formData.append('avatar', {
        uri,
        name: 'avatar.jpg',
        type: 'image/jpeg',
      } as any);

      const response = await api.post('/users/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      onUploadSuccess(response.data.avatar || uri); 
    } catch (error) {
      setToast({ visible: true, message: 'Failed to upload image. Please try again.', type: 'error' });
      setLocalUri(null); // Revert optimistic UI
    } finally {
      setIsUploading(false);
    }
  };

  const displayUri = localUri || currentAvatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=fallback';

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handlePress} disabled={isUploading} style={styles.imageContainer}>
        <Image source={{ uri: displayUri }} style={styles.image} />
        {isUploading && (
          <View style={styles.overlay}>
            <ActivityIndicator color="white" size="large" />
          </View>
        )}
        <View style={styles.editBadge}>
          <Ionicons name="camera" size={16} color="white" />
        </View>
      </TouchableOpacity>

      <ActionModal
        visible={showOptions}
        title="Profile Photo"
        onClose={() => setShowOptions(false)}
        options={[
          { label: 'Take Photo', icon: 'camera-outline', onPress: openCamera },
          { label: 'Choose from Gallery', icon: 'image-outline', onPress: openGallery }
        ]}
      />

      <Toast 
        visible={toast.visible} 
        message={toast.message} 
        type={toast.type} 
        onHide={() => setToast(prev => ({ ...prev, visible: false }))} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageContainer: {
    position: 'relative',
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#e5e7eb',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#3b82f6',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
});
