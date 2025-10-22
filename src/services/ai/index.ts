// AI Service Exports
// MIGRATED: Using Edge Function AI Service (ASK-35)
// All AI processing now happens server-side in Supabase Edge Function

export { AIService } from './AIServiceEdge';

// Legacy exports (kept for backward compatibility during migration)
export { AIService as AIServiceLocal } from './AIService';
export { AIMiddleware } from './AIMiddleware';
export { GeminiProvider } from './providers/GeminiProvider';
export { MockProvider } from './providers/MockProvider';

export type {
  AIProvider,
  AnalysisRequest,
  ProjectAnalysis,
  QuoteBreakdown,
  MaterialItem,
  ToolRequirement,
  AIProviderConfig,
  AIMiddlewareConfig,
} from './types';

// Default export (now uses Edge Function)
import { AIService } from './AIServiceEdge';
export default AIService;
