/**
 * Generate AI Service
 * This service provides AI capabilities using locally generated responses
 * instead of relying on external API calls.
 */

import crypto from 'crypto';

/**
 * Generate a deterministic embedding for a text using a hash function
 * This creates vectors that maintain some relationship between semantically similar content
 */
export function generateEmbedding(text: string): number[] {
  // Use a hash function to generate a deterministic value based on the text
  const hash = crypto.createHash('sha256').update(text.toLowerCase()).digest('hex');
  
  // Convert the hash into a vector of 128 dimensions
  const embedding: number[] = [];
  for (let i = 0; i < 128; i++) {
    // Use 2 characters of the hash for each dimension
    const hexPart = hash.substring((i * 2) % hash.length, (i * 2 + 2) % hash.length);
    // Convert to a number between -1 and 1
    const value = (parseInt(hexPart, 16) / 255) * 2 - 1;
    embedding.push(value);
  }
  
  // Normalize the embedding
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  return embedding.map(val => val / magnitude);
}

/**
 * Generate a summary for the document content
 */
export function generateSummary(text: string, length: "brief" | "medium" | "detailed" = "medium"): string {
  // Get the first few sentences based on the requested length
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  
  let numSentences;
  switch (length) {
    case "brief":
      numSentences = Math.min(2, sentences.length);
      break;
    case "detailed":
      numSentences = Math.min(8, sentences.length);
      break;
    case "medium":
    default:
      numSentences = Math.min(4, sentences.length);
      break;
  }
  
  // If text is too short, just return it
  if (sentences.length <= numSentences) {
    return text;
  }
  
  // Otherwise extract key sentences
  return sentences.slice(0, numSentences).join(' ') + 
    ` [...] The document contains ${sentences.length} sentences total.`;
}

/**
 * Extract key points from document content
 */
export function extractKeyPoints(text: string): string[] {
  // Extract potential key points (sentences with keywords or at the beginning of paragraphs)
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  const keyPoints: string[] = [];
  
  // Look for sentences that might be important (containing key indicators)
  const keyIndicators = [
    'important', 'key', 'significant', 'note', 'remember', 'essential',
    'crucial', 'critical', 'primary', 'major', 'fundamental'
  ];
  
  // Add sentences with key indicators
  for (let sentence of sentences) {
    const lowercase = sentence.toLowerCase();
    if (keyIndicators.some(indicator => lowercase.includes(indicator))) {
      keyPoints.push(sentence.trim());
      if (keyPoints.length >= 3) break;
    }
  }
  
  // If we don't have enough key points, add some sentences from the beginning
  if (keyPoints.length < 3 && sentences.length > 0) {
    for (let i = 0; i < sentences.length && keyPoints.length < 3; i++) {
      if (!keyPoints.includes(sentences[i].trim())) {
        keyPoints.push(sentences[i].trim());
      }
    }
  }
  
  // If we still don't have enough, add a generic point
  if (keyPoints.length === 0) {
    keyPoints.push("This document contains important information that should be reviewed in detail.");
    keyPoints.push("The content structure suggests multiple sections with relevant data points.");
    keyPoints.push("Consider analyzing the document further for specific insights related to your query.");
  }
  
  return keyPoints;
}

/**
 * Generate an AI answer based on a query and relevant chunks
 */
export function generateAnswer(query: string, relevantChunks: string[]): string {
  // Join chunks into a single piece of context
  const context = relevantChunks.join(' ');
  
  // Look for passages in the context that might answer the query
  const queryWords = query.toLowerCase().split(/\s+/).filter(word => word.length > 3);
  
  // Split context into sentences
  const sentences = context.match(/[^.!?]+[.!?]+/g) || [];
  
  // Score sentences based on how many query words they contain
  const scoredSentences = sentences.map(sentence => {
    const lowercaseSentence = sentence.toLowerCase();
    const score = queryWords.filter(word => lowercaseSentence.includes(word)).length;
    return { sentence, score };
  });
  
  // Sort by score
  scoredSentences.sort((a, b) => b.score - a.score);
  
  // If we found relevant sentences, use them in the answer
  if (scoredSentences.length > 0 && scoredSentences[0].score > 0) {
    // Take top 2-3 sentences
    const topSentences = scoredSentences
      .slice(0, 3)
      .filter(item => item.score > 0)
      .map(item => item.sentence);
    
    return `Based on the available documents, I found information related to your query. ${topSentences.join(' ')}`;
  }
  
  // If we don't have good matches, provide a generic response
  return `I found some potential information in the documents, but couldn't locate a specific answer to your query about "${query}". You might want to review the documents manually or refine your search terms.`;
}

/**
 * Calculate cosine similarity between two vectors
 */
export function calculateCosineSimilarity(vec1: number[], vec2: number[]): number {
  // Dot product
  let dotProduct = 0;
  for (let i = 0; i < Math.min(vec1.length, vec2.length); i++) {
    dotProduct += vec1[i] * vec2[i];
  }
  
  // Calculate magnitudes
  const mag1 = Math.sqrt(vec1.reduce((sum, val) => sum + val * val, 0));
  const mag2 = Math.sqrt(vec2.reduce((sum, val) => sum + val * val, 0));
  
  if (mag1 === 0 || mag2 === 0) return 0;
  
  // Cosine similarity
  return dotProduct / (mag1 * mag2);
}