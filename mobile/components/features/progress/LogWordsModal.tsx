import React, { useState, useEffect, forwardRef, useImperativeHandle, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Modal, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, PanResponder, Animated } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../services/api';
import * as Haptics from 'expo-haptics';

interface LogWordsModalProps {
  onClose: () => void;
  initialWordCount?: number;
}

export const LogWordsModal = forwardRef<any, LogWordsModalProps>(
  ({ onClose, initialWordCount = 0 }, ref) => {
  const [isVisible, setIsVisible] = useState(false);
  const [wordCount, setWordCount] = useState(initialWordCount.toString());
  const [projectName, setProjectName] = useState('Default');
  const [notes, setNotes] = useState('');
  
  const queryClient = useQueryClient();
  const panY = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (e, gestureState) => {
        if (gestureState.dy > 0) {
          panY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (e, gestureState) => {
        if (gestureState.dy > 100) {
          Animated.timing(panY, {
            toValue: 800,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            setIsVisible(false);
            onClose();
          });
        } else {
          Animated.spring(panY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  useImperativeHandle(ref, () => ({
    present: () => {
      panY.setValue(0);
      setWordCount(initialWordCount.toString());
      setIsVisible(true);
    },
    dismiss: () => {
      setIsVisible(false);
      onClose();
    }
  }));

  useEffect(() => {
    if (isVisible) {
      setWordCount(initialWordCount.toString());
    }
  }, [initialWordCount, isVisible]);

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      const parsedCount = parseInt(wordCount) || 0;
      await api.post('/progress', {
        wordCount: parsedCount,
        projectName,
        notes
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progressStats'] });
      queryClient.invalidateQueries({ queryKey: ['progressHistory'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setIsVisible(false);
      onClose();
    }
  });

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => {
        setIsVisible(false);
        onClose();
      }}
    >
      <KeyboardAvoidingView 
        style={styles.overlay} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableWithoutFeedback onPress={() => { Keyboard.dismiss(); setIsVisible(false); onClose(); }}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>
        
        <Animated.View 
          style={[styles.bottomSheet, { transform: [{ translateY: panY }] }]}
          {...panResponder.panHandlers}
        >
          <View style={styles.indicatorContainer}>
            <View style={styles.indicator} />
          </View>
          
          <Text style={styles.title}>Log Today's Words</Text>
          
          {initialWordCount > 0 && (
            <View style={styles.alertBox}>
              <Text style={styles.alertText}>You've already logged {initialWordCount} words today. Enter your new total.</Text>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Total Words</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={wordCount}
              onChangeText={setWordCount}
              placeholder="e.g. 500"
              placeholderTextColor="#94a3b8"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Project Name (Optional)</Text>
            <TextInput
              style={styles.input}
              value={projectName}
              onChangeText={setProjectName}
              placeholder="e.g. The Great Novel"
              placeholderTextColor="#94a3b8"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Notes (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="How did the session go?"
              placeholderTextColor="#94a3b8"
              multiline
              numberOfLines={2}
            />
          </View>

          <TouchableOpacity 
            style={styles.submitBtn} 
            onPress={() => mutate()}
            disabled={isPending || !wordCount}
          >
            {isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitBtnText}>Save Progress</Text>
            )}
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  bottomSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingTop: 12,
    maxHeight: '90%',
  },
  indicatorContainer: {
    alignItems: 'center',
    paddingBottom: 16,
  },
  indicator: {
    width: 40,
    height: 4,
    backgroundColor: '#cbd5e1',
    borderRadius: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 20,
    textAlign: 'center',
  },
  alertBox: {
    backgroundColor: '#eff6ff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  alertText: {
    fontSize: 13,
    color: '#1d4ed8',
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: '#0f172a',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  submitBtn: {
    backgroundColor: '#8b5cf6',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  }
});
