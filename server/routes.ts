import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import * as z from "zod";
import { insertUserSchema, insertDocumentSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";
import { processDocument, searchDocuments } from "./services/documentProcessor";
import { generateSummary, extractKeyPoints, generateAnswer, generateEmbedding, calculateCosineSimilarity } from "./services/generateAI";

// Set up file upload with multer
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage_config = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage_config,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB limit
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = [".pdf", ".docx", ".txt"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only PDF, DOCX, and TXT files are allowed."));
    }
  },
});

const uploadSingleFile = upload.single("file");

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // User routes
  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.status(201).json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Document routes
  app.post("/api/documents", (req, res) => {
    uploadSingleFile(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ message: err.message });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      try {
        // For the MVP, we'll use a fixed user ID
        const userId = 1; // Default to the demo user

        // Process the document
        const documentId = await processDocument(
          req.file.path,
          req.file.originalname,
          userId
        );

        res.status(201).json({ documentId });
      } catch (error) {
        console.error("Error uploading document:", error);
        res.status(500).json({ message: "Error processing document" });
      }
    });
  });

  app.get("/api/documents", async (req, res) => {
    try {
      // For the MVP, we'll use a fixed user ID
      const userId = 1; // Default to the demo user
      const documents = await storage.getDocumentsByUser(userId);
      res.json(documents);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/documents/recent", async (req, res) => {
    try {
      // For the MVP, we'll use a fixed user ID
      const userId = 1; // Default to the demo user
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const documents = await storage.getRecentDocuments(userId, limit);
      res.json(documents);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/documents/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const document = await storage.getDocument(id);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      res.json(document);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.get("/api/documents/:id/related", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 3;
      
      const relatedDocuments = await storage.findRelatedDocuments(id, limit);
      res.json(relatedDocuments);
    } catch (error) {
      console.error("Error finding related documents:", error);
      res.status(500).json({ message: "Error finding related documents" });
    }
  });

  // Search routes
  app.post("/api/search", async (req, res) => {
    try {
      const { query } = req.body;
      if (!query || typeof query !== "string") {
        return res.status(400).json({ message: "Invalid query" });
      }

      // For the MVP, we'll use a fixed user ID
      const userId = 1; // Default to the demo user

      const results = await searchDocuments(query, userId);
      res.json(results);
    } catch (error) {
      console.error("Search error:", error);
      res.status(500).json({ message: "Error searching documents" });
    }
  });

  app.get("/api/search/history", async (req, res) => {
    try {
      // For the MVP, we'll use a fixed user ID
      const userId = 1; // Default to the demo user
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const searchHistory = await storage.getSearchHistoryByUser(userId, limit);
      res.json(searchHistory);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Document processing routes
  app.post("/api/documents/:id/summarize", async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      const length = req.query.length as "brief" | "medium" | "detailed" || "medium";
      
      const document = await storage.getDocument(documentId);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      const chunks = await storage.getChunksByDocument(documentId);
      if (!chunks.length) {
        return res.status(404).json({ message: "No content found for document" });
      }
      
      // Combine chunks for summarization
      const fullText = chunks.sort((a, b) => a.chunkIndex - b.chunkIndex)
                             .map(chunk => chunk.chunkText)
                             .join("\n\n");
      
      // Generate summary and key points concurrently
      const [summary, keyPoints] = await Promise.all([
        generateSummary(fullText, length),
        extractKeyPoints(fullText)
      ]);
      
      // If the summary contains the API quota exceeded message, let the client know
      const apiLimitExceeded = summary.includes("API Quota Exceeded") || 
                              keyPoints.some(point => point.includes("API Quota Exceeded"));
      
      res.json({ 
        summary, 
        keyPoints,
        apiLimitExceeded
      });
    } catch (error) {
      console.error("Summarization error:", error);
      // Send a more specific error message when possible
      if (error instanceof Error) {
        const message = error.message.includes("quota") ? 
          "API quota exceeded. Using fallback summarization." : 
          "Error generating summary";
        
        return res.status(500).json({ 
          message,
          apiLimitExceeded: error.message.includes("quota")
        });
      }
      
      res.status(500).json({ message: "Error generating summary" });
    }
  });

  app.post("/api/answer", async (req, res) => {
    try {
      const { query, documentIds } = req.body;
      
      if (!query || typeof query !== "string") {
        return res.status(400).json({ message: "Invalid query" });
      }
      
      // Get query embedding
      const queryEmbedding = await generateEmbedding(query);
      
      // Find most relevant chunks across all documents or specified documents
      let relevantChunks: { chunkText: string; score: number }[] = [];
      
      // If specific documents are provided, only search within those
      if (documentIds && Array.isArray(documentIds) && documentIds.length > 0) {
        for (const docId of documentIds) {
          const chunks = await storage.getChunksByDocument(docId);
          
          for (const chunk of chunks) {
            if (chunk.embedding) {
              // Calculate similarity score (simplified)
              let dotProduct = 0;
              let mag1 = 0;
              let mag2 = 0;
              
              for (let i = 0; i < queryEmbedding.length; i++) {
                dotProduct += queryEmbedding[i] * chunk.embedding[i];
                mag1 += queryEmbedding[i] * queryEmbedding[i];
                mag2 += chunk.embedding[i] * chunk.embedding[i];
              }
              
              mag1 = Math.sqrt(mag1);
              mag2 = Math.sqrt(mag2);
              
              const score = dotProduct / (mag1 * mag2);
              
              relevantChunks.push({
                chunkText: chunk.chunkText,
                score
              });
            }
          }
        }
      } else {
        // Search across all documents
        const searchResults = await storage.searchDocuments(queryEmbedding, 5);
        
        for (const result of searchResults) {
          const chunks = await storage.getChunksByDocument(result.documentId);
          
          for (const chunk of chunks) {
            if (chunk.embedding) {
              // Calculate similarity score (simplified)
              let dotProduct = 0;
              let mag1 = 0;
              let mag2 = 0;
              
              for (let i = 0; i < queryEmbedding.length; i++) {
                dotProduct += queryEmbedding[i] * chunk.embedding[i];
                mag1 += queryEmbedding[i] * queryEmbedding[i];
                mag2 += chunk.embedding[i] * chunk.embedding[i];
              }
              
              mag1 = Math.sqrt(mag1);
              mag2 = Math.sqrt(mag2);
              
              const score = dotProduct / (mag1 * mag2);
              
              relevantChunks.push({
                chunkText: chunk.chunkText,
                score
              });
            }
          }
        }
      }
      
      // Sort chunks by relevance and take top ones
      relevantChunks.sort((a, b) => b.score - a.score);
      const topChunks = relevantChunks.slice(0, 5).map(chunk => chunk.chunkText);
      
      // Generate answer
      const answer = await generateAnswer(query, topChunks);
      
      // Check if the answer indicates API quota exceeded
      const apiLimitExceeded = answer.includes("API Quota Exceeded");
      
      res.json({ 
        answer, 
        sourceCount: Math.min(3, topChunks.length),
        apiLimitExceeded
      });
    } catch (error) {
      console.error("Answer generation error:", error);
      
      // Send a more specific error message when possible
      if (error instanceof Error) {
        const message = error.message.includes("quota") ? 
          "API quota exceeded. Using fallback answer generation." : 
          "Error generating answer";
        
        return res.status(500).json({ 
          message,
          apiLimitExceeded: error.message.includes("quota"),
          answer: "Unable to generate answer due to API limitations. Please try again later."
        });
      }
      
      res.status(500).json({ message: "Error generating answer" });
    }
  });

  // Add some demo documents for the initial state
  const addDemoDocuments = async () => {
    const userId = 1; // Demo user
    
    // Check if we already have documents
    const existingDocs = await storage.getDocumentsByUser(userId);
    if (existingDocs.length > 0) {
      return; // Already have demo documents
    }
    
    // Sample document content
    const demoContents = [
      {
        title: "Project Proposal.pdf",
        content: "This proposal outlines the development of an AI-powered document search and retrieval system designed to help knowledge workers efficiently find and extract insights from multiple document types using natural language queries.\n\nObjectives:\n- Enable natural language search across document repositories\n- Provide instant summarization and key point extraction\n- Support multiple document formats (PDF, DOCX, PPT, etc.)\n- Offer intelligent recommendations for related content\n- Create an intuitive and responsive user interface\n\nThe system will use state-of-the-art language models for semantic search capabilities, with vector embeddings to represent document content. This approach will allow users to find relevant information using natural language rather than exact keyword matching.",
        fileType: "PDF",
        size: 245678,
        pageCount: 5
      },
      {
        title: "Marketing Strategy.docx",
        content: "Marketing Strategy for Q4\n\nTarget Audience:\n- Enterprise businesses\n- Knowledge workers in research and development\n- Information professionals and librarians\n\nKey Messages:\n- Save 70% of research time with AI-powered search\n- Access insights instantly with document summarization\n- Find connections between documents you never knew existed\n\nChannels:\n- LinkedIn for professional outreach\n- Industry conferences focusing on knowledge management\n- Direct demos to enterprise customers\n- Partnerships with document management systems",
        fileType: "DOCX",
        size: 125689,
        pageCount: 2
      },
      {
        title: "Financial Report.pdf",
        content: "Annual Financial Report - 2023\n\nRevenue: $2.4M (42% increase from previous year)\nExpenses: $1.8M (23% increase from previous year)\nNet Profit: $600K\n\nKey Financial Highlights:\n- Successful Series A funding round closed in Q2\n- Customer acquisition cost reduced by 18%\n- Subscription revenue now accounts for 85% of total revenue\n- R&D investments increased by 35% to support AI capabilities\n\nOutlook for 2024:\n- Projected 50% revenue growth\n- Expansion into European market planned for Q3\n- Additional investment in AI research team",
        fileType: "PDF",
        size: 345987,
        pageCount: 8
      }
    ];
    
    for (const demoDoc of demoContents) {
      // Create document
      const document = await storage.createDocument({
        title: demoDoc.title,
        fileUrl: "/demo/" + demoDoc.title.toLowerCase().replace(/\s+/g, "-"),
        fileType: demoDoc.fileType,
        uploadedBy: userId,
        metadata: {
          size: demoDoc.size,
          pageCount: demoDoc.pageCount
        }
      });
      
      // Split content and create chunks
      const chunks = demoDoc.content.split(/\n\n/).filter(Boolean);
      
      for (let i = 0; i < chunks.length; i++) {
        const embedding = await generateEmbedding(chunks[i]);
        
        await storage.createChunk({
          documentId: document.id,
          chunkIndex: i,
          chunkText: chunks[i],
          embedding
        });
      }
    }
    
    // Add some search history
    const searchQueries = [
      "marketing strategy for Q4",
      "project timeline updates",
      "annual budget forecast"
    ];
    
    for (const query of searchQueries) {
      await storage.createSearchHistory({
        userId,
        query,
        results: [1, 2, 3] // Demo document IDs
      });
    }
  };
  
  // Add demo documents
  addDemoDocuments().catch(console.error);

  const httpServer = createServer(app);
  return httpServer;
}
