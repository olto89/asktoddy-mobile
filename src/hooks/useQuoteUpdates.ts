/**
 * useQuoteUpdates - Hook for real-time quote updates
 * Polls the edge function for latest quote state during active conversations
 */

import { useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabase';
import { logger } from '../services/Logger';

interface QuoteState {
  projectType: string;
  confidence: number;
  aiConfidence: number; // Original AI confidence (doesn't change with edits)
  totalCost: {
    min: number;
    max: number;
  };
  keyItems: Array<{
    id: string;
    name: string;
    total: number;
    category: 'materials' | 'labor' | 'tools';
  }>;
  fullAnalysis?: any;
  lastUpdated: number;
  isManuallyEdited?: boolean; // Track if user has made manual changes
  isPdfEligible?: boolean; // Separate PDF eligibility from AI confidence
  // Enhanced professional cost breakdown
  professionalCosts?: {
    grandTotal: number;
    subtotalExVAT: number;
    vat: { rate: number; amount: number };
    contingency: { percentage: number; amount: number; description: string };
    materials: { total: number; wastageAmount: number };
    labour: { total: number };
    overheads: { total: number; percentage: number };
    preliminaries: { total: number; percentage: number };
    profit: { percentage: number; amount: number };
  };
  confidenceBreakdown?: {
    overall: number;
    factors: {
      materialAvailability: { score: number; description: string; impact: string };
      labourAvailability: { score: number; description: string; impact: string };
      priceStability: { score: number; description: string; impact: string };
      seasonalFactors: { score: number; description: string; impact: string };
      dataFreshness: { score: number; description: string; impact: string };
    };
    recommendations: Array<{ priority: string; action: string; impact: string }>;
  };
  enhancedPricing?: {
    materialCount: number;
    dataSource: string;
    confidenceScore: number;
    enhancementApplied: boolean;
  };
  professionalAdvice?: string[];
}

interface UseQuoteUpdatesOptions {
  sessionId: string;
  userId: string;
  isActive?: boolean; // Whether chat is actively being used
  pollInterval?: number; // Polling interval in ms (default: 3000)
}

export const useQuoteUpdates = ({
  sessionId,
  userId,
  isActive = true,
  pollInterval = 3000,
}: UseQuoteUpdatesOptions) => {
  const [quoteState, setQuoteState] = useState<QuoteState | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateRef = useRef<number>(0);

  /**
   * Fetch latest quote state from edge function
   */
  const fetchQuoteState = async (): Promise<void> => {
    if (!sessionId || !isActive) return;

    try {
      setIsUpdating(true);
      setError(null);

      // Call edge function to get latest session state
      const { data, error: fetchError } = await supabase.functions.invoke('get-session-quote', {
        body: {
          sessionId,
          userId,
          includeFullAnalysis: false, // Just summary for preview
        },
      });

      if (fetchError) {
        // Silently ignore - polling is temporarily disabled
        // console.error('Failed to fetch quote state:', fetchError);
        // setError('Failed to fetch latest quote');
        return;
      }

      if (data?.success && data?.quoteState) {
        const newQuote = data.quoteState;

        // Only update if data has actually changed
        if (newQuote.lastUpdated > lastUpdateRef.current) {
          setQuoteState(newQuote);
          lastUpdateRef.current = newQuote.lastUpdated;

          logger.debug('Quote updated:', {
            confidence: newQuote.confidence,
            totalCost: newQuote.totalCost,
            lastUpdated: new Date(newQuote.lastUpdated).toISOString(),
          });
        }
      }
    } catch (err) {
      console.error('Quote update error:', err);
      setError('Failed to update quote');
    } finally {
      setIsUpdating(false);
    }
  };

  /**
   * Extract key items from full analysis for preview
   */
  const extractKeyItems = (analysis: any): QuoteState['keyItems'] => {
    const keyItems: QuoteState['keyItems'] = [];

    // Extract top materials
    if (analysis.costBreakdown?.materials?.items) {
      const topMaterials = analysis.costBreakdown.materials.items
        .sort((a: any, b: any) => (b.total || b.totalPrice) - (a.total || a.totalPrice))
        .slice(0, 2);

      topMaterials.forEach((item: any, index: number) => {
        keyItems.push({
          id: `mat-${index}`,
          name: item.name || 'Material Item',
          total: item.total || item.totalPrice || 0,
          category: 'materials',
        });
      });
    }

    // Extract top labor
    if (analysis.costBreakdown?.labor?.items) {
      const topLabor = analysis.costBreakdown.labor.items
        .sort((a: any, b: any) => b.total - a.total)
        .slice(0, 1);

      topLabor.forEach((item: any, index: number) => {
        keyItems.push({
          id: `lab-${index}`,
          name: item.name || 'Labor Item',
          total: item.total || 0,
          category: 'labor',
        });
      });
    }

    // If no detailed items, create summary items
    if (keyItems.length === 0) {
      if (analysis.costBreakdown?.materials) {
        keyItems.push({
          id: 'materials-summary',
          name: 'Materials & Supplies',
          total: analysis.costBreakdown.materials.max || 0,
          category: 'materials',
        });
      }

      if (analysis.costBreakdown?.labor) {
        keyItems.push({
          id: 'labor-summary',
          name: 'Professional Labor',
          total: analysis.costBreakdown.labor.max || 0,
          category: 'labor',
        });
      }
    }

    return keyItems;
  };

  /**
   * Update quote state from new analysis (called when chat sends new message)
   */
  const updateFromAnalysis = (analysis: any): void => {
    if (!analysis) return;

    const keyItems = extractKeyItems(analysis);
    const totalCost = {
      min: analysis.costBreakdown?.total?.min || 0,
      max: analysis.costBreakdown?.total?.max || 0,
    };

    const aiConfidence = analysis.confidence || 0;

    const newQuoteState: QuoteState = {
      projectType: analysis.projectType || 'Construction Project',
      confidence: aiConfidence,
      aiConfidence: aiConfidence,
      totalCost,
      keyItems,
      fullAnalysis: analysis,
      lastUpdated: Date.now(),
      isManuallyEdited: false,
      isPdfEligible: aiConfidence >= 85,
      // Extract enhanced professional cost data if available
      professionalCosts: analysis.professionalCosts
        ? {
            grandTotal: analysis.professionalCosts.grandTotal,
            subtotalExVAT: analysis.professionalCosts.subtotalExVAT,
            vat: analysis.professionalCosts.vat,
            contingency: analysis.professionalCosts.contingency,
            materials: analysis.professionalCosts.materials,
            labour: analysis.professionalCosts.labour,
            overheads: analysis.professionalCosts.overheads,
            preliminaries: analysis.professionalCosts.preliminaries,
            profit: analysis.professionalCosts.profit,
          }
        : undefined,
      confidenceBreakdown: analysis.confidenceBreakdown,
      enhancedPricing: analysis.enhancedPricing,
      professionalAdvice: analysis.professionalAdvice,
    };

    setQuoteState(newQuoteState);
    lastUpdateRef.current = newQuoteState.lastUpdated;
  };

  /**
   * Mark quote as manually edited (maintains PDF eligibility for premium users)
   */
  const markAsManuallyEdited = (): void => {
    if (quoteState) {
      setQuoteState({
        ...quoteState,
        isManuallyEdited: true,
        // For premium users, manual editing should maintain PDF eligibility
        isPdfEligible: true,
        lastUpdated: Date.now(),
      });
    }
  };

  /**
   * Start/stop polling based on active state
   */
  useEffect(() => {
    // TEMPORARILY DISABLED - Edge Function not deployed yet
    // Uncomment when get-session-quote function is deployed
    /*
    if (isActive && sessionId) {
      // Start polling
      fetchQuoteState();
      intervalRef.current = setInterval(fetchQuoteState, pollInterval);
    } else {
      // Stop polling
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    */

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, sessionId, pollInterval]);

  /**
   * Manual refresh function
   */
  const refreshQuote = async (): Promise<void> => {
    await fetchQuoteState();
  };

  /**
   * Clear quote state for new session
   */
  const clearQuote = (): void => {
    setQuoteState(null);
    setError(null);
    lastUpdateRef.current = 0;
  };

  return {
    quoteState,
    isUpdating,
    error,
    updateFromAnalysis,
    refreshQuote,
    clearQuote,
    markAsManuallyEdited,
  };
};
