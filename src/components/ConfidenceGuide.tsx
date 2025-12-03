/**
 * ConfidenceGuide - Helps users improve quote confidence
 * Shows actionable steps to reach 85%+ confidence for PDF generation
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import designTokens from '../styles/designTokens';

interface ConfidenceStep {
  id: string;
  title: string;
  description: string;
  icon: string;
  completed: boolean;
  action?: string;
  onPress?: () => void;
}

interface ConfidenceGuideProps {
  confidence: number;
  hasImages: boolean;
  hasLocation: boolean;
  hasDetailedDescription: boolean;
  onAddImages: () => void;
  onImproveDescription: () => void;
  onCheckLocation: () => void;
}

export default function ConfidenceGuide({
  confidence,
  hasImages,
  hasLocation,
  hasDetailedDescription,
  onAddImages,
  onImproveDescription,
  onCheckLocation,
}: ConfidenceGuideProps) {
  const getSteps = (): ConfidenceStep[] => [
    {
      id: 'description',
      title: 'Detailed Project Description',
      description: 'Include room dimensions, materials, scope of work',
      icon: 'document-text',
      completed: hasDetailedDescription,
      action: 'Add more details',
      onPress: onImproveDescription,
    },
    {
      id: 'images',
      title: 'Upload Photos',
      description: 'Photos of the space, existing fixtures, or inspiration',
      icon: 'camera',
      completed: hasImages,
      action: 'Add photos',
      onPress: onAddImages,
    },
    {
      id: 'location',
      title: 'Verify Location',
      description: 'Accurate location for regional material pricing',
      icon: 'location',
      completed: hasLocation,
      action: 'Check location',
      onPress: onCheckLocation,
    },
  ];

  const steps = getSteps();
  const completedSteps = steps.filter(step => step.completed).length;
  const progressPercentage = Math.max(confidence, (completedSteps / steps.length) * 100);

  const getConfidenceMessage = () => {
    if (confidence >= 85) {
      return {
        title: '🎉 Excellent! Your quote is ready',
        subtitle: 'All key information provided - generate professional PDF',
        color: designTokens.colors.success,
      };
    } else if (confidence >= 70) {
      return {
        title: '👍 Good progress! Almost there',
        subtitle: 'Complete the steps below to unlock PDF generation',
        color: designTokens.colors.warning,
      };
    } else {
      return {
        title: "📝 Let's improve your quote accuracy",
        subtitle: 'Complete these steps for a professional estimate',
        color: designTokens.colors.primary[500],
      };
    }
  };

  const message = getConfidenceMessage();

  const handleStepPress = (step: ConfidenceStep) => {
    if (!step.completed && step.onPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      step.onPress();
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.confidenceScore}>
          <Text style={styles.scoreNumber}>{Math.round(confidence)}%</Text>
          <Text style={styles.scoreLabel}>Confidence</Text>
        </View>
        <View style={styles.messageContainer}>
          <Text style={[styles.messageTitle, { color: message.color }]}>{message.title}</Text>
          <Text style={styles.messageSubtitle}>{message.subtitle}</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.min(progressPercentage, 100)}%`,
                backgroundColor: message.color,
              },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {completedSteps} of {steps.length} completed
        </Text>
      </View>

      {/* Steps */}
      <ScrollView style={styles.stepsContainer} showsVerticalScrollIndicator={false}>
        {steps.map((step, index) => (
          <TouchableOpacity
            key={step.id}
            style={[
              styles.stepCard,
              step.completed && styles.stepCompleted,
              !step.completed && styles.stepPending,
            ]}
            onPress={() => handleStepPress(step)}
            disabled={step.completed}
          >
            <View style={styles.stepHeader}>
              <View
                style={[
                  styles.stepIcon,
                  step.completed ? styles.stepIconCompleted : styles.stepIconPending,
                ]}
              >
                <Ionicons
                  name={step.completed ? 'checkmark' : (step.icon as any)}
                  size={20}
                  color={step.completed ? '#fff' : designTokens.colors.primary[500]}
                />
              </View>
              <View style={styles.stepContent}>
                <Text style={[styles.stepTitle, step.completed && styles.stepTitleCompleted]}>
                  {step.title}
                </Text>
                <Text style={styles.stepDescription}>{step.description}</Text>
              </View>
              {!step.completed && (
                <View style={styles.stepAction}>
                  <Text style={styles.stepActionText}>{step.action}</Text>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={designTokens.colors.primary[500]}
                  />
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Bottom Tip */}
      <View style={styles.tipContainer}>
        <Ionicons name="bulb" size={16} color={designTokens.colors.warning} />
        <Text style={styles.tipText}>
          <Text style={styles.tipBold}>Tip:</Text> More details = more accurate pricing. Include
          specific materials, finishes, and any special requirements.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: designTokens.colors.background,
    borderRadius: designTokens.borderRadius.xl,
    padding: designTokens.spacing.lg,
    margin: designTokens.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: designTokens.colors.grey[200],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: designTokens.spacing.lg,
    gap: designTokens.spacing.md,
  },
  confidenceScore: {
    alignItems: 'center',
    paddingVertical: designTokens.spacing.sm,
  },
  scoreNumber: {
    fontSize: designTokens.typography.fontSize.xxl,
    fontWeight: designTokens.typography.fontWeight.bold as any,
    color: designTokens.colors.text.primary,
  },
  scoreLabel: {
    fontSize: designTokens.typography.fontSize.xs,
    color: designTokens.colors.text.secondary,
    fontWeight: designTokens.typography.fontWeight.medium as any,
  },
  messageContainer: {
    flex: 1,
  },
  messageTitle: {
    fontSize: designTokens.typography.fontSize.lg,
    fontWeight: designTokens.typography.fontWeight.semibold as any,
    marginBottom: designTokens.spacing.xs,
  },
  messageSubtitle: {
    fontSize: designTokens.typography.fontSize.sm,
    color: designTokens.colors.text.secondary,
    lineHeight: 18,
  },
  progressContainer: {
    marginBottom: designTokens.spacing.lg,
  },
  progressTrack: {
    height: 6,
    backgroundColor: designTokens.colors.grey[200],
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: designTokens.spacing.xs,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: designTokens.typography.fontSize.xs,
    color: designTokens.colors.text.secondary,
    textAlign: 'center',
  },
  stepsContainer: {
    maxHeight: 200,
    marginBottom: designTokens.spacing.md,
  },
  stepCard: {
    borderRadius: designTokens.borderRadius.lg,
    marginBottom: designTokens.spacing.sm,
    overflow: 'hidden',
  },
  stepCompleted: {
    backgroundColor: designTokens.colors.success + '10',
    borderWidth: 1,
    borderColor: designTokens.colors.success + '30',
  },
  stepPending: {
    backgroundColor: designTokens.colors.grey[50],
    borderWidth: 1,
    borderColor: designTokens.colors.grey[200],
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: designTokens.spacing.md,
    gap: designTokens.spacing.md,
  },
  stepIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepIconCompleted: {
    backgroundColor: designTokens.colors.success,
  },
  stepIconPending: {
    backgroundColor: designTokens.colors.primary[50],
    borderWidth: 1,
    borderColor: designTokens.colors.primary[200],
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: designTokens.typography.fontSize.base,
    fontWeight: designTokens.typography.fontWeight.semibold as any,
    color: designTokens.colors.text.primary,
    marginBottom: designTokens.spacing.xs,
  },
  stepTitleCompleted: {
    color: designTokens.colors.success,
  },
  stepDescription: {
    fontSize: designTokens.typography.fontSize.sm,
    color: designTokens.colors.text.secondary,
    lineHeight: 18,
  },
  stepAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designTokens.spacing.xs,
  },
  stepActionText: {
    fontSize: designTokens.typography.fontSize.sm,
    color: designTokens.colors.primary[500],
    fontWeight: designTokens.typography.fontWeight.medium as any,
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: designTokens.spacing.md,
    backgroundColor: designTokens.colors.warning + '10',
    borderRadius: designTokens.borderRadius.md,
    gap: designTokens.spacing.sm,
  },
  tipText: {
    flex: 1,
    fontSize: designTokens.typography.fontSize.sm,
    color: designTokens.colors.text.secondary,
    lineHeight: 18,
  },
  tipBold: {
    fontWeight: designTokens.typography.fontWeight.semibold as any,
    color: designTokens.colors.text.primary,
  },
});
