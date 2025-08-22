import { NextRequest, NextResponse } from 'next/server';
import { getUnifiedLLM } from '@/lib/llm-unified';
import { getVectorStore } from '@/lib/enhanced-vector-store';
import { sharedDocumentStore } from '@/lib/shared-document-store';

export async function POST(request: NextRequest) {
  try {
    const { query, topK = 5, minScore = 0.1, sourceFilter } = await request.json();

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Valid query is required' },
        { status: 400 }
      );
    }

    console.log(`🔍 Retrieving context for query: "${query.slice(0, 100)}${query.length > 100 ? '...' : ''}"`);

    // Initialize LLM and vector store
    const llm = getUnifiedLLM({
      geminiApiKey: process.env.GEMINI_API_KEY,
      openaiApiKey: process.env.OPENAI_API_KEY,
      preferredProvider: 'auto'
    });

    const vectorStore = getVectorStore();

    // Check if we have any data
    const stats = vectorStore.getStats();
    if (stats.totalEntries === 0) {
      return NextResponse.json({
        query,
        results: [],
        message: 'No documents available for search. Please upload and process documents first.',
        stats: {
          totalEntries: 0,
          totalSources: 0
        }
      });
    }

    // Generate embedding for the query
    console.log('🧮 Generating query embedding...');
    const queryEmbeddings = await llm.generateEmbeddings([query]);
    const queryEmbedding = queryEmbeddings[0];

    if (!queryEmbedding || !queryEmbedding.embedding) {
      throw new Error('Failed to generate query embedding');
    }

    console.log(`✅ Query embedding generated (${queryEmbedding.dimensions}D, provider: ${queryEmbedding.provider})`);

    // Search for similar chunks
    const searchResults = await vectorStore.searchSimilar(
      queryEmbedding.embedding,
      topK,
      minScore,
      sourceFilter
    );

    console.log(`📊 Found ${searchResults.length} relevant chunks`);

    // Format results for the frontend
    const formattedResults = searchResults.map(result => ({
      text: result.chunk.text,
      score: result.score,
      source: result.chunk.metadata.source,
      sourceType: result.chunk.metadata.sourceType,
      chunkIndex: result.chunk.metadata.chunkIndex,
      metadata: {
        startChar: result.chunk.metadata.startChar,
        endChar: result.chunk.metadata.endChar,
        pageNumber: result.chunk.metadata.pageNumber,
        embeddingProvider: result.metadata.provider,
        embeddingModel: result.metadata.model,
        dimensions: result.metadata.dimensions
      }
    }));

    return NextResponse.json({
      query,
      results: formattedResults,
      totalResults: searchResults.length,
      queryEmbedding: {
        provider: queryEmbedding.provider,
        model: queryEmbedding.model,
        dimensions: queryEmbedding.dimensions
      },
      searchParams: {
        topK,
        minScore,
        sourceFilter
      },
      vectorStoreStats: {
        totalEntries: stats.totalEntries,
        totalSources: stats.totalSources,
        providers: stats.providers
      }
    });
  } catch (error) {
    console.error('❌ Error retrieving context:', error);
    
    let errorMessage = 'Failed to retrieve context';
    if (error instanceof Error) {
      if (error.message.includes('embedding')) {
        errorMessage = 'Failed to generate query embedding - check API keys';
      } else if (error.message.includes('search')) {
        errorMessage = 'Failed to search vector store';
      } else {
        errorMessage = error.message;
      }
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Enhanced health check endpoint
export async function GET() {
  try {
    const vectorStore = getVectorStore();
    const vectorStats = vectorStore.getStats();
    const sharedStats = sharedDocumentStore.getStats();

    // Check provider health
    const llm = getUnifiedLLM({
      geminiApiKey: process.env.GEMINI_API_KEY,
      openaiApiKey: process.env.OPENAI_API_KEY
    });
    const providerHealth = llm.getProviderHealth();

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      vectorStore: {
        totalEntries: vectorStats.totalEntries,
        totalSources: vectorStats.totalSources,
        averageDimensions: vectorStats.averageDimensions,
        storageMB: (vectorStats.storageSize / 1024 / 1024).toFixed(2),
        providers: vectorStats.providers,
        models: vectorStats.models,
        sources: vectorStore.getSources()
      },
      sharedDocumentStore: {
        totalDocuments: sharedStats.totalDocuments,
        totalChunks: sharedStats.totalChunks,
        documentList: sharedStats.documentList
      },
      llmProviders: {
        health: providerHealth,
        available: Object.entries(providerHealth).filter(([_, healthy]) => healthy).map(([provider]) => provider)
      },
      environment: {
        hasGeminiKey: !!process.env.GEMINI_API_KEY,
        hasOpenAIKey: !!process.env.OPENAI_API_KEY
      }
    });
  } catch (error) {
    console.error('❌ Error in health check:', error);
    return NextResponse.json(
      { 
        status: 'unhealthy',
        error: 'Health check failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
