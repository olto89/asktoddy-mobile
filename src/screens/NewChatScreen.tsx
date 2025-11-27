/**
 * NewChatScreen - Quote-first UI with interactive preview at top
 * Chat input at bottom, real-time quote updates
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useQuoteUpdates } from '../hooks/useQuoteUpdates';
import QuotePreviewCard from '../components/QuotePreviewCard';
import QuoteOverlay from '../components/QuoteOverlay';
import ChatMenuSidebar from '../components/ChatMenuSidebar';
import {
  chatHistoryService,
  ChatMessage as ChatHistoryMessage,
} from '../services/ChatHistoryService';
import designTokens from '../styles/designTokens';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  analysis?: any;
}

export default function NewChatScreen() {
  const { user } = useAuth();
  const [sessionId, setSessionId] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showQuoteOverlay, setShowQuoteOverlay] = useState(false);
  const [showChatMenu, setShowChatMenu] = useState(false);

  const flatListRef = useRef<FlatList>(null);

  // Real-time quote updates
  const {
    quoteState,
    isUpdating,
    error: quoteError,
    updateFromAnalysis,
    refreshQuote,
  } = useQuoteUpdates({
    sessionId,
    userId: user?.id || 'anonymous',
    isActive: true,
  });

  // Initialize session
  useEffect(() => {
    initializeSession();
  }, []);

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
    if (!inputText.trim() || isLoading) return;

    const userMessage = inputText.trim();
    setInputText('');
    setIsLoading(true);

    // Add user message
    const userMsg: Message = {
      id: `msg_${Date.now()}_user`,
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);

    try {
      // Call analyze-construction edge function
      const { data, error } = await supabase.functions.invoke('analyze-construction', {
        body: {
          message: userMessage,
          sessionId: sessionId,
          userId: user?.id || 'anonymous',
          history: messages.slice(-6), // Include recent history
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.success && data?.data) {
        const analysis = data.data;

        // Add assistant response
        const assistantMsg: Message = {
          id: `msg_${Date.now()}_assistant`,
          role: 'assistant',
          content: analysis.description || 'Analysis completed.',
          timestamp: new Date(),
          analysis,
        };

        setMessages(prev => {
          const newMessages = [...prev, assistantMsg];
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
        const newMessages = [...prev, errorMsg];
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

      // Update quote state for new session
      refreshQuote();

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

  const handleGeneratePDF = async (analysis: any) => {
    try {
      setIsLoading(true);

      const { data, error } = await supabase.functions.invoke('generate-document', {
        body: {
          type: 'pdf',
          analysis: analysis,
          sessionId: sessionId,
          userId: user?.id || 'anonymous',
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.success && data?.fileUrl) {
        // Handle PDF sharing/download
        console.log('PDF generated:', data.fileUrl);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        // TODO: Open share sheet or download
      }
    } catch (error) {
      console.error('PDF generation error:', error);
      Alert.alert('Error', 'Failed to generate PDF. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View
      style={[
        styles.messageContainer,
        item.role === 'user' ? styles.userMessage : styles.assistantMessage,
      ]}
    >
      <Text
        style={[
          styles.messageText,
          item.role === 'user' ? styles.userMessageText : styles.assistantMessageText,
        ]}
      >
        {item.content}
      </Text>
      {item.analysis && (
        <Text style={styles.analysisInfo}>
          {item.analysis.projectType} • {item.analysis.confidence}% confidence
        </Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowChatMenu(true);
          }}
        >
          <Ionicons name="menu" size={24} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>AskToddy</Text>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              handleNewChat();
            }}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.headerButton} onPress={refreshQuote}>
            <Ionicons
              name="refresh"
              size={24}
              color={isUpdating ? '#fff' : 'rgba(255,255,255,0.7)'}
            />
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Quote Preview - Top Half */}
        <View style={styles.quoteSection}>
          {quoteState ? (
            <QuotePreviewCard
              projectType={quoteState.projectType}
              confidence={quoteState.confidence}
              totalCost={quoteState.totalCost}
              keyItems={quoteState.keyItems}
              isUpdating={isUpdating}
              onExpand={handleExpandQuote}
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

          {quoteError && <Text style={styles.errorText}>{quoteError}</Text>}
        </View>

        {/* Chat - Bottom Half */}
        <View style={styles.chatSection}>
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={item => item.id}
            style={styles.messagesList}
            contentContainerStyle={styles.messagesContainer}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
          />

          {/* Input Area */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Describe your project..."
              multiline
              maxLength={1000}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!inputText.trim() || isLoading) && styles.sendButtonDisabled,
              ]}
              onPress={sendMessage}
              disabled={!inputText.trim() || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="send" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Quote Overlay */}
      <QuoteOverlay
        visible={showQuoteOverlay}
        onClose={() => setShowQuoteOverlay(false)}
        analysis={quoteState?.fullAnalysis}
        onGeneratePDF={handleGeneratePDF}
        onUpdateQuote={updated => updateFromAnalysis(updated)}
      />

      {/* Chat Menu Sidebar */}
      <ChatMenuSidebar
        visible={showChatMenu}
        onClose={() => setShowChatMenu(false)}
        currentSessionId={sessionId}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
      />
    </SafeAreaView>
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
  },

  // Quote Section (Top Half)
  quoteSection: {
    flex: 0.5,
    minHeight: 200,
    paddingBottom: designTokens.spacing.md,
  },
  placeholderQuote: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    margin: designTokens.spacing.lg,
    padding: designTokens.spacing.xl,
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
  errorText: {
    color: designTokens.colors.error,
    fontSize: designTokens.typography.fontSize.sm,
    textAlign: 'center',
    marginTop: designTokens.spacing.sm,
  },

  // Chat Section (Bottom Half)
  chatSection: {
    flex: 0.5,
    borderTopWidth: 1,
    borderTopColor: designTokens.colors.grey[200],
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    padding: designTokens.spacing.md,
    paddingBottom: designTokens.spacing.lg,
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

  // Input Area
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: designTokens.spacing.md,
    backgroundColor: designTokens.colors.background,
    borderTopWidth: 1,
    borderTopColor: designTokens.colors.grey[200],
    gap: designTokens.spacing.sm,
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
