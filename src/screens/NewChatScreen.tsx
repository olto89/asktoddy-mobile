/**
 * NewChatScreen - Quote-first UI with interactive preview at top
 * Chat input at bottom, real-time quote updates
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  SafeAreaView,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,
  Keyboard,
  TouchableWithoutFeedback,
  ScrollView,
  KeyboardAvoidingView,
  Image,
  Linking,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Location from 'expo-location';
import * as DocumentPicker from 'expo-document-picker';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useQuoteUpdates } from '../hooks/useQuoteUpdates';
import QuotePreviewCard from '../components/QuotePreviewCard';
import QuoteOverlay from '../components/QuoteOverlay';
import ChatMenuSidebar from '../components/ChatMenuSidebar';
import ToddyHeader from '../components/ToddyHeader';
import {
  chatHistoryService,
  ChatMessage as ChatHistoryMessage,
} from '../services/ChatHistoryService';
import designTokens from '../styles/designTokens';
import { subscriptionService, PREMIUM_FEATURES } from '../services/SubscriptionService';
import PaywallModal from '../components/PaywallModal';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  analysis?: any;
  images?: string[];
  pdfs?: Array<{ uri: string; name: string; size: number }>;
}

export default function NewChatScreen() {
  const { user } = useAuth();
  const [sessionId, setSessionId] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showQuoteOverlay, setShowQuoteOverlay] = useState(false);
  const [showChatMenu, setShowChatMenu] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [selectedPdfs, setSelectedPdfs] = useState<
    Array<{
      uri: string;
      name: string;
      size: number;
    }>
  >([]);
  const [userLocation, setUserLocation] = useState<{
    city?: string;
    region?: string;
    postcode?: string;
    coordinates?: { latitude: number; longitude: number };
  } | null>(null);
  const [locationPermissionGranted, setLocationPermissionGranted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallFeature, setPaywallFeature] = useState<string>('');
  const textInputRef = useRef<TextInput>(null);

  const scrollViewRef = useRef<any>(null);

  // Real-time quote updates
  const {
    quoteState,
    isUpdating,
    error: quoteError,
    updateFromAnalysis,
    refreshQuote,
    clearQuote,
    markAsManuallyEdited,
  } = useQuoteUpdates({
    sessionId,
    userId: user?.id || 'anonymous',
    isActive: true,
  });

  // Initialize session, location, and subscription service
  useEffect(() => {
    initializeSession();
    requestLocationPermission();
    subscriptionService.initialize();
  }, []);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        setLocationPermissionGranted(true);
        await getCurrentLocation();
      } else {
        console.log('Location permission denied');
        // Set default UK location
        setUserLocation({
          city: 'London',
          region: 'England',
          postcode: 'SW1A 1AA',
        });
      }
    } catch (error) {
      console.error('Location permission error:', error);
      // Fallback to default location
      setUserLocation({
        city: 'London',
        region: 'England',
        postcode: 'SW1A 1AA',
      });
    }
  };

  const getCurrentLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 5000,
      });

      const { latitude, longitude } = location.coords;

      // Reverse geocode to get address
      const addresses = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (addresses.length > 0) {
        const address = addresses[0];
        setUserLocation({
          city: address.city || address.subregion || 'Unknown',
          region: address.region || 'England',
          postcode: address.postalCode || undefined,
          coordinates: { latitude, longitude },
        });

        console.log('📍 Location updated:', {
          city: address.city,
          region: address.region,
          postcode: address.postalCode,
        });
      }
    } catch (error) {
      console.error('Location fetch error:', error);
      // Fallback to default UK location
      setUserLocation({
        city: 'London',
        region: 'England',
        postcode: 'SW1A 1AA',
      });
    }
  };

  const initializeSession = async () => {
    try {
      // Try to get current session from chat history service
      let currentSessionId = await chatHistoryService.getCurrentSessionId();

      if (!currentSessionId) {
        // Create new session via chat history service
        const newSession = await chatHistoryService.createNewSession();
        currentSessionId = newSession.id;
      }

      setSessionId(currentSessionId);

      // Load existing messages for this session
      const sessionMessages = await chatHistoryService.loadSessionMessages(currentSessionId);
      const formattedMessages = sessionMessages.map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp,
        analysis: msg.analysis,
      }));
      setMessages(formattedMessages);

      console.log(
        '📱 Session initialized:',
        currentSessionId,
        'with',
        formattedMessages.length,
        'messages'
      );
    } catch (error) {
      console.error('Failed to initialize session:', error);
    }
  };

  const sendMessage = async () => {
    if (
      (!inputText.trim() && selectedImages.length === 0 && selectedPdfs.length === 0) ||
      isLoading
    )
      return;

    const userMessage = inputText.trim();
    const imagesToSend = [...selectedImages];
    const pdfsToSend = [...selectedPdfs];
    setInputText('');
    setSelectedImages([]);
    setSelectedPdfs([]);
    setIsLoading(true);

    // Add user message
    let messageContent = userMessage;
    if (!messageContent) {
      if (imagesToSend.length > 0 && pdfsToSend.length > 0) {
        messageContent = `Uploaded ${imagesToSend.length} photo(s) and ${pdfsToSend.length} document(s)`;
      } else if (imagesToSend.length > 0) {
        messageContent = `Uploaded ${imagesToSend.length} photo(s)`;
      } else if (pdfsToSend.length > 0) {
        messageContent = `Uploaded ${pdfsToSend.length} document(s)`;
      }
    }

    const userMsg: Message = {
      id: `msg_${Date.now()}_user`,
      role: 'user',
      content: messageContent,
      timestamp: new Date(),
      images: imagesToSend.length > 0 ? imagesToSend : undefined,
      pdfs: pdfsToSend.length > 0 ? pdfsToSend : undefined,
    };

    setMessages(prev => [...prev, userMsg]);

    // Scroll to bottom after adding message
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    // Add loading message like ChatScreen does
    const loadingMessage: Message = {
      id: `msg_${Date.now()}_loading`,
      role: 'assistant',
      content: 'Analyzing your request...',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, loadingMessage]);

    try {
      // Call analyze-construction edge function
      const requestBody = {
        message: userMessage,
        imageUri: imagesToSend.length > 0 ? imagesToSend[0] : undefined,
        images: imagesToSend,
        pdfs: pdfsToSend,
        sessionId: sessionId,
        userId: user?.id,
        context: {
          location: 'UK',
          city: userLocation?.city || 'London',
          region: userLocation?.region || 'England',
          postcode: userLocation?.postcode,
          coordinates: userLocation?.coordinates,
        },
      };

      console.log('📱 [FRONTEND] Sending request:', requestBody);

      const { data, error } = await supabase.functions.invoke('analyze-construction', {
        body: requestBody,
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.success && data?.data) {
        const analysis = data.data;

        console.log('📱 [FRONTEND] Analysis received:', analysis);

        // Format the response content (simplified version)
        const responseContent =
          analysis.description ||
          `Here's your construction quote analysis:\n\n**Project Type:** ${analysis.projectType || 'Construction Project'}\n\n**Estimated Cost:** £${analysis.costBreakdown?.total?.min || 0} - £${analysis.costBreakdown?.total?.max || 0}\n\n**Confidence:** ${analysis.confidence || 85}%`;

        // Add assistant response
        const assistantMsg: Message = {
          id: `msg_${Date.now()}_assistant`,
          role: 'assistant',
          content: responseContent,
          timestamp: new Date(),
          analysis,
        };

        setMessages(prev => {
          // Remove loading message and add assistant response
          const withoutLoading = prev.filter(msg => !msg.id.includes('_loading'));
          const newMessages = [...withoutLoading, assistantMsg];
          // Save messages to chat history
          saveMessagesToHistory(newMessages);
          return newMessages;
        });

        // Update chat history session with latest message and analysis
        await chatHistoryService.updateSession(sessionId, userMessage, analysis);

        // Update quote preview with new analysis
        updateFromAnalysis(analysis);

        // Provide haptic feedback for successful response
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Message send error:', error);

      // Add error message
      const errorMsg: Message = {
        id: `msg_${Date.now()}_error`,
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error.message}. Please try again.`,
        timestamp: new Date(),
      };

      setMessages(prev => {
        // Remove loading message and add error response
        const withoutLoading = prev.filter(msg => !msg.id.includes('_loading'));
        const newMessages = [...withoutLoading, errorMsg];
        // Save messages to chat history
        saveMessagesToHistory(newMessages);
        return newMessages;
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveMessagesToHistory = async (messagesToSave: Message[]) => {
    try {
      const historyMessages = messagesToSave.map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp,
        analysis: msg.analysis,
      }));
      await chatHistoryService.saveSessionMessages(sessionId, historyMessages);
    } catch (error) {
      console.error('Failed to save messages to history:', error);
    }
  };

  const handleNewChat = async () => {
    try {
      const newSession = await chatHistoryService.createNewSession();
      setSessionId(newSession.id);
      setMessages([]);
      setInputText('');
      setSelectedImages([]);
      setSelectedPdfs([]);
      // Location persists across sessions for better UX

      // Clear quote state for new session
      clearQuote();

      console.log('📝 Started new chat session:', newSession.id);
    } catch (error) {
      console.error('Failed to create new chat:', error);
    }
  };

  const handleSelectSession = async (selectedSessionId: string) => {
    try {
      setSessionId(selectedSessionId);
      await chatHistoryService.setCurrentSession(selectedSessionId);

      // Load messages for this session
      const sessionMessages = await chatHistoryService.loadSessionMessages(selectedSessionId);
      const formattedMessages = sessionMessages.map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp,
        analysis: msg.analysis,
      }));
      setMessages(formattedMessages);

      // If the session has analysis, update the quote state
      const latestAnalysis = formattedMessages.reverse().find(msg => msg.analysis)?.analysis;
      if (latestAnalysis) {
        updateFromAnalysis(latestAnalysis);
      }

      console.log(
        '📂 Switched to session:',
        selectedSessionId,
        'with',
        formattedMessages.length,
        'messages'
      );
    } catch (error) {
      console.error('Failed to select session:', error);
    }
  };

  const handleExpandQuote = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowQuoteOverlay(true);
  };

  const handleImageUpload = async () => {
    try {
      // First check current permission status
      const { status: existingStatus } = await ImagePicker.getMediaLibraryPermissionsAsync();

      let finalStatus = existingStatus;

      // Only request if not determined or denied (iOS allows re-requesting)
      if (existingStatus !== 'granted') {
        const { status: newStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        finalStatus = newStatus;
      }

      if (finalStatus !== 'granted') {
        Alert.alert(
          'Photos Access Required',
          'To upload photos, please enable photo library access in your device settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Open Settings',
              onPress: () => {
                // Opens settings on iOS/Android
                if (Platform.OS === 'ios') {
                  Linking.openURL('app-settings:');
                } else {
                  Linking.openSettings();
                }
              },
            },
          ]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];

        // Compress image for better upload performance
        const compressedImage = await ImageManipulator.manipulateAsync(
          asset.uri,
          [{ resize: { width: 1024 } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
        );

        setSelectedImages(prev => [...prev, compressedImage.uri]);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      console.error('Image upload error:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  const handleCameraCapture = async () => {
    try {
      // First check current permission status
      const { status: existingStatus } = await ImagePicker.getCameraPermissionsAsync();

      let finalStatus = existingStatus;

      // Only request if not determined or denied
      if (existingStatus !== 'granted') {
        const { status: newStatus } = await ImagePicker.requestCameraPermissionsAsync();
        finalStatus = newStatus;
      }

      if (finalStatus !== 'granted') {
        Alert.alert(
          'Camera Access Required',
          'To take photos, please enable camera access in your device settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Open Settings',
              onPress: () => {
                if (Platform.OS === 'ios') {
                  Linking.openURL('app-settings:');
                } else {
                  Linking.openSettings();
                }
              },
            },
          ]
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];

        // Compress image for better upload performance
        const compressedImage = await ImageManipulator.manipulateAsync(
          asset.uri,
          [{ resize: { width: 1024 } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
        );

        setSelectedImages(prev => [...prev, compressedImage.uri]);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      console.error('Camera capture error:', error);
      Alert.alert('Error', 'Failed to capture photo. Please try again.');
    }
  };

  const removeImage = (indexToRemove: number) => {
    setSelectedImages(prev => prev.filter((_, index) => index !== indexToRemove));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePdfUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];

        // Check file size (limit to 10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (asset.size && asset.size > maxSize) {
          Alert.alert('File Too Large', 'Please select a PDF file smaller than 10MB.');
          return;
        }

        const pdfFile = {
          uri: asset.uri,
          name: asset.name || 'document.pdf',
          size: asset.size || 0,
        };

        setSelectedPdfs(prev => [...prev, pdfFile]);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        console.log(
          '📄 PDF selected:',
          pdfFile.name,
          `(${(pdfFile.size / 1024 / 1024).toFixed(1)}MB)`
        );
      }
    } catch (error) {
      console.error('PDF upload error:', error);
      Alert.alert('Error', 'Failed to select PDF. Please try again.');
    }
  };

  const removePdf = (indexToRemove: number) => {
    setSelectedPdfs(prev => prev.filter((_, index) => index !== indexToRemove));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const showAttachmentOptions = () => {
    Alert.alert('Add Attachment', 'Choose what to add to your quote request', [
      {
        text: 'Take Photo',
        onPress: handleCameraCapture,
      },
      {
        text: 'Choose Photo',
        onPress: handleImageUpload,
      },
      {
        text: 'Upload PDF',
        onPress: handlePdfUpload,
      },
      {
        text: 'Cancel',
        style: 'cancel',
      },
    ]);
  };

  const showImageOptions = () => {
    Alert.alert('Add Photo', 'Choose how to add a photo to your quote request', [
      {
        text: 'Take Photo',
        onPress: handleCameraCapture,
      },
      {
        text: 'Choose from Library',
        onPress: handleImageUpload,
      },
      {
        text: 'Cancel',
        style: 'cancel',
      },
    ]);
  };

  const handleLocationPress = () => {
    Alert.alert(
      'Location Settings',
      `Current: ${userLocation?.city}, ${userLocation?.region}${userLocation?.postcode ? ` (${userLocation.postcode})` : ''}`,
      [
        {
          text: 'Update Location',
          onPress: getCurrentLocation,
        },
        {
          text: 'Manual Override',
          onPress: showLocationOverride,
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const showLocationOverride = () => {
    // For now, show common UK locations
    Alert.alert('Choose Location', 'Select your approximate location for accurate pricing', [
      {
        text: 'London',
        onPress: () => setUserLocation({ city: 'London', region: 'England', postcode: 'SW1A 1AA' }),
      },
      {
        text: 'Manchester',
        onPress: () =>
          setUserLocation({ city: 'Manchester', region: 'England', postcode: 'M1 1AA' }),
      },
      {
        text: 'Birmingham',
        onPress: () =>
          setUserLocation({ city: 'Birmingham', region: 'England', postcode: 'B1 1AA' }),
      },
      {
        text: 'Leeds',
        onPress: () => setUserLocation({ city: 'Leeds', region: 'England', postcode: 'LS1 1AA' }),
      },
      {
        text: 'Edinburgh',
        onPress: () =>
          setUserLocation({ city: 'Edinburgh', region: 'Scotland', postcode: 'EH1 1AA' }),
      },
      {
        text: 'Cardiff',
        onPress: () => setUserLocation({ city: 'Cardiff', region: 'Wales', postcode: 'CF1 1AA' }),
      },
      {
        text: 'Cancel',
        style: 'cancel',
      },
    ]);
  };

  const handleGeneratePDF = async (analysis: any) => {
    try {
      // Check if user has access to PDF generation
      const hasAccess = subscriptionService.hasFeatureAccess(PREMIUM_FEATURES.PDF_GENERATION);

      if (!hasAccess) {
        setPaywallFeature(PREMIUM_FEATURES.PDF_GENERATION);
        setShowPaywall(true);
        return;
      }

      // Check PDF eligibility based on subscription and quote state
      const isPremiumUser = !subscriptionService.isFreePlan();
      const isEligible =
        quoteState?.isPdfEligible ||
        (isPremiumUser && quoteState?.isManuallyEdited) ||
        quoteState?.confidence >= 85;

      if (!isEligible && !isPremiumUser) {
        Alert.alert(
          'Improve Quote Accuracy',
          'Complete the guidance steps to unlock PDF generation, or upgrade to Pro for instant access.',
          [
            { text: 'Improve Quote', style: 'default' },
            {
              text: 'Upgrade to Pro',
              onPress: () => {
                setPaywallFeature(PREMIUM_FEATURES.PDF_GENERATION);
                setShowPaywall(true);
              },
            },
          ]
        );
        return;
      }

      setIsLoading(true);

      const { data, error } = await supabase.functions.invoke('generate-document', {
        body: {
          type: 'pdf',
          analysis: analysis,
          sessionId: sessionId,
          userId: user?.id || 'anonymous',
          subscription: subscriptionService.getSubscriptionStatus(),
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.success && data?.fileUrl) {
        // Handle PDF sharing/download
        console.log('PDF generated:', data.fileUrl);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('PDF Generated', 'Your professional quote has been generated successfully!', [
          {
            text: 'Share',
            onPress: () => {
              /* TODO: Open share sheet */
            },
          },
          { text: 'Done', style: 'default' },
        ]);
      }
    } catch (error) {
      console.error('PDF generation error:', error);
      Alert.alert('Error', 'Failed to generate PDF. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartTrial = async () => {
    try {
      const success = await subscriptionService.startFreeTrial();
      if (success) {
        setShowPaywall(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          '🎉 Trial Started!',
          'Welcome to your 7-day free trial of AskToddy Pro. Enjoy all premium features!',
          [{ text: 'Get Started', style: 'default' }]
        );
      } else {
        Alert.alert('Error', 'Failed to start trial. Please try again.');
      }
    } catch (error) {
      console.error('Trial start error:', error);
      Alert.alert('Error', 'Failed to start trial. Please try again.');
    }
  };

  const handleUpgrade = async (planId: string) => {
    try {
      // TODO: Integrate with actual payment processing (RevenueCat, Stripe, etc.)
      const success = await subscriptionService.activateSubscription(planId);
      if (success) {
        setShowPaywall(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          '💎 Welcome to AskToddy Pro!',
          'Your subscription is now active. Enjoy all premium features!',
          [{ text: 'Continue', style: 'default' }]
        );
      } else {
        Alert.alert('Error', 'Payment failed. Please try again.');
      }
    } catch (error) {
      console.error('Upgrade error:', error);
      Alert.alert('Error', 'Payment failed. Please try again.');
    }
  };

  const renderMessage = (item: Message) => (
    <View
      key={item.id}
      style={[
        styles.messageContainer,
        item.role === 'user' ? styles.userMessage : styles.assistantMessage,
      ]}
    >
      {item.images && item.images.length > 0 && (
        <View style={styles.messageImages}>
          {item.images.map((imageUri, index) => (
            <Image
              key={index}
              source={{ uri: imageUri }}
              style={styles.messageImage}
              resizeMode="cover"
            />
          ))}
        </View>
      )}
      {item.pdfs && item.pdfs.length > 0 && (
        <View style={styles.messagePdfs}>
          {item.pdfs.map((pdf, index) => (
            <View key={index} style={styles.pdfItem}>
              <Ionicons name="document" size={24} color={designTokens.colors.primary[500]} />
              <View style={styles.pdfInfo}>
                <Text style={styles.pdfName} numberOfLines={1}>
                  {pdf.name}
                </Text>
                <Text style={styles.pdfSize}>{(pdf.size / 1024 / 1024).toFixed(1)}MB</Text>
              </View>
            </View>
          ))}
        </View>
      )}
      {item.content && (
        <Text
          style={[
            styles.messageText,
            item.role === 'user' ? styles.userMessageText : styles.assistantMessageText,
          ]}
        >
          {item.content}
        </Text>
      )}
      {item.analysis && (
        <Text style={styles.analysisInfo}>
          {item.analysis.projectType} • {item.analysis.confidence}% confidence
        </Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Native status bar styling */}
      <StatusBar
        barStyle="light-content"
        backgroundColor={Platform.OS === 'ios' ? 'transparent' : '#FF6B35'}
        translucent={Platform.OS === 'ios'}
      />

      {/* Custom Header with gradient and logo */}
      <ToddyHeader
        onMenuPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setShowChatMenu(true);
        }}
        onNewChatPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          handleNewChat();
        }}
      />

      {/* Main Content Area */}
      <View style={styles.content}>
        {/* Quote Preview - Top Half */}
        <ScrollView
          style={styles.quoteSection}
          contentContainerStyle={styles.quoteSectionContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {quoteState ? (
            <QuotePreviewCard
              projectType={quoteState.projectType}
              confidence={quoteState.confidence}
              totalCost={quoteState.totalCost}
              keyItems={quoteState.keyItems}
              isUpdating={isUpdating}
              onExpand={handleExpandQuote}
              showPremiumFeatures={true}
              onGeneratePDF={() => handleGeneratePDF(quoteState.fullAnalysis)}
              showConfidenceGuide={quoteState.confidence < 85 && !quoteState.isManuallyEdited}
              hasImages={
                selectedImages.length > 0 || messages.some(m => m.images && m.images.length > 0)
              }
              hasLocation={!!userLocation}
              hasDetailedDescription={messages.some(
                m => m.role === 'user' && m.content.length > 50
              )}
              isPdfEligible={quoteState.isPdfEligible}
              isManuallyEdited={quoteState.isManuallyEdited}
              professionalCosts={quoteState.professionalCosts}
              enhancedPricing={quoteState.enhancedPricing}
              professionalAdvice={quoteState.professionalAdvice}
              onAddImages={showAttachmentOptions}
              onImproveDescription={() => {
                textInputRef.current?.focus();
                Alert.alert(
                  'Improve Description',
                  'Add more details about:\n\n• Room dimensions (e.g., "3m x 4m kitchen")\n• Specific materials (e.g., "quartz worktops", "ceramic tiles")\n• Quality level (e.g., "mid-range", "premium")\n• Special requirements\n• Current condition',
                  [{ text: 'Got it', style: 'default' }]
                );
              }}
              onCheckLocation={() => {
                if (userLocation) {
                  handleLocationPress();
                } else {
                  getCurrentLocation();
                }
              }}
            />
          ) : (
            <View style={styles.placeholderQuote}>
              <Ionicons name="calculator" size={48} color={designTokens.colors.grey[400]} />
              <Text style={styles.placeholderText}>Start chatting to build your quote</Text>
              <Text style={styles.placeholderSubtext}>
                Tell me about your construction project and I'll create a detailed estimate
              </Text>
            </View>
          )}
          {quoteError ? <Text style={styles.errorText}>{quoteError}</Text> : null}
        </ScrollView>

        {/* Suggested Prompts - Show when no messages */}
        {messages.length === 0 && (
          <View style={styles.suggestedPromptsContainer}>
            <Text style={styles.suggestedPromptsTitle}>Quick starts:</Text>
            <View style={styles.suggestedPrompts}>
              {[
                'Kitchen renovation, 3m x 4m, mid-range finishes',
                'Bathroom remodel, ensuite, modern style',
                'Living room extension, 20 sqm, brick construction',
                'Garden decking, 4m x 3m composite boards',
              ].map((prompt, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.suggestedPrompt}
                  onPress={() => {
                    setInputText(prompt);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <Text style={styles.suggestedPromptText}>{prompt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Chat - Bottom Section */}
        <View style={styles.chatSection}>
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesList}
            contentContainerStyle={styles.messagesContainer}
            showsVerticalScrollIndicator={true}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            onContentSizeChange={() => {
              // Auto-scroll to bottom when messages change
              if (messages.length > 0) {
                scrollViewRef.current?.scrollToEnd({ animated: true });
              }
            }}
          >
            {messages.map(renderMessage)}
          </ScrollView>
        </View>
      </View>

      {/* Bottom Fixed Area - Outside content */}
      <View style={styles.bottomInputArea}>
        {/* Selected Files Preview */}
        {(selectedImages.length > 0 || selectedPdfs.length > 0) && (
          <View style={styles.selectedFilesContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {/* Selected Images */}
              {selectedImages.map((imageUri, index) => (
                <View key={`img-${index}`} style={styles.selectedImageWrapper}>
                  <Image source={{ uri: imageUri }} style={styles.selectedImage} />
                  <TouchableOpacity
                    style={styles.removeFileButton}
                    onPress={() => removeImage(index)}
                  >
                    <Ionicons name="close-circle" size={24} color={designTokens.colors.error} />
                  </TouchableOpacity>
                </View>
              ))}
              {/* Selected PDFs */}
              {selectedPdfs.map((pdf, index) => (
                <View key={`pdf-${index}`} style={styles.selectedPdfWrapper}>
                  <View style={styles.selectedPdf}>
                    <Ionicons name="document" size={32} color={designTokens.colors.primary[500]} />
                    <Text style={styles.selectedPdfName} numberOfLines={2}>
                      {pdf.name}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.removeFileButton}
                    onPress={() => removePdf(index)}
                  >
                    <Ionicons name="close-circle" size={24} color={designTokens.colors.error} />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Location Display */}
        {userLocation && (
          <View style={styles.locationContainer}>
            <TouchableOpacity style={styles.locationButton} onPress={handleLocationPress}>
              <Ionicons name="location" size={16} color={designTokens.colors.primary[500]} />
              <Text style={styles.locationText}>
                {userLocation.city}, {userLocation.region}
                {userLocation.postcode && ` (${userLocation.postcode})`}
              </Text>
              <Ionicons name="chevron-down" size={16} color={designTokens.colors.text.secondary} />
            </TouchableOpacity>
          </View>
        )}

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.attachmentButton} onPress={showAttachmentOptions}>
            <Ionicons name="attach" size={24} color={designTokens.colors.primary[500]} />
          </TouchableOpacity>
          <TextInput
            ref={textInputRef}
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Describe your project..."
            multiline
            maxLength={1000}
            keyboardType="default"
            autoCapitalize="sentences"
            autoCorrect={true}
          />
          <TouchableOpacity
            style={styles.voiceButton}
            onPress={() => {
              // Focus input to show keyboard with voice option
              textInputRef.current?.focus();
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              Alert.alert(
                '🎤 Voice Input',
                "Use your keyboard's microphone button to dictate text. On iOS, tap the microphone icon on the keyboard. On Android, tap the microphone on your keyboard.",
                [{ text: 'Got it', style: 'default' }]
              );
            }}
            onLongPress={() => {
              // Haptic feedback for long press
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setIsRecording(true);
              Alert.alert(
                '🎙️ Voice Recording',
                "Voice recording feature coming soon! For now, use your keyboard's built-in voice input.",
                [{ text: 'OK', onPress: () => setIsRecording(false) }]
              );
            }}
          >
            <Ionicons
              name={isRecording ? 'mic' : 'mic-outline'}
              size={24}
              color={isRecording ? designTokens.colors.error : designTokens.colors.primary[500]}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.sendButton,
              ((!inputText.trim() && selectedImages.length === 0 && selectedPdfs.length === 0) ||
                isLoading) &&
                styles.sendButtonDisabled,
            ]}
            onPress={sendMessage}
            disabled={
              (!inputText.trim() && selectedImages.length === 0 && selectedPdfs.length === 0) ||
              isLoading
            }
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Quote Overlay */}
      <QuoteOverlay
        visible={showQuoteOverlay}
        onClose={() => setShowQuoteOverlay(false)}
        analysis={quoteState?.fullAnalysis}
        onGeneratePDF={handleGeneratePDF}
        onUpdateQuote={updated => {
          updateFromAnalysis(updated);
          markAsManuallyEdited();
        }}
      />

      {/* Chat Menu Sidebar */}
      <ChatMenuSidebar
        visible={showChatMenu}
        onClose={() => setShowChatMenu(false)}
        currentSessionId={sessionId}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
      />

      {/* Paywall Modal */}
      <PaywallModal
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        feature={paywallFeature as any}
        onStartTrial={handleStartTrial}
        onUpgrade={handleUpgrade}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: designTokens.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: designTokens.spacing.lg,
    paddingVertical: designTokens.spacing.md,
    backgroundColor: designTokens.colors.primary[500],
  },
  menuButton: {
    padding: designTokens.spacing.sm,
    borderRadius: designTokens.borderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    flex: 1,
    fontSize: designTokens.typography.fontSize.xl,
    fontWeight: designTokens.typography.fontWeight.bold as any,
    color: '#fff',
    textAlign: 'center',
    marginHorizontal: designTokens.spacing.md,
  },
  headerRight: {
    flexDirection: 'row',
    gap: designTokens.spacing.sm,
  },
  headerButton: {
    padding: designTokens.spacing.sm,
    borderRadius: designTokens.borderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  content: {
    flex: 1,
    paddingBottom: 80, // Space for fixed input area
  },
  contentContainer: {
    flexGrow: 1,
  },

  // Quote Section (Top Section)
  quoteSection: {
    minHeight: 200,
    maxHeight: 280,
  },
  quoteSectionContent: {
    paddingHorizontal: designTokens.spacing.md,
    paddingVertical: designTokens.spacing.md,
    flexGrow: 1,
  },
  placeholderQuote: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: designTokens.spacing.xs,
    marginVertical: designTokens.spacing.sm,
    padding: designTokens.spacing.lg,
    backgroundColor: designTokens.colors.grey[50],
    borderRadius: designTokens.borderRadius.xl,
    borderWidth: 2,
    borderColor: designTokens.colors.grey[200],
    borderStyle: 'dashed',
  },
  placeholderText: {
    fontSize: designTokens.typography.fontSize.lg,
    fontWeight: designTokens.typography.fontWeight.semibold as any,
    color: designTokens.colors.text.primary,
    textAlign: 'center',
    marginTop: designTokens.spacing.md,
  },
  placeholderSubtext: {
    fontSize: designTokens.typography.fontSize.base,
    color: designTokens.colors.text.secondary,
    textAlign: 'center',
    marginTop: designTokens.spacing.sm,
  },

  // Suggested Prompts
  suggestedPromptsContainer: {
    paddingHorizontal: designTokens.spacing.md,
    paddingBottom: designTokens.spacing.sm,
  },
  suggestedPromptsTitle: {
    fontSize: designTokens.typography.fontSize.sm,
    fontWeight: designTokens.typography.fontWeight.semibold as any,
    color: designTokens.colors.text.secondary,
    marginBottom: designTokens.spacing.sm,
  },
  suggestedPrompts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: designTokens.spacing.sm,
  },
  suggestedPrompt: {
    backgroundColor: designTokens.colors.grey[100],
    borderRadius: designTokens.borderRadius.full,
    paddingHorizontal: designTokens.spacing.md,
    paddingVertical: designTokens.spacing.sm,
    borderWidth: 1,
    borderColor: designTokens.colors.grey[200],
  },
  suggestedPromptText: {
    fontSize: designTokens.typography.fontSize.sm,
    color: designTokens.colors.text.primary,
  },
  errorText: {
    color: designTokens.colors.error,
    fontSize: designTokens.typography.fontSize.sm,
    textAlign: 'center',
    marginTop: designTokens.spacing.sm,
  },

  // Chat Section (Bottom Half)
  chatSection: {
    flex: 1,
    minHeight: 300,
    borderTopWidth: 2,
    borderTopColor: designTokens.colors.grey[300],
    backgroundColor: designTokens.colors.background,
  },
  messagesWrapper: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    paddingHorizontal: designTokens.spacing.md,
    paddingTop: designTokens.spacing.lg,
    paddingBottom: designTokens.spacing.xl,
    flexGrow: 1,
  },
  messageContainer: {
    marginBottom: designTokens.spacing.md,
    maxWidth: '85%',
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: designTokens.colors.primary[500],
    borderRadius: designTokens.borderRadius.lg,
    borderBottomRightRadius: designTokens.borderRadius.sm,
    padding: designTokens.spacing.md,
  },
  assistantMessage: {
    alignSelf: 'flex-start',
    backgroundColor: designTokens.colors.grey[100],
    borderRadius: designTokens.borderRadius.lg,
    borderBottomLeftRadius: designTokens.borderRadius.sm,
    padding: designTokens.spacing.md,
  },
  messageText: {
    fontSize: designTokens.typography.fontSize.base,
    lineHeight: 22,
  },
  userMessageText: {
    color: '#fff',
  },
  assistantMessageText: {
    color: designTokens.colors.text.primary,
  },
  analysisInfo: {
    fontSize: designTokens.typography.fontSize.xs,
    color: designTokens.colors.text.secondary,
    marginTop: designTokens.spacing.xs,
    fontStyle: 'italic',
  },
  messageImages: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: designTokens.spacing.xs,
    marginBottom: designTokens.spacing.sm,
  },
  messageImage: {
    width: 120,
    height: 120,
    borderRadius: designTokens.borderRadius.md,
  },
  messagePdfs: {
    marginBottom: designTokens.spacing.sm,
  },
  pdfItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: designTokens.spacing.sm,
    backgroundColor: designTokens.colors.grey[50],
    borderRadius: designTokens.borderRadius.md,
    marginBottom: designTokens.spacing.xs,
    gap: designTokens.spacing.sm,
  },
  pdfInfo: {
    flex: 1,
  },
  pdfName: {
    fontSize: designTokens.typography.fontSize.sm,
    fontWeight: designTokens.typography.fontWeight.medium as any,
    color: designTokens.colors.text.primary,
  },
  pdfSize: {
    fontSize: designTokens.typography.fontSize.xs,
    color: designTokens.colors.text.secondary,
    marginTop: 2,
  },

  // Selected Files Preview
  selectedFilesContainer: {
    paddingHorizontal: designTokens.spacing.md,
    paddingVertical: designTokens.spacing.sm,
    backgroundColor: designTokens.colors.grey[50],
    borderTopWidth: 1,
    borderTopColor: designTokens.colors.grey[200],
  },
  selectedImageWrapper: {
    position: 'relative',
    marginRight: designTokens.spacing.sm,
  },
  selectedImage: {
    width: 80,
    height: 80,
    borderRadius: designTokens.borderRadius.md,
  },
  removeFileButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: designTokens.colors.background,
    borderRadius: 12,
  },

  // Location Display
  locationContainer: {
    paddingHorizontal: designTokens.spacing.md,
    paddingVertical: designTokens.spacing.xs,
    backgroundColor: designTokens.colors.grey[50],
    borderTopWidth: 1,
    borderTopColor: designTokens.colors.grey[200],
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designTokens.spacing.xs,
    paddingVertical: designTokens.spacing.xs,
  },
  locationText: {
    flex: 1,
    fontSize: designTokens.typography.fontSize.sm,
    color: designTokens.colors.text.secondary,
  },

  // Bottom Fixed Input Area
  bottomInputArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: designTokens.colors.background,
    borderTopWidth: 1,
    borderTopColor: designTokens.colors.grey[200],
  },

  // Input Area
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: designTokens.spacing.md,
    backgroundColor: designTokens.colors.background,
    gap: designTokens.spacing.sm,
  },
  selectedPdfWrapper: {
    position: 'relative',
    marginRight: designTokens.spacing.sm,
  },
  selectedPdf: {
    width: 80,
    height: 80,
    backgroundColor: designTokens.colors.grey[100],
    borderRadius: designTokens.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    padding: designTokens.spacing.xs,
  },
  selectedPdfName: {
    fontSize: designTokens.typography.fontSize.xs,
    color: designTokens.colors.text.secondary,
    textAlign: 'center',
    marginTop: 2,
  },
  attachmentButton: {
    padding: designTokens.spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceButton: {
    padding: designTokens.spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: designTokens.colors.grey[300],
    borderRadius: designTokens.borderRadius.lg,
    paddingHorizontal: designTokens.spacing.md,
    paddingVertical: designTokens.spacing.sm,
    fontSize: designTokens.typography.fontSize.base,
    maxHeight: 100,
    backgroundColor: designTokens.colors.background,
  },
  sendButton: {
    backgroundColor: designTokens.colors.primary[500],
    borderRadius: designTokens.borderRadius.full,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: designTokens.colors.grey[400],
  },
});
