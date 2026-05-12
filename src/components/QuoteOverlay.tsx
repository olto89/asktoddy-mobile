/**
 * QuoteOverlay - Full-screen interactive quote editor
 * Enhanced version of InteractiveQuoteTable as a modal
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  SafeAreaView,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import designTokens from '../styles/designTokens';
import InteractiveQuoteTable from './InteractiveQuoteTable';

interface QuoteOverlayProps {
  visible: boolean;
  onClose: () => void;
  analysis: any;
  onGeneratePDF: (updatedAnalysis: any) => void;
  onUpdateQuote: (updatedAnalysis: any) => void;
}

const { height: screenHeight } = Dimensions.get('window');

export default function QuoteOverlay({
  visible,
  onClose,
  analysis,
  onGeneratePDF,
  onUpdateQuote,
}: QuoteOverlayProps) {
  const [slideAnim] = useState(new Animated.Value(screenHeight));
  const [showPDFOptions, setShowPDFOptions] = useState(false);

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: screenHeight,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  const handleGeneratePDF = (updatedAnalysis: any) => {
    if (analysis.confidence >= 85) {
      setShowPDFOptions(true);
    } else {
      onGeneratePDF(updatedAnalysis);
    }
  };

  const handlePDFWithLogo = (updatedAnalysis: any) => {
    setShowPDFOptions(false);
    // TODO: Open logo selection/upload flow
    onGeneratePDF({
      ...updatedAnalysis,
      includeLogo: true,
      generateProjectPlan: true,
    });
  };

  const handleBasicPDF = (updatedAnalysis: any) => {
    setShowPDFOptions(false);
    onGeneratePDF(updatedAnalysis);
  };

  if (!analysis) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.modalOverlay}>
        {/* Background blur/dim */}
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose} />

        {/* Main content */}
        <Animated.View
          style={[
            styles.modalContent,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Text style={styles.title}>Interactive Quote</Text>
                <View style={styles.confidenceBadge}>
                  <Text style={styles.confidenceText}>{analysis.confidence || 75}% Complete</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                <Ionicons name="close" size={24} color={designTokens.colors.text.primary} />
              </TouchableOpacity>
            </View>

            {/* Drag handle */}
            <View style={styles.dragHandle} />

            {/* Interactive Quote Table */}
            <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
              <InteractiveQuoteTable
                analysis={analysis}
                onGeneratePDF={handleGeneratePDF}
                onUpdateQuote={onUpdateQuote}
              />
            </ScrollView>
          </SafeAreaView>
        </Animated.View>

        {/* PDF Options Modal */}
        {showPDFOptions && (
          <View style={styles.pdfOptionsOverlay}>
            <View style={styles.pdfOptionsModal}>
              <View style={styles.pdfOptionsHeader}>
                <Text style={styles.pdfOptionsTitle}>Generate Professional Quote</Text>
                <Text style={styles.pdfOptionsSubtitle}>
                  Your quote is ready! Choose your output format:
                </Text>
              </View>

              <TouchableOpacity
                style={styles.pdfOption}
                onPress={() => handlePDFWithLogo(analysis)}
              >
                <View style={styles.pdfOptionIcon}>
                  <Ionicons name="business" size={24} color={designTokens.colors.primary[500]} />
                </View>
                <View style={styles.pdfOptionContent}>
                  <Text style={styles.pdfOptionTitle}>Professional Package</Text>
                  <Text style={styles.pdfOptionDescription}>
                    • PDF with your company logo • Detailed project plan • Material shopping list •
                    Timeline breakdown
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={designTokens.colors.text.secondary}
                />
              </TouchableOpacity>

              <TouchableOpacity style={styles.pdfOption} onPress={() => handleBasicPDF(analysis)}>
                <View style={styles.pdfOptionIcon}>
                  <Ionicons name="document-text" size={24} color={designTokens.colors.grey[500]} />
                </View>
                <View style={styles.pdfOptionContent}>
                  <Text style={styles.pdfOptionTitle}>Basic Quote</Text>
                  <Text style={styles.pdfOptionDescription}>
                    • Simple PDF quote • Cost breakdown • No branding
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={designTokens.colors.text.secondary}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowPDFOptions(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: designTokens.colors.background.primary,
    borderTopLeftRadius: designTokens.borderRadius.xxl,
    borderTopRightRadius: designTokens.borderRadius.xxl,
    maxHeight: screenHeight * 0.95,
    minHeight: screenHeight * 0.85,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: designTokens.spacing.lg,
    paddingVertical: designTokens.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: designTokens.colors.grey[200],
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: designTokens.spacing.md,
  },
  title: {
    fontSize: designTokens.typography.fontSize.xl,
    fontWeight: designTokens.typography.fontWeight.bold as any,
    color: designTokens.colors.text.primary,
  },
  confidenceBadge: {
    backgroundColor: designTokens.colors.primary[100],
    paddingHorizontal: designTokens.spacing.sm,
    paddingVertical: designTokens.spacing.xs,
    borderRadius: designTokens.borderRadius.full,
  },
  confidenceText: {
    fontSize: designTokens.typography.fontSize.xs,
    fontWeight: designTokens.typography.fontWeight.semibold as any,
    color: designTokens.colors.primary[700],
  },
  closeButton: {
    padding: designTokens.spacing.sm,
    borderRadius: designTokens.borderRadius.full,
    backgroundColor: designTokens.colors.grey[100],
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: designTokens.colors.grey[300],
    borderRadius: 2,
    alignSelf: 'center',
    marginVertical: designTokens.spacing.sm,
  },
  scrollContainer: {
    flex: 1,
  },

  // PDF Options Modal
  pdfOptionsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pdfOptionsModal: {
    backgroundColor: designTokens.colors.background.primary,
    borderRadius: designTokens.borderRadius.xl,
    margin: designTokens.spacing.lg,
    padding: designTokens.spacing.lg,
    width: '90%',
    maxWidth: 400,
  },
  pdfOptionsHeader: {
    marginBottom: designTokens.spacing.lg,
    alignItems: 'center',
  },
  pdfOptionsTitle: {
    fontSize: designTokens.typography.fontSize.xl,
    fontWeight: designTokens.typography.fontWeight.bold as any,
    color: designTokens.colors.text.primary,
    marginBottom: designTokens.spacing.sm,
  },
  pdfOptionsSubtitle: {
    fontSize: designTokens.typography.fontSize.base,
    color: designTokens.colors.text.secondary,
    textAlign: 'center',
  },
  pdfOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: designTokens.spacing.md,
    borderWidth: 1,
    borderColor: designTokens.colors.grey[200],
    borderRadius: designTokens.borderRadius.lg,
    marginBottom: designTokens.spacing.md,
    gap: designTokens.spacing.md,
  },
  pdfOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: designTokens.colors.grey[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  pdfOptionContent: {
    flex: 1,
  },
  pdfOptionTitle: {
    fontSize: designTokens.typography.fontSize.base,
    fontWeight: designTokens.typography.fontWeight.semibold as any,
    color: designTokens.colors.text.primary,
    marginBottom: designTokens.spacing.xs,
  },
  pdfOptionDescription: {
    fontSize: designTokens.typography.fontSize.sm,
    color: designTokens.colors.text.secondary,
    lineHeight: 18,
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: designTokens.spacing.md,
  },
  cancelButtonText: {
    fontSize: designTokens.typography.fontSize.base,
    color: designTokens.colors.text.secondary,
  },
});
