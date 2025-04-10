export interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  role: string;
}

export interface Document {
  id: number;
  title: string;
  fileUrl: string;
  fileType: string;
  uploadedBy: number;
  uploadedAt: string;
  metadata: {
    size: number;
    pageCount?: number;
  };
  score?: number; // For search results
}

export interface SearchHistory {
  id: number;
  userId: number;
  query: string;
  timestamp: string;
  results: number[];
}

export interface SearchResult extends Document {
  score: number;
  snippet?: string;
}

export interface DocumentSummary {
  summary: string;
  keyPoints: string[];
}
