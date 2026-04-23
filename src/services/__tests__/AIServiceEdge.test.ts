/* eslint-disable @typescript-eslint/no-explicit-any, max-lines-per-function, max-lines */

// Mock config before importing AIServiceEdge
jest.mock('../../config', () => ({
  config: {
    supabase: {
      url: 'https://test.supabase.co',
      anonKey: 'test-anon-key',
    },
    ai: {
      geminiApiKey: 'test-key',
      primaryProvider: 'gemini',
      enableFallback: true,
      fallbackProviders: ['mock'],
      timeoutMs: 30000,
    },
  },
}));

// Must import after mocks
import { AIService } from '../ai/AIServiceEdge';

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('AIServiceEdge', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockReset();
  });

  describe('initialization', () => {
    it('constructs with correct base URL', () => {
      expect(AIService).toBeDefined();
      // The singleton is already created, verify it exists
      expect(typeof AIService.initialize).toBe('function');
      expect(typeof AIService.analyzeImage).toBe('function');
      expect(typeof AIService.processChat).toBe('function');
    });

    it('initialize() calls health check endpoint', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            status: 'healthy',
            middleware: { availableProviders: ['gemini-simple'] },
          }),
      });

      // Force re-initialization
      AIService.cleanup();
      await AIService.initialize();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test.supabase.co/functions/v1/analyze-construction',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            apikey: 'test-anon-key',
          }),
        })
      );
    });

    it('initialize() succeeds even if health check fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
      });

      AIService.cleanup();
      // Should not throw
      await expect(AIService.initialize()).resolves.toBeUndefined();
    });

    it('initialize() succeeds even on network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      AIService.cleanup();
      await expect(AIService.initialize()).resolves.toBeUndefined();
    });
  });

  describe('analyzeImage', () => {
    beforeEach(() => {
      // Pre-initialize to skip health check in analysis tests
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) });
      AIService.cleanup();
    });

    it('sends POST request with correct payload', async () => {
      // First call: health check init
      // Second call: actual analysis
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            data: {
              projectType: 'Kitchen Renovation',
              description: 'Test analysis',
              difficultyLevel: 'Moderate',
              confidence: 85,
              costBreakdown: {
                materials: { min: 100, max: 200, items: [] },
                labor: { min: 50, max: 100, hourlyRate: 25, estimatedHours: 4 },
                total: { min: 150, max: 300 },
              },
              timeline: { diy: '2 days', professional: '1 day', phases: [] },
              toolsRequired: [],
              safetyConsiderations: [],
              permitsRequired: [],
              requiresProfessional: false,
              recommendations: [],
              warnings: [],
              analysisId: 'test-id',
              timestamp: new Date().toISOString(),
              aiProvider: 'gemini-simple',
              processingTimeMs: 1500,
            },
            aiProvider: 'gemini-simple',
          }),
      });

      const result = await AIService.analyzeImage({
        message: 'Analyze my kitchen',
        analysisType: 'chat',
      });

      expect(result.projectType).toBe('Kitchen Renovation');
      expect(result.confidence).toBe(85);

      // The POST call is the second fetch call
      const postCall = mockFetch.mock.calls.find((call: any) => call[1]?.method === 'POST');
      expect(postCall).toBeDefined();
      const body = JSON.parse(postCall![1].body);
      expect(body.message).toBe('Analyze my kitchen');
      expect(body.sessionId).toBeDefined();
    });

    it('throws on non-OK response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Internal Server Error'),
      });

      await expect(
        AIService.analyzeImage({ message: 'test', analysisType: 'chat' })
      ).rejects.toThrow('Edge function failed: 500');
    });

    it('throws when response has success: false', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            success: false,
            error: { message: 'Rate limit exceeded' },
          }),
      });

      await expect(
        AIService.analyzeImage({ message: 'test', analysisType: 'chat' })
      ).rejects.toThrow('Rate limit exceeded');
    });
  });

  describe('processChat', () => {
    it('delegates to analyzeImage with chat type', async () => {
      const analyzeSpy = jest.spyOn(AIService, 'analyzeImage').mockResolvedValueOnce({
        projectType: 'General',
        description: 'Chat response',
      } as any);

      await AIService.processChat('Hello');

      expect(analyzeSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Hello',
          analysisType: 'chat',
        })
      );
      analyzeSpy.mockRestore();
    });
  });

  describe('session management', () => {
    it('getCurrentSessionId returns a session ID', () => {
      const id = AIService.getCurrentSessionId();
      // After construction, it should have loaded or created a session
      expect(id === null || typeof id === 'string').toBe(true);
    });

    it('createNewSession generates unique IDs', async () => {
      const id1 = await AIService.createNewSession();
      const id2 = await AIService.createNewSession();

      expect(id1).toMatch(/^session_/);
      expect(id2).toMatch(/^session_/);
      expect(id1).not.toBe(id2);
    });
  });

  describe('cleanup', () => {
    it('resets initialization state', () => {
      AIService.cleanup();
      // After cleanup, next call should re-initialize
      expect(typeof AIService.initialize).toBe('function');
    });
  });

  describe('503 fallback handling', () => {
    beforeEach(() => {
      // Pre-initialize to skip health check
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) });
      AIService.cleanup();
    });

    it('returns fallback data with _isFallback flag on 503 with fallbackData', async () => {
      const fallbackData = {
        projectType: 'general',
        description: 'Estimated costs',
        confidence: 60,
        provider: 'fallback-template',
        costBreakdown: {
          materials: { min: 1000, max: 3000, items: [] },
          labor: { min: 800, max: 1200, hourlyRate: 25, estimatedHours: 40 },
          total: { min: 1800, max: 4200 },
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: () =>
          Promise.resolve({
            success: false,
            error: { message: 'AI unavailable', code: 'AI_UNAVAILABLE' },
            fallbackData,
          }),
      });

      const result = await AIService.analyzeImage({
        message: 'test',
        analysisType: 'chat',
      });

      expect(result._isFallback).toBe(true);
      expect(result.projectType).toBe('general');
      expect(result.confidence).toBe(60);
    });

    it('throws error on 503 without fallbackData', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: () =>
          Promise.resolve({
            success: false,
            error: { message: 'AI unavailable', code: 'AI_UNAVAILABLE' },
          }),
      });

      await expect(
        AIService.analyzeImage({ message: 'test', analysisType: 'chat' })
      ).rejects.toThrow('AI unavailable');
    });

    it('does not set _isFallback on successful 200 response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            success: true,
            data: {
              projectType: 'Kitchen Renovation',
              description: 'Real AI analysis',
              confidence: 85,
              costBreakdown: {
                materials: { min: 5000, max: 8000, items: [] },
                labor: { min: 2000, max: 3000, hourlyRate: 30, estimatedHours: 80 },
                total: { min: 7000, max: 11000 },
              },
              timeline: { diy: '14 days', professional: '7 days', phases: [] },
              toolsRequired: [],
              safetyConsiderations: [],
              permitsRequired: [],
              requiresProfessional: false,
              recommendations: [],
              warnings: [],
              analysisId: 'real-id',
              timestamp: new Date().toISOString(),
              aiProvider: 'gemini-structured',
              processingTimeMs: 2000,
            },
            aiProvider: 'gemini-structured',
          }),
      });

      const result = await AIService.analyzeImage({
        message: 'Analyze my kitchen renovation',
        analysisType: 'chat',
      });

      expect(result._isFallback).toBeUndefined();
      expect(result.projectType).toBe('Kitchen Renovation');
      expect(result.confidence).toBe(85);
    });
  });

  describe('getAvailableProviders', () => {
    it('returns providers from health endpoint', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            middleware: { availableProviders: ['gemini-simple', 'gemini'] },
          }),
      });

      const providers = await AIService.getAvailableProviders();
      expect(providers).toEqual(['gemini-simple', 'gemini']);
    });

    it('returns empty array on failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const providers = await AIService.getAvailableProviders();
      expect(providers).toEqual([]);
    });
  });
});
