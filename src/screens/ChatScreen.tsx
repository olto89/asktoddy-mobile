/**
 * ChatScreen - ChatGPT-style interface for AskToddy
 * Thin client that ONLY calls Supabase Edge Functions
 * NO business logic - all AI processing happens in the backend
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Alert,
  Dimensions,
  StatusBar,
  HapticFeedback,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';
import designTokens from '../styles/designTokens';
import { Ionicons } from '@expo/vector-icons';
import { useImagePicker } from '../hooks/useImagePicker';
import { useLocation } from '../hooks/useLocation';
import ToddyHeader from '../components/ToddyHeader';

// Get device dimensions for responsive design
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isSmallDevice = screenWidth < 375;
const isIOS = Platform.OS === 'ios';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  imageUri?: string;
  isLoading?: boolean;
  error?: boolean;
  showDocumentButtons?: boolean;
  analysis?: any; // Store full analysis for document generation
}

export default function ChatScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const { location, region, pricingContext, loading: locationLoading } = useLocation(true);

  // Update greeting message when location is loaded
  useEffect(() => {
    if (pricingContext && !locationLoading) {
      const locationInfo =
        region?.name !== 'Midlands'
          ? `\n\n📍 I've detected you're in ${pricingContext.city}, ${region?.name}. I'll use local pricing for your area (${region?.pricingMultiplier === 1 ? 'baseline' : region?.pricingMultiplier > 1 ? `+${Math.round((region?.pricingMultiplier - 1) * 100)}%` : `-${Math.round((1 - region?.pricingMultiplier) * 100)}%`} vs UK average).`
          : `\n\n📍 I'm using ${pricingContext.city} pricing for your quotes.`;

      setMessages([
        {
          id: '1',
          role: 'assistant',
          content: `Hi! I'm Toddy, your construction cost expert 👋\n\nI provide detailed quotes for any building project:\n• Full cost breakdowns (materials + labour + tools)\n• Project timelines and phases\n• What each trade will charge\n• VAT and contingency costs${locationInfo}\n\nTell me about your project and I'll give you a comprehensive quote! You can also upload photos.`,
          timestamp: new Date().toISOString(),
        },
      ]);
    }
  }, [pricingContext, region, locationLoading]);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content:
        "Hi! I'm Toddy, your construction cost expert 👋\n\nI provide detailed quotes for any building project:\n• Full cost breakdowns (materials + labour + tools)\n• Project timelines and phases\n• What each trade will charge\n• VAT and contingency costs\n\nTell me about your project and I'll give you a comprehensive quote! You can also upload photos.",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Use image picker hook
  const { selectedImage, showImagePicker, clearImage } = useImagePicker({
    onImageSelected: uri => {
      console.log('Image selected:', uri);
    },
  });

  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);

  // Auto-scroll to bottom when new messages are added with animation
  useEffect(() => {
    if (messages.length > 0) {
      // Use LayoutAnimation for smooth transitions
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  /**
   * Send message to analyze-construction Edge Function
   * NO AI logic here - just API call
   */
  const handleSend = async () => {
    if (!inputText.trim() && !selectedImage) return;

    // Native haptic feedback
    if (isIOS) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText.trim(),
      timestamp: new Date().toISOString(),
      imageUri: selectedImage || undefined,
    };

    // Animate message addition
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    // Add user message to chat
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    clearImage();

    // Add loading message
    const loadingMessage: Message = {
      id: `${Date.now()}_loading`,
      role: 'assistant',
      content: 'Analyzing your request...',
      timestamp: new Date().toISOString(),
      isLoading: true,
    };
    setMessages(prev => [...prev, loadingMessage]);

    setIsLoading(true);

    try {
      // Development fallback - check if we're in development mode
      const isDevelopment = __DEV__ || process.env.EXPO_PUBLIC_APP_ENV === 'development';

      let analysis;

      if (isDevelopment) {
        // MOCK DATA: Replace with real Edge Function in production
        // See MOCK_DATA_TRACKING.md for details
        console.log('🔧 Using development mock response with regional pricing');
        await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API delay

        // Apply regional pricing multiplier to mock data
        const multiplier = pricingContext?.pricingMultiplier || 1.0;
        const baseMaterials = { min: 1500, max: 3500 };
        const baseLabor = { min: 2000, max: 4500 };

        analysis = {
          projectType: detectProjectType(userMessage.content),
          description: `I can help you with your ${detectProjectType(userMessage.content).toLowerCase()} project! Based on your location in ${pricingContext?.city || 'your area'}, ${pricingContext?.region || 'UK'}, here's what I found.`,
          costBreakdown: {
            materials: {
              min: Math.round(baseMaterials.min * multiplier),
              max: Math.round(baseMaterials.max * multiplier),
            },
            labor: {
              min: Math.round(baseLabor.min * multiplier),
              max: Math.round(baseLabor.max * multiplier),
            },
            total: {
              min: Math.round((baseMaterials.min + baseLabor.min) * multiplier),
              max: Math.round((baseMaterials.max + baseLabor.max) * multiplier),
            },
          },
          timeline: {
            diy: '2-3 weeks', // HARDCODED: Replace with real AI analysis
            professional: '1-2 weeks', // HARDCODED: Replace with real AI analysis
          },
          recommendations: [
            // HARDCODED: Replace with real AI recommendations
            'Get multiple quotes from local contractors',
            'Consider seasonal pricing variations',
            'Check building regulations in your area',
          ],
          requiresProfessional: true, // HARDCODED: Replace with real AI analysis
          professionalReasons: ['Safety requirements', 'Building regulations'], // HARDCODED
          confidence: 85, // HARDCODED: Replace with real AI confidence score
          aiProvider: 'development-mock', // HARDCODED: Development identifier
        };
      } else {
        // Call analyze-construction Edge Function with real location
        const { data, error } = await supabase.functions.invoke('analyze-construction', {
          body: {
            message: userMessage.content || undefined,
            imageUri: userMessage.imageUri,
            context: {
              location: pricingContext?.location || 'Unknown location',
              city: pricingContext?.city || 'Unknown',
              postcode: pricingContext?.postcode,
              region: pricingContext?.region || 'UK',
              regionCode: pricingContext?.regionCode,
              pricingMultiplier: pricingContext?.pricingMultiplier || 1.0,
              coordinates: pricingContext?.coordinates,
              projectType: detectProjectType(userMessage.content),
              preferredProvider: 'auto',
            },
            history: messages.slice(-6).map(m => ({
              role: m.role,
              content: m.content,
              timestamp: m.timestamp,
            })),
          },
        });

        if (error) throw error;

        if (data?.success && data?.data) {
          analysis = data.data;
        } else {
          throw new Error('Invalid response from server');
        }
      }

      // Format response message
      const responseContent = formatAnalysisResponse(analysis);

      // Replace loading message with actual response
      setMessages(prev =>
        prev.map(msg =>
          msg.id === loadingMessage.id
            ? {
                id: `${Date.now()}_response`,
                role: 'assistant',
                content: responseContent,
                timestamp: new Date().toISOString(),
                showDocumentButtons: true,
                analysis: analysis, // Store for document generation
              }
            : msg
        )
      );
    } catch (error) {
      console.error('Chat error:', error);

      // Replace loading message with error
      setMessages(prev =>
        prev.map(msg =>
          msg.id === loadingMessage.id
            ? {
                id: `${Date.now()}_error`,
                role: 'assistant',
                content: 'Sorry, I encountered an error analyzing your request. Please try again.',
                timestamp: new Date().toISOString(),
                error: true,
              }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Detect project type from user message (basic keyword detection)
   */
  const detectProjectType = (message: string): string => {
    const lower = message.toLowerCase();
    if (lower.includes('kitchen')) return 'Kitchen Renovation';
    if (lower.includes('bathroom')) return 'Bathroom Renovation';
    if (lower.includes('extension')) return 'Home Extension';
    if (lower.includes('roof')) return 'Roof Repair';
    if (lower.includes('garden')) return 'Garden Landscaping';
    if (lower.includes('floor')) return 'Flooring';
    if (lower.includes('paint')) return 'Painting';
    return 'General Construction';
  };

  /**
   * Format analysis response for display - handles conversation, estimation, and quote modes
   */
  const formatAnalysisResponse = (analysis: any): string => {
    // Handle conversation mode - just show the questions
    if (analysis.responseType === 'conversation') {
      return analysis.description;
    }

    // Handle estimation mode - show rough estimate with caveats
    if (analysis.responseType === 'estimation') {
      let response = `**${analysis.projectType}**\n\n`;
      response += `${analysis.description}\n\n`;

      if (analysis.roughEstimate) {
        response += `💰 **Rough Estimate:**\n`;
        response += `**£${analysis.roughEstimate.min.toLocaleString()}-£${analysis.roughEstimate.max.toLocaleString()}**\n\n`;

        if (analysis.roughEstimate.caveats && analysis.roughEstimate.caveats.length > 0) {
          response += `⚠️ **Important Caveats:**\n`;
          analysis.roughEstimate.caveats.forEach((caveat: string) => {
            response += `• ${caveat}\n`;
          });
          response += '\n';
        }
      }

      if (analysis.questionsAsked && analysis.questionsAsked.length > 0) {
        response += `❓ **For a more accurate quote, please provide:**\n`;
        analysis.questionsAsked.forEach((question: string) => {
          response += `• ${question}\n`;
        });
        response += '\n';
      }

      response += `*Confidence: ${analysis.confidence}% | This is a preliminary estimate*`;
      return response;
    }

    // Quote mode - full detailed response (existing logic)
    let response = `**${analysis.projectType}**\n\n`;
    response += `${analysis.description}\n\n`;

    // Only show cost breakdown if we have meaningful values
    if (analysis.costBreakdown?.total?.max > 0) {
      response += `💰 **Estimated Cost:**\n`;
      response += `Materials: £${analysis.costBreakdown.materials.min.toLocaleString()}-£${analysis.costBreakdown.materials.max.toLocaleString()}\n`;
      response += `Labour: £${analysis.costBreakdown.labor.min.toLocaleString()}-£${analysis.costBreakdown.labor.max.toLocaleString()}\n`;
      response += `**Total: £${analysis.costBreakdown.total.min.toLocaleString()}-£${analysis.costBreakdown.total.max.toLocaleString()}**\n\n`;

      response += `⏱️ **Timeline:**\n`;
      response += `DIY: ${analysis.timeline.diy}\n`;
      response += `Professional: ${analysis.timeline.professional}\n\n`;
    }

    if (analysis.recommendations && analysis.recommendations.length > 0) {
      response += `💡 **Recommendations:**\n`;
      analysis.recommendations.forEach((rec: string) => {
        response += `• ${rec}\n`;
      });
      response += '\n';
    }

    if (analysis.requiresProfessional) {
      response += `⚠️ **Professional Required:** ${analysis.professionalReasons?.join(', ')}\n\n`;
    }

    response += `*Analysis confidence: ${analysis.confidence}% | Provider: ${analysis.aiProvider}*`;

    return response;
  };

  /**
   * Handle document generation (calls generate-document Edge Function)
   */
  const handleGenerateDocument = async (type: 'quote' | 'timeline' | 'tasklist', analysis: any) => {
    Alert.alert('Generate Document', `Generate ${type} PDF for this project?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Generate',
        onPress: async () => {
          try {
            setIsLoading(true);

            // Development fallback for document generation
            const isDevelopment = __DEV__ || process.env.EXPO_PUBLIC_APP_ENV === 'development';

            if (isDevelopment) {
              // MOCK DATA: Replace with real document generation in production
              // See MOCK_DATA_TRACKING.md for details
              console.log(`🔧 Mock generating ${type} document`);
              await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate processing

              Alert.alert(
                'Success (Development)',
                `Your ${type} would be generated in production. Download link would be sent to your email.`
              );
            } else {
              // Call generate-document Edge Function
              const { data, error } = await supabase.functions.invoke('generate-document', {
                body: {
                  type,
                  projectType: analysis.projectType,
                  analysis,
                  pricing: {}, // TODO: Include pricing data if needed
                },
              });

              if (error) throw error;

              Alert.alert(
                'Success',
                `Your ${type} has been generated. Download link will be sent to your email.`
              );
            }
          } catch (error) {
            Alert.alert('Error', 'Failed to generate document. Please try again.');
          } finally {
            setIsLoading(false);
          }
        },
      },
    ]);
  };

  /**
   * Handle document button press with haptic feedback
   */
  const handleDocumentButtonPress = async (
    type: 'quote' | 'timeline' | 'tasklist',
    analysis: any
  ) => {
    // Native haptic feedback
    if (isIOS) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    handleGenerateDocument(type, analysis);
  };

  /**
   * Render individual message bubble with native styling
   */
  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.role === 'user';

    return (
      <View style={[styles.messageContainer, isUser && styles.userMessageContainer]}>
        {/* Avatar with platform-specific styling */}
        <View
          style={[
            styles.avatar,
            isUser ? styles.userAvatar : styles.assistantAvatar,
            isIOS && styles.avatarIOS,
            !isIOS && styles.avatarAndroid,
          ]}
        >
          {isUser ? (
            <Ionicons
              name="person"
              size={isSmallDevice ? 18 : 20}
              color={designTokens.colors.text.inverse}
            />
          ) : (
            <Text style={[styles.avatarText, isSmallDevice && styles.avatarTextSmall]}>T</Text>
          )}
        </View>

        {/* Message bubble with native shadows and styling */}
        <View
          style={[
            styles.messageBubble,
            isUser ? styles.userBubble : styles.assistantBubble,
            isIOS && (isUser ? styles.userBubbleIOS : styles.assistantBubbleIOS),
            !isIOS && (isUser ? styles.userBubbleAndroid : styles.assistantBubbleAndroid),
          ]}
        >
          {item.imageUri && (
            <Image
              source={{ uri: item.imageUri }}
              style={[styles.messageImage, isSmallDevice && styles.messageImageSmall]}
            />
          )}

          {item.isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={designTokens.colors.primary[500]} />
              <Text style={styles.loadingText}>Analyzing...</Text>
            </View>
          ) : (
            <Text
              style={[
                styles.messageText,
                isUser && styles.userMessageText,
                isSmallDevice && styles.messageTextSmall,
              ]}
            >
              {item.content}
            </Text>
          )}

          {/* Document generation buttons with native touch feedback */}
          {item.showDocumentButtons && item.analysis && (
            <View style={styles.documentButtons}>
              <TouchableOpacity
                style={[styles.documentButton, isIOS && styles.documentButtonIOS]}
                onPress={() => handleDocumentButtonPress('quote', item.analysis)}
                activeOpacity={0.7}
              >
                <Ionicons name="document-text" size={16} color={designTokens.colors.primary[500]} />
                <Text style={styles.documentButtonText}>PDF Quote</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.documentButton, isIOS && styles.documentButtonIOS]}
                onPress={() => handleDocumentButtonPress('timeline', item.analysis)}
                activeOpacity={0.7}
              >
                <Ionicons name="calendar" size={16} color={designTokens.colors.primary[500]} />
                <Text style={styles.documentButtonText}>Timeline</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.documentButton, isIOS && styles.documentButtonIOS]}
                onPress={() => handleDocumentButtonPress('tasklist', item.analysis)}
                activeOpacity={0.7}
              >
                <Ionicons name="checkbox" size={16} color={designTokens.colors.primary[500]} />
                <Text style={styles.documentButtonText}>Task List</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  const handleMenuPress = () => {
    // Native haptic feedback
    if (isIOS) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    // Navigate to Account screen
    navigation.navigate('Account' as never);
  };

  return (
    <View style={styles.container}>
      {/* Native status bar styling */}
      <StatusBar
        barStyle="light-content"
        backgroundColor={isIOS ? 'transparent' : '#FF6B35'}
        translucent={isIOS}
      />

      {/* Custom Header */}
      <ToddyHeader onMenuPress={handleMenuPress} />

      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={isIOS ? 'padding' : 'height'}
        keyboardVerticalOffset={isIOS ? 0 : 25}
      >
        {/* Messages list with native optimizations */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={renderMessage}
          contentContainerStyle={[styles.messagesList, isSmallDevice && styles.messagesListSmall]}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          initialNumToRender={10}
          windowSize={10}
        />

        {/* Attached image preview with native styling */}
        {selectedImage && (
          <View
            style={[
              styles.attachmentPreview,
              isIOS && styles.attachmentPreviewIOS,
              !isIOS && styles.attachmentPreviewAndroid,
            ]}
          >
            <Image source={{ uri: selectedImage }} style={styles.attachmentImage} />
            <TouchableOpacity
              style={styles.removeAttachment}
              onPress={() => {
                if (isIOS) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                clearImage();
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="close-circle" size={24} color={designTokens.colors.error} />
            </TouchableOpacity>
          </View>
        )}

        {/* Input bar with native styling */}
        <View
          style={[
            styles.inputContainer,
            isIOS && styles.inputContainerIOS,
            !isIOS && styles.inputContainerAndroid,
          ]}
        >
          <TouchableOpacity
            style={[styles.attachButton, isIOS && styles.attachButtonIOS]}
            onPress={() => {
              if (isIOS) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              showImagePicker();
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="camera" size={24} color={designTokens.colors.grey[600]} />
          </TouchableOpacity>

          <TextInput
            ref={inputRef}
            style={[
              styles.textInput,
              isIOS && styles.textInputIOS,
              !isIOS && styles.textInputAndroid,
              isSmallDevice && styles.textInputSmall,
            ]}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask about your construction project..."
            placeholderTextColor={designTokens.colors.grey[400]}
            multiline
            maxHeight={isSmallDevice ? 80 : 100}
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
            editable={!isLoading}
            textAlignVertical="top"
            returnKeyType="send"
          />

          <TouchableOpacity
            style={[
              styles.sendButton,
              !inputText.trim() && !selectedImage && styles.sendButtonDisabled,
              isIOS && styles.sendButtonIOS,
              !isIOS && styles.sendButtonAndroid,
            ]}
            onPress={handleSend}
            disabled={(!inputText.trim() && !selectedImage) || isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={designTokens.colors.text.inverse} />
            ) : (
              <Ionicons name="send" size={20} color={designTokens.colors.text.inverse} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: designTokens.colors.background,
  },
  chatContainer: {
    flex: 1,
    backgroundColor: designTokens.colors.background,
  },
  messagesList: {
    paddingHorizontal: designTokens.spacing.lg,
    paddingBottom: designTokens.spacing.xl,
    paddingTop: designTokens.spacing.md,
  },
  messageContainer: {
    flexDirection: 'row',
    marginVertical: designTokens.spacing.lg,
    alignItems: 'flex-end',
  },
  userMessageContainer: {
    flexDirection: 'row-reverse',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: designTokens.borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: designTokens.spacing.md,
  },
  userAvatar: {
    backgroundColor: designTokens.colors.grey[600],
  },
  assistantAvatar: {
    backgroundColor: designTokens.colors.primary[500],
  },
  avatarText: {
    color: designTokens.colors.text.inverse,
    fontWeight: designTokens.typography.fontWeight.bold,
    fontSize: designTokens.typography.fontSize.base,
  },
  messageBubble: {
    maxWidth: '78%',
    paddingHorizontal: designTokens.spacing.lg,
    paddingVertical: designTokens.spacing.md,
    borderRadius: designTokens.borderRadius['2xl'],
  },
  userBubble: {
    backgroundColor: designTokens.colors.navy[900],
  },
  assistantBubble: {
    backgroundColor: designTokens.colors.grey[100],
  },
  messageText: {
    fontSize: designTokens.typography.fontSize.lg,
    lineHeight: designTokens.typography.lineHeight.lg,
    color: designTokens.colors.text.primary,
  },
  userMessageText: {
    color: designTokens.colors.text.inverse,
  },
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: designTokens.borderRadius.md,
    marginBottom: designTokens.spacing.sm,
  },
  documentButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: designTokens.spacing.md,
    gap: designTokens.spacing.sm,
  },
  documentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: designTokens.spacing.md,
    paddingVertical: designTokens.spacing.sm,
    backgroundColor: designTokens.colors.background,
    borderRadius: designTokens.borderRadius.lg,
    borderWidth: 1,
    borderColor: designTokens.colors.primary[500],
  },
  documentButtonText: {
    marginLeft: designTokens.spacing.xs,
    fontSize: designTokens.typography.fontSize.sm,
    color: designTokens.colors.primary[500],
    fontWeight: designTokens.typography.fontWeight.medium,
  },
  attachmentPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: designTokens.spacing.lg,
    paddingVertical: designTokens.spacing.md,
    backgroundColor: designTokens.colors.grey[50],
    borderTopWidth: 1,
    borderTopColor: designTokens.colors.grey[200],
  },
  attachmentImage: {
    width: 60,
    height: 60,
    borderRadius: designTokens.borderRadius.md,
  },
  removeAttachment: {
    marginLeft: designTokens.spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: designTokens.spacing.lg,
    paddingTop: designTokens.spacing.lg,
    paddingBottom: designTokens.spacing.xl,
    backgroundColor: designTokens.colors.background,
    borderTopWidth: 1,
    borderTopColor: designTokens.colors.grey[200],
  },
  attachButton: {
    width: 46,
    height: 46,
    borderRadius: designTokens.borderRadius.full,
    backgroundColor: designTokens.colors.grey[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: designTokens.spacing.md,
    borderWidth: 1,
    borderColor: designTokens.colors.grey[200],
  },
  textInput: {
    flex: 1,
    minHeight: 46,
    maxHeight: 120,
    paddingHorizontal: designTokens.spacing.lg,
    paddingVertical: designTokens.spacing.md,
    backgroundColor: designTokens.colors.grey[50],
    borderRadius: designTokens.borderRadius['2xl'],
    fontSize: designTokens.typography.fontSize.lg,
    color: designTokens.colors.text.primary,
    borderWidth: 1,
    borderColor: designTokens.colors.grey[200],
  },
  sendButton: {
    width: 46,
    height: 46,
    borderRadius: designTokens.borderRadius.full,
    backgroundColor: designTokens.colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: designTokens.spacing.md,
  },
  sendButtonDisabled: {
    backgroundColor: designTokens.colors.grey[300],
  },
});
