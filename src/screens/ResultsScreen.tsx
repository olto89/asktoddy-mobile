import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../App';
import designTokens from '../styles/designTokens';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

type ResultsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Results'>;
type ResultsScreenRouteProp = RouteProp<RootStackParamList, 'Results'>;

interface Props {
  navigation: ResultsScreenNavigationProp;
  route: ResultsScreenRouteProp;
}

export default function ResultsScreen({ navigation, route }: Props) {
  const { imageUri, analysis } = route.params;

  const handleNewAnalysis = () => {
    navigation.navigate('Camera');
  };

  const handleBackToHome = () => {
    navigation.navigate('Home');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Quote Results</Text>
        <Text style={styles.subtitle}>
          Results screen will be implemented in ASK-26
        </Text>

        <Card variant="elevated" style={styles.resultCard}>
          <Text style={styles.cardTitle}>Mock Quote Results</Text>
          <Text style={styles.cardText}>
            • Project Type: Extension{'\n'}
            • Estimated Cost: £15,000 - £25,000{'\n'}
            • Timeline: 4-6 weeks{'\n'}
            • Materials: £8,000{'\n'}
            • Labor: £12,000{'\n'}
            • Tools needed: Excavator, Concrete mixer
          </Text>
        </Card>

        <Card variant="outlined" style={styles.debugCard}>
          <Text style={styles.debugTitle}>Debug Info</Text>
          <Text style={styles.debugText}>
            Image URI: {imageUri}{'\n'}
            Analysis Data: {JSON.stringify(analysis, null, 2)}
          </Text>
        </Card>

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
    marginBottom: designTokens.spacing.xl,
    lineHeight: designTokens.typography.lineHeight.lg,
  },
  resultCard: {
    marginBottom: designTokens.spacing.lg,
  },
  cardTitle: {
    fontSize: designTokens.typography.fontSize.lg,
    fontWeight: designTokens.typography.fontWeight.semibold,
    color: designTokens.colors.text.primary,
    marginBottom: designTokens.spacing.sm,
  },
  cardText: {
    fontSize: designTokens.typography.fontSize.sm,
    color: designTokens.colors.text.secondary,
    lineHeight: designTokens.typography.lineHeight.lg,
  },
  debugCard: {
    backgroundColor: designTokens.colors.neutral[50],
    borderColor: designTokens.colors.neutral[200],
    marginBottom: designTokens.spacing.xl,
  },
  debugTitle: {
    fontSize: designTokens.typography.fontSize.sm,
    fontWeight: designTokens.typography.fontWeight.semibold,
    color: designTokens.colors.text.tertiary,
    marginBottom: designTokens.spacing.xs,
  },
  debugText: {
    fontSize: designTokens.typography.fontSize.xs,
    color: designTokens.colors.text.tertiary,
    fontFamily: 'monospace',
  },
  buttonContainer: {
    gap: designTokens.spacing.md,
  },
  button: {
    marginBottom: designTokens.spacing.sm,
  },
});