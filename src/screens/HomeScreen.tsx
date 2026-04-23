import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { Ionicons } from '@expo/vector-icons';
import designTokens from '../styles/designTokens';
import { AppIcons, IconSize } from '../styles/iconRegistry';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

interface Props {
  navigation: HomeScreenNavigationProp;
}

export default function HomeScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Welcome to AskToddy</Text>
          <Text style={styles.subtitle}>AI-powered construction quoting at your fingertips</Text>
        </View>

        <View style={styles.features}>
          <Card variant="elevated" style={styles.featureCard}>
            <View style={styles.featureTitleRow}>
              <Ionicons
                name={AppIcons.chatAndQuote}
                size={IconSize.medium}
                color={designTokens.colors.primary[500]}
              />
              <Text style={styles.featureTitle}>Chat & Quote</Text>
            </View>
            <Text style={styles.featureText}>
              Chat with Toddy, share photos, and get instant cost estimates with AI-powered analysis
            </Text>
          </Card>

          <Card variant="elevated" style={styles.featureCard}>
            <View style={styles.featureTitleRow}>
              <Ionicons
                name={AppIcons.detailedAnalysis}
                size={IconSize.medium}
                color={designTokens.colors.primary[500]}
              />
              <Text style={styles.featureTitle}>Detailed Analysis</Text>
            </View>
            <Text style={styles.featureText}>
              Get comprehensive breakdown of materials, labor costs, timeline, and tool requirements
            </Text>
          </Card>

          <Card variant="elevated" style={styles.featureCard}>
            <View style={styles.featureTitleRow}>
              <Ionicons
                name={AppIcons.smartRecommendations}
                size={IconSize.medium}
                color={designTokens.colors.primary[500]}
              />
              <Text style={styles.featureTitle}>Smart Recommendations</Text>
            </View>
            <Text style={styles.featureText}>
              Find the right tools, materials, and contractors based on your location and project
              needs
            </Text>
          </Card>

          <Card variant="elevated" style={styles.featureCard}>
            <View style={styles.featureTitleRow}>
              <Ionicons
                name={AppIcons.customPricing}
                size={IconSize.medium}
                color={designTokens.colors.primary[500]}
              />
              <Text style={styles.featureTitle}>Custom Pricing</Text>
            </View>
            <Text style={styles.featureText}>
              Adjust quotes with your preferred suppliers and provide feedback to improve accuracy
            </Text>
          </Card>
        </View>

        <Button
          title="Start Chat with Toddy"
          onPress={() => navigation.navigate('Chat')}
          size="lg"
          fullWidth
          style={styles.cameraButton}
        />

        <Text style={styles.bottomText}>
          Chat with Toddy about your construction project and get professional advice instantly
        </Text>
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
  header: {
    alignItems: 'center',
    marginBottom: designTokens.spacing['2xl'],
    marginTop: designTokens.spacing.lg,
  },
  title: {
    fontSize: designTokens.typography.fontSize['3xl'],
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
    paddingHorizontal: designTokens.spacing.md,
  },
  features: {
    marginBottom: designTokens.spacing['2xl'],
  },
  featureCard: {
    marginBottom: designTokens.spacing.lg,
  },
  featureTitleRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: designTokens.spacing.sm,
    marginBottom: designTokens.spacing.sm,
  },
  featureTitle: {
    fontSize: designTokens.typography.fontSize.lg,
    fontWeight: designTokens.typography.fontWeight.semibold,
    color: designTokens.colors.text.primary,
  },
  featureText: {
    fontSize: designTokens.typography.fontSize.sm,
    color: designTokens.colors.text.secondary,
    lineHeight: designTokens.typography.lineHeight.lg,
  },
  cameraButton: {
    marginBottom: designTokens.spacing.xl,
  },
  bottomText: {
    fontSize: designTokens.typography.fontSize.sm,
    color: designTokens.colors.text.tertiary,
    textAlign: 'center',
    lineHeight: designTokens.typography.lineHeight.lg,
    marginBottom: designTokens.spacing.lg,
  },
});
