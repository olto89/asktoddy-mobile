import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import designTokens from '../../styles/designTokens';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  style,
  textStyle,
  icon,
  fullWidth = false,
}: ButtonProps) {
  const buttonStyles = [
    styles.base,
    styles[variant],
    styles[size],
    fullWidth && styles.fullWidth,
    (disabled || loading) && styles.disabled,
    style,
  ];

  const textStyles = [
    styles.baseText,
    styles[`${variant}Text`],
    styles[`${size}Text`],
    (disabled || loading) && styles.disabledText,
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? designTokens.colors.text.inverse : designTokens.colors.primary[500]}
        />
      ) : (
        <>
          {icon}
          <Text style={textStyles}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: designTokens.borderRadius.lg,
    borderWidth: 1,
    borderColor: 'transparent',
    ...designTokens.shadows.sm,
  },
  
  // Variants
  primary: {
    backgroundColor: designTokens.colors.primary[500],
    borderColor: designTokens.colors.primary[500],
  },
  secondary: {
    backgroundColor: designTokens.colors.secondary[500],
    borderColor: designTokens.colors.secondary[500],
  },
  outline: {
    backgroundColor: 'transparent',
    borderColor: designTokens.colors.primary[500],
    shadowOpacity: 0,
    elevation: 0,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
  },

  // Sizes
  sm: {
    paddingHorizontal: designTokens.spacing.md,
    paddingVertical: designTokens.spacing.sm,
    minHeight: 36,
  },
  md: {
    paddingHorizontal: designTokens.spacing.lg,
    paddingVertical: designTokens.spacing.md,
    minHeight: 44,
  },
  lg: {
    paddingHorizontal: designTokens.spacing.xl,
    paddingVertical: designTokens.spacing.lg,
    minHeight: 52,
  },

  // States
  disabled: {
    opacity: 0.6,
  },
  fullWidth: {
    width: '100%',
  },

  // Text styles
  baseText: {
    fontWeight: designTokens.typography.fontWeight.semibold,
    textAlign: 'center',
  },
  primaryText: {
    color: designTokens.colors.text.inverse,
  },
  secondaryText: {
    color: designTokens.colors.text.inverse,
  },
  outlineText: {
    color: designTokens.colors.primary[500],
  },
  ghostText: {
    color: designTokens.colors.primary[500],
  },

  // Text sizes
  smText: {
    fontSize: designTokens.typography.fontSize.sm,
    lineHeight: designTokens.typography.lineHeight.sm,
  },
  mdText: {
    fontSize: designTokens.typography.fontSize.base,
    lineHeight: designTokens.typography.lineHeight.base,
  },
  lgText: {
    fontSize: designTokens.typography.fontSize.lg,
    lineHeight: designTokens.typography.lineHeight.lg,
  },

  disabledText: {
    opacity: 0.8,
  },
});