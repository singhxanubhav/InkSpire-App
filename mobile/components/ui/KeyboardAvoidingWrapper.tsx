import React from 'react';
import {
  KeyboardAvoidingView,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
  StyleSheet,
  ViewStyle,
  ScrollViewProps,
} from 'react-native';

interface KeyboardAvoidingWrapperProps {
  children: React.ReactNode;
  style?: ViewStyle;
  scrollViewProps?: Omit<ScrollViewProps, 'children'>;
  /**
   * If true, tapping outside inputs will dismiss the keyboard.
   * Defaults to true.
   */
  dismissOnTap?: boolean;
  /**
   * Extra offset to compensate for headers/navigation bars.
   * Pass the height of a custom header if needed.
   */
  extraOffset?: number;
  className?: string;
}

/**
 * Production-grade keyboard-aware wrapper.
 *
 * Strategy (same pattern used by WhatsApp, Instagram, Notion):
 * - iOS: `behavior="padding"` pushes content up, ScrollView handles scrolling to focused field.
 * - Android: `behavior="height"` shrinks the view so the keyboard never overlaps content.
 *   Android's WindowSoftInputMode must be "adjustResize" for this to work correctly.
 *   (Expo sets this by default.)
 *
 * Usage:
 *   <KeyboardAvoidingWrapper>
 *     <YourForm />
 *     <SubmitButton />   ← always visible
 *   </KeyboardAvoidingWrapper>
 */
export const KeyboardAvoidingWrapper: React.FC<KeyboardAvoidingWrapperProps> = ({
  children,
  style,
  scrollViewProps,
  dismissOnTap = true,
  extraOffset = 0,
  className,
}) => {
  const content = (
    <KeyboardAvoidingView
      style={[styles.flex, style]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? extraOffset : 0}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        bounces={Platform.OS === 'ios'}
        {...scrollViewProps}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );

  if (dismissOnTap) {
    return (
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        {content}
      </TouchableWithoutFeedback>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});
