import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

export type ConfirmModalVariant = 'danger' | 'warning' | 'info' | 'success';

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmModalVariant;
  onConfirm: () => void;
  onCancel: () => void;
}

const VARIANT_CONFIG: Record<ConfirmModalVariant, {
  icon: any;
  iconBg: string;
  iconColor: string;
  btnBg: string;
}> = {
  danger: {
    icon: 'trash-outline',
    iconBg: '#fef2f2',
    iconColor: '#ef4444',
    btnBg: '#ef4444',
  },
  warning: {
    icon: 'warning-outline',
    iconBg: '#fffbeb',
    iconColor: '#f59e0b',
    btnBg: '#f59e0b',
  },
  info: {
    icon: 'information-circle-outline',
    iconBg: '#eff6ff',
    iconColor: '#3b82f6',
    btnBg: '#3b82f6',
  },
  success: {
    icon: 'checkmark-circle-outline',
    iconBg: '#f0fdf4',
    iconColor: '#22c55e',
    btnBg: '#22c55e',
  },
};

export function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'info',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const scaleAnim = useRef(new Animated.Value(0.88)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const config = VARIANT_CONFIG[variant];

  useEffect(() => {
    if (visible) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 120,
          friction: 10,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.88,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onCancel}>
      <TouchableWithoutFeedback onPress={onCancel}>
        <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
          <TouchableWithoutFeedback>
            <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
              {/* Icon */}
              <View style={[styles.iconWrapper, { backgroundColor: config.iconBg }]}>
                <Ionicons name={config.icon} size={32} color={config.iconColor} />
              </View>

              {/* Text */}
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.message}>{message}</Text>

              {/* Actions */}
              <View style={styles.actions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} activeOpacity={0.7}>
                  <Text style={styles.cancelLabel}>{cancelLabel}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.confirmBtn, { backgroundColor: config.btnBg }]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    onConfirm();
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={styles.confirmLabel}>{confirmLabel}</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  card: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 28,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.18,
    shadowRadius: 32,
    elevation: 24,
  },
  iconWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  message: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: '#f1f5f9',
    borderRadius: 16,
    alignItems: 'center',
  },
  cancelLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#475569',
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  confirmLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
});
