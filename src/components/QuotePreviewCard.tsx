/**
 * QuotePreviewCard - Condensed quote display for main UI
 * Shows key information and updates in real-time
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import designTokens from '../styles/designTokens';

interface QuoteItem {
  id: string;
  name: string;
  total: number;
  category: 'materials' | 'labor' | 'tools';
}

interface QuotePreviewProps {
  projectType?: string;
  confidence: number;
  totalCost: {
    min: number;
    max: number;
  };
  keyItems: QuoteItem[];
  isUpdating?: boolean;
  onExpand: () => void;
}

export default function QuotePreviewCard({
  projectType = 'Construction Project',
  confidence,
  totalCost,
  keyItems,
  isUpdating = false,
  onExpand,
}: QuotePreviewProps) {
  const getConfidenceColor = () => {
    if (confidence >= 85) return designTokens.colors.success;
    if (confidence >= 70) return designTokens.colors.warning;
    return designTokens.colors.error;
  };

  const getConfidenceText = () => {
    if (confidence >= 85) return 'Ready for PDF';
    if (confidence >= 70) return 'Getting better';
    return 'Need more info';
  };

  const shouldShowPDFPrompt = confidence >= 85;
  const averageCost = (totalCost.min + totalCost.max) / 2;

  const handleExpand = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onExpand();
  };

  return (
    <TouchableOpacity style={styles.container} onPress={handleExpand} activeOpacity={0.95}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.projectType}>{projectType}</Text>
          <View style={[styles.confidenceBadge, { backgroundColor: getConfidenceColor() }]}>
            <Text style={styles.confidenceText}>{confidence}%</Text>
          </View>
        </View>

        <View style={styles.expandButton}>
          <Ionicons name="expand" size={20} color={designTokens.colors.text.secondary} />
        </View>
      </View>

      {/* Main Cost Display */}
      <View style={styles.costSection}>
        <Text style={styles.costLabel}>Estimated Total</Text>
        <Text style={styles.costValue}>
          £{totalCost.min.toLocaleString()} - £{totalCost.max.toLocaleString()}
        </Text>
        <Text style={styles.averageCost}>Average: £{Math.round(averageCost).toLocaleString()}</Text>
      </View>

      {/* Key Items Preview */}
      <View style={styles.itemsSection}>
        <Text style={styles.itemsLabel}>Key Items:</Text>
        {keyItems.slice(0, 3).map((item, index) => (
          <View key={item.id} style={styles.itemRow}>
            <View
              style={[styles.categoryDot, { backgroundColor: getCategoryColor(item.category) }]}
            />
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemCost}>£{item.total.toLocaleString()}</Text>
          </View>
        ))}
        {keyItems.length > 3 && (
          <Text style={styles.moreItems}>+{keyItems.length - 3} more items</Text>
        )}
      </View>

      {/* PDF Generation Prompt */}
      {shouldShowPDFPrompt && (
        <View style={styles.pdfPrompt}>
          <View style={styles.pdfPromptContent}>
            <Ionicons name="checkmark-circle" size={18} color={designTokens.colors.success} />
            <Text style={styles.pdfPromptText}>Ready for PDF generation!</Text>
          </View>
          <Text style={styles.pdfPromptSubtext}>Tap to add logo & generate professional quote</Text>
        </View>
      )}

      {/* Status Indicators */}
      <View style={styles.statusBar}>
        <View style={styles.statusLeft}>
          <View style={[styles.statusDot, { backgroundColor: getConfidenceColor() }]} />
          <Text style={styles.statusText}>{getConfidenceText()}</Text>
        </View>

        {isUpdating && (
          <View style={styles.updatingIndicator}>
            <Animated.View style={[styles.pulsingDot]} />
            <Text style={styles.updatingText}>Updating...</Text>
          </View>
        )}

        <TouchableOpacity style={styles.expandText} onPress={handleExpand}>
          <Text style={styles.expandLabel}>View Full Quote</Text>
          <Ionicons name="chevron-forward" size={16} color={designTokens.colors.primary[500]} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'materials':
      return designTokens.colors.primary[500];
    case 'labor':
      return designTokens.colors.secondary[500];
    case 'tools':
      return designTokens.colors.warning;
    default:
      return designTokens.colors.grey[400];
  }
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: designTokens.colors.background,
    borderRadius: designTokens.borderRadius.xl,
    padding: designTokens.spacing.lg,
    margin: designTokens.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: designTokens.colors.grey[200],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: designTokens.spacing.md,
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: designTokens.spacing.sm,
  },
  projectType: {
    fontSize: designTokens.typography.fontSize.lg,
    fontWeight: designTokens.typography.fontWeight.bold as any,
    color: designTokens.colors.text.primary,
    flex: 1,
  },
  confidenceBadge: {
    paddingHorizontal: designTokens.spacing.sm,
    paddingVertical: designTokens.spacing.xs,
    borderRadius: designTokens.borderRadius.full,
  },
  confidenceText: {
    color: '#fff',
    fontSize: designTokens.typography.fontSize.sm,
    fontWeight: designTokens.typography.fontWeight.semibold as any,
  },
  expandButton: {
    padding: designTokens.spacing.xs,
  },
  costSection: {
    alignItems: 'center',
    marginBottom: designTokens.spacing.lg,
    paddingVertical: designTokens.spacing.md,
    backgroundColor: designTokens.colors.grey[50],
    borderRadius: designTokens.borderRadius.lg,
  },
  costLabel: {
    fontSize: designTokens.typography.fontSize.sm,
    color: designTokens.colors.text.secondary,
    marginBottom: designTokens.spacing.xs,
  },
  costValue: {
    fontSize: designTokens.typography.fontSize.xxl,
    fontWeight: designTokens.typography.fontWeight.bold as any,
    color: designTokens.colors.primary[600],
    marginBottom: designTokens.spacing.xs,
  },
  averageCost: {
    fontSize: designTokens.typography.fontSize.sm,
    color: designTokens.colors.text.secondary,
  },
  itemsSection: {
    marginBottom: designTokens.spacing.md,
  },
  itemsLabel: {
    fontSize: designTokens.typography.fontSize.base,
    fontWeight: designTokens.typography.fontWeight.semibold as any,
    color: designTokens.colors.text.primary,
    marginBottom: designTokens.spacing.sm,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: designTokens.spacing.xs,
    gap: designTokens.spacing.sm,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  itemName: {
    flex: 1,
    fontSize: designTokens.typography.fontSize.sm,
    color: designTokens.colors.text.primary,
  },
  itemCost: {
    fontSize: designTokens.typography.fontSize.sm,
    fontWeight: designTokens.typography.fontWeight.medium as any,
    color: designTokens.colors.text.primary,
  },
  moreItems: {
    fontSize: designTokens.typography.fontSize.sm,
    color: designTokens.colors.text.secondary,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: designTokens.spacing.xs,
  },
  pdfPrompt: {
    backgroundColor: designTokens.colors.success + '10',
    borderColor: designTokens.colors.success,
    borderWidth: 1,
    borderRadius: designTokens.borderRadius.lg,
    padding: designTokens.spacing.md,
    marginBottom: designTokens.spacing.md,
  },
  pdfPromptContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: designTokens.spacing.xs,
    gap: designTokens.spacing.sm,
  },
  pdfPromptText: {
    fontSize: designTokens.typography.fontSize.base,
    fontWeight: designTokens.typography.fontWeight.semibold as any,
    color: designTokens.colors.success,
  },
  pdfPromptSubtext: {
    fontSize: designTokens.typography.fontSize.sm,
    color: designTokens.colors.text.secondary,
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designTokens.spacing.xs,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: designTokens.typography.fontSize.xs,
    color: designTokens.colors.text.secondary,
  },
  updatingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designTokens.spacing.xs,
  },
  pulsingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: designTokens.colors.primary[500],
    // Add pulsing animation
  },
  updatingText: {
    fontSize: designTokens.typography.fontSize.xs,
    color: designTokens.colors.primary[500],
  },
  expandText: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designTokens.spacing.xs,
  },
  expandLabel: {
    fontSize: designTokens.typography.fontSize.xs,
    color: designTokens.colors.primary[500],
    fontWeight: designTokens.typography.fontWeight.medium as any,
  },
});
