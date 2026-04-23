/**
 * ChatHistoryService - Manages chat session storage and retrieval
 * Provides ChatGPT-style persistent chat management
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from './Logger';

export interface ChatSession {
  id: string;
  title: string;
  lastMessage: string;
  lastUpdated: number;
  messageCount: number;
  projectType?: string;
  confidence?: number;
  estimatedCost?: {
    min: number;
    max: number;
  };
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  analysis?: any;
}

const STORAGE_KEYS = {
  SESSIONS: '@asktoddy_chat_sessions',
  MESSAGES: '@asktoddy_chat_messages',
  CURRENT_SESSION: '@asktoddy_current_session',
} as const;

class ChatHistoryService {
  /**
   * Get all chat sessions ordered by last updated
   */
  async getAllSessions(): Promise<ChatSession[]> {
    try {
      const sessionsData = await AsyncStorage.getItem(STORAGE_KEYS.SESSIONS);
      if (!sessionsData) return [];

      const sessions: ChatSession[] = JSON.parse(sessionsData);
      return sessions.sort((a, b) => b.lastUpdated - a.lastUpdated);
    } catch (error) {
      console.error('Failed to get chat sessions:', error);
      return [];
    }
  }

  /**
   * Create a new chat session
   */
  async createNewSession(): Promise<ChatSession> {
    const newSession: ChatSession = {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: 'New Construction Quote',
      lastMessage: '',
      lastUpdated: Date.now(),
      messageCount: 0,
    };

    try {
      // Add to sessions list
      const sessions = await this.getAllSessions();
      sessions.unshift(newSession);
      await AsyncStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));

      // Set as current session
      await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_SESSION, newSession.id);

      logger.debug('📝 New chat session created:', newSession.id);
      return newSession;
    } catch (error) {
      console.error('Failed to create new session:', error);
      throw error;
    }
  }

  /**
   * Update session with new message and analysis data
   */
  async updateSession(sessionId: string, lastMessage: string, analysis?: any): Promise<void> {
    try {
      const sessions = await this.getAllSessions();
      const sessionIndex = sessions.findIndex(s => s.id === sessionId);

      if (sessionIndex === -1) {
        logger.warn('Session not found for update:', sessionId);
        return;
      }

      // Generate smart title from first user message or project type
      let title = sessions[sessionIndex].title;
      if (sessions[sessionIndex].messageCount === 0 && lastMessage.length > 0) {
        title = this.generateSessionTitle(lastMessage);
      } else if (analysis?.projectType) {
        title = `${analysis.projectType} Quote`;
      }

      sessions[sessionIndex] = {
        ...sessions[sessionIndex],
        title,
        lastMessage: lastMessage.substring(0, 100) + (lastMessage.length > 100 ? '...' : ''),
        lastUpdated: Date.now(),
        messageCount: sessions[sessionIndex].messageCount + 1,
        projectType: analysis?.projectType,
        confidence: analysis?.confidence,
        estimatedCost: analysis?.costBreakdown?.total
          ? {
              min: analysis.costBreakdown.total.min || 0,
              max: analysis.costBreakdown.total.max || 0,
            }
          : undefined,
      };

      await AsyncStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
    } catch (error) {
      console.error('Failed to update session:', error);
    }
  }

  /**
   * Delete a chat session and its messages
   */
  async deleteSession(sessionId: string): Promise<void> {
    try {
      // Remove from sessions
      const sessions = await this.getAllSessions();
      const filteredSessions = sessions.filter(s => s.id !== sessionId);
      await AsyncStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(filteredSessions));

      // Remove session messages
      await AsyncStorage.removeItem(`${STORAGE_KEYS.MESSAGES}_${sessionId}`);

      logger.debug('🗑️ Session deleted:', sessionId);
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  }

  /**
   * Get current active session ID
   */
  async getCurrentSessionId(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_SESSION);
    } catch (error) {
      console.error('Failed to get current session:', error);
      return null;
    }
  }

  /**
   * Set current active session
   */
  async setCurrentSession(sessionId: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_SESSION, sessionId);
    } catch (error) {
      console.error('Failed to set current session:', error);
    }
  }

  /**
   * Save messages for a session
   */
  async saveSessionMessages(sessionId: string, messages: ChatMessage[]): Promise<void> {
    try {
      await AsyncStorage.setItem(`${STORAGE_KEYS.MESSAGES}_${sessionId}`, JSON.stringify(messages));
    } catch (error) {
      console.error('Failed to save session messages:', error);
    }
  }

  /**
   * Load messages for a session
   */
  async loadSessionMessages(sessionId: string): Promise<ChatMessage[]> {
    try {
      const messagesData = await AsyncStorage.getItem(`${STORAGE_KEYS.MESSAGES}_${sessionId}`);
      if (!messagesData) return [];

      return JSON.parse(messagesData).map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
      }));
    } catch (error) {
      console.error('Failed to load session messages:', error);
      return [];
    }
  }

  /**
   * Generate a smart session title from first user message
   */
  private generateSessionTitle(message: string): string {
    const lowered = message.toLowerCase();

    // Extract project keywords
    if (lowered.includes('kitchen')) return 'Kitchen Renovation';
    if (lowered.includes('bathroom')) return 'Bathroom Renovation';
    if (lowered.includes('bedroom')) return 'Bedroom Project';
    if (lowered.includes('garden') || lowered.includes('landscaping')) return 'Garden Project';
    if (lowered.includes('roof')) return 'Roofing Project';
    if (lowered.includes('flooring') || lowered.includes('floor')) return 'Flooring Project';
    if (lowered.includes('extension')) return 'Home Extension';
    if (lowered.includes('loft') || lowered.includes('attic')) return 'Loft Conversion';
    if (lowered.includes('garage')) return 'Garage Project';
    if (lowered.includes('driveway')) return 'Driveway Project';

    // Fallback to first few words
    const words = message.split(' ').slice(0, 3).join(' ');
    return words.length > 20 ? words.substring(0, 20) + '...' : words || 'Construction Quote';
  }

  /**
   * Clear all chat history (for testing/reset)
   */
  async clearAllHistory(): Promise<void> {
    try {
      const sessions = await this.getAllSessions();

      // Remove all session messages
      for (const session of sessions) {
        await AsyncStorage.removeItem(`${STORAGE_KEYS.MESSAGES}_${session.id}`);
      }

      // Clear sessions and current session
      await AsyncStorage.removeItem(STORAGE_KEYS.SESSIONS);
      await AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_SESSION);

      logger.debug('🗑️ All chat history cleared');
    } catch (error) {
      console.error('Failed to clear chat history:', error);
    }
  }

  /**
   * Get session by ID
   */
  async getSessionById(sessionId: string): Promise<ChatSession | null> {
    try {
      const sessions = await this.getAllSessions();
      return sessions.find(s => s.id === sessionId) || null;
    } catch (error) {
      console.error('Failed to get session by ID:', error);
      return null;
    }
  }
}

export const chatHistoryService = new ChatHistoryService();
export default ChatHistoryService;
