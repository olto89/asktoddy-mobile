import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  ViewStyle,
  TextInputProps,
} from 'react-native';
import designTokens from '../../styles/designTokens';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helper?: string;
  containerStyle?: ViewStyle;
  variant?: 'default' | 'filled';
  size?: 'sm' | 'md' | 'lg';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export default function Input({
  label,
  error,
  helper,
  containerStyle,
  variant = 'default',
  size = 'md',
  leftIcon,
  rightIcon,
  style,
  ...props
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const inputContainerStyles = [
    styles.inputContainer,
    styles[variant],
    styles[size],
    isFocused && styles.focused,
    error && styles.error,
  ];

  const inputStyles = [
    styles.input,
    styles[`${size}Input`],
    leftIcon && styles.inputWithLeftIcon,
    rightIcon && styles.inputWithRightIcon,
    style,
  ];

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <View style={inputContainerStyles}>
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        
        <TextInput
          style={inputStyles}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholderTextColor={designTokens.colors.neutral[400]}
          {...props}
        />
        
        {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
      </View>
      
      {error && <Text style={styles.errorText}>{error}</Text>}
      {helper && !error && <Text style={styles.helperText}>{helper}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: designTokens.spacing.md,
  },
  
  label: {
    fontSize: designTokens.typography.fontSize.sm,
    fontWeight: designTokens.typography.fontWeight.medium,
    color: designTokens.colors.text.primary,
    marginBottom: designTokens.spacing.xs,
  },
  
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: designTokens.borderRadius.lg,
    backgroundColor: designTokens.colors.background,
  },
  
  // Variants
  default: {
    borderColor: designTokens.colors.border,
  },
  filled: {
    backgroundColor: designTokens.colors.neutral[50],
    borderColor: designTokens.colors.neutral[200],
  },
  
  // Sizes
  sm: {
    minHeight: 36,
    paddingHorizontal: designTokens.spacing.sm,
  },
  md: {
    minHeight: 44,
    paddingHorizontal: designTokens.spacing.md,
  },
  lg: {
    minHeight: 52,
    paddingHorizontal: designTokens.spacing.lg,
  },
  
  // States
  focused: {
    borderColor: designTokens.colors.primary[500],
    borderWidth: 2,
  },
  error: {
    borderColor: designTokens.colors.error,
    borderWidth: 1,
  },
  
  input: {
    flex: 1,
    fontSize: designTokens.typography.fontSize.base,
    color: designTokens.colors.text.primary,
    fontWeight: designTokens.typography.fontWeight.normal,
  },
  
  // Input sizes
  smInput: {
    fontSize: designTokens.typography.fontSize.sm,
  },
  mdInput: {
    fontSize: designTokens.typography.fontSize.base,
  },
  lgInput: {
    fontSize: designTokens.typography.fontSize.lg,
  },
  
  inputWithLeftIcon: {
    paddingLeft: designTokens.spacing.sm,
  },
  inputWithRightIcon: {
    paddingRight: designTokens.spacing.sm,
  },
  
  leftIcon: {
    marginRight: designTokens.spacing.sm,
  },
  rightIcon: {
    marginLeft: designTokens.spacing.sm,
  },
  
  errorText: {
    fontSize: designTokens.typography.fontSize.xs,
    color: designTokens.colors.error,
    marginTop: designTokens.spacing.xs,
  },
  helperText: {
    fontSize: designTokens.typography.fontSize.xs,
    color: designTokens.colors.text.tertiary,
    marginTop: designTokens.spacing.xs,
  },
});