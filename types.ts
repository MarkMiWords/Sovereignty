
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
    reach: number; // Percentage of global target
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
  author: string;
  description: string;
  coverUrl: string;
  slug: string;
  releaseYear: string;
}

export interface GroundingSource {
  web?: {
    uri: string;
    title: string;
  };
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: GroundingSource[];
}

export interface MediaAsset {
  id: string;
  data: string; // Base64 image data
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
  resourceIntensity: number; // Simulated token cost/intensity
  marketabilityScore: number;
  suggestedTitle: string;
}
