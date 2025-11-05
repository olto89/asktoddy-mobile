/**
 * useImageAnalysis Hook - AI-powered image analysis using Edge Functions
 * Thin client implementation that delegates to analyze-construction Edge Function
 */

import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AnalysisContext {
  location?: string;
  projectType?: string;
  preferredProvider?: 'auto' | 'gemini' | 'openai';
  budgetRange?: {
    min: number;
    max: number;
  };
  userPreferences?: string[];
}

export interface AnalysisResult {
  success: boolean;
  data?: any;
  error?: string;
  provider?: string;
  confidence?: number;
}

export interface ImageAnalysisState {
  isAnalyzing: boolean;
  lastResult: AnalysisResult | null;

  // Actions
  analyzeImage: (imageUri: string, context?: AnalysisContext) => Promise<AnalysisResult>;
  analyzeWithMessage: (
    imageUri: string,
    message: string,
    context?: AnalysisContext
  ) => Promise<AnalysisResult>;
  clearResult: () => void;
}

export interface UseImageAnalysisOptions {
  defaultContext?: AnalysisContext;
  onAnalysisComplete?: (result: AnalysisResult) => void;
  onError?: (error: Error) => void;
}

export const useImageAnalysis = (options: UseImageAnalysisOptions = {}): ImageAnalysisState => {
  const {
    defaultContext = {
      location: 'London',
      projectType: 'General Construction',
      preferredProvider: 'auto',
    },
    onAnalysisComplete,
    onError,
  } = options;

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastResult, setLastResult] = useState<AnalysisResult | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Initialize session ID
  useEffect(() => {
    const initializeSession = async () => {
      try {
        const existingSessionId = await AsyncStorage.getItem('conversation_session_id');
        if (existingSessionId) {
          setSessionId(existingSessionId);
        } else {
          const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          await AsyncStorage.setItem('conversation_session_id', newSessionId);
          setSessionId(newSessionId);
        }
      } catch (error) {
        console.error('Failed to initialize session in useImageAnalysis:', error);
        const fallbackSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        setSessionId(fallbackSessionId);
      }
    };

    initializeSession();
  }, []);

  /**
   * Analyze image only (no text message)
   */
  const analyzeImage = async (
    imageUri: string,
    context: AnalysisContext = {}
  ): Promise<AnalysisResult> => {
    setIsAnalyzing(true);

    try {
      console.log('🤖 Starting image analysis with Edge Function...');

      const { data, error } = await supabase.functions.invoke('analyze-construction', {
        body: {
          imageUri,
          sessionId: sessionId, // Include session for contextual memory
          context: {
            ...defaultContext,
            ...context,
          },
        },
      });

      if (error) {
        throw new Error(`Analysis failed: ${error.message}`);
      }

      const result: AnalysisResult = {
        success: true,
        data: data?.data,
        provider: data?.data?.aiProvider,
        confidence: data?.data?.confidence,
      };

      setLastResult(result);
      onAnalysisComplete?.(result);

      console.log('✅ Image analysis complete:', result.data?.projectType);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Analysis failed';
      console.error('Image analysis error:', errorMessage);

      const result: AnalysisResult = {
        success: false,
        error: errorMessage,
      };

      setLastResult(result);
      onError?.(new Error(errorMessage));

      return result;
    } finally {
      setIsAnalyzing(false);
    }
  };

  /**
   * Analyze image with accompanying text message
   */
  const analyzeWithMessage = async (
    imageUri: string,
    message: string,
    context: AnalysisContext = {}
  ): Promise<AnalysisResult> => {
    setIsAnalyzing(true);

    try {
      console.log('🤖 Starting image + message analysis with Edge Function...');

      const { data, error } = await supabase.functions.invoke('analyze-construction', {
        body: {
          message,
          imageUri,
          sessionId: sessionId, // Include session for contextual memory
          context: {
            ...defaultContext,
            ...context,
          },
        },
      });

      if (error) {
        throw new Error(`Analysis failed: ${error.message}`);
      }

      const result: AnalysisResult = {
        success: true,
        data: data?.data,
        provider: data?.data?.aiProvider,
        confidence: data?.data?.confidence,
      };

      setLastResult(result);
      onAnalysisComplete?.(result);

      console.log('✅ Multi-modal analysis complete:', result.data?.projectType);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Analysis failed';
      console.error('Multi-modal analysis error:', errorMessage);

      const result: AnalysisResult = {
        success: false,
        error: errorMessage,
      };

      setLastResult(result);
      onError?.(new Error(errorMessage));

      return result;
    } finally {
      setIsAnalyzing(false);
    }
  };

  /**
   * Clear the last analysis result
   */
  const clearResult = (): void => {
    setLastResult(null);
  };

  return {
    isAnalyzing,
    lastResult,
    analyzeImage,
    analyzeWithMessage,
    clearResult,
  };
};
