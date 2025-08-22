/**
 * Enhanced Vector Store
 * Improved implementation based on the proven workflow
 * Uses cosine similarity for better retrieval accuracy
 */

import { DocumentChunk } from './pdf-processor';
import { EmbeddingResult } from './llm-unified';

export interface VectorStoreEntry {
  id: string;
  chunk: DocumentChunk;
  embedding: number[];
  metadata: {
    dimensions: number;
    model: string;
    provider: string;
    addedAt: Date;
  };
}

export interface SearchResult {
  chunk: DocumentChunk;
  score: number;
  metadata: VectorStoreEntry['metadata'];
}

export interface VectorStoreStats {
  totalEntries: number;
  totalSources: number;
  averageDimensions: number;
  storageSize: number; // in bytes (approximate)
  providers: Record<string, number>;
  models: Record<string, number>;
}

/**
 * Enhanced Vector Store with improved similarity search and persistence
 */
export class EnhancedVectorStore {
  private entries: Map<string, VectorStoreEntry> = new Map();
  private sourceIndex: Map<string, Set<string>> = new Map(); // source -> entry IDs
  private dimensionIndex: Map<number, Set<string>> = new Map(); // dimensions -> entry IDs

  constructor() {
    console.log('🏗️ Enhanced Vector Store initialized');
  }

  /**
   * Add chunks with their embeddings to the store
   */
  async addChunks(chunks: DocumentChunk[], embeddings: EmbeddingResult[]): Promise<void> {
    if (chunks.length !== embeddings.length) {
      throw new Error(`Mismatch between chunks (${chunks.length}) and embeddings (${embeddings.length})`);
    }

    console.log(`📥 Adding ${chunks.length} chunks to vector store...`);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const embedding = embeddings[i];

      const entry: VectorStoreEntry = {
        id: chunk.id,
        chunk,
        embedding: embedding.embedding,
        metadata: {
          dimensions: embedding.dimensions,
          model: embedding.model,
          provider: embedding.provider,
          addedAt: new Date()
        }
      };

      // Store the entry
      this.entries.set(chunk.id, entry);

      // Update source index
      if (!this.sourceIndex.has(chunk.metadata.source)) {
        this.sourceIndex.set(chunk.metadata.source, new Set());
      }
      this.sourceIndex.get(chunk.metadata.source)!.add(chunk.id);

      // Update dimension index
      if (!this.dimensionIndex.has(embedding.dimensions)) {
        this.dimensionIndex.set(embedding.dimensions, new Set());
      }
      this.dimensionIndex.get(embedding.dimensions)!.add(chunk.id);
    }

