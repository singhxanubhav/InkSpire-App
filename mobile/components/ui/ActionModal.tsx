import React, { useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
} from 'react-native';
import { GestureHandlerRootView, PanGestureHandler, PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

export interface ActionOption {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  destructive?: boolean;
}

interface ActionModalProps {
  visible: boolean;
  title?: string;
  options: ActionOption[];
  onClose: () => void;
}

export function ActionModal({ visible, title, options, onClose }: ActionModalProps) {
  const slideAnim = useRef(new Animated.Value(400)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (visible) {
      slideAnim.setValue(400);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }),
      ]).start();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [visible]);

  const animateClose = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 400,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => onClose());
  }, [onClose]);

  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationY: slideAnim } }],
    { useNativeDriver: true }
  );

  const onHandlerStateChange = useCallback(
    (event: PanGestureHandlerGestureEvent) => {
      const { translationY, velocityY, state } = event.nativeEvent;
      // state 5 = GESTURE END
      if (state === 5) {
        if (translationY > 100 || velocityY > 600) {
          animateClose();
        } else {
          Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: true,
            tension: 65,
            friction: 11,
          }).start();
        }
      }
    },
    [animateClose]
  );

  if (!visible) return null;

  // Bottom padding accounts for safe area (home indicator on iOS, gesture bar on Android)
  // so the sheet content never sits behind the bottom navbar
  const bottomPadding = Math.max(insets.bottom, 8) + 16;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent
      onRequestClose={animateClose}
    >
      {/*
        GestureHandlerRootView MUST be inside Modal on mobile (Android/iOS),
        because Modal renders in a new React root, outside the app's GestureHandlerRootView.
        statusBarTranslucent ensures the overlay covers the full screen on Android.
      */}
      <GestureHandlerRootView style={StyleSheet.absoluteFill}>
        {/* Full-screen backdrop — covers everything including bottom navbar */}
        <TouchableWithoutFeedback onPress={animateClose}>
          <Animated.View style={[styles.overlay, { opacity: fadeAnim }]} />
        </TouchableWithoutFeedback>

        {/* Sheet anchored to very bottom of screen */}
        <Animated.View style={[styles.sheetWrapper, { transform: [{ translateY: slideAnim }] }]}>
          <PanGestureHandler
            onGestureEvent={onGestureEvent}
            onHandlerStateChange={onHandlerStateChange}
            activeOffsetY={10}
            failOffsetY={-5}
          >
            <Animated.View style={[styles.container, { paddingBottom: bottomPadding }]}>
              <View style={styles.dragHandle} />

              {title && <Text style={styles.title}>{title}</Text>}

              <View style={styles.optionsContainer}>
                {options.map((option, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.optionButton,
                      index < options.length - 1 && styles.borderBottom,
                    ]}
                    activeOpacity={0.7}
                    onPress={() => {
                      Haptics.selectionAsync();
                      animateClose();
                      setTimeout(option.onPress, 200);
                    }}
                  >
                    {option.icon && (
                      <Ionicons
                        name={option.icon}
                        size={22}
                        color={option.destructive ? '#ef4444' : '#374151'}
                        style={styles.icon}
                      />
                    )}
                    <Text style={[styles.optionText, option.destructive && styles.destructiveText]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Animated.View>
          </PanGestureHandler>
        </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  sheetWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  container: {
    backgroundColor: '#f3f4f6',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#d1d5db',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  optionsContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#ffffff',
  },
  borderBottom: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
  },
  icon: {
    marginRight: 16,
  },
  optionText: {
    fontSize: 17,
    color: '#374151',
    fontWeight: '500',
  },
  destructiveText: {
    color: '#ef4444',
  },
});
