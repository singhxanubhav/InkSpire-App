import React, { useState } from 'react';
import { View, Text, TextInput, TextInputProps, TouchableOpacity } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
  interpolateColor,
  useSharedValue,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  leftIcon,
  rightIcon,
  onRightIconPress,
  secureTextEntry,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(!secureTextEntry);
  
  const focusProgress = useSharedValue(0);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    focusProgress.value = withTiming(1, { duration: 200 });
    props.onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    focusProgress.value = withTiming(0, { duration: 200 });
    props.onBlur?.(e);
  };

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const animatedBorderStyle = useAnimatedStyle(() => {
    const borderColor = interpolateColor(
      focusProgress.value,
      [0, 1],
      ['#d1d5db', '#3b82f6'] // gray-300 to blue-500
    );

    return {
      borderColor: error ? '#ef4444' : borderColor, // red-500 for error
    };
  });

  return (
    <View className="mb-4">
      {label && (
        <Text className="text-sm font-medium text-gray-700 mb-1">{label}</Text>
      )}
      <Animated.View
        style={animatedBorderStyle}
        className={`flex-row items-center border rounded-xl bg-white px-3 h-12`}
      >
        {leftIcon && (
          <Ionicons
            name={leftIcon}
            size={20}
            color={error ? '#ef4444' : isFocused ? '#3b82f6' : '#9ca3af'}
            className="mr-2"
          />
        )}
        <TextInput
          className="flex-1 text-base text-gray-900"
          placeholderTextColor="#9ca3af"
          onFocus={handleFocus}
          onBlur={handleBlur}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          {...props}
        />
        {secureTextEntry ? (
          <TouchableOpacity onPress={togglePasswordVisibility} className="p-2">
            <Ionicons
              name={isPasswordVisible ? 'eye-outline' : 'eye-off-outline'}
              size={20}
              color="#9ca3af"
            />
          </TouchableOpacity>
        ) : rightIcon ? (
          <TouchableOpacity onPress={onRightIconPress} disabled={!onRightIconPress} className="p-2">
            <Ionicons name={rightIcon} size={20} color="#9ca3af" />
          </TouchableOpacity>
        ) : null}
      </Animated.View>
      {error && (
        <Text className="text-xs text-red-500 mt-1">{error}</Text>
      )}
    </View>
  );
};
