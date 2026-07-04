import { HfInference } from "@huggingface/inference";

// Initialize Hugging Face Inference client
// Ensure HUGGINGFACE_API_KEY is present in .env
const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

/**
 * Generate a 384-dimensional vector embedding for the given text
 * using the all-MiniLM-L6-v2 model on Hugging Face Serverless API.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const output = await hf.featureExtraction({
      model: "sentence-transformers/all-MiniLM-L6-v2",
      inputs: text,
    });
    // output is either number[] or number[][] depending on inputs
    // Since we pass a single string, it's number[]
    if (Array.isArray(output) && output.length > 0 && typeof output[0] === 'number') {
      return output as number[];
    } else if (Array.isArray(output) && Array.isArray(output[0])) {
       return output[0] as number[];
    }
    throw new Error("Unexpected embedding output format");
  } catch (error) {
    console.error("[RAG] Failed to generate embedding:", error);
    throw error;
  }
}
