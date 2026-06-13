import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, TouchableOpacityProps, View } from 'react-native';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  className?: string;
  textStyle?: any;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className,
  ...props
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return 'bg-blue-600';
      case 'secondary':
        return 'bg-gray-200';
      case 'ghost':
        return 'bg-transparent';
      case 'danger':
        return 'bg-red-500';
      case 'outline':
        return 'bg-transparent border border-gray-300';
      default:
        return 'bg-blue-600';
    }
  };

  const getTextStyles = () => {
    switch (variant) {
      case 'primary':
      case 'danger':
        return 'text-white';
      case 'secondary':
        return 'text-gray-900';
      case 'ghost':
        return 'text-blue-600';
      case 'outline':
        return 'text-gray-700';
      default:
        return 'text-white';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'py-2 px-4';
      case 'md':
        return 'py-3 px-6';
      case 'lg':
        return 'py-4 px-8';
      default:
        return 'py-3 px-6';
    }
  };

  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      className={`rounded-xl flex-row justify-center items-center ${getVariantStyles()} ${getSizeStyles()} ${
        isDisabled ? 'opacity-50' : 'opacity-100'
      } ${className || ''}`}
      disabled={isDisabled}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' || variant === 'danger' ? '#ffffff' : '#3b82f6'}
          className="mr-2"
        />
      ) : null}
      <Text className={`font-semibold text-center text-base ${getTextStyles()}`}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};
