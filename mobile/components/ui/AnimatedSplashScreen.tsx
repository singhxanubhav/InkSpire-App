import React, { useEffect, useState } from 'react';
import { StyleSheet, Dimensions, View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  runOnJS,
  withSpring,
} from 'react-native-reanimated';
import * as SplashScreen from 'expo-splash-screen';
import { Ionicons } from '@expo/vector-icons';

interface AnimatedSplashScreenProps {
  onAnimationComplete: () => void;
}

const { width, height } = Dimensions.get('window');

// Keep the splash screen visible while we load resources
SplashScreen.preventAutoHideAsync().catch(() => {});

export function AnimatedSplashScreen({ onAnimationComplete }: AnimatedSplashScreenProps) {
  const [isAppReady, setAppReady] = useState(false);
  const overlayOpacity = useSharedValue(1);
  const overlayScale = useSharedValue(1);
  
  const iconTranslateY = useSharedValue(-50);
  const iconOpacity = useSharedValue(0);
  
  const titleTranslateY = useSharedValue(20);
  const titleOpacity = useSharedValue(0);

  const taglineOpacity = useSharedValue(0);

  useEffect(() => {
    // Simulate loading resources
    const prepare = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (e) {
        console.warn(e);
      } finally {
        setAppReady(true);
      }
    };
    prepare();
  }, []);

  useEffect(() => {
    if (isAppReady) {
      // 1. Hide native splash screen (which is pure white now)
      SplashScreen.hideAsync().catch(() => {});

      // 2. Start elegant animation sequence
      // Icon drops in
      iconOpacity.value = withTiming(1, { duration: 600 });
      iconTranslateY.value = withSpring(0, { damping: 12, stiffness: 90 });

      // Title fades and slides up shortly after
      titleOpacity.value = withDelay(300, withTiming(1, { duration: 600 }));
      titleTranslateY.value = withDelay(300, withSpring(0, { damping: 12, stiffness: 90 }));

      // Tagline fades in elegantly
      taglineOpacity.value = withDelay(800, withTiming(1, { duration: 800 }));

      // After reading time, scale up slightly and fade the whole overlay
      overlayScale.value = withDelay(
        2200,
        withTiming(1.1, { duration: 400, easing: Easing.in(Easing.ease) })
      );
      overlayOpacity.value = withDelay(
        2200,
        withTiming(0, { duration: 400, easing: Easing.inOut(Easing.ease) }, (finished) => {
          if (finished) {
            runOnJS(onAnimationComplete)();
          }
        })
      );
    }
  }, [isAppReady]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
    transform: [{ scale: overlayScale.value }],
    pointerEvents: overlayOpacity.value === 0 ? 'none' : 'auto',
  }));

  const iconStyle = useAnimatedStyle(() => ({
    opacity: iconOpacity.value,
    transform: [{ translateY: iconTranslateY.value }],
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));

  const taglineStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
  }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.container, overlayStyle]}>
      <View style={styles.contentContainer}>
        <Animated.View style={iconStyle}>
          <View style={styles.iconCircle}>
            <Ionicons name="pencil" size={48} color="#ffffff" />
          </View>
        </Animated.View>

        <Animated.View style={titleStyle}>
          <Text style={styles.title}>InkSpire</Text>
        </Animated.View>

        <Animated.View style={taglineStyle}>
          <Text style={styles.tagline}>Where Writers Connect</Text>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff', // Pure white to match the native splash and app theme
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  contentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#6366f1', // Indigo-500 from the theme
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontSize: 42,
    fontWeight: '800',
    color: '#111827', // Gray-900
    letterSpacing: -1,
    marginBottom: 12,
  },
  tagline: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280', // Gray-500
    letterSpacing: 0.5,
  },
});
