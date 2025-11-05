export interface DocumentRequest {
  type: 'quote' | 'timeline' | 'tasklist';
  projectType: string;
  analysis: ProjectAnalysis;
  pricing?: PricingResponse;
  userDetails?: {
    name?: string;
    email?: string;
    address?: string;
    phone?: string;
  };
}

export interface ProjectAnalysis {
  projectType: string;
  description: string;
  costBreakdown: CostBreakdown;
  timeline: Timeline;
  recommendations: string[];
  confidence: number;
  aiProvider: string;
  processingTimeMs: number;
}

export interface CostBreakdown {
  materials: LineItem[];
  labour: LineItem[];
  tools: LineItem[];
  total: number;
  vatRate?: number;
  vatAmount?: number;
  grandTotal?: number;
}

export interface LineItem {
  item: string;
  description?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
}

export interface Timeline {
  phases: Phase[];
  totalDuration: string;
  startDate?: string;
  endDate?: string;
}

export interface Phase {
  name: string;
  description?: string;
  duration: string;
  dependencies?: string[];
  tasks?: Task[];
}

export interface Task {
  name: string;
  description?: string;
  duration: string;
  skillsRequired: string[];
  toolsNeeded: string[];
  safetyConsiderations?: string[];
}

export interface PricingResponse {
  materials: any[];
  labour: any[];
  tools: any[];
  aggregates?: any[];
  location?: string;
  generatedAt: string;
}

export interface DocumentResponse {
  success: boolean;
  document: {
    documentId: string;
    type: string;
    filename: string;
    downloadUrl: string;
    size: string;
    pages: number;
    generatedAt: string;
    expiresAt: string;
  };
  pdfBuffer?: Uint8Array;
  message: string;
  processingTimeMs: number;
}
