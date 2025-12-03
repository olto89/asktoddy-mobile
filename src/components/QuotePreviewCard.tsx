/**
 * QuotePreviewCard - Condensed quote display for main UI
 * Shows key information and updates in real-time
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import designTokens from '../styles/designTokens';
import ConfidenceGuide from './ConfidenceGuide';
import { PermissionService } from '../services/PermissionService';

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
  showPremiumFeatures?: boolean;
  onGeneratePDF?: () => void;
  showConfidenceGuide?: boolean;
  hasImages?: boolean;
  hasLocation?: boolean;
  hasDetailedDescription?: boolean;
  onAddImages?: () => void;
  onImproveDescription?: () => void;
  onCheckLocation?: () => void;
  isPdfEligible?: boolean;
  isManuallyEdited?: boolean;
  // Enhanced professional cost data
  professionalCosts?: {
    grandTotal: number;
    subtotalExVAT: number;
    vat: { rate: number; amount: number };
    contingency: { percentage: number; amount: number; description: string };
    materials: { total: number; wastageAmount: number };
    labour: { total: number };
    overheads: { total: number; percentage: number };
    preliminaries: { total: number; percentage: number };
    profit: { percentage: number; amount: number };
  };
  enhancedPricing?: {
    materialCount: number;
    dataSource: string;
    confidenceScore: number;
    enhancementApplied: boolean;
  };
  professionalAdvice?: string[];
}

export default function QuotePreviewCard({
  projectType = 'Construction Project',
  confidence,
  totalCost,
  keyItems,
  isUpdating = false,
  onExpand,
  showPremiumFeatures = false,
  onGeneratePDF,
  showConfidenceGuide = false,
  hasImages = false,
  hasLocation = false,
  hasDetailedDescription = false,
  onAddImages,
  onImproveDescription,
  onCheckLocation,
  isPdfEligible = false,
  isManuallyEdited = false,
  professionalCosts,
  enhancedPricing,
  professionalAdvice,
}: QuotePreviewProps) {
  // Permission service for enhanced UX
  const permissionService = PermissionService.getInstance();
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

  // PDF eligibility logic:
  // - Premium users: Always eligible if manually edited OR high AI confidence
  // - Free users: Only eligible with high AI confidence (encourages good data)
  const shouldShowPDFPrompt = isPdfEligible || confidence >= 85;
  const averageCost = (totalCost.min + totalCost.max) / 2;

  const handleExpand = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onExpand();
  };

  // Use state for collapsible confidence guide - auto-expand for very low confidence
  const [showGuideExpanded, setShowGuideExpanded] = React.useState(confidence < 60);

  // Enhanced permission-aware action handlers
  const handleAddImages = async () => {
    const cameraStatus = await permissionService.checkPermissionStatus('camera');
    if (!cameraStatus.granted) {
      const shouldRequest = await permissionService.showPermissionEducation('camera');
      if (shouldRequest) {
        await permissionService.requestCameraPermission();
      }
    }
    onAddImages?.();
  };

  const handleCheckLocation = async () => {
    const locationStatus = await permissionService.checkPermissionStatus('location');
    if (!locationStatus.granted) {
      const shouldRequest = await permissionService.showPermissionEducation('location');
      if (shouldRequest) {
        await permissionService.requestLocationPermission();
      }
    }
    onCheckLocation?.();
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

      {/* Enhanced Professional Cost Breakdown */}
      {professionalCosts && (
        <View style={styles.professionalSection}>
          <View style={styles.professionalHeader}>
            <Ionicons name="business" size={16} color={designTokens.colors.primary[500]} />
            <Text style={styles.professionalTitle}>Professional Breakdown</Text>
            {enhancedPricing && (
              <View style={styles.enhancedBadge}>
                <Text style={styles.enhancedBadgeText}>
                  {enhancedPricing.materialCount}+ materials
                </Text>
              </View>
            )}
          </View>

          <View style={styles.costBreakdown}>
            <View style={styles.costRow}>
              <Text style={styles.costRowLabel}>Materials (inc. wastage)</Text>
              <Text style={styles.costRowValue}>
                £{professionalCosts.materials.total.toLocaleString()}
              </Text>
            </View>
            <View style={styles.costRow}>
              <Text style={styles.costRowLabel}>Labour</Text>
              <Text style={styles.costRowValue}>
                £{professionalCosts.labour.total.toLocaleString()}
              </Text>
            </View>
            <View style={styles.costRow}>
              <Text style={styles.costRowLabel}>
                Preliminaries ({professionalCosts.preliminaries.percentage}%)
              </Text>
              <Text style={styles.costRowValue}>
                £{professionalCosts.preliminaries.total.toLocaleString()}
              </Text>
            </View>
            <View style={styles.costRow}>
              <Text style={styles.costRowLabel}>
                Overheads ({professionalCosts.overheads.percentage}%)
              </Text>
              <Text style={styles.costRowValue}>
                £{professionalCosts.overheads.total.toLocaleString()}
              </Text>
            </View>
            <View style={styles.costRow}>
              <Text style={styles.costRowLabel}>
                Profit ({professionalCosts.profit.percentage}%)
              </Text>
              <Text style={styles.costRowValue}>
                £{professionalCosts.profit.amount.toLocaleString()}
              </Text>
            </View>
            <View style={styles.costRow}>
              <Text style={styles.costRowLabel}>
                Contingency ({professionalCosts.contingency.percentage}%)
              </Text>
              <Text style={styles.costRowValue}>
                £{professionalCosts.contingency.amount.toLocaleString()}
              </Text>
            </View>
            <View style={[styles.costRow, styles.subtotalRow]}>
              <Text style={styles.subtotalLabel}>Subtotal (ex VAT)</Text>
              <Text style={styles.subtotalValue}>
                £{professionalCosts.subtotalExVAT.toLocaleString()}
              </Text>
            </View>
            <View style={styles.costRow}>
              <Text style={styles.costRowLabel}>
                VAT ({(professionalCosts.vat.rate * 100).toFixed(0)}%)
              </Text>
              <Text style={styles.costRowValue}>
                £{professionalCosts.vat.amount.toLocaleString()}
              </Text>
            </View>
            <View style={[styles.costRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Grand Total</Text>
              <Text style={styles.totalValue}>
                £{professionalCosts.grandTotal.toLocaleString()}
              </Text>
            </View>
          </View>

          {professionalAdvice && professionalAdvice.length > 0 && (
            <View style={styles.adviceSection}>
              <Text style={styles.adviceTitle}>Professional Advice:</Text>
              {professionalAdvice.slice(0, 2).map((advice, index) => (
                <Text key={index} style={styles.adviceText}>
                  • {advice}
                </Text>
              ))}
            </View>
          )}
        </View>
      )}

      {/* PDF Generation Prompt */}
      {shouldShowPDFPrompt && showPremiumFeatures && (
        <TouchableOpacity style={styles.pdfPrompt} onPress={onGeneratePDF}>
          <View style={styles.pdfPromptContent}>
            <Ionicons name="document-text" size={18} color={designTokens.colors.success} />
            <Text style={styles.pdfPromptText}>
              {isManuallyEdited ? 'Generate Custom PDF' : 'Generate Professional PDF'}
            </Text>
            <View style={styles.premiumBadge}>
              <Text style={styles.premiumBadgeText}>PRO</Text>
            </View>
          </View>
          <Text style={styles.pdfPromptSubtext}>
            {isManuallyEdited
              ? 'Your custom quote is ready for PDF export'
              : 'Add company logo & create professional quote'}
          </Text>
          <View style={styles.pdfButtonRow}>
            <Ionicons name="diamond" size={16} color={designTokens.colors.primary[500]} />
            <Text style={styles.pdfButtonText}>Generate PDF Quote</Text>
            <Ionicons name="arrow-forward" size={16} color={designTokens.colors.primary[500]} />
          </View>
        </TouchableOpacity>
      )}

      {/* Confidence Improvement Tip - Only show for low confidence */}
      {showConfidenceGuide && (
        <View style={styles.confidenceTip}>
          <TouchableOpacity
            style={styles.confidenceTipHeader}
            onPress={() => setShowGuideExpanded(!showGuideExpanded)}
          >
            <Ionicons name="bulb-outline" size={16} color={designTokens.colors.warning} />
            <Text style={styles.confidenceTipTitle}>
              Improve accuracy for PDF ({Math.round(confidence)}%)
            </Text>
            <Ionicons
              name={showGuideExpanded ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={designTokens.colors.text.secondary}
            />
          </TouchableOpacity>

          {showGuideExpanded && (
            <View style={styles.confidenceTipContent}>
              <View style={styles.tipActions}>
                {!hasImages && (
                  <TouchableOpacity style={styles.tipAction} onPress={handleAddImages}>
                    <Ionicons name="camera" size={14} color={designTokens.colors.primary[500]} />
                    <Text style={styles.tipActionText}>Add photos</Text>
                  </TouchableOpacity>
                )}
                {!hasDetailedDescription && (
                  <TouchableOpacity style={styles.tipAction} onPress={onImproveDescription}>
                    <Ionicons
                      name="document-text"
                      size={14}
                      color={designTokens.colors.primary[500]}
                    />
                    <Text style={styles.tipActionText}>Add details</Text>
                  </TouchableOpacity>
                )}
                {!hasLocation && (
                  <TouchableOpacity style={styles.tipAction} onPress={handleCheckLocation}>
                    <Ionicons name="location" size={14} color={designTokens.colors.primary[500]} />
                    <Text style={styles.tipActionText}>Check location</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
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
    backgroundColor: designTokens.colors.primary[50],
    borderColor: designTokens.colors.primary[200],
    borderWidth: 2,
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
  premiumBadge: {
    backgroundColor: designTokens.colors.primary[500],
    paddingHorizontal: designTokens.spacing.xs,
    paddingVertical: 2,
    borderRadius: designTokens.borderRadius.sm,
    marginLeft: 'auto',
  },
  premiumBadgeText: {
    color: '#fff',
    fontSize: designTokens.typography.fontSize.xs,
    fontWeight: designTokens.typography.fontWeight.bold as any,
  },
  pdfButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: designTokens.spacing.xs,
    marginTop: designTokens.spacing.sm,
    paddingVertical: designTokens.spacing.sm,
    backgroundColor: designTokens.colors.primary[500],
    borderRadius: designTokens.borderRadius.md,
  },
  pdfButtonText: {
    color: '#fff',
    fontSize: designTokens.typography.fontSize.sm,
    fontWeight: designTokens.typography.fontWeight.semibold as any,
  },
  pdfPromptText: {
    flex: 1,
    fontSize: designTokens.typography.fontSize.base,
    fontWeight: designTokens.typography.fontWeight.semibold as any,
    color: designTokens.colors.primary[700],
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

  // Confidence Tip Styles
  confidenceTip: {
    backgroundColor: designTokens.colors.warning + '10',
    borderRadius: designTokens.borderRadius.md,
    marginBottom: designTokens.spacing.md,
    overflow: 'hidden',
  },
  confidenceTipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: designTokens.spacing.sm,
    gap: designTokens.spacing.xs,
  },
  confidenceTipTitle: {
    flex: 1,
    fontSize: designTokens.typography.fontSize.sm,
    color: designTokens.colors.text.primary,
    fontWeight: designTokens.typography.fontWeight.medium as any,
  },
  confidenceTipContent: {
    paddingHorizontal: designTokens.spacing.sm,
    paddingBottom: designTokens.spacing.sm,
  },
  tipActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: designTokens.spacing.xs,
  },
  tipAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: designTokens.colors.primary[50],
    borderRadius: designTokens.borderRadius.full,
    paddingHorizontal: designTokens.spacing.sm,
    paddingVertical: designTokens.spacing.xs,
    gap: designTokens.spacing.xs,
  },
  tipActionText: {
    fontSize: designTokens.typography.fontSize.xs,
    color: designTokens.colors.primary[500],
    fontWeight: designTokens.typography.fontWeight.medium as any,
  },

  // Professional Cost Breakdown Styles
  professionalSection: {
    backgroundColor: designTokens.colors.grey[50],
    borderRadius: designTokens.borderRadius.lg,
    padding: designTokens.spacing.md,
    marginBottom: designTokens.spacing.md,
    borderWidth: 1,
    borderColor: designTokens.colors.primary[200],
  },
  professionalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: designTokens.spacing.md,
    gap: designTokens.spacing.sm,
  },
  professionalTitle: {
    flex: 1,
    fontSize: designTokens.typography.fontSize.base,
    fontWeight: designTokens.typography.fontWeight.semibold as any,
    color: designTokens.colors.text.primary,
  },
  enhancedBadge: {
    backgroundColor: designTokens.colors.success + '20',
    borderRadius: designTokens.borderRadius.full,
    paddingHorizontal: designTokens.spacing.sm,
    paddingVertical: 2,
  },
  enhancedBadgeText: {
    fontSize: designTokens.typography.fontSize.xs,
    color: designTokens.colors.success,
    fontWeight: designTokens.typography.fontWeight.medium as any,
  },
  costBreakdown: {
    gap: designTokens.spacing.xs,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: designTokens.spacing.xs,
  },
  costRowLabel: {
    fontSize: designTokens.typography.fontSize.sm,
    color: designTokens.colors.text.secondary,
    flex: 1,
  },
  costRowValue: {
    fontSize: designTokens.typography.fontSize.sm,
    fontWeight: designTokens.typography.fontWeight.medium as any,
    color: designTokens.colors.text.primary,
  },
  subtotalRow: {
    borderTopWidth: 1,
    borderTopColor: designTokens.colors.grey[200],
    marginTop: designTokens.spacing.xs,
    paddingTop: designTokens.spacing.sm,
  },
  subtotalLabel: {
    fontSize: designTokens.typography.fontSize.sm,
    fontWeight: designTokens.typography.fontWeight.semibold as any,
    color: designTokens.colors.text.primary,
    flex: 1,
  },
  subtotalValue: {
    fontSize: designTokens.typography.fontSize.sm,
    fontWeight: designTokens.typography.fontWeight.semibold as any,
    color: designTokens.colors.text.primary,
  },
  totalRow: {
    borderTopWidth: 2,
    borderTopColor: designTokens.colors.primary[300],
    marginTop: designTokens.spacing.sm,
    paddingTop: designTokens.spacing.sm,
    backgroundColor: designTokens.colors.primary[50],
    marginHorizontal: -designTokens.spacing.sm,
    paddingHorizontal: designTokens.spacing.sm,
    borderRadius: designTokens.borderRadius.md,
  },
  totalLabel: {
    fontSize: designTokens.typography.fontSize.base,
    fontWeight: designTokens.typography.fontWeight.bold as any,
    color: designTokens.colors.primary[700],
    flex: 1,
  },
  totalValue: {
    fontSize: designTokens.typography.fontSize.base,
    fontWeight: designTokens.typography.fontWeight.bold as any,
    color: designTokens.colors.primary[700],
  },
  adviceSection: {
    marginTop: designTokens.spacing.md,
    paddingTop: designTokens.spacing.md,
    borderTopWidth: 1,
    borderTopColor: designTokens.colors.grey[200],
  },
  adviceTitle: {
    fontSize: designTokens.typography.fontSize.sm,
    fontWeight: designTokens.typography.fontWeight.semibold as any,
    color: designTokens.colors.text.primary,
    marginBottom: designTokens.spacing.sm,
  },
  adviceText: {
    fontSize: designTokens.typography.fontSize.sm,
    color: designTokens.colors.text.secondary,
    marginBottom: designTokens.spacing.xs,
    lineHeight: 18,
  },
});
