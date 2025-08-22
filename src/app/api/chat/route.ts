import { NextRequest, NextResponse } from 'next/server';
import { generateResponse } from '@/lib/gemini';
import { sharedDocumentStore } from '@/lib/shared-document-store';

export async function POST(request: NextRequest) {
  try {
    const { message, useContext = true } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      );
    }

    let enhancedPrompt = message;
    let contextUsed = false;

    // If context is requested and we have documents, retrieve relevant context
    if (useContext && sharedDocumentStore.getSize() > 0) {
      try {
        // Get all available documents
        const documents = sharedDocumentStore.getAllDocuments();
        
        // Import findRelevantChunks dynamically to avoid import issues
        const { findRelevantChunks } = await import('@/lib/text-processing');
        
        // Find relevant chunks for the user's message
        const relevantResults = await findRelevantChunks(message, documents, 3);
        
        if (relevantResults.length > 0) {
          // Build context from relevant chunks
          const contextText = relevantResults
            .map((result, index) => 
              `[Context ${index + 1} from ${result.document.metadata.title}]:\n${result.chunk.text}`
            )
            .join('\n\n');
          
          // Enhance the prompt with context
          enhancedPrompt = `Based on the following context information, please answer the user's question. If the context doesn't contain relevant information, you can still provide a helpful response based on your general knowledge.

Context:
${contextText}

User Question: ${message}

Please provide a comprehensive answer:`;
          
          contextUsed = true;
        }
      } catch (contextError) {
        console.error('Error retrieving context:', contextError);
        // Continue without context if there's an error
      }
    }

    const response = await generateResponse(enhancedPrompt);

    return NextResponse.json({ 
      response,
      contextUsed,
      enhancedPrompt: contextUsed ? enhancedPrompt : undefined
    });
  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    );
  }
}