    console.log(`✅ Successfully added ${chunks.length} chunks to vector store`);
    this.logStats();
  }

  /**
   * Remove all chunks from a specific source
   */
  removeSource(source: string): number {
    const entryIds = this.sourceIndex.get(source);
    if (!entryIds) {
      return 0;
    }

    let removedCount = 0;
    for (const entryId of entryIds) {
      const entry = this.entries.get(entryId);
      if (entry) {
        // Remove from main store
        this.entries.delete(entryId);

        // Remove from dimension index
        const dimensionSet = this.dimensionIndex.get(entry.metadata.dimensions);
        if (dimensionSet) {
          dimensionSet.delete(entryId);
          if (dimensionSet.size === 0) {
            this.dimensionIndex.delete(entry.metadata.dimensions);
          }
        }

        removedCount++;
      }
    }

    // Remove from source index
    this.sourceIndex.delete(source);

    console.log(`🗑️ Removed ${removedCount} chunks from source: ${source}`);
    return removedCount;
  }

  /**
   * Search for most similar chunks using cosine similarity
   */
  async searchSimilar(
    queryEmbedding: number[],
    topK: number = 5,
    minScore: number = 0.1,
    sourceFilter?: string[]
  ): Promise<SearchResult[]> {
    const queryDimensions = queryEmbedding.length;

    // Filter entries by dimensions and optional source filter
    let candidateEntries = Array.from(this.entries.values()).filter(entry => {
      // Must have matching dimensions
      if (entry.metadata.dimensions !== queryDimensions) {
        return false;
      }

      // Apply source filter if provided
      if (sourceFilter && sourceFilter.length > 0) {
        return sourceFilter.includes(entry.chunk.metadata.source);
      }

      return true;
    });

    if (candidateEntries.length === 0) {
      console.warn('⚠️ No matching entries found for search');
      return [];
    }

    console.log(`🔍 Searching ${candidateEntries.length} entries for similar chunks...`);

    // Calculate cosine similarity for each candidate
    const results: SearchResult[] = [];
    
    for (const entry of candidateEntries) {
      const similarity = this.cosineSimilarity(queryEmbedding, entry.embedding);
      
      if (similarity >= minScore) {
        results.push({
          chunk: entry.chunk,
          score: similarity,
          metadata: entry.metadata
        });
      }
    }

    // Sort by similarity score (descending) and return top K
    const sortedResults = results
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    console.log(`✅ Found ${sortedResults.length} similar chunks (min score: ${minScore})`);
    
    if (sortedResults.length > 0) {
      console.log(`📊 Score range: ${sortedResults[0].score.toFixed(3)} - ${sortedResults[sortedResults.length - 1].score.toFixed(3)}`);
    }

    return sortedResults;
  }

  /**
   * Calculate cosine similarity between two vectors
   * Optimized version with better numerical stability
   */
  private cosineSimilarity(vectorA: number[], vectorB: number[]): number {
    if (vectorA.length !== vectorB.length) {
      throw new Error(`Vector dimension mismatch: ${vectorA.length} vs ${vectorB.length}`);
    }

    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;

    for (let i = 0; i < vectorA.length; i++) {
      const a = vectorA[i];
      const b = vectorB[i];
      
      dotProduct += a * b;
      magnitudeA += a * a;
      magnitudeB += b * b;
    }

    // Handle edge cases
    if (magnitudeA === 0 || magnitudeB === 0) {
      return 0;
    }

    const similarity = dotProduct / (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB));
    
    // Clamp to [-1, 1] range due to floating point precision
    return Math.max(-1, Math.min(1, similarity));
  }

  /**
   * Get statistics about the vector store
   */
  getStats(): VectorStoreStats {
    const entries = Array.from(this.entries.values());
    
    if (entries.length === 0) {
      return {
        totalEntries: 0,
        totalSources: 0,
        averageDimensions: 0,
        storageSize: 0,
        providers: {},
        models: {}
      };
    }

    // Calculate statistics
    const providers: Record<string, number> = {};
    const models: Record<string, number> = {};
    let totalDimensions = 0;

    for (const entry of entries) {
      // Count providers
      providers[entry.metadata.provider] = (providers[entry.metadata.provider] || 0) + 1;
      
      // Count models
      models[entry.metadata.model] = (models[entry.metadata.model] || 0) + 1;
      
      // Sum dimensions
      totalDimensions += entry.metadata.dimensions;
    }

    // Estimate storage size (rough approximation)
    const avgEmbeddingSize = entries[0]?.embedding.length * 8 || 0; // 8 bytes per float64
    const avgChunkTextSize = entries.reduce((sum, entry) => sum + entry.chunk.text.length, 0) / entries.length * 2; // 2 bytes per char (Unicode)
    const storageSize = entries.length * (avgEmbeddingSize + avgChunkTextSize + 200); // +200 for metadata overhead

    return {
      totalEntries: entries.length,
      totalSources: this.sourceIndex.size,
      averageDimensions: Math.round(totalDimensions / entries.length),
      storageSize: Math.round(storageSize),
      providers,
      models
    };
  }

  /**
   * Get all chunks from a specific source
   */
  getChunksBySource(source: string): DocumentChunk[] {
    const entryIds = this.sourceIndex.get(source);
    if (!entryIds) {
      return [];
    }

    return Array.from(entryIds)
      .map(id => this.entries.get(id))
      .filter((entry): entry is VectorStoreEntry => entry !== undefined)
      .map(entry => entry.chunk);
  }

  /**
   * Get all unique sources
   */
  getSources(): string[] {
    return Array.from(this.sourceIndex.keys());
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.entries.clear();
    this.sourceIndex.clear();
    this.dimensionIndex.clear();
    console.log('🧹 Vector store cleared');
  }

  /**
   * Export store data for persistence
   */
  export(): any {
    return {
      entries: Array.from(this.entries.entries()),
      sourceIndex: Array.from(this.sourceIndex.entries()).map(([source, ids]) => [source, Array.from(ids)]),
      dimensionIndex: Array.from(this.dimensionIndex.entries()).map(([dim, ids]) => [dim, Array.from(ids)]),
      exportedAt: new Date().toISOString()
    };
  }

  /**
   * Import store data from persistence
   */
  import(data: any): void {
    this.clear();

    if (data.entries) {
      this.entries = new Map(data.entries);
    }

    if (data.sourceIndex) {
      this.sourceIndex = new Map(data.sourceIndex.map(([source, ids]: [string, string[]]) => [source, new Set(ids)]));
    }

    if (data.dimensionIndex) {
      this.dimensionIndex = new Map(data.dimensionIndex.map(([dim, ids]: [number, string[]]) => [dim, new Set(ids)]));
    }

    console.log(`📥 Vector store imported with ${this.entries.size} entries`);
    this.logStats();
  }

  private logStats(): void {
    const stats = this.getStats();
    console.log(`📊 Vector Store Stats:`, {
      entries: stats.totalEntries,
      sources: stats.totalSources,
      avgDimensions: stats.averageDimensions,
      storageMB: (stats.storageSize / 1024 / 1024).toFixed(2),
      providers: Object.keys(stats.providers).join(', ')
    });
  }
}

// Export singleton instance
let vectorStore: EnhancedVectorStore | null = null;

export function getVectorStore(): EnhancedVectorStore {
  if (!vectorStore) {
    vectorStore = new EnhancedVectorStore();
  }
  return vectorStore;
}

