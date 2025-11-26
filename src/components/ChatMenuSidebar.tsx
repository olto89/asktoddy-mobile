/**
 * ChatMenuSidebar - ChatGPT-style navigation menu
 * Shows chat history and new chat option
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { chatHistoryService, ChatSession } from '../services/ChatHistoryService';
import designTokens from '../styles/designTokens';

interface ChatMenuSidebarProps {
  visible: boolean;
  onClose: () => void;
  currentSessionId?: string;
  onSelectSession: (sessionId: string) => void;
  onNewChat: () => void;
}

const { width: screenWidth } = Dimensions.get('window');

export default function ChatMenuSidebar({
  visible,
  onClose,
  currentSessionId,
  onSelectSession,
  onNewChat,
}: ChatMenuSidebarProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [slideAnim] = useState(new Animated.Value(-screenWidth * 0.8));
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      loadSessions();
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -screenWidth * 0.8,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const loadSessions = async () => {
    try {
      setIsLoading(true);
      const allSessions = await chatHistoryService.getAllSessions();
      setSessions(allSessions);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onNewChat();
      onClose();
    } catch (error) {
      console.error('Failed to create new chat:', error);
    }
  };

  const handleSelectSession = (sessionId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelectSession(sessionId);
    onClose();
  };

  const handleDeleteSession = (session: ChatSession) => {
    Alert.alert('Delete Chat', `Are you sure you want to delete "${session.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await chatHistoryService.deleteSession(session.id);
            await loadSessions();

            // If this was the current session, create a new one
            if (currentSessionId === session.id) {
              onNewChat();
            }
          } catch (error) {
            console.error('Failed to delete session:', error);
          }
        },
      },
    ]);
  };

  const formatTimeAgo = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;

    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const renderSessionItem = (session: ChatSession) => {
    const isActive = currentSessionId === session.id;

    return (
      <View key={session.id} style={styles.sessionItemContainer}>
        <TouchableOpacity
          style={[styles.sessionItem, isActive && styles.activeSessionItem]}
          onPress={() => handleSelectSession(session.id)}
          activeOpacity={0.7}
        >
          <View style={styles.sessionContent}>
            <View style={styles.sessionHeader}>
              <Text
                style={[styles.sessionTitle, isActive && styles.activeSessionTitle]}
                numberOfLines={1}
              >
                {session.title}
              </Text>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteSession(session)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={16} color={designTokens.colors.text.secondary} />
              </TouchableOpacity>
            </View>

            {session.lastMessage && (
              <Text
                style={[styles.lastMessage, isActive && styles.activeLastMessage]}
                numberOfLines={2}
              >
                {session.lastMessage}
              </Text>
            )}

            <View style={styles.sessionMeta}>
              <Text style={[styles.timeAgo, isActive && styles.activeTimeAgo]}>
                {formatTimeAgo(session.lastUpdated)}
              </Text>

              {session.estimatedCost && (
                <Text style={[styles.costPreview, isActive && styles.activeCostPreview]}>
                  £{session.estimatedCost.min.toLocaleString()}-£
                  {session.estimatedCost.max.toLocaleString()}
                </Text>
              )}
            </View>

            {session.confidence && session.confidence > 0 && (
              <View style={styles.confidenceBar}>
                <View style={styles.confidenceTrack}>
                  <View
                    style={[
                      styles.confidenceFill,
                      {
                        width: `${session.confidence}%`,
                        backgroundColor: getConfidenceColor(session.confidence),
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.confidenceText, isActive && styles.activeConfidenceText]}>
                  {session.confidence}%
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 85) return designTokens.colors.success;
    if (confidence >= 70) return designTokens.colors.warning;
    return designTokens.colors.error;
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        {/* Background tap to close */}
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

        {/* Sidebar content */}
        <Animated.View
          style={[
            styles.sidebar,
            {
              transform: [{ translateX: slideAnim }],
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Ionicons name="chatbubbles" size={24} color={designTokens.colors.primary[500]} />
              <Text style={styles.headerTitle}>Chat History</Text>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={designTokens.colors.text.primary} />
            </TouchableOpacity>
          </View>

          {/* New Chat Button */}
          <TouchableOpacity style={styles.newChatButton} onPress={handleNewChat}>
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.newChatText}>New Construction Quote</Text>
          </TouchableOpacity>

          {/* Sessions List */}
          <ScrollView style={styles.sessionsList} showsVerticalScrollIndicator={false}>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading chat history...</Text>
              </View>
            ) : sessions.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons
                  name="chatbubble-outline"
                  size={48}
                  color={designTokens.colors.grey[400]}
                />
                <Text style={styles.emptyTitle}>No chat history yet</Text>
                <Text style={styles.emptySubtitle}>
                  Start your first construction quote to see it here
                </Text>
              </View>
            ) : (
              <>
                <Text style={styles.sectionTitle}>Recent Chats</Text>
                {sessions.map(renderSessionItem)}
              </>
            )}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {sessions.length} chat{sessions.length !== 1 ? 's' : ''} saved
            </Text>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const getConfidenceColor = (confidence: number): string => {
  if (confidence >= 85) return designTokens.colors.success;
  if (confidence >= 70) return designTokens.colors.warning;
  return designTokens.colors.error;
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sidebar: {
    width: screenWidth * 0.8,
    backgroundColor: designTokens.colors.background,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: designTokens.spacing.lg,
    paddingVertical: designTokens.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: designTokens.colors.grey[200],
    backgroundColor: designTokens.colors.surface,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designTokens.spacing.md,
  },
  headerTitle: {
    fontSize: designTokens.typography.fontSize.lg,
    fontWeight: designTokens.typography.fontWeight.bold as any,
    color: designTokens.colors.text.primary,
  },
  closeButton: {
    padding: designTokens.spacing.sm,
    borderRadius: designTokens.borderRadius.full,
    backgroundColor: designTokens.colors.grey[100],
  },
  newChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: designTokens.colors.primary[500],
    paddingVertical: designTokens.spacing.md,
    marginHorizontal: designTokens.spacing.lg,
    marginTop: designTokens.spacing.lg,
    borderRadius: designTokens.borderRadius.lg,
    gap: designTokens.spacing.sm,
  },
  newChatText: {
    color: '#fff',
    fontSize: designTokens.typography.fontSize.base,
    fontWeight: designTokens.typography.fontWeight.semibold as any,
  },
  sessionsList: {
    flex: 1,
    paddingTop: designTokens.spacing.lg,
  },
  sectionTitle: {
    fontSize: designTokens.typography.fontSize.sm,
    fontWeight: designTokens.typography.fontWeight.semibold as any,
    color: designTokens.colors.text.secondary,
    paddingHorizontal: designTokens.spacing.lg,
    marginBottom: designTokens.spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sessionItemContainer: {
    paddingHorizontal: designTokens.spacing.lg,
    marginBottom: designTokens.spacing.sm,
  },
  sessionItem: {
    backgroundColor: designTokens.colors.surface,
    borderRadius: designTokens.borderRadius.lg,
    padding: designTokens.spacing.md,
    borderWidth: 1,
    borderColor: designTokens.colors.grey[200],
  },
  activeSessionItem: {
    backgroundColor: designTokens.colors.primary[50],
    borderColor: designTokens.colors.primary[200],
  },
  sessionContent: {
    gap: designTokens.spacing.sm,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  sessionTitle: {
    flex: 1,
    fontSize: designTokens.typography.fontSize.base,
    fontWeight: designTokens.typography.fontWeight.semibold as any,
    color: designTokens.colors.text.primary,
    marginRight: designTokens.spacing.sm,
  },
  activeSessionTitle: {
    color: designTokens.colors.primary[600],
  },
  deleteButton: {
    padding: designTokens.spacing.xs,
  },
  lastMessage: {
    fontSize: designTokens.typography.fontSize.sm,
    color: designTokens.colors.text.secondary,
    lineHeight: 18,
  },
  activeLastMessage: {
    color: designTokens.colors.primary[700],
  },
  sessionMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeAgo: {
    fontSize: designTokens.typography.fontSize.xs,
    color: designTokens.colors.text.secondary,
  },
  activeTimeAgo: {
    color: designTokens.colors.primary[600],
  },
  costPreview: {
    fontSize: designTokens.typography.fontSize.xs,
    fontWeight: designTokens.typography.fontWeight.semibold as any,
    color: designTokens.colors.text.primary,
  },
  activeCostPreview: {
    color: designTokens.colors.primary[600],
  },
  confidenceBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designTokens.spacing.sm,
  },
  confidenceTrack: {
    flex: 1,
    height: 4,
    backgroundColor: designTokens.colors.grey[200],
    borderRadius: 2,
  },
  confidenceFill: {
    height: '100%',
    borderRadius: 2,
  },
  confidenceText: {
    fontSize: designTokens.typography.fontSize.xs,
    fontWeight: designTokens.typography.fontWeight.medium as any,
    color: designTokens.colors.text.secondary,
    minWidth: 30,
  },
  activeConfidenceText: {
    color: designTokens.colors.primary[600],
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: designTokens.spacing.xl,
  },
  loadingText: {
    fontSize: designTokens.typography.fontSize.base,
    color: designTokens.colors.text.secondary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: designTokens.spacing.xl,
    paddingHorizontal: designTokens.spacing.lg,
  },
  emptyTitle: {
    fontSize: designTokens.typography.fontSize.lg,
    fontWeight: designTokens.typography.fontWeight.semibold as any,
    color: designTokens.colors.text.primary,
    marginTop: designTokens.spacing.md,
    marginBottom: designTokens.spacing.sm,
  },
  emptySubtitle: {
    fontSize: designTokens.typography.fontSize.base,
    color: designTokens.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  footer: {
    paddingHorizontal: designTokens.spacing.lg,
    paddingVertical: designTokens.spacing.md,
    borderTopWidth: 1,
    borderTopColor: designTokens.colors.grey[200],
    backgroundColor: designTokens.colors.surface,
  },
  footerText: {
    fontSize: designTokens.typography.fontSize.xs,
    color: designTokens.colors.text.secondary,
    textAlign: 'center',
  },
});
