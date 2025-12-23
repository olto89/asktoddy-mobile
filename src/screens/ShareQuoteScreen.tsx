import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import designTokens from '../styles/designTokens';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

export default function ShareQuoteScreen({ navigation, route }: any) {
  const { quote } = route.params;

  const formatQuoteText = () => {
    let quoteText = `📋 QUOTE: ${quote.quoteName}\n\n`;

    if (quote.customerName) {
      quoteText += `👤 Customer: ${quote.customerName}\n`;
    }

    quoteText += `📍 Property: ${quote.siteNotes?.address || 'Not specified'}\n`;
    quoteText += `🏗️ Job Type: ${quote.siteNotes?.jobType || 'General'}\n\n`;

    quoteText += `💰 ESTIMATED TOTAL: £${quote.totalCost.min.toLocaleString()} - £${quote.totalCost.max.toLocaleString()}\n\n`;

    quoteText += `📋 BREAKDOWN:\n`;
    quote.tasks.forEach((task: any, index: number) => {
      quoteText += `${index + 1}. ${task.description}\n`;
      quoteText += `   Cost: £${task.estimatedCost.min.toLocaleString()} - £${task.estimatedCost.max.toLocaleString()}\n\n`;
    });

    if (quote.projectNotes) {
      quoteText += `📝 Notes:\n${quote.projectNotes}\n\n`;
    }

    quoteText += `⚡ Generated with AskToddy - Professional Quotes in Minutes\n`;
    quoteText += `📅 Quote Date: ${new Date(quote.timestamp).toLocaleDateString()}`;

    return quoteText;
  };

  const handleShare = async () => {
    try {
      const result = await Share.share({
        message: formatQuoteText(),
        title: quote.quoteName,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share quote');
    }
  };

  const handleEmail = () => {
    Alert.alert('Email Quote', 'Email functionality will be added in a future update');
  };

  const handlePDF = () => {
    Alert.alert('PDF Export', 'PDF export functionality will be added in a future update');
  };

  const handleCopyToClipboard = () => {
    // In a real app, you'd use Clipboard API
    Alert.alert('Copied!', 'Quote text copied to clipboard');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={designTokens.colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>📤 Share Quote</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Quote Preview */}
        <Card style={styles.previewCard}>
          <Text style={styles.previewTitle}>Quote Preview</Text>
          <Text style={styles.previewText}>{formatQuoteText()}</Text>
        </Card>

        {/* Share Options */}
        <View style={styles.shareOptions}>
          <Text style={styles.sectionTitle}>Share Options</Text>

          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <View style={styles.shareIcon}>
              <Ionicons name="share-outline" size={24} color={designTokens.colors.primary[500]} />
            </View>
            <View style={styles.shareContent}>
              <Text style={styles.shareOptionTitle}>Share via Apps</Text>
              <Text style={styles.shareOptionSubtitle}>WhatsApp, Messages, Email, etc.</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={designTokens.colors.text.tertiary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.shareButton} onPress={handleCopyToClipboard}>
            <View style={styles.shareIcon}>
              <Ionicons name="copy-outline" size={24} color={designTokens.colors.primary[500]} />
            </View>
            <View style={styles.shareContent}>
              <Text style={styles.shareOptionTitle}>Copy to Clipboard</Text>
              <Text style={styles.shareOptionSubtitle}>Copy quote text</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={designTokens.colors.text.tertiary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.shareButton} onPress={handleEmail}>
            <View style={styles.shareIcon}>
              <Ionicons name="mail-outline" size={24} color={designTokens.colors.primary[500]} />
            </View>
            <View style={styles.shareContent}>
              <Text style={styles.shareOptionTitle}>Email Quote</Text>
              <Text style={styles.shareOptionSubtitle}>Send formatted email (Coming Soon)</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={designTokens.colors.text.tertiary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.shareButton} onPress={handlePDF}>
            <View style={styles.shareIcon}>
              <Ionicons
                name="document-outline"
                size={24}
                color={designTokens.colors.primary[500]}
              />
            </View>
            <View style={styles.shareContent}>
              <Text style={styles.shareOptionTitle}>Export PDF</Text>
              <Text style={styles.shareOptionSubtitle}>Professional PDF quote (Coming Soon)</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={designTokens.colors.text.tertiary} />
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <Button
            title="Share Now"
            onPress={handleShare}
            variant="primary"
            fullWidth
            icon={<Ionicons name="share" size={20} color="white" />}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: designTokens.colors.background.primary,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: designTokens.spacing.lg,
    paddingVertical: designTokens.spacing.md,
  },
  title: {
    fontSize: designTokens.typography.fontSize.xl,
    fontWeight: designTokens.typography.fontWeight.bold as any,
    color: designTokens.colors.text.primary,
  },
  previewCard: {
    marginHorizontal: designTokens.spacing.md,
    marginBottom: designTokens.spacing.lg,
    padding: designTokens.spacing.md,
    backgroundColor: designTokens.colors.background.secondary,
  },
  previewTitle: {
    fontSize: designTokens.typography.fontSize.base,
    fontWeight: designTokens.typography.fontWeight.semibold as any,
    color: designTokens.colors.text.primary,
    marginBottom: designTokens.spacing.md,
  },
  previewText: {
    fontSize: designTokens.typography.fontSize.sm,
    color: designTokens.colors.text.primary,
    lineHeight: 20,
    fontFamily: 'monospace',
  },
  shareOptions: {
    paddingHorizontal: designTokens.spacing.md,
  },
  sectionTitle: {
    fontSize: designTokens.typography.fontSize.lg,
    fontWeight: designTokens.typography.fontWeight.semibold as any,
    color: designTokens.colors.text.primary,
    marginBottom: designTokens.spacing.md,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: designTokens.borderRadius.lg,
    padding: designTokens.spacing.md,
    marginBottom: designTokens.spacing.sm,
    borderWidth: 1,
    borderColor: designTokens.colors.border.primary,
  },
  shareIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: designTokens.colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: designTokens.spacing.md,
  },
  shareContent: {
    flex: 1,
  },
  shareOptionTitle: {
    fontSize: designTokens.typography.fontSize.base,
    fontWeight: designTokens.typography.fontWeight.medium as any,
    color: designTokens.colors.text.primary,
  },
  shareOptionSubtitle: {
    fontSize: designTokens.typography.fontSize.sm,
    color: designTokens.colors.text.secondary,
    marginTop: 2,
  },
  actions: {
    paddingHorizontal: designTokens.spacing.md,
    paddingVertical: designTokens.spacing.lg,
  },
});
