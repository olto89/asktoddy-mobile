/**
 * Type definitions for contextual memory system
 */

export interface ConversationContext {
  sessionId: string;
  userId?: string;
  createdAt: string;
  lastUpdated: string;
  projectProfile: ProjectProfile;
  questionHistory: QuestionHistory[];
  messageHistory: MessageSummary[];
  currentPhase: ConversationPhase;
  completenessScore: number; // 0-100%
}

export interface ProjectProfile {
  projectType?: string;
  specificType?: string;
  location?: LocationInfo;
  scope?: ProjectScope;
  requirements?: ProjectRequirements;
  constraints?: ProjectConstraints;
  preferences?: UserPreferences;
}

export interface LocationInfo {
  region?: string;
  city?: string;
  postcode?: string;
  pricingMultiplier?: number;
}

export interface ProjectScope {
  rooms?: string[];
  size?: SizeInfo;
  timeline?: TimelineInfo;
  budget?: BudgetInfo;
  workType?: WorkType[];
}

export interface SizeInfo {
  area?: number; // square meters
  dimensions?: string; // e.g., "3m x 4m"
  description?: string; // e.g., "small", "medium", "large"
}

export interface TimelineInfo {
  urgency?: 'urgent' | 'normal' | 'flexible';
  deadline?: string;
  preferredStart?: string;
  duration?: string;
}

export interface BudgetInfo {
  range?: string; // e.g., "£5000-£10000"
  max?: number;
  priority?: 'budget' | 'quality' | 'speed';
}

export interface ProjectRequirements {
  finishLevel?: 'budget' | 'mid-range' | 'high-end' | 'luxury';
  specificRequirements?: string[];
  mustHaves?: string[];
  niceToHaves?: string[];
}

export interface ProjectConstraints {
  access?: string; // access limitations
  utilities?: string; // utility constraints
  structural?: string; // structural limitations
  planning?: boolean; // planning permission needed
  listed?: boolean; // listed building
  other?: string[];
}

export interface UserPreferences {
  style?: string; // design style preferences
  brands?: string[]; // preferred brands
  materials?: string[]; // material preferences
  tradePreferences?: string[]; // preferred trades/contractors
}

export interface QuestionHistory {
  question: string;
  answer?: string;
  askedAt: string;
  answeredAt?: string;
  category: QuestionCategory;
  importance: 'critical' | 'important' | 'optional';
}

export interface MessageSummary {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  keyInfo?: string[]; // extracted key information
  responseType?: 'conversation' | 'estimation' | 'quote';
  // Multi-modal support
  attachments?: MediaAttachment[];
  hasMedia?: boolean;
}

export interface MediaAttachment {
  type: 'image' | 'pdf' | 'video' | 'document';
  mimeType: string;
  description?: string; // AI-generated description of media content
  extractedInfo?: string[]; // Key information extracted from media
  confidence?: number; // AI confidence in media analysis (0-100)
}

export type ConversationPhase = 'discovery' | 'estimation' | 'refinement' | 'quoting';

export type QuestionCategory =
  | 'project_type'
  | 'size_scope'
  | 'quality_finish'
  | 'budget_constraints'
  | 'timeline'
  | 'access_limitations'
  | 'preferences';

export type WorkType =
  | 'renovation'
  | 'extension'
  | 'new_build'
  | 'repair'
  | 'maintenance'
  | 'planning';

// Enhanced analysis request with context
export interface ContextualAnalysisRequest {
  message?: string;
  imageUri?: string;
  sessionId: string;
  userId?: string;
  context?: {
    location?: string;
    city?: string;
    postcode?: string;
    region?: string;
    regionCode?: string;
    pricingMultiplier?: number;
    coordinates?: [number, number];
    projectType?: string;
    preferredProvider?: string;
  };
  history?: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
  }>;
  conversationContext?: ConversationContext;
}

// Enhanced project analysis with context awareness
export interface ContextualProjectAnalysis {
  // Existing fields
  projectType: string;
  description: string;
  difficultyLevel: string;
  responseType: 'conversation' | 'estimation' | 'quote';

  // Context-aware fields
  contextUsed: boolean;
  previouslyAskedQuestions: string[];
  newInformationGathered: Record<string, any>;
  projectCompleteness: number; // 0-100%
  nextRecommendedQuestions: string[];
  assumptionsMade: string[];

  // Updated context
  updatedProjectProfile: ProjectProfile;
  conversationPhase: ConversationPhase;

  // Rest of existing analysis fields...
  costBreakdown?: any;
  timeline?: any;
  toolsRequired?: string[];
  safetyConsiderations?: string[];
  permitsRequired?: string[];
  requiresProfessional?: boolean;
  professionalReasons?: string[];
  confidence: number;
  recommendations?: string[];
  warnings?: string[];
  analysisId: string;
  timestamp: string;
  aiProvider: string;
  processingTimeMs: number;
}

// Database row interface
export interface ConversationSessionRow {
  id: string;
  user_id?: string;
  session_id: string;
  project_profile: Record<string, any>;
  question_history: Record<string, any>[];
  message_history: Record<string, any>[];
  current_phase: ConversationPhase;
  completeness_score: number;
  created_at: string;
  updated_at: string;
}
