import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../App';
import designTokens from '../styles/designTokens';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { AIService, ProjectAnalysis } from '../services/ai';

type ResultsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Results'>;
type ResultsScreenRouteProp = RouteProp<RootStackParamList, 'Results'>;

interface Props {
  navigation: ResultsScreenNavigationProp;
  route: ResultsScreenRouteProp;
}

export default function ResultsScreen({ navigation, route }: Props) {
  const { imageUri } = route.params;
  const [analysis, setAnalysis] = useState<ProjectAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    analyzeImage();
  }, [imageUri]);

  const analyzeImage = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('🔍 Starting AI analysis...');
      
      const result = await AIService.analyzeImageWithContext(imageUri, {
        location: 'UK',
        // Could add user preferences here from auth context
      });

      setAnalysis(result);
      console.log('✅ Analysis completed successfully');
    } catch (err) {
      console.error('❌ Analysis failed:', err);
      setError(err instanceof Error ? err.message : 'Analysis failed');
      
      Alert.alert(
        'Analysis Error',
        'Failed to analyze your image. Please try again or contact support.',
        [
          { text: 'Try Again', onPress: analyzeImage },
          { text: 'Go Back', onPress: () => navigation.goBack() }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleNewAnalysis = () => {
    navigation.navigate('Camera');
  };

  const handleBackToHome = () => {
    navigation.navigate('Home');
  };

  const formatCurrency = (amount: number): string => {
    return `£${amount.toLocaleString()}`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={designTokens.colors.primary[500]} />
          <Text style={styles.loadingTitle}>Analyzing Your Project</Text>
          <Text style={styles.loadingText}>
            Our AI is examining your image and calculating accurate quotes...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !analysis) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>⚠️ Analysis Failed</Text>
          <Text style={styles.errorText}>{error}</Text>
          <Button title="Try Again" onPress={analyzeImage} style={styles.retryButton} />
          <Button title="Go Back" onPress={() => navigation.goBack()} variant="outline" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Quote Results</Text>
          {analysis && (
            <Text style={styles.subtitle}>
              {analysis.projectType} • {analysis.confidence}% confidence
            </Text>
          )}
        </View>

        {/* Captured Image */}
        <Card variant="elevated" style={styles.imageCard}>
          <Image source={{ uri: imageUri }} style={styles.capturedImage} />
        </Card>

        {analysis && (
          <>
            {/* Cost Breakdown */}
            <Card variant="elevated" style={styles.resultCard}>
              <Text style={styles.cardTitle}>💰 Cost Estimate</Text>
              <View style={styles.costRow}>
                <Text style={styles.costLabel}>Total Project Cost:</Text>
                <Text style={styles.costValue}>
                  {formatCurrency(analysis.costBreakdown.total.min)} - {formatCurrency(analysis.costBreakdown.total.max)}
                </Text>
              </View>
              <View style={styles.costBreakdown}>
                <View style={styles.costRow}>
                  <Text style={styles.costSubLabel}>Materials:</Text>
                  <Text style={styles.costSubValue}>
                    {formatCurrency(analysis.costBreakdown.materials.min)} - {formatCurrency(analysis.costBreakdown.materials.max)}
                  </Text>
                </View>
                <View style={styles.costRow}>
                  <Text style={styles.costSubLabel}>Labor:</Text>
                  <Text style={styles.costSubValue}>
                    {formatCurrency(analysis.costBreakdown.labor.min)} - {formatCurrency(analysis.costBreakdown.labor.max)}
                  </Text>
                </View>
              </View>
            </Card>

            {/* Timeline */}
            <Card variant="elevated" style={styles.resultCard}>
              <Text style={styles.cardTitle}>⏱️ Timeline</Text>
              <View style={styles.timelineRow}>
                <Text style={styles.timelineLabel}>DIY Project:</Text>
                <Text style={styles.timelineValue}>{analysis.timeline.diy}</Text>
              </View>
              <View style={styles.timelineRow}>
                <Text style={styles.timelineLabel}>Professional:</Text>
                <Text style={styles.timelineValue}>{analysis.timeline.professional}</Text>
              </View>
              <Text style={styles.difficultyBadge}>
                Difficulty: {analysis.difficultyLevel}
              </Text>
            </Card>

            {/* Tools Required */}
            {analysis.toolsRequired.length > 0 && (
              <Card variant="elevated" style={styles.resultCard}>
                <Text style={styles.cardTitle}>🔧 Tools Required</Text>
                {analysis.toolsRequired.slice(0, 4).map((tool, index) => (
                  <View key={index} style={styles.toolRow}>
                    <Text style={styles.toolName}>{tool.name}</Text>
                    <Text style={styles.toolPrice}>
                      £{tool.dailyRentalPrice}/day × {tool.estimatedDays} days
                    </Text>
                  </View>
                ))}
                {analysis.toolsRequired.length > 4 && (
                  <Text style={styles.moreTools}>
                    +{analysis.toolsRequired.length - 4} more tools...
                  </Text>
                )}
              </Card>
            )}

            {/* Recommendations */}
            {analysis.recommendations.length > 0 && (
              <Card variant="outlined" style={styles.recommendationsCard}>
                <Text style={styles.cardTitle}>💡 Recommendations</Text>
                {analysis.recommendations.slice(0, 3).map((rec, index) => (
                  <Text key={index} style={styles.recommendationText}>
                    • {rec}
                  </Text>
                ))}
              </Card>
            )}

            {/* Professional Required Warning */}
            {analysis.requiresProfessional && (
              <Card variant="outlined" style={styles.warningCard}>
                <Text style={styles.warningTitle}>⚠️ Professional Required</Text>
                {analysis.professionalReasons?.map((reason, index) => (
                  <Text key={index} style={styles.warningText}>• {reason}</Text>
                ))}
              </Card>
            )}

            {/* AI Provider Info */}
            <Card variant="outlined" style={styles.metaCard}>
              <Text style={styles.metaTitle}>Analysis Details</Text>
              <Text style={styles.metaText}>
                Provider: {analysis.aiProvider} • 
                Time: {analysis.processingTimeMs}ms • 
                Confidence: {analysis.confidence}%
              </Text>
            </Card>
          </>
        )}

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <Button
            title="Analyze Another Project"
            onPress={handleNewAnalysis}
            style={styles.button}
          />
          
          <Button
            title="Back to Home"
            onPress={handleBackToHome}
            variant="outline"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: designTokens.colors.surface,
  },
  content: {
    flexGrow: 1,
    padding: designTokens.spacing.xl,
  },
  
  // Header
  header: {
    alignItems: 'center',
    marginBottom: designTokens.spacing.lg,
  },
  title: {
    fontSize: designTokens.typography.fontSize['2xl'],
    fontWeight: designTokens.typography.fontWeight.bold,
    color: designTokens.colors.text.primary,
    marginBottom: designTokens.spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: designTokens.typography.fontSize.base,
    color: designTokens.colors.text.secondary,
    textAlign: 'center',
    lineHeight: designTokens.typography.lineHeight.lg,
  },

  // Loading states
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: designTokens.spacing.xl,
  },
  loadingTitle: {
    fontSize: designTokens.typography.fontSize.xl,
    fontWeight: designTokens.typography.fontWeight.bold,
    color: designTokens.colors.text.primary,
    marginTop: designTokens.spacing.lg,
    marginBottom: designTokens.spacing.sm,
  },
  loadingText: {
    fontSize: designTokens.typography.fontSize.base,
    color: designTokens.colors.text.secondary,
    textAlign: 'center',
    lineHeight: designTokens.typography.lineHeight.lg,
  },

  // Error states
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: designTokens.spacing.xl,
  },
  errorTitle: {
    fontSize: designTokens.typography.fontSize.xl,
    fontWeight: designTokens.typography.fontWeight.bold,
    color: designTokens.colors.error,
    marginBottom: designTokens.spacing.sm,
  },
  errorText: {
    fontSize: designTokens.typography.fontSize.base,
    color: designTokens.colors.text.secondary,
    textAlign: 'center',
    marginBottom: designTokens.spacing.xl,
    lineHeight: designTokens.typography.lineHeight.lg,
  },
  retryButton: {
    marginBottom: designTokens.spacing.md,
  },

  // Image display
  imageCard: {
    marginBottom: designTokens.spacing.lg,
    overflow: 'hidden',
  },
  capturedImage: {
    width: '100%',
    height: 200,
    borderRadius: designTokens.borderRadius.lg,
  },

  // Cards
  resultCard: {
    marginBottom: designTokens.spacing.lg,
  },
  cardTitle: {
    fontSize: designTokens.typography.fontSize.lg,
    fontWeight: designTokens.typography.fontWeight.semibold,
    color: designTokens.colors.text.primary,
    marginBottom: designTokens.spacing.md,
  },

  // Cost breakdown
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: designTokens.spacing.sm,
  },
  costLabel: {
    fontSize: designTokens.typography.fontSize.base,
    fontWeight: designTokens.typography.fontWeight.semibold,
    color: designTokens.colors.text.primary,
    flex: 1,
  },
  costValue: {
    fontSize: designTokens.typography.fontSize.base,
    fontWeight: designTokens.typography.fontWeight.bold,
    color: designTokens.colors.primary[600],
  },
  costBreakdown: {
    marginTop: designTokens.spacing.sm,
    paddingTop: designTokens.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: designTokens.colors.border,
  },
  costSubLabel: {
    fontSize: designTokens.typography.fontSize.sm,
    color: designTokens.colors.text.secondary,
    flex: 1,
  },
  costSubValue: {
    fontSize: designTokens.typography.fontSize.sm,
    fontWeight: designTokens.typography.fontWeight.medium,
    color: designTokens.colors.text.primary,
  },

  // Timeline
  timelineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: designTokens.spacing.sm,
  },
  timelineLabel: {
    fontSize: designTokens.typography.fontSize.base,
    color: designTokens.colors.text.secondary,
  },
  timelineValue: {
    fontSize: designTokens.typography.fontSize.base,
    fontWeight: designTokens.typography.fontWeight.medium,
    color: designTokens.colors.text.primary,
  },
  difficultyBadge: {
    fontSize: designTokens.typography.fontSize.sm,
    fontWeight: designTokens.typography.fontWeight.medium,
    color: designTokens.colors.secondary[600],
    backgroundColor: designTokens.colors.secondary[100],
    paddingHorizontal: designTokens.spacing.sm,
    paddingVertical: designTokens.spacing.xs,
    borderRadius: designTokens.borderRadius.md,
    alignSelf: 'flex-start',
    marginTop: designTokens.spacing.sm,
  },

  // Tools
  toolRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: designTokens.spacing.xs,
  },
  toolName: {
    fontSize: designTokens.typography.fontSize.sm,
    color: designTokens.colors.text.primary,
    flex: 1,
  },
  toolPrice: {
    fontSize: designTokens.typography.fontSize.xs,
    color: designTokens.colors.text.tertiary,
  },
  moreTools: {
    fontSize: designTokens.typography.fontSize.xs,
    color: designTokens.colors.text.tertiary,
    fontStyle: 'italic',
    marginTop: designTokens.spacing.xs,
  },

  // Recommendations
  recommendationsCard: {
    backgroundColor: designTokens.colors.info + '10',
    borderColor: designTokens.colors.info + '40',
    marginBottom: designTokens.spacing.lg,
  },
  recommendationText: {
    fontSize: designTokens.typography.fontSize.sm,
    color: designTokens.colors.text.secondary,
    lineHeight: designTokens.typography.lineHeight.lg,
    marginBottom: designTokens.spacing.xs,
  },

  // Warnings
  warningCard: {
    backgroundColor: designTokens.colors.warning + '10',
    borderColor: designTokens.colors.warning + '40',
    marginBottom: designTokens.spacing.lg,
  },
  warningTitle: {
    fontSize: designTokens.typography.fontSize.base,
    fontWeight: designTokens.typography.fontWeight.semibold,
    color: designTokens.colors.warning,
    marginBottom: designTokens.spacing.sm,
  },
  warningText: {
    fontSize: designTokens.typography.fontSize.sm,
    color: designTokens.colors.text.secondary,
    lineHeight: designTokens.typography.lineHeight.lg,
    marginBottom: designTokens.spacing.xs,
  },

  // Metadata
  metaCard: {
    backgroundColor: designTokens.colors.neutral[50],
    borderColor: designTokens.colors.neutral[200],
    marginBottom: designTokens.spacing.xl,
  },
  metaTitle: {
    fontSize: designTokens.typography.fontSize.sm,
    fontWeight: designTokens.typography.fontWeight.semibold,
    color: designTokens.colors.text.tertiary,
    marginBottom: designTokens.spacing.xs,
  },
  metaText: {
    fontSize: designTokens.typography.fontSize.xs,
    color: designTokens.colors.text.tertiary,
  },

  // Buttons
  buttonContainer: {
    gap: designTokens.spacing.md,
  },
  button: {
    marginBottom: designTokens.spacing.sm,
  },
});