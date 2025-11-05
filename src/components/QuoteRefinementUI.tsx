/**
 * QuoteRefinementUI - User feedback system for quote adjustment
 * Allows users to refine quotes by adjusting preferences and providing feedback
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import designTokens from '../styles/designTokens';

interface CostBreakdown {
  materials: LineItem[];
  labour: LineItem[];
  tools: LineItem[];
  total: number;
}

interface LineItem {
  item: string;
  description?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
}

interface QuoteRefinementUIProps {
  visible: boolean;
  onClose: () => void;
  analysis: {
    projectType: string;
    description: string;
    costBreakdown: CostBreakdown;
    timeline: any;
    recommendations: string[];
    confidence: number;
  };
  onRefineQuote: (refinements: QuoteRefinements) => Promise<void>;
}

interface QuoteRefinements {
  feedback: {
    accuracy: 'too_high' | 'too_low' | 'about_right';
    comments: string;
  };
  adjustments: {
    materials: MaterialAdjustment[];
    labour: LabourAdjustment[];
    tools: ToolAdjustment[];
  };
  preferences: {
    qualityLevel: 'budget' | 'standard' | 'premium';
    timelinePreference: 'fastest' | 'standard' | 'flexible';
    supplierPreference: 'cheapest' | 'local' | 'premium';
  };
}

interface MaterialAdjustment {
  item: string;
  preferredBrand?: string;
  qualityLevel?: 'budget' | 'standard' | 'premium';
  adjustedPrice?: number;
}

interface LabourAdjustment {
  trade: string;
  adjustedRate?: number;
  preferredExperience?: 'apprentice' | 'experienced' | 'master';
}

interface ToolAdjustment {
  item: string;
  preferredSource?: 'hire' | 'buy' | 'own';
  adjustedCost?: number;
}

export default function QuoteRefinementUI({
  visible,
  onClose,
  analysis,
  onRefineQuote,
}: QuoteRefinementUIProps) {
  const [activeTab, setActiveTab] = useState<
    'feedback' | 'materials' | 'labour' | 'tools' | 'preferences'
  >('feedback');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Feedback state
  const [accuracy, setAccuracy] = useState<'too_high' | 'too_low' | 'about_right'>('about_right');
  const [comments, setComments] = useState('');

  // Preferences state
  const [qualityLevel, setQualityLevel] = useState<'budget' | 'standard' | 'premium'>('standard');
  const [timelinePreference, setTimelinePreference] = useState<'fastest' | 'standard' | 'flexible'>(
    'standard'
  );
  const [supplierPreference, setSupplierPreference] = useState<'cheapest' | 'local' | 'premium'>(
    'local'
  );

  // Adjustments state
  const [materialAdjustments, setMaterialAdjustments] = useState<MaterialAdjustment[]>([]);
  const [labourAdjustments, setLabourAdjustments] = useState<LabourAdjustment[]>([]);
  const [toolAdjustments, setToolAdjustments] = useState<ToolAdjustment[]>([]);

  const handleSubmitRefinements = async () => {
    if (!comments.trim() && accuracy === 'about_right') {
      Alert.alert(
        'Feedback Required',
        'Please provide some feedback about the quote to help us improve.'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const refinements: QuoteRefinements = {
        feedback: {
          accuracy,
          comments: comments.trim(),
        },
        adjustments: {
          materials: materialAdjustments,
          labour: labourAdjustments,
          tools: toolAdjustments,
        },
        preferences: {
          qualityLevel,
          timelinePreference,
          supplierPreference,
        },
      };

      await onRefineQuote(refinements);
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to submit refinements. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderFeedbackTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>How accurate is this quote?</Text>
        <View style={styles.accuracyButtons}>
          {[
            { key: 'too_high', label: 'Too High', icon: 'arrow-up', color: '#e74c3c' },
            { key: 'about_right', label: 'About Right', icon: 'checkmark', color: '#27ae60' },
            { key: 'too_low', label: 'Too Low', icon: 'arrow-down', color: '#f39c12' },
          ].map(option => (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.accuracyButton,
                accuracy === option.key && {
                  backgroundColor: option.color,
                  borderColor: option.color,
                },
              ]}
              onPress={() => setAccuracy(option.key as any)}
            >
              <Ionicons
                name={option.icon as any}
                size={20}
                color={accuracy === option.key ? '#fff' : option.color}
              />
              <Text
                style={[styles.accuracyButtonText, accuracy === option.key && { color: '#fff' }]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tell us more about your expectations</Text>
        <TextInput
          style={styles.commentInput}
          placeholder="What would you change about this quote? Any specific requirements or concerns?"
          placeholderTextColor={designTokens.colors.textSecondary}
          multiline
          numberOfLines={4}
          value={comments}
          onChangeText={setComments}
          textAlignVertical="top"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quote Overview</Text>
        <View style={styles.quoteOverview}>
          <View style={styles.overviewRow}>
            <Text style={styles.overviewLabel}>Project Type:</Text>
            <Text style={styles.overviewValue}>{analysis.projectType}</Text>
          </View>
          <View style={styles.overviewRow}>
            <Text style={styles.overviewLabel}>Total Cost:</Text>
            <Text style={styles.overviewValue}>£{analysis.costBreakdown.total.toFixed(2)}</Text>
          </View>
          <View style={styles.overviewRow}>
            <Text style={styles.overviewLabel}>AI Confidence:</Text>
            <Text
              style={[
                styles.overviewValue,
                {
                  color:
                    analysis.confidence >= 80
                      ? '#27ae60'
                      : analysis.confidence >= 60
                        ? '#f39c12'
                        : '#e74c3c',
                },
              ]}
            >
              {analysis.confidence}%
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  const renderPreferencesTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quality Level</Text>
        <Text style={styles.sectionDescription}>What quality of materials would you prefer?</Text>
        <View style={styles.preferenceButtons}>
          {[
            { key: 'budget', label: 'Budget', description: 'Good value, basic quality' },
            { key: 'standard', label: 'Standard', description: 'Good quality, balanced price' },
            { key: 'premium', label: 'Premium', description: 'Best quality, higher cost' },
          ].map(option => (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.preferenceButton,
                qualityLevel === option.key && styles.preferenceButtonActive,
              ]}
              onPress={() => setQualityLevel(option.key as any)}
            >
              <Text
                style={[
                  styles.preferenceButtonLabel,
                  qualityLevel === option.key && styles.preferenceButtonLabelActive,
                ]}
              >
                {option.label}
              </Text>
              <Text style={styles.preferenceButtonDescription}>{option.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Timeline Preference</Text>
        <Text style={styles.sectionDescription}>How flexible are you with timing?</Text>
        <View style={styles.preferenceButtons}>
          {[
            { key: 'fastest', label: 'As Fast As Possible', description: 'Premium for speed' },
            { key: 'standard', label: 'Standard Timeline', description: 'Balanced approach' },
            { key: 'flexible', label: 'Flexible Timeline', description: 'Potential cost savings' },
          ].map(option => (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.preferenceButton,
                timelinePreference === option.key && styles.preferenceButtonActive,
              ]}
              onPress={() => setTimelinePreference(option.key as any)}
            >
              <Text
                style={[
                  styles.preferenceButtonLabel,
                  timelinePreference === option.key && styles.preferenceButtonLabelActive,
                ]}
              >
                {option.label}
              </Text>
              <Text style={styles.preferenceButtonDescription}>{option.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Supplier Preference</Text>
        <Text style={styles.sectionDescription}>Where would you prefer to source materials?</Text>
        <View style={styles.preferenceButtons}>
          {[
            { key: 'cheapest', label: 'Cheapest Options', description: 'Lowest cost priority' },
            { key: 'local', label: 'Local Suppliers', description: 'Support local business' },
            { key: 'premium', label: 'Premium Brands', description: 'Top quality materials' },
          ].map(option => (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.preferenceButton,
                supplierPreference === option.key && styles.preferenceButtonActive,
              ]}
              onPress={() => setSupplierPreference(option.key as any)}
            >
              <Text
                style={[
                  styles.preferenceButtonLabel,
                  supplierPreference === option.key && styles.preferenceButtonLabelActive,
                ]}
              >
                {option.label}
              </Text>
              <Text style={styles.preferenceButtonDescription}>{option.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'feedback':
        return renderFeedbackTab();
      case 'preferences':
        return renderPreferencesTab();
      case 'materials':
        return (
          <ScrollView style={styles.tabContent}>
            <Text style={styles.comingSoon}>Material adjustments coming soon!</Text>
          </ScrollView>
        );
      case 'labour':
        return (
          <ScrollView style={styles.tabContent}>
            <Text style={styles.comingSoon}>Labour rate adjustments coming soon!</Text>
          </ScrollView>
        );
      case 'tools':
        return (
          <ScrollView style={styles.tabContent}>
            <Text style={styles.comingSoon}>Tool preference adjustments coming soon!</Text>
          </ScrollView>
        );
      default:
        return null;
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={designTokens.colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Refine Quote</Text>
          <TouchableOpacity
            onPress={handleSubmitRefinements}
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Update</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.tabBar}>
          {[
            { key: 'feedback', label: 'Feedback', icon: 'chatbubble' },
            { key: 'preferences', label: 'Preferences', icon: 'settings' },
            { key: 'materials', label: 'Materials', icon: 'cube' },
            { key: 'labour', label: 'Labour', icon: 'people' },
            { key: 'tools', label: 'Tools', icon: 'hammer' },
          ].map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.activeTab]}
              onPress={() => setActiveTab(tab.key as any)}
            >
              <Ionicons
                name={tab.icon as any}
                size={16}
                color={
                  activeTab === tab.key
                    ? designTokens.colors.primary
                    : designTokens.colors.textSecondary
                }
              />
              <Text style={[styles.tabLabel, activeTab === tab.key && styles.activeTabLabel]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {renderTabContent()}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: designTokens.colors.textPrimary,
  },
  submitButton: {
    backgroundColor: designTokens.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 70,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: designTokens.colors.primary,
  },
  tabLabel: {
    fontSize: 12,
    color: designTokens.colors.textSecondary,
    marginTop: 4,
  },
  activeTabLabel: {
    color: designTokens.colors.primary,
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: designTokens.colors.textPrimary,
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: designTokens.colors.textSecondary,
    marginBottom: 16,
  },
  accuracyButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  accuracyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    gap: 8,
  },
  accuracyButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: designTokens.colors.textPrimary,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: designTokens.colors.textPrimary,
    backgroundColor: '#fff',
    minHeight: 100,
  },
  quoteOverview: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
  },
  overviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  overviewLabel: {
    fontSize: 14,
    color: designTokens.colors.textSecondary,
  },
  overviewValue: {
    fontSize: 14,
    fontWeight: '600',
    color: designTokens.colors.textPrimary,
  },
  preferenceButtons: {
    gap: 12,
  },
  preferenceButton: {
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  preferenceButtonActive: {
    borderColor: designTokens.colors.primary,
    backgroundColor: '#fff5f2',
  },
  preferenceButtonLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: designTokens.colors.textPrimary,
    marginBottom: 4,
  },
  preferenceButtonLabelActive: {
    color: designTokens.colors.primary,
  },
  preferenceButtonDescription: {
    fontSize: 12,
    color: designTokens.colors.textSecondary,
  },
  comingSoon: {
    textAlign: 'center',
    fontSize: 16,
    color: designTokens.colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 40,
  },
});
