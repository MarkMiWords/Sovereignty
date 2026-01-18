
export type MasteringGoal = 'newspaper' | 'substack' | 'paperback';

export interface UsageMetrics {
  estimatedTokens: number;
  humanHoursSaved: number;
  wholesaleCostEstimate: number;
  // Added to align with metrics returned by Gemini services
  simulatedResourceLoad?: number;
}

export interface EfficiencyLog {
  id: string;
  timestamp: string;
  action: string;
  metrics: UsageMetrics;
}

export interface Narrative {
  id: string;
  title: string;
  author: string;
  excerpt: string;
  category: 'Diary' | 'Interview' | 'Short Story' | 'Essay' | 'Legal Testimony' | 'Family Law Chronicle' | 'Systemic Memoir';
  imageUrl: string;
  tags: string[];
  region: 'AU' | 'US' | 'UK' | 'GLOBAL';
  publishDate: string;
  stats?: {
    reads: number;
    kindredConnections: number;
    reach: number;
  };
}

export interface Artwork {
  id: string;
  title: string;
  artist: string;
  imageUrl: string;
  tags: string[];
}

export interface Book {
  id: string;
  title: string;
  subtitle?: string;
  author: string;
  description: string;
  coverUrl: string;
  slug: string;
  releaseYear: string;
  buyUrl?: string;
}

export interface GroundingSource {
  web?: { uri: string; title: string; };
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: GroundingSource[];
}

export interface MediaAsset {
  id: string;
  data: string;
  name: string;
  type: string;
}

export interface Chapter {
  id: string;
  title: string;
  content: string;
  order: number;
  media?: MediaAsset[];
  subChapters?: Chapter[];
}

export interface ManuscriptReport {
  summary: string;
  toneAssessment: string;
  structuralCheck: string;
  legalSafetyAudit: string;
  resourceIntensity: number;
  marketabilityScore: number;
  suggestedTitle: string;
  mediumSpecificAdvice: string;
}

export interface VaultSheet {
  id: string;
  timestamp: string;
  dispatchKey?: string;
  status: 'draft' | 'archived' | 'dispatched';
  data: Chapter;
}

export interface VaultAI {
  id: string;
  timestamp: string;
  topic: string;
  history: Message[];
}

export interface VaultAudit {
  id: string;
  timestamp: string;
  goal: MasteringGoal;
  report: ManuscriptReport;
}

export interface VaultStorage {
  sheets: VaultSheet[];
  books: Book[];
  ai: VaultAI[];
  audits: VaultAudit[];
  efficiencyLogs?: EfficiencyLog[];
}
