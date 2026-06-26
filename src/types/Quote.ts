import type { VoiceRecording } from '../hooks/useVoiceRecording';

export interface SiteNote {
  id: string;
  timestamp: number;
  address: string;
  jobType: string;
  constructionMethod?: string;
  constructionMethodMultiplier?: number;
  propertyType: string;
  size: string;
  sizeLength?: string;
  sizeWidth?: string;
  specLevel?: string;
  numberOfRooms?: string;
  numberOfFloors?: string;
  tasks: string[];
  notes: string;
  photos: string[];
  voiceNotes: string; // Legacy: text transcript
  voiceRecordings?: VoiceRecording[];
  syncStatus: 'local' | 'syncing' | 'synced';
  status: 'draft' | 'generated' | 'completed';
  lastModified: number;
  // Generated quote fields (present after AI analysis)
  generatedTasks?: any[];
  totalCost?: { min: number; max: number };
  finalCost?: number;
  aiAnalysis?: any;
  siteNotes?: any; // Reference to original site notes for generated quotes
  pendingGeneration?: boolean;
  // Edit quote fields
  quoteName?: string;
  customerName?: string;
  projectNotes?: string;
  // Construction method label for display
  constructionMethodLabel?: string;
  // Cached on-demand "Toddy's advice" (winning-range estimate + margin tips),
  // so re-opening a saved quote shows it without re-billing a Gemini call.
  toddyAdvice?: {
    winRange: { min: number; max: number };
    rationale: string;
    tips: string[];
  };
  // User opt-in to list each line item's materials on the customer PDF.
  showMaterialBreakdown?: boolean;
}

export interface DraftFormData {
  currentQuoteId: string | null;
  quoteName?: string;
  customerName?: string;
  address: string;
  selectedJobType: string;
  selectedConstructionMethod: string;
  selectedPropertyType: string;
  size: string;
  sizeLength?: string;
  sizeWidth?: string;
  specLevel?: string;
  numberOfRooms?: string;
  numberOfFloors?: string;
  selectedTasks: string[];
  additionalNotes: string;
  photos: string[];
  voiceTranscript: string;
  voiceRecordings: VoiceRecording[];
  existingTimestamp?: number;
  existingStatus?: 'draft' | 'generated' | 'completed';
}
