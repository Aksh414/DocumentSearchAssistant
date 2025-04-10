import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const MODEL = "gpt-4o";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || "demo-key" 
});

// Track if we've encountered a quota error to avoid repeated API calls
let hasQuotaError = false;

/**
 * Generate embeddings for text content
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  // If we've already encountered a quota error, don't attempt further calls
  if (hasQuotaError) {
    console.log("Skipping OpenAI API call due to previous quota error");
    return generateFakeEmbedding(text);
  }
  
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
      encoding_format: "float",
    });
    
    return response.data[0].embedding;
  } catch (error: any) {
    console.error("Error generating embedding:", error);
    
    // Check if it's a quota error
    if (error?.code === 'insufficient_quota' || error?.status === 429) {
      hasQuotaError = true;
      console.warn("OpenAI API quota exceeded. Using backup embedding strategy.");
    }
    
    // Return a deterministic embedding based on the text
    return generateFakeEmbedding(text);
  }
}

/**
 * Generate a deterministic "fake" embedding for demo purposes
 * This is used when OpenAI API is unavailable or quota is exceeded
 */
function generateFakeEmbedding(text: string): number[] {
  // Create a simple hash of the text to use as a seed
  const hash = text.split('')
    .reduce((acc, char) => ((acc << 5) - acc) + char.charCodeAt(0), 0);
  
  // Generate a consistent embedding vector based on the hash
  const embedding = Array(1536).fill(0).map((_, i) => {
    // Use a simple pseudorandom function based on the hash and index
    const value = Math.sin(hash * (i + 1)) / 2 + 0.5;
    return value; 
  });
  
  // Normalize the embedding vector
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  return embedding.map(val => val / magnitude);
}

/**
 * Generate a summary of document content
 */
