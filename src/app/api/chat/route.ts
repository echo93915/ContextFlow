import { NextRequest, NextResponse } from 'next/server';
import { getUnifiedLLM } from '@/lib/llm-unified';
import { getVectorStore } from '@/lib/enhanced-vector-store';
import { sharedDocumentStore } from '@/lib/shared-document-store';
import { getAgent } from '@/lib/agent-graph';

export async function POST(request: NextRequest) {
  try {
    const { message, useContext = true, topK = 4, minScore = 0.1, useAgent = false } = await request.json();

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Valid message is required' },
        { status: 400 }
      );
    }

    console.log(`💬 Chat request: "${message.slice(0, 100)}${message.length > 100 ? '...' : ''}"`);

    // NEW: Agent-based routing (Phase 1.4 implementation)
    if (useAgent) {
      console.log('🤖 Using agent-based routing...');
      try {
        console.log('📡 Getting agent instance...');
        const agent = getAgent();
        console.log('✅ Agent instance created');
        console.log('🔧 Agent config:', agent.getConfig());
        
        // Prepare user context from available data
        console.log('📊 Preparing user context...');
        const vectorStore = getVectorStore();
        const stats = vectorStore.getStats();
        console.log('📈 Vector store stats:', stats);
        
        const userContext = {
          conversation_history: [], // TODO: Add actual conversation history
          uploaded_documents: stats.totalSources > 0 ? vectorStore.getSources() : [],
        };
        console.log('📝 User context prepared:', { 
          documentsCount: userContext.uploaded_documents.length,
          historyCount: userContext.conversation_history.length 
        });
        
        // Process through agent
        console.log('🔄 Processing through agent...');
        const agentResult = await agent.processInputDetailed(message, userContext);
        console.log('✅ Agent processing complete');
        
        console.log(`🚦 Agent routing result: ${agentResult.workflow} (confidence: ${agentResult.confidence})`);
        
        return NextResponse.json({
          response: agentResult.response,
          contextUsed: false, // Agent handles context internally
          agentInfo: {
            workflow: agentResult.workflow,
            confidence: agentResult.confidence,
            metadata: agentResult.metadata,
          },
          llmInfo: {
            provider: 'agent-system',
            model: 'multi-workflow',
            tokensUsed: 0,
          }
        });
        
      } catch (agentError) {
        console.error('❌ Agent processing failed:', agentError);
        console.error('Error details:', {
          name: agentError.name,
          message: agentError.message,
          stack: agentError.stack?.slice(0, 500)
        });
        console.log('🔄 Falling back to traditional processing...');
        // Fall through to traditional processing
      }
    }

    // Traditional processing (existing implementation)
    // Initialize the unified LLM interface
    const llm = getUnifiedLLM({
      geminiApiKey: process.env.GEMINI_API_KEY,
      openaiApiKey: process.env.OPENAI_API_KEY,
      preferredProvider: 'auto'
    });

    let contextInfo: any = {
      used: false,
      chunks: [],
      sources: [],
      totalResults: 0,
      query: message
    };

    let systemMessage = "You are a precise assistant that answers questions based strictly on the provided context. If no context is provided or the context doesn't contain relevant information, please say so and provide a general helpful response.";
    let userMessage = message;

    // If context is requested, retrieve relevant context using the enhanced vector store
    if (useContext) {
      try {
        const vectorStore = getVectorStore();
        const stats = vectorStore.getStats();

        if (stats.totalEntries > 0) {
          console.log('🔍 Retrieving context using enhanced vector store...');
          
          // Generate embedding for the query
          const queryEmbeddings = await llm.generateEmbeddings([message]);
          const queryEmbedding = queryEmbeddings[0];

          if (queryEmbedding && queryEmbedding.embedding) {
            // Search for relevant chunks
            const searchResults = await vectorStore.searchSimilar(
              queryEmbedding.embedding,
              topK,
              minScore
            );

            if (searchResults.length > 0) {
              console.log(`✅ Found ${searchResults.length} relevant chunks`);

              // Build context from relevant chunks
              const contextChunks = searchResults.map((result, index) => ({
                index: index + 1,
                text: result.chunk.text,
                source: result.chunk.metadata.source,
                score: result.score,
                chunkIndex: result.chunk.metadata.chunkIndex
              }));

              const contextText = contextChunks
                .map(chunk => `[Context ${chunk.index}]\n${chunk.text}`)
                .join('\n\n');

              // Enhanced prompt construction based on proven workflow
              systemMessage = "You are a precise assistant that answers questions based strictly on the provided context. Focus on accuracy and cite the context when appropriate.";
              
              userMessage = `Question: ${message}

Context:
${contextText}

Please answer the question based strictly on the provided context.`;

              contextInfo = {
                used: true,
                chunks: contextChunks,
                sources: [...new Set(contextChunks.map(c => c.source))],
                totalResults: searchResults.length,
                query: message,
                searchParams: { topK, minScore },
                queryEmbedding: {
                  provider: queryEmbedding.provider,
                  model: queryEmbedding.model,
                  dimensions: queryEmbedding.dimensions
                }
              };
            } else {
              console.log('ℹ️ No relevant context found for the query');
            }
          }
        } else {
          console.log('ℹ️ No documents available for context retrieval');
        }
      } catch (contextError) {
        console.error('❌ Error retrieving context:', contextError);
        // Continue without context if there's an error
        contextInfo.error = contextError instanceof Error ? contextError.message : 'Unknown context error';
      }
    }

    // Generate chat completion using the unified LLM interface
    console.log('🤖 Generating chat response...');
    const chatResult = await llm.generateChatCompletion(systemMessage, userMessage);

    console.log(`✅ Response generated using ${chatResult.provider} (${chatResult.model})`);

    return NextResponse.json({ 
      response: chatResult.response,
      contextUsed: contextInfo.used,
      contextInfo,
      llmInfo: {
        provider: chatResult.provider,
        model: chatResult.model,
        tokensUsed: chatResult.tokensUsed
      }
    });

  } catch (error) {
    console.error('❌ Error in chat API:', error);
    
    let errorMessage = 'Failed to generate response';
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        errorMessage = 'API configuration error - check your API keys';
      } else if (error.message.includes('embedding')) {
        errorMessage = 'Failed to process context - embedding generation failed';
      } else if (error.message.includes('chat')) {
        errorMessage = 'Failed to generate chat response';
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
