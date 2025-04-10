import { 
  users, 
  documents, 
  chunks, 
  searchHistory, 
  type User, 
  type InsertUser, 
  type Document, 
  type InsertDocument, 
  type Chunk, 
  type InsertChunk, 
  type SearchHistory, 
  type InsertSearchHistory 
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Document operations
  getDocument(id: number): Promise<Document | undefined>;
  getDocumentsByUser(userId: number): Promise<Document[]>;
  getRecentDocuments(userId: number, limit?: number): Promise<Document[]>;
  createDocument(document: InsertDocument): Promise<Document>;
  
  // Chunk operations
  getChunk(id: number): Promise<Chunk | undefined>;
  getChunksByDocument(documentId: number): Promise<Chunk[]>;
  createChunk(chunk: InsertChunk): Promise<Chunk>;
  
  // Search history operations
  getSearchHistory(id: number): Promise<SearchHistory | undefined>;
  getSearchHistoryByUser(userId: number, limit?: number): Promise<SearchHistory[]>;
  createSearchHistory(searchHistory: InsertSearchHistory): Promise<SearchHistory>;
  
  // Vector search
  searchDocuments(embedding: number[], limit?: number): Promise<{documentId: number, score: number}[]>;
  
  // Related documents
  findRelatedDocuments(documentId: number, limit?: number): Promise<Document[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private documents: Map<number, Document>;
  private chunks: Map<number, Chunk>;
  private searchHistory: Map<number, SearchHistory>;
  private userId: number;
  private documentId: number;
  private chunkId: number;
  private searchHistoryId: number;

  constructor() {
    this.users = new Map();
    this.documents = new Map();
    this.chunks = new Map();
    this.searchHistory = new Map();
    this.userId = 1;
    this.documentId = 1;
    this.chunkId = 1;
    this.searchHistoryId = 1;
    
    // Add a demo user
    this.createUser({
      username: "demo",
      password: "password",
      name: "Sarah Johnson",
      email: "sarah.j@example.com",
      role: "user"
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = { ...insertUser, id, createdAt: new Date() };
    this.users.set(id, user);
    return user;
  }

  // Document operations
  async getDocument(id: number): Promise<Document | undefined> {
    return this.documents.get(id);
  }

  async getDocumentsByUser(userId: number): Promise<Document[]> {
    return Array.from(this.documents.values()).filter(
      (document) => document.uploadedBy === userId,
    );
  }

  async getRecentDocuments(userId: number, limit: number = 10): Promise<Document[]> {
    return Array.from(this.documents.values())
      .filter((document) => document.uploadedBy === userId)
      .sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime())
      .slice(0, limit);
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const id = this.documentId++;
    const document: Document = { ...insertDocument, id, uploadedAt: new Date() };
    this.documents.set(id, document);
    return document;
  }

  // Chunk operations
  async getChunk(id: number): Promise<Chunk | undefined> {
    return this.chunks.get(id);
  }

  async getChunksByDocument(documentId: number): Promise<Chunk[]> {
    return Array.from(this.chunks.values()).filter(
      (chunk) => chunk.documentId === documentId,
    );
  }

  async createChunk(insertChunk: InsertChunk): Promise<Chunk> {
    const id = this.chunkId++;
    const chunk: Chunk = { ...insertChunk, id };
    this.chunks.set(id, chunk);
    return chunk;
  }

  // Search history operations
  async getSearchHistory(id: number): Promise<SearchHistory | undefined> {
    return this.searchHistory.get(id);
  }

  async getSearchHistoryByUser(userId: number, limit: number = 10): Promise<SearchHistory[]> {
    return Array.from(this.searchHistory.values())
      .filter((history) => history.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  async createSearchHistory(insertSearchHistory: InsertSearchHistory): Promise<SearchHistory> {
    const id = this.searchHistoryId++;
    const searchHistory: SearchHistory = { ...insertSearchHistory, id, timestamp: new Date() };
    this.searchHistory.set(id, searchHistory);
    return searchHistory;
  }

  // Vector search - simplified implementation for MVP
  async searchDocuments(embedding: number[], limit: number = 10): Promise<{ documentId: number; score: number }[]> {
    const results: { documentId: number; score: number; chunkId: number }[] = [];
    
    // Simplified similarity calculation
    for (const chunk of this.chunks.values()) {
      if (chunk.embedding) {
        const score = this.calculateCosineSimilarity(embedding, chunk.embedding);
        results.push({ documentId: chunk.documentId, score, chunkId: chunk.id });
      }
    }
    
    // Sort by score (descending) and remove duplicates by keeping the highest score for each document
    const uniqueResults = new Map<number, { documentId: number; score: number }>();
    results
      .sort((a, b) => b.score - a.score)
      .forEach((result) => {
        if (!uniqueResults.has(result.documentId) || uniqueResults.get(result.documentId)!.score < result.score) {
          uniqueResults.set(result.documentId, { documentId: result.documentId, score: result.score });
        }
      });
    
    return Array.from(uniqueResults.values()).slice(0, limit);
  }

  // Related document finder
  async findRelatedDocuments(documentId: number, limit: number = 3): Promise<Document[]> {
    try {
      // Get the document
      const document = await this.getDocument(documentId);
      if (!document) {
        return [];
      }
      
      // Get document chunks
      const chunks = await this.getChunksByDocument(documentId);
      if (!chunks || chunks.length === 0) {
        return [];
      }
      
      // Combine chunk embeddings into a single document embedding by averaging
      const documentEmbedding: number[] = [];
      let validChunksCount = 0;
      
      for (const chunk of chunks) {
        if (chunk.embedding && chunk.embedding.length > 0) {
          if (documentEmbedding.length === 0) {
            // Initialize with the first chunk's embedding dimensions
            for (let i = 0; i < chunk.embedding.length; i++) {
              documentEmbedding.push(0);
            }
          }
          
          // Add each dimension
          for (let i = 0; i < chunk.embedding.length; i++) {
            documentEmbedding[i] += chunk.embedding[i];
          }
          validChunksCount++;
        }
      }
      
      // If we couldn't get valid embeddings, return empty array
      if (validChunksCount === 0) {
        return [];
      }
      
      // Calculate the average
      for (let i = 0; i < documentEmbedding.length; i++) {
        documentEmbedding[i] /= validChunksCount;
      }
      
      // Search for similar documents
      const results = await this.searchDocuments(documentEmbedding, limit + 1); // +1 to account for filtering out the original
      
      // Filter out the original document and get the actual documents
      const relatedDocs = await Promise.all(
        results
          .filter(result => result.documentId !== documentId)
          .slice(0, limit)
          .map(result => this.getDocument(result.documentId))
      );
      
      // Filter out any undefined results
      return relatedDocs.filter((doc): doc is Document => doc !== undefined);
    } catch (error) {
      console.error("Error finding related documents:", error);
      return [];
    }
  }

  // Helper function to calculate cosine similarity
  private calculateCosineSimilarity(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) {
      throw new Error("Vectors must have the same length");
    }
    
    let dotProduct = 0;
    let mag1 = 0;
    let mag2 = 0;
    
    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      mag1 += vec1[i] * vec1[i];
      mag2 += vec2[i] * vec2[i];
    }
    
    mag1 = Math.sqrt(mag1);
    mag2 = Math.sqrt(mag2);
    
    return dotProduct / (mag1 * mag2);
  }
}

export const storage = new MemStorage();