export async function generateSummary(text: string, length: "brief" | "medium" | "detailed" = "medium"): Promise<string> {
  const lengthMap = {
    brief: "a brief summary in 2-3 sentences",
    medium: "a medium-length summary in 1-2 paragraphs",
    detailed: "a detailed summary covering all main points"
  };

  // If we've already encountered a quota error, return a fallback message
  if (hasQuotaError) {
    console.log("Skipping OpenAI API call for summary due to quota error");
    return generateFallbackSummary(text, length);
  }

  try {
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant that summarizes documents clearly and concisely. Generate ${lengthMap[length]} of the provided text.`
        },
        {
          role: "user",
          content: text
        }
      ]
    });

    return response.choices[0].message.content || "Failed to generate summary.";
  } catch (error: any) {
    console.error("Error generating summary:", error);
    
    // Check if it's a quota error
    if (error?.code === 'insufficient_quota' || error?.status === 429) {
      hasQuotaError = true;
      console.warn("OpenAI API quota exceeded for summary generation.");
    }
    
    return generateFallbackSummary(text, length);
  }
}

/**
 * Generate a simple fallback summary when API is unavailable
 */
function generateFallbackSummary(text: string, length: "brief" | "medium" | "detailed"): string {
  // Extract a portion of the text based on requested length
  const words = text.split(/\s+/);
  
  let excerpt = '';
  const brevityMap = {
    brief: Math.min(50, words.length),
    medium: Math.min(100, words.length),
    detailed: Math.min(200, words.length)
  };
  
  excerpt = words.slice(0, brevityMap[length]).join(' ');
  
  if (words.length > brevityMap[length]) {
    excerpt += '...';
  }
  
  return "API Quota Exceeded: Using text excerpt instead. " + excerpt;
}

/**
 * Extract key points from document content
 */
export async function extractKeyPoints(text: string): Promise<string[]> {
  // If we've already encountered a quota error, return fallback key points
  if (hasQuotaError) {
    console.log("Skipping OpenAI API call for key points due to quota error");
    return generateFallbackKeyPoints(text);
  }
  
  try {
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: "Extract the 5 most important key points from the provided text. Return the results as a JSON array of strings."
        },
        {
          role: "user",
          content: text
        }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    
    if (!content) {
      return ["No key points extracted."];
    }
    
    try {
      const parsed = JSON.parse(content);
      return Array.isArray(parsed.points) ? parsed.points : ["No key points extracted."];
    } catch (e) {
      console.error("Error parsing key points JSON:", e);
      return ["Error parsing key points."];
    }
  } catch (error: any) {
    console.error("Error extracting key points:", error);
    
    // Check if it's a quota error
    if (error?.code === 'insufficient_quota' || error?.status === 429) {
      hasQuotaError = true;
      console.warn("OpenAI API quota exceeded for key points extraction.");
    }
    
    return generateFallbackKeyPoints(text);
  }
}

/**
 * Generate fallback key points when API is unavailable
 */
function generateFallbackKeyPoints(text: string): string[] {
  // Simple fallback: extract first sentences from paragraphs as key points
  const paragraphs = text.split(/\n\s*\n/);
  const keyPoints = [];
  
  // Try to extract first sentences from paragraphs
  for (let i = 0; i < Math.min(paragraphs.length, 5); i++) {
    const paragraph = paragraphs[i].trim();
    if (paragraph) {
      // Extract first sentence or first 100 characters if no sentence ending found
      const match = paragraph.match(/^.*?[.!?]/);
      if (match) {
        keyPoints.push(`API Quota Exceeded: ${match[0]}`);
      } else if (paragraph.length > 10) {
        // If no sentence ending, take the first 100 characters
        keyPoints.push(`API Quota Exceeded: ${paragraph.substring(0, 100)}...`);
      }
    }
  }
  
  // If we couldn't get enough key points, add a message
  if (keyPoints.length === 0) {
    keyPoints.push("API Quota Exceeded: Could not extract key points.");
  }
  
  // Ensure we have at least 3 items
  while (keyPoints.length < 3) {
    keyPoints.push("API Quota Exceeded: Additional key points unavailable.");
  }
  
  return keyPoints;
}

/**
 * Generate an AI answer for a search query based on document chunks
 */
export async function generateAnswer(query: string, relevantChunks: string[]): Promise<string> {
  // If we've already encountered a quota error, return a fallback answer
  if (hasQuotaError) {
    console.log("Skipping OpenAI API call for answer generation due to quota error");
    return generateFallbackAnswer(query, relevantChunks);
  }
  
  try {
    const context = relevantChunks.join("\n\n");
    
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that answers questions based on the provided document context. Answer the user's query based solely on the information in the context. If the answer is not in the context, say that you don't have enough information."
        },
        {
          role: "user",
          content: `Context:\n${context}\n\nQuery: ${query}`
        }
      ]
    });

    return response.choices[0].message.content || "Failed to generate an answer.";
  } catch (error: any) {
    console.error("Error generating answer:", error);
    
    // Check if it's a quota error
    if (error?.code === 'insufficient_quota' || error?.status === 429) {
      hasQuotaError = true;
      console.warn("OpenAI API quota exceeded for answer generation.");
    }
    
    return generateFallbackAnswer(query, relevantChunks);
  }
}

/**
 * Generate a fallback answer when API is unavailable
 */
function generateFallbackAnswer(query: string, relevantChunks: string[]): string {
  // First, check if we have any chunks to work with
  if (!relevantChunks || relevantChunks.length === 0) {
    return "API Quota Exceeded: No relevant information found for your query.";
  }
  
  // Find the chunk that might be most relevant by doing simple word matching
  const queryWords = new Set(query.toLowerCase().split(/\W+/).filter(w => w.length > 2));
  
  let bestChunk = relevantChunks[0];
  let bestScore = 0;
  
  for (const chunk of relevantChunks) {
    const chunkWords = chunk.toLowerCase().split(/\W+/);
    let matchCount = 0;
    
    for (const word of chunkWords) {
      if (queryWords.has(word)) {
        matchCount++;
      }
    }
    
    if (matchCount > bestScore) {
      bestScore = matchCount;
      bestChunk = chunk;
    }
  }
  
  return "API Quota Exceeded: I found some potentially relevant information in our documents:\n\n" + bestChunk;
}
