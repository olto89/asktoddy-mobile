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
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';
import designTokens from '../styles/designTokens';
import { Ionicons } from '@expo/vector-icons';
import { useImagePicker } from '../hooks/useImagePicker';
import { useLocation } from '../hooks/useLocation';
import ToddyHeader from '../components/ToddyHeader';
import QuoteRefinementUI from '../components/QuoteRefinementUI';
import InteractiveQuoteTable from '../components/InteractiveQuoteTable';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  showInteractiveQuote?: boolean; // Show editable quote table
  analysis?: any; // Store full analysis for document generation
  isGenerating?: boolean; // For showing loading state
  pdfFile?: {
    uri: string;
    filename: string;
    type: string;
  };
}

export default function ChatScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const { location, region, pricingContext, loading: locationLoading } = useLocation(true);

  // Session management for contextual memory
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Initialize or load session ID
  useEffect(() => {
    const initializeSession = async () => {
      try {
        const existingSessionId = await AsyncStorage.getItem('conversation_session_id');
        if (existingSessionId) {
          setSessionId(existingSessionId);
          console.log('📱 Loaded existing conversation session:', existingSessionId);
        } else {
          const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          await AsyncStorage.setItem('conversation_session_id', newSessionId);
          setSessionId(newSessionId);
          console.log('🆕 Created new conversation session:', newSessionId);
        }
      } catch (error) {
        console.error('Failed to initialize session:', error);
        // Create fallback session without persistence
        const fallbackSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        setSessionId(fallbackSessionId);
      }
    };

    initializeSession();
  }, []);

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
  const [isGeneratingDocument, setIsGeneratingDocument] = useState(false);

  // Quote refinement state
  const [showRefinementUI, setShowRefinementUI] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState<any>(null);

  // Use image picker hook
  const { selectedImage, showImagePicker, clearImage } = useImagePicker({
    onImageSelected: uri => {
      console.log('Image selected:', uri);
    },
  });

  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);

  /**
   * Start a new conversation session (clear context)
   */
  const startNewConversation = async () => {
    try {
      const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await AsyncStorage.setItem('conversation_session_id', newSessionId);
      setSessionId(newSessionId);

      // Clear messages except welcome message
      setMessages([
        {
          id: '1',
          role: 'assistant',
          content: `Hi! I'm Toddy, your construction cost expert 👋\n\nI provide detailed quotes for any building project:\n• Full cost breakdowns (materials + labour + tools)\n• Project timelines and phases\n• What each trade will charge\n• VAT and contingency costs\n\nTell me about your project and I'll give you a comprehensive quote! You can also upload photos.`,
          timestamp: new Date().toISOString(),
        },
      ]);

      console.log('🔄 Started new conversation session:', newSessionId);
    } catch (error) {
      console.error('Failed to start new conversation:', error);
    }
  };

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

    console.log('📱 [FRONTEND] handleSend called with:', {
      inputText: inputText.trim(),
      hasImage: !!selectedImage,
      timestamp: new Date().toISOString(),
    });

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

    console.log('📱 [FRONTEND] User message created:', userMessage);

    // Clear input immediately to prevent UI issues
    const originalInputText = inputText.trim();
    setInputText('');
    console.log('📱 [FRONTEND] Input text cleared, was:', originalInputText);
    clearImage();

    // Animate message addition
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    // Add user message to chat
    setMessages(prev => [...prev, userMessage]);

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
      const requestBody = {
        message: userMessage.content || undefined,
        imageUri: userMessage.imageUri,
        sessionId: sessionId, // Include session for contextual memory
        userId: user?.id, // Include user ID if available
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
      };

      console.log('📱 [FRONTEND] Calling Edge Function with body:', {
        message: requestBody.message,
        hasImage: !!requestBody.imageUri,
        sessionId: requestBody.sessionId,
        projectType: requestBody.context.projectType,
        preferredProvider: requestBody.context.preferredProvider,
      });

      // Call analyze-construction Edge Function with contextual memory
      const { data, error } = await supabase.functions.invoke('analyze-construction', {
        body: requestBody,
      });

      console.log('📱 [FRONTEND] Edge Function response:', {
        hasData: !!data,
        hasError: !!error,
        success: data?.success,
        aiProvider: data?.aiProvider,
        dataProvider: data?.data?.aiProvider,
      });

      if (error) {
        console.error('📱 [FRONTEND] Supabase Edge Function error:', error);
        throw error;
      }

      let analysis;
      if (data?.success && data?.data) {
        analysis = data.data;
        console.log('📱 [FRONTEND] Analysis received:', {
          provider: analysis.aiProvider,
          projectType: analysis.projectType,
          confidence: analysis.confidence,
          hasWarnings: !!(analysis.warnings && analysis.warnings.length > 0),
          warnings: analysis.warnings,
        });
      } else {
        console.error('📱 [FRONTEND] Invalid server response:', data);
        throw new Error('Invalid response from server');
      }

      // Format response message
      const responseContent = formatAnalysisResponse(analysis);

      console.log('📱 [FRONTEND] Formatted response:', {
        contentLength: responseContent.length,
        provider: analysis.aiProvider,
        isMock: responseContent.includes('mock') || responseContent.includes('Mock'),
      });

      const assistantMessage = {
        id: `${Date.now()}_response`,
        role: 'assistant',
        content: responseContent,
        timestamp: new Date().toISOString(),
        showInteractiveQuote: true, // Show interactive table instead of immediate buttons
        analysis: analysis, // Store for document generation
      };

      console.log('📱 [FRONTEND] Assistant message created:', {
        messageId: assistantMessage.id,
        provider: analysis.aiProvider,
        hasAnalysis: !!assistantMessage.analysis,
        showInteractiveQuote: assistantMessage.showInteractiveQuote,
        showDocumentButtons: assistantMessage.showDocumentButtons,
      });

      // Replace loading message with actual response
      setMessages(prev => prev.map(msg => (msg.id === loadingMessage.id ? assistantMessage : msg)));
    } catch (error) {
      console.error('📱 [FRONTEND] Chat error occurred:', error);
      console.error('📱 [FRONTEND] Error details:', {
        message: error?.message || 'Unknown error',
        name: error?.name,
        stack: error?.stack,
      });

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

      console.log('📱 [FRONTEND] Error message added to chat');
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

      // Show contingency if present
      if (analysis.costBreakdown.contingency) {
        const contingency = analysis.costBreakdown.contingency;
        response += `\n🌦️ **Seasonal Contingency (${contingency.percentage}%):** £${contingency.amount.toLocaleString()}\n`;
        response += `*${contingency.reason}*\n`;
      }

      response += `\n**Total: £${analysis.costBreakdown.total.min.toLocaleString()}-£${analysis.costBreakdown.total.max.toLocaleString()}**\n\n`;

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
    try {
      setIsGeneratingDocument(true);

      // Add a temporary "generating" message to chat
      const generatingMessage = {
        id: `${Date.now()}_generating`,
        role: 'assistant',
        content: `🔄 Generating your ${type} PDF...`,
        timestamp: new Date().toISOString(),
        isGenerating: true,
      };
      setMessages(prev => [...prev, generatingMessage]);

      // Auto-scroll to new message
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);

      console.log('Starting PDF generation for:', type, analysis.projectType);
      console.log('Original analysis structure:', {
        hasProjectType: !!analysis.projectType,
        hasCostBreakdown: !!analysis.costBreakdown,
        costBreakdownKeys: analysis.costBreakdown ? Object.keys(analysis.costBreakdown) : [],
        hasTimeline: !!analysis.timeline,
        timelineKeys: analysis.timeline ? Object.keys(analysis.timeline) : [],
      });

      // Transform analysis data for PDF generation with safe data extraction
      const safeExtractArray = (data: any, path: string) => {
        try {
          return Array.isArray(data) ? data : [];
        } catch (e) {
          console.warn(`Failed to extract array from ${path}:`, e);
          return [];
        }
      };

      // Calculate totals from cost breakdown if available
      const materialsMin = analysis.costBreakdown?.materials?.min || 0;
      const materialsMax = analysis.costBreakdown?.materials?.max || 0;
      const laborMin = analysis.costBreakdown?.labor?.min || 0;
      const laborMax = analysis.costBreakdown?.labor?.max || 0;
      const totalMin = analysis.costBreakdown?.total?.min || 0;
      const totalMax = analysis.costBreakdown?.total?.max || 0;

      const transformedAnalysis = {
        projectType: analysis.projectType || 'Unknown Project',
        description: analysis.description || 'Generated quote',
        costBreakdown: {
          materials: [
            {
              name: 'Materials & Supplies',
              description: 'Construction materials and supplies',
              quantity: 1,
              unitPrice: materialsMax,
              total: materialsMax,
            },
          ],
          labour: [
            {
              name: 'Professional Labour',
              description: 'Installation and construction work',
              quantity: 1,
              unitPrice: laborMax,
              total: laborMax,
            },
          ],
          tools: safeExtractArray(analysis.costBreakdown?.toolHire?.items, 'tools'),
          total: totalMax,
          vatRate: 0.2,
          grandTotal: totalMax * 1.2, // Include VAT
        },
        timeline: {
          phases: safeExtractArray(analysis.timeline?.phases, 'timeline.phases'),
          totalDuration: analysis.timeline?.professional || analysis.timeline?.diy || 'TBD',
        },
        recommendations: safeExtractArray(analysis.recommendations, 'recommendations'),
        confidence: Number(analysis.confidence || 85),
        aiProvider: analysis.aiProvider || 'unknown',
        processingTimeMs: Number(analysis.processingTimeMs || 0),
      };

      console.log('Transformed analysis for PDF:', transformedAnalysis);

      // Call generate-document Edge Function
      const response = await supabase.functions.invoke('generate-document', {
        body: {
          type,
          projectType: analysis.projectType,
          analysis: transformedAnalysis,
          pricing: analysis.pricing || {},
          userDetails: {
            name: user?.email?.split('@')[0] || 'Customer',
            email: user?.email,
          },
        },
      });

      console.log('PDF generation response status:', {
        hasError: !!response.error,
        hasData: !!response.data,
        success: response.data?.success,
        hasDocument: !!response.data?.document,
        hasBase64: !!response.data?.document?.base64,
        fullResponse: JSON.stringify(response.data, null, 2),
      });

      if (response.error) {
        console.error('Edge function error details:', response.error);
        throw new Error(
          response.error.message ||
            `Edge function returned non-2xx status code: ${JSON.stringify(response.error)}`
        );
      }

      // Check if we got an error response in data
      if (response.data?.error) {
        console.error('PDF generation error in response data:', response.data);
        throw new Error(response.data.message || 'PDF generation failed');
      }

      // Remove generating message
      setMessages(prev => prev.filter(m => !m.isGenerating));

      // The response.data should contain the PDF data
      if (
        response.data &&
        response.data.success &&
        response.data.document &&
        response.data.document.base64
      ) {
        const { document } = response.data;

        // Use filename from server or generate one
        const filename =
          document.filename ||
          `asktoddy-${type}-${analysis.projectType}-${new Date().toISOString().split('T')[0]}.pdf`;

        // Save PDF to device
        const fileUri = `${FileSystem.documentDirectory}${filename}`;

        console.log('Saving PDF to device:', {
          filename,
          fileUri,
          base64Length: document.base64?.length || 0,
        });

        // Write base64 PDF data to file
        await FileSystem.writeAsStringAsync(fileUri, document.base64, {
          encoding: FileSystem.EncodingType.Base64,
        });

        // Verify file was saved
        const fileInfo = await FileSystem.getInfoAsync(fileUri);
        console.log('PDF saved successfully:', {
          exists: fileInfo.exists,
          size: (fileInfo as any).size || 'unknown',
          uri: fileInfo.uri || fileUri,
        });

        // Add success message with download button
        const pdfMessage = {
          id: `${Date.now()}_pdf`,
          role: 'assistant',
          content: `✅ **${type.charAt(0).toUpperCase() + type.slice(1)} PDF Generated**\n\nYour ${type} is ready! Tap the button below to open or share the PDF.`,
          timestamp: new Date().toISOString(),
          pdfFile: {
            uri: fileUri,
            filename,
            type,
          },
        };
        setMessages(prev => [...prev, pdfMessage]);

        // Auto-scroll to new message
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      } else {
        console.error('Unexpected response structure:', {
          hasData: !!response.data,
          hasSuccess: !!response.data?.success,
          hasDocument: !!response.data?.document,
          hasBase64: !!response.data?.document?.base64,
          responseKeys: response.data ? Object.keys(response.data) : [],
          documentKeys: response.data?.document ? Object.keys(response.data.document) : [],
        });

        if (!response.data) {
          throw new Error('No data received from server');
        } else if (!response.data.success) {
          throw new Error('PDF generation was not successful');
        } else if (!response.data.document) {
          throw new Error('No PDF document in response');
        } else if (!response.data.document.base64) {
          throw new Error('PDF document is missing base64 data');
        } else {
          throw new Error('Invalid response structure from server');
        }
      }
    } catch (error: any) {
      console.error('PDF generation error:', {
        message: error?.message,
        type,
        projectType: analysis?.projectType,
        stack: error?.stack,
      });

      // Remove generating message
      setMessages(prev => prev.filter(m => !m.isGenerating));

      // Add more specific error message
      let errorContent = `❌ Sorry, I couldn't generate the ${type} PDF.`;

      if (error?.message?.includes('base64')) {
        errorContent +=
          '\n\nThe PDF data was not properly formatted. This might be a server issue.';
      } else if (error?.message?.includes('network')) {
        errorContent +=
          '\n\nThere was a network error. Please check your connection and try again.';
      } else if (error?.message?.includes('timeout')) {
        errorContent += '\n\nThe request timed out. Please try again.';
      } else {
        errorContent += `\n\nError: ${error?.message || 'Unknown error occurred'}`;
      }

      const errorMessage = {
        id: `${Date.now()}_error`,
        role: 'assistant',
        content: errorContent,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsGeneratingDocument(false);
    }
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
   * Handle refine quote button press
   */
  const handleRefineQuote = (analysis: any) => {
    // Native haptic feedback
    if (isIOS) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setSelectedAnalysis(analysis);
    setShowRefinementUI(true);
  };

  /**
   * Handle interactive quote update
   */
  const handleInteractiveQuoteUpdate = (messageId: string, updatedAnalysis: any) => {
    setMessages(prev =>
      prev.map(msg => (msg.id === messageId ? { ...msg, analysis: updatedAnalysis } : msg))
    );
  };

  /**
   * Handle PDF generation from interactive quote
   */
  const handleGeneratePDFFromQuote = (
    analysis: any,
    type: 'quote' | 'timeline' | 'tasklist' = 'quote'
  ) => {
    handleGenerateDocument(type, analysis);
  };

  /**
   * Handle quote refinement submission
   */
  const handleRefineQuoteSubmit = async (refinements: any) => {
    try {
      // Call analyze-construction with refinement data
      const { data, error } = await supabase.functions.invoke('analyze-construction', {
        body: {
          message: `Please refine my quote based on this feedback: ${refinements.feedback.comments}`,
          sessionId: sessionId,
          userId: user?.id,
          refinements: refinements,
          originalAnalysis: selectedAnalysis,
          context: {
            location: pricingContext?.location || 'Unknown location',
            city: pricingContext?.city || 'Unknown',
            postcode: pricingContext?.postcode,
            region: pricingContext?.region || 'UK',
            regionCode: pricingContext?.regionCode,
            pricingMultiplier: pricingContext?.pricingMultiplier || 1.0,
            coordinates: pricingContext?.coordinates,
            projectType: selectedAnalysis?.projectType,
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
        const analysis = data.data;
        const responseContent = formatAnalysisResponse(analysis);

        // Add refined quote message
        const refinedMessage = {
          id: `${Date.now()}_refined`,
          role: 'assistant',
          content: `✨ **Refined Quote Based on Your Feedback**\n\n${responseContent}`,
          timestamp: new Date().toISOString(),
          showInteractiveQuote: true,
          analysis: analysis,
        };

        setMessages(prev => [...prev, refinedMessage]);

        // Auto-scroll to new message
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);

        // Show success feedback
        if (isIOS) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Quote refinement error:', error);
      Alert.alert('Error', 'Failed to refine quote. Please try again.');
    }
  };

  /**
   * Handle opening PDF in device viewer
   */
  const handleOpenPDF = async (pdfFile: any) => {
    try {
      // Native haptic feedback
      if (isIOS) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      // The PDF file is already saved to disk, just use its URI
      const fileUri = pdfFile.uri;

      // Check if file exists
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (!fileInfo.exists) {
        throw new Error('PDF file not found');
      }

      // Open with system viewer
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Open PDF',
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert('Sharing not available', 'Unable to share files on this device.');
      }
    } catch (error) {
      console.error('Error opening PDF:', error);
      Alert.alert('Error', 'Unable to open PDF. Please try again.');
    }
  };

  /**
   * Handle sharing PDF
   */
  const handleSharePDF = async (pdfFile: any) => {
    try {
      // Native haptic feedback
      if (isIOS) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      // The PDF file is already saved to disk, just use its URI
      const fileUri = pdfFile.uri;

      // Check if file exists
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (!fileInfo.exists) {
        throw new Error('PDF file not found');
      }

      // Share the PDF
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Share PDF',
        });
      } else {
        Alert.alert('Sharing not available', 'Unable to share files on this device.');
      }
    } catch (error) {
      console.error('Error sharing PDF:', error);
      Alert.alert('Error', 'Unable to share PDF. Please try again.');
    }
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

          {/* Inline PDF display for ChatGPT-style experience */}
          {item.pdfFile && (
            <View style={styles.pdfContainer}>
              <View style={styles.pdfHeader}>
                <Ionicons name="document-text" size={20} color={designTokens.colors.primary[500]} />
                <Text style={styles.pdfTitle}>{item.pdfFile.filename}</Text>
              </View>
              <View style={styles.pdfActions}>
                <TouchableOpacity
                  style={[styles.pdfButton, styles.pdfViewButton]}
                  onPress={() => handleOpenPDF(item.pdfFile)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="eye" size={16} color="#fff" />
                  <Text style={styles.pdfButtonText}>View PDF</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.pdfButton, styles.pdfShareButton]}
                  onPress={() => handleSharePDF(item.pdfFile)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="share" size={16} color="#fff" />
                  <Text style={styles.pdfButtonText}>Share</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Interactive Quote Table (new quotes) */}
          {item.showInteractiveQuote && item.analysis && (
            <InteractiveQuoteTable
              analysis={item.analysis}
              onUpdateQuote={updatedAnalysis =>
                handleInteractiveQuoteUpdate(item.id, updatedAnalysis)
              }
              onGeneratePDF={updatedAnalysis => handleGeneratePDFFromQuote(updatedAnalysis)}
            />
          )}

          {/* Document generation buttons (fallback for older quotes without interactive table) */}
          {item.showDocumentButtons && !item.showInteractiveQuote && item.analysis && (
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
              <TouchableOpacity
                style={[
                  styles.documentButton,
                  styles.refineButton,
                  isIOS && styles.documentButtonIOS,
                ]}
                onPress={() => handleRefineQuote(item.analysis)}
                activeOpacity={0.7}
              >
                <Ionicons name="settings" size={16} color={designTokens.colors.primary[500]} />
                <Text style={styles.documentButtonText}>Refine Quote</Text>
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

      {/* Quote Refinement Modal */}
      {selectedAnalysis && (
        <QuoteRefinementUI
          visible={showRefinementUI}
          onClose={() => {
            setShowRefinementUI(false);
            setSelectedAnalysis(null);
          }}
          analysis={selectedAnalysis}
          onRefineQuote={handleRefineQuoteSubmit}
        />
      )}
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
  refineButton: {
    backgroundColor: '#fff5f2',
    borderColor: designTokens.colors.primary,
  },
  pdfContainer: {
    backgroundColor: designTokens.colors.grey[50],
    borderRadius: designTokens.borderRadius.lg,
    borderWidth: 1,
    borderColor: designTokens.colors.grey[200],
    marginTop: designTokens.spacing.md,
    padding: designTokens.spacing.md,
  },
  pdfHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: designTokens.spacing.sm,
  },
  pdfTitle: {
    marginLeft: designTokens.spacing.sm,
    fontSize: designTokens.typography.fontSize.md,
    fontWeight: designTokens.typography.fontWeight.medium,
    color: designTokens.colors.text.primary,
    flex: 1,
  },
  pdfActions: {
    flexDirection: 'row',
    gap: designTokens.spacing.sm,
  },
  pdfButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: designTokens.spacing.md,
    paddingVertical: designTokens.spacing.sm,
    borderRadius: designTokens.borderRadius.md,
    flex: 1,
    justifyContent: 'center',
  },
  pdfViewButton: {
    backgroundColor: designTokens.colors.primary[500],
  },
  pdfShareButton: {
    backgroundColor: designTokens.colors.grey[600],
  },
  pdfButtonText: {
    marginLeft: designTokens.spacing.xs,
    fontSize: designTokens.typography.fontSize.sm,
    color: '#fff',
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
