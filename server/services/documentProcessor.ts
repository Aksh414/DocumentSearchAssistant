import fs from 'fs/promises';
import path from 'path';
import { storage } from '../storage';
import { generateEmbedding } from './openai';
import { InsertDocument, InsertChunk } from '@shared/schema';

interface DocumentData {
  title: string;
  content: string;
  fileType: string;
  size: number;
  pageCount?: number;
}

/**
 * Process and store a document
 */
export async function processDocument(
  filePath: string, 
  originalFilename: string,
  userId: number
): Promise<number> {
  try {
    // Extract document data (text content, metadata, etc.)
    const documentData = await extractDocumentData(filePath, originalFilename);
    
    // Store document metadata
    const document = await storage.createDocument({
      title: documentData.title,
      fileUrl: filePath,
      fileType: documentData.fileType,
      uploadedBy: userId,
      metadata: {
        size: documentData.size,
        pageCount: documentData.pageCount
      }
    });
    
    // Split document into chunks
    const chunks = splitIntoChunks(documentData.content);
    
    // Create and store chunks with embeddings
    try {
      for (let i = 0; i < chunks.length; i++) {
        // Generate embedding (now has built-in fallback)
        const embedding = await generateEmbedding(chunks[i]);
        
        await storage.createChunk({
          documentId: document.id,
          chunkIndex: i,
          chunkText: chunks[i],
          embedding
        });
      }
    } catch (embeddingError) {
      // If there's an error during embedding, log it but continue
      // We still want to save the document even if embeddings fail
      console.error("Error generating embeddings:", embeddingError);
      console.log("Document saved but embeddings may be incomplete.");
    }
    
    return document.id;
  } catch (error) {
    console.error("Error processing document:", error);
    throw error;
  }
}

/**
 * Extract text and metadata from a document file
 */
async function extractDocumentData(filePath: string, originalFilename: string): Promise<DocumentData> {
  try {
    // Get file size
    const stats = await fs.stat(filePath);
    const fileSize = stats.size;
    
    // Get file extension
    const fileExt = path.extname(originalFilename).toLowerCase();
    
    // For the MVP, we'll just read the file as text
    // In a real implementation, we would use different parsers for different file types
    const fileContent = await fs.readFile(filePath, 'utf-8');
    
    let pageCount;
    if (fileExt === '.pdf') {
      // Simple estimation for PDF pages - in a real app we'd use a PDF parser
      pageCount = Math.max(1, Math.ceil(fileContent.length / 4000));
    }
    
    return {
      title: originalFilename,
      content: fileContent,
      fileType: fileExt.replace('.', '').toUpperCase(),
      size: fileSize,
      pageCount
    };
  } catch (error) {
    console.error("Error extracting document data:", error);
    throw error;
  }
}

/**
 * Split document content into chunks for embedding and search
 */
function splitIntoChunks(text: string, maxChunkSize: number = 1000): string[] {
  // Simple implementation: split by paragraphs then combine until reaching max size
  const paragraphs = text.split(/\n\s*\n/);
  const chunks: string[] = [];
  let currentChunk = '';
  
  for (const paragraph of paragraphs) {
    if (currentChunk.length + paragraph.length < maxChunkSize) {
      currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk);
      }
      currentChunk = paragraph;
    }
  }
  
  if (currentChunk) {
    chunks.push(currentChunk);
  }
  
  return chunks;
}

/**
 * Search documents using a natural language query
 */
export async function searchDocuments(query: string, userId: number) {
  try {
    // Generate embedding for the query (now has built-in fallback)
    const queryEmbedding = await generateEmbedding(query);
    
    // Search for relevant documents
    const searchResults = await storage.searchDocuments(queryEmbedding, 10);
    
    // Get document details
    const documents = await Promise.all(
      searchResults.map(async (result) => {
        try {
          const document = await storage.getDocument(result.documentId);
          if (!document) return null;
          
          return {
            ...document,
            score: result.score,
            // Add a snippet from the document content for display in search results
            snippet: await getDocumentSnippet(document.id, query)
          };
        } catch (docError) {
          console.error(`Error getting document ${result.documentId}:`, docError);
          return null;
        }
      })
    );
    
    // Filter out null/undefined documents and sort by score
    const validDocuments = documents.filter((doc): doc is NonNullable<typeof doc> => doc !== null && doc !== undefined)
      .sort((a, b) => (b.score || 0) - (a.score || 0));
    
    try {
      // Store search history - but don't let failures here affect the search results
      await storage.createSearchHistory({
        userId,
        query,
        results: validDocuments.map(doc => doc!.id)
      });
    } catch (historyError) {
      console.error("Error storing search history:", historyError);
      // Continue anyway - search history is non-critical
    }
    
    return validDocuments;
  } catch (error) {
    console.error("Error searching documents:", error);
    
    // Return empty results rather than failing completely
    return [];
  }
}

/**
 * Get a relevant snippet from a document that matches the query
 */
async function getDocumentSnippet(documentId: number, query: string): Promise<string> {
  try {
    // Get document chunks
    const chunks = await storage.getChunksByDocument(documentId);
    if (!chunks || chunks.length === 0) {
      return "No preview available";
    }
    
    // Simple relevance scoring - find the chunk with the most query terms
    const queryTerms = query.toLowerCase().split(/\W+/).filter(t => t.length > 2);
    let bestChunk = chunks[0];
    let bestScore = 0;
    
    for (const chunk of chunks) {
      const chunkText = chunk.chunkText.toLowerCase();
      let score = 0;
      
      for (const term of queryTerms) {
        if (chunkText.includes(term)) {
          score++;
        }
      }
      
      if (score > bestScore) {
        bestScore = score;
        bestChunk = chunk;
      }
    }
    
    // Return the best chunk text (or a portion of it if it's very long)
    const text = bestChunk.chunkText;
    if (text.length > 200) {
      return text.substring(0, 197) + '...';
    }
    return text;
  } catch (error) {
    console.error("Error getting document snippet:", error);
    return "Preview unavailable";
  }
}
