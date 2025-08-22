import { pipeline, env } from '@xenova/transformers';

// Configure transformers to use local models
env.allowRemoteModels = false;
env.allowLocalModels = true;

export interface TextChunk {
  id: string;
  text: string;
  embedding?: number[];
  metadata: {
    source: string;
    sourceType: 'pdf' | 'url';
    chunkIndex: number;
    startChar: number;
    endChar: number;
  };
}

export interface ProcessedDocument {
  id: string;
  chunks: TextChunk[];
  metadata: {
    title: string;
    sourceType: 'pdf' | 'url';
    source: string;
    processedAt: Date;
  };
}

// Initialize embeddings pipeline (lazy loading)
let embeddingsPipeline: any = null;

async function getEmbeddingsPipeline() {
  if (!embeddingsPipeline) {
    embeddingsPipeline = await pipeline(
      'feature-extraction',
      'Xenova/all-MiniLM-L6-v2'
    );
  }
  return embeddingsPipeline;
}

/**
 * Split text into chunks with overlapping windows
 */
export function chunkText(text: string, chunkSize: number = 800, overlap: number = 100): string[] {
  if (text.length <= chunkSize) {
    return [text];
  }

  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    let end = start + chunkSize;
    
    // Try to break at sentence boundaries
    if (end < text.length) {
      const sentenceEnd = text.lastIndexOf('.', end);
      const paragraphEnd = text.lastIndexOf('\n', end);
      const spaceEnd = text.lastIndexOf(' ', end);
      
      // Choose the best breaking point
      const breakPoint = Math.max(sentenceEnd, paragraphEnd, spaceEnd);
      if (breakPoint > start + chunkSize * 0.5) {
        end = breakPoint + 1;
      }
    }
    
    const chunk = text.slice(start, end).trim();
    if (chunk.length > 0) {
      chunks.push(chunk);
    }
    
    // Move start position with overlap
    start = end - overlap;
    if (start >= text.length) break;
  }

  return chunks;
}

/**
 * Generate embeddings for text chunks
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  try {
    const pipeline = await getEmbeddingsPipeline();
    const embeddings: number[][] = [];
    
    for (const text of texts) {
      const result = await pipeline(text, { pooling: 'mean', normalize: true });
      embeddings.push(Array.from(result.data));
    }
    
    return embeddings;
  } catch (error) {
    console.error('Error generating embeddings:', error);
    throw new Error('Failed to generate embeddings');
  }
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Process document into chunks with embeddings
 */
export async function processDocument(
  text: string,
  source: string,
  sourceType: 'pdf' | 'url',
  title: string = ''
): Promise<ProcessedDocument> {
  const documentId = crypto.randomUUID();
  const chunks = chunkText(text);
  const embeddings = await generateEmbeddings(chunks);
  
  const processedChunks: TextChunk[] = chunks.map((chunk, index) => ({
    id: crypto.randomUUID(),
    text: chunk,
    embedding: embeddings[index],
    metadata: {
      source,
      sourceType,
      chunkIndex: index,
      startChar: text.indexOf(chunk),
      endChar: text.indexOf(chunk) + chunk.length,
    },
  }));

  return {
    id: documentId,
    chunks: processedChunks,
    metadata: {
      title: title || source,
      sourceType,
      source,
      processedAt: new Date(),
    },
  };
}

/**
 * Find most relevant chunks for a query
 */
export async function findRelevantChunks(
  query: string,
  documents: ProcessedDocument[],
  topK: number = 5
): Promise<{ chunk: TextChunk; score: number; document: ProcessedDocument }[]> {
  try {
    // Generate embedding for the query
    const queryEmbedding = await generateEmbeddings([query]);
    const queryVector = queryEmbedding[0];
    
    // Calculate similarities for all chunks
    const results: { chunk: TextChunk; score: number; document: ProcessedDocument }[] = [];
    
    for (const document of documents) {
      for (const chunk of document.chunks) {
        if (chunk.embedding) {
          const similarity = cosineSimilarity(queryVector, chunk.embedding);
          results.push({
            chunk,
            score: similarity,
            document,
          });
        }
      }
    }
    
    // Sort by similarity score and return top results
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  } catch (error) {
    console.error('Error finding relevant chunks:', error);
    throw new Error('Failed to find relevant chunks');
  }
}
