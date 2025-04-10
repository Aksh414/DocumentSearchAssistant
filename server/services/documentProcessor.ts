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
    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query);
    
    // Search for relevant documents
    const searchResults = await storage.searchDocuments(queryEmbedding, 10);
    
    // Get document details
    const documents = await Promise.all(
      searchResults.map(async (result) => {
        const document = await storage.getDocument(result.documentId);
        return {
          ...document,
          score: result.score
        };
      })
    );
    
    // Filter out undefined documents and sort by score
    const validDocuments = documents.filter(Boolean).sort((a, b) => b.score - a.score);
    
    // Store search history
    await storage.createSearchHistory({
      userId,
      query,
      results: validDocuments.map(doc => doc!.id)
    });
    
    return validDocuments;
  } catch (error) {
    console.error("Error searching documents:", error);
    throw error;
  }
}
