import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import designTokens from '../../styles/designTokens';
import Card from './Card';

interface ErrorAlertProps {
  title: string;
  message: string;
  suggestion?: string;
  actionText?: string;
  onActionPress?: () => void;
  onDismiss?: () => void;
  visible: boolean;
}

export default function ErrorAlert({
  title,
  message,
  suggestion,
  actionText,
  onActionPress,
  onDismiss,
  visible,
}: ErrorAlertProps) {
  if (!visible) return null;

  return (
    <Card variant="outlined" style={styles.container}>
      {/* Error Icon and Dismiss */}
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>⚠️</Text>
          <Text style={styles.title}>{title}</Text>
        </View>
        {onDismiss && (
          <TouchableOpacity onPress={onDismiss} style={styles.dismissButton}>
            <Text style={styles.dismissText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Error Message */}
      <Text style={styles.message}>{message}</Text>
      
      {/* Suggestion */}
      {suggestion && (
        <Text style={styles.suggestion}>{suggestion}</Text>
      )}

      {/* Action Button */}
      {actionText && onActionPress && (
        <TouchableOpacity onPress={onActionPress} style={styles.actionButton}>
          <Text style={styles.actionText}>{actionText}</Text>
        </TouchableOpacity>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: designTokens.colors.error[25],
    borderColor: designTokens.colors.error[200],
    borderWidth: 1,
    marginVertical: designTokens.spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: designTokens.spacing.sm,
  },
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    fontSize: 20,
    marginRight: designTokens.spacing.sm,
  },
  title: {
    fontSize: designTokens.typography.fontSize.base,
    fontWeight: designTokens.typography.fontWeight.semibold,
    color: designTokens.colors.error[700],
    flex: 1,
  },
  dismissButton: {
    padding: designTokens.spacing.xs,
    marginLeft: designTokens.spacing.sm,
  },
  dismissText: {
    fontSize: designTokens.typography.fontSize.lg,
    color: designTokens.colors.error[500],
    fontWeight: designTokens.typography.fontWeight.bold,
  },
  message: {
    fontSize: designTokens.typography.fontSize.sm,
    color: designTokens.colors.error[600],
    marginBottom: designTokens.spacing.xs,
    lineHeight: designTokens.typography.lineHeight.base,
  },
  suggestion: {
    fontSize: designTokens.typography.fontSize.xs,
    color: designTokens.colors.error[500],
    marginBottom: designTokens.spacing.md,
    lineHeight: designTokens.typography.lineHeight.base,
    fontStyle: 'italic',
  },
  actionButton: {
    alignSelf: 'flex-start',
    paddingVertical: designTokens.spacing.xs,
    paddingHorizontal: designTokens.spacing.sm,
    backgroundColor: designTokens.colors.error[100],
    borderRadius: designTokens.borderRadius.md,
    borderWidth: 1,
    borderColor: designTokens.colors.error[300],
  },
  actionText: {
    fontSize: designTokens.typography.fontSize.sm,
    color: designTokens.colors.error[700],
    fontWeight: designTokens.typography.fontWeight.medium,
  },
});