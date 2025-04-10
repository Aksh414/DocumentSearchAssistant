import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const MODEL = "gpt-4o";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || "demo-key" 
});

/**
 * Generate embeddings for text content
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
      encoding_format: "float",
    });
    
    return response.data[0].embedding;
  } catch (error) {
    console.error("Error generating embedding:", error);
    // Return a zero vector as fallback for demo purposes
    return Array(1536).fill(0);
  }
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
  } catch (error) {
    console.error("Error generating summary:", error);
    return "Failed to generate summary due to an error.";
  }
}

/**
 * Extract key points from document content
 */
export async function extractKeyPoints(text: string): Promise<string[]> {
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
  } catch (error) {
    console.error("Error extracting key points:", error);
    return ["Failed to extract key points due to an error."];
  }
}

/**
 * Generate an AI answer for a search query based on document chunks
 */
export async function generateAnswer(query: string, relevantChunks: string[]): Promise<string> {
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
  } catch (error) {
    console.error("Error generating answer:", error);
    return "Failed to generate an answer due to an error.";
  }
}
