import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import designTokens from '../../styles/designTokens';

export interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: keyof typeof designTokens.spacing;
  style?: ViewStyle;
}

export default function Card({ children, variant = 'default', padding = 'lg', style }: CardProps) {
  const cardStyles = [
    styles.base,
    styles[variant],
    { padding: designTokens.spacing[padding] },
    style,
  ];

  return <View style={cardStyles}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    borderRadius: designTokens.borderRadius.xl,
    backgroundColor: designTokens.colors.background,
  },

  default: {
    ...designTokens.shadows.sm,
  },

  elevated: {
    ...designTokens.shadows.lg,
  },

  outlined: {
    borderWidth: 1,
    borderColor: designTokens.colors.border,
    shadowOpacity: 0,
    elevation: 0,
  },
});
