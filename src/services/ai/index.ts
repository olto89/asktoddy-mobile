// AI Service Exports

export { AIService } from './AIService';
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
  AIMiddlewareConfig
} from './types';

// Default export
export default AIService;