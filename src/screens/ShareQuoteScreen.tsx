import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
  ActivityIndicator,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import designTokens from '../styles/designTokens';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

export default function ShareQuoteScreen({ navigation, route }: any) {
  const { quote } = route.params;
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const formatQuoteText = () => {
    let quoteText = `📋 QUOTE: ${quote.quoteName || 'Construction Quote'}\n\n`;

    if (quote.customerName) {
      quoteText += `👤 Customer: ${quote.customerName}\n`;
    }

    quoteText += `📍 Property: ${quote.siteNotes?.address || 'Not specified'}\n`;
    quoteText += `🏗️ Job Type: ${quote.siteNotes?.jobType || 'General'}\n\n`;

    // Show Your Quote Total (finalCost) prominently
    if (quote.finalCost) {
      quoteText += `💰 YOUR QUOTE TOTAL: £${quote.finalCost.toLocaleString()}\n\n`;
    } else {
      quoteText += `💰 ESTIMATED TOTAL: £${quote.totalCost?.min?.toLocaleString() || 0} - £${quote.totalCost?.max?.toLocaleString() || 0}\n\n`;
    }

    quoteText += `📋 BREAKDOWN:\n`;
    quote.tasks?.forEach((task: any, index: number) => {
      quoteText += `${index + 1}. ${task.description}\n`;
      // Show Your Price per line item
      const yourPrice = task.finalPrice || task.estimatedCost?.max || 0;
      quoteText += `   Your Price: £${yourPrice.toLocaleString()}\n\n`;
    });

    if (quote.projectNotes) {
      quoteText += `📝 Notes:\n${quote.projectNotes}\n\n`;
    }

    quoteText += `⚡ Generated with AskToddy - Professional Quotes in Minutes\n`;
    quoteText += `📅 Quote Date: ${new Date(quote.timestamp || Date.now()).toLocaleDateString()}`;

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

  const generateQuoteHTML = () => {
    const quoteDate = new Date(quote.timestamp || Date.now()).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const totalAmount = quote.finalCost
      ? `£${quote.finalCost.toLocaleString()}`
      : `£${quote.totalCost?.min?.toLocaleString() || 0} - £${quote.totalCost?.max?.toLocaleString() || 0}`;

    const tasksHTML =
      quote.tasks
        ?.map((task: any, index: number) => {
          const price = task.finalPrice || task.estimatedCost?.max || 0;
          return `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${index + 1}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${task.description || 'Item'}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 500;">£${price.toLocaleString()}</td>
        </tr>
      `;
        })
        .join('') || '';

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Quote - ${quote.quoteName || 'Construction Quote'}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              color: #1f2937;
              line-height: 1.5;
              padding: 40px;
              max-width: 800px;
              margin: 0 auto;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 40px;
              padding-bottom: 20px;
              border-bottom: 3px solid #2563eb;
            }
            .logo {
              font-size: 28px;
              font-weight: 700;
              color: #2563eb;
            }
            .logo-tagline {
              font-size: 12px;
              color: #6b7280;
              margin-top: 4px;
            }
            .quote-info {
              text-align: right;
            }
            .quote-title {
              font-size: 24px;
              font-weight: 700;
              color: #1f2937;
              margin-bottom: 8px;
            }
            .quote-date {
              font-size: 14px;
              color: #6b7280;
            }
            .section {
              margin-bottom: 32px;
            }
            .section-title {
              font-size: 14px;
              font-weight: 600;
              color: #6b7280;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 12px;
            }
            .customer-details {
              background: #f9fafb;
              padding: 20px;
              border-radius: 8px;
            }
            .detail-row {
              display: flex;
              margin-bottom: 8px;
            }
            .detail-label {
              font-weight: 500;
              width: 120px;
              color: #4b5563;
            }
            .detail-value {
              color: #1f2937;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 12px;
            }
            th {
              background: #f3f4f6;
              padding: 12px;
              text-align: left;
              font-weight: 600;
              font-size: 14px;
              color: #374151;
            }
            th:last-child {
              text-align: right;
            }
            .total-row {
              background: #2563eb;
              color: white;
            }
            .total-row td {
              padding: 16px 12px;
              font-weight: 700;
              font-size: 18px;
              border: none;
            }
            .notes {
              background: #fffbeb;
              padding: 20px;
              border-radius: 8px;
              border-left: 4px solid #f59e0b;
            }
            .notes p {
              color: #92400e;
              font-size: 14px;
            }
            .footer {
              margin-top: 60px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              text-align: center;
            }
            .footer p {
              font-size: 12px;
              color: #9ca3af;
            }
            .validity {
              background: #ecfdf5;
              padding: 12px 20px;
              border-radius: 8px;
              text-align: center;
              margin-top: 24px;
            }
            .validity p {
              color: #065f46;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="logo">AskToddy</div>
              <div class="logo-tagline">Professional Construction Quotes</div>
            </div>
            <div class="quote-info">
              <div class="quote-title">QUOTE</div>
              <div class="quote-date">${quoteDate}</div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Customer Details</div>
            <div class="customer-details">
              ${
                quote.customerName
                  ? `
                <div class="detail-row">
                  <span class="detail-label">Customer:</span>
                  <span class="detail-value">${quote.customerName}</span>
                </div>
              `
                  : ''
              }
              <div class="detail-row">
                <span class="detail-label">Property:</span>
                <span class="detail-value">${quote.siteNotes?.address || 'Not specified'}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Job Type:</span>
                <span class="detail-value">${quote.siteNotes?.jobType || 'General Construction'}</span>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Quote Breakdown</div>
            <table>
              <thead>
                <tr>
                  <th style="width: 50px;">#</th>
                  <th>Description</th>
                  <th style="width: 120px;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${tasksHTML}
                <tr class="total-row">
                  <td colspan="2">TOTAL</td>
                  <td style="text-align: right;">${totalAmount}</td>
                </tr>
              </tbody>
            </table>
          </div>

          ${
            quote.projectNotes
              ? `
            <div class="section">
              <div class="section-title">Notes</div>
              <div class="notes">
                <p>${quote.projectNotes}</p>
              </div>
            </div>
          `
              : ''
          }

          <div class="validity">
            <p>This quote is valid for 30 days from the date of issue.</p>
          </div>

          <div class="footer">
            <p>Generated with AskToddy - Professional Construction Quotes</p>
            <p style="margin-top: 4px;">© ${new Date().getFullYear()} AskToddy. All rights reserved.</p>
          </div>
        </body>
      </html>
    `;
  };

  const handlePDF = async () => {
    try {
      setIsGeneratingPDF(true);

      const html = generateQuoteHTML();
      const { uri } = await Print.printToFileAsync({
        html,
        base64: false,
      });

      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Share Quote PDF',
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert(
          'PDF Created',
          'PDF has been generated but sharing is not available on this device.'
        );
      }
    } catch (error) {
      console.error('PDF generation error:', error);
      Alert.alert('Error', 'Failed to generate PDF. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleCopyToClipboard = async () => {
    try {
      await Clipboard.setStringAsync(formatQuoteText());
      Alert.alert('Copied!', 'Quote text copied to clipboard');
    } catch (error) {
      console.error('Clipboard error:', error);
      Alert.alert('Error', 'Failed to copy to clipboard');
    }
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

          <TouchableOpacity
            style={[styles.shareButton, isGeneratingPDF && styles.shareButtonDisabled]}
            onPress={handlePDF}
            disabled={isGeneratingPDF}
          >
            <View style={styles.shareIcon}>
              {isGeneratingPDF ? (
                <ActivityIndicator size="small" color={designTokens.colors.primary[500]} />
              ) : (
                <Ionicons
                  name="document-outline"
                  size={24}
                  color={designTokens.colors.primary[500]}
                />
              )}
            </View>
            <View style={styles.shareContent}>
              <Text style={styles.shareOptionTitle}>Export PDF</Text>
              <Text style={styles.shareOptionSubtitle}>
                {isGeneratingPDF ? 'Generating PDF...' : 'Download professional PDF quote'}
              </Text>
            </View>
            {!isGeneratingPDF && (
              <Ionicons
                name="chevron-forward"
                size={20}
                color={designTokens.colors.text.tertiary}
              />
            )}
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
  shareButtonDisabled: {
    opacity: 0.7,
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
