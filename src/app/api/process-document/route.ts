import { NextRequest, NextResponse } from 'next/server';
import { chunkText, ProcessedDocument } from '@/lib/pdf-processor';
import { getUnifiedLLM } from '@/lib/llm-unified';
import { getVectorStore } from '@/lib/enhanced-vector-store';
import { sharedDocumentStore } from '@/lib/shared-document-store';

export async function POST(request: NextRequest) {
  try {
    const { text, source, sourceType, title, uploadId } = await request.json();

    if (!text || !source || !sourceType) {
      return NextResponse.json(
        { error: 'Missing required fields: text, source, sourceType' },
        { status: 400 }
      );
    }

    console.log(`🔄 Processing document: ${title || source}`);
    console.log(`📄 Text length: ${text.length} characters`);

    // Chunk the text using the proven algorithm from DocuChat (1200 chars, 200 overlap)
    const chunks = chunkText(text, 1200, 200, source, sourceType);
    console.log(`✂️ Created ${chunks.length} chunks`);

    // Initialize the unified LLM interface
    const llm = getUnifiedLLM({
      geminiApiKey: process.env.GEMINI_API_KEY,
      openaiApiKey: process.env.OPENAI_API_KEY,
      preferredProvider: 'auto'
    });

    // Generate embeddings for all chunks
    console.log('🧮 Generating embeddings...');
    const chunkTexts = chunks.map(chunk => chunk.text);
    const embeddings = await llm.generateEmbeddings(chunkTexts);
    console.log(`✅ Generated ${embeddings.length} embeddings`);

    // Store in the enhanced vector store
    const vectorStore = getVectorStore();
    await vectorStore.addChunks(chunks, embeddings);

    // Create processed document for legacy compatibility
    const processedDocument: ProcessedDocument = {
      id: crypto.randomUUID(),
      chunks,
      metadata: {
        title: title || source || 'Untitled Document',
        author: undefined,
        creator: undefined,
        producer: undefined,
        creationDate: undefined,
        modificationDate: undefined,
        totalPages: 0, // Will be updated if this is a PDF
        totalCharacters: text.length,
        sourceType: sourceType as 'pdf' | 'url',
        source,
        processedAt: new Date()
      }
    };

    // Store the processed document (associate with upload ID)
    if (uploadId) {
      sharedDocumentStore.set(uploadId, processedDocument);
    }

    // Get vector store statistics
    const stats = vectorStore.getStats();

    return NextResponse.json({
      success: true,
      documentId: processedDocument.id,
      chunksCount: chunks.length,
      title: title || source,
      vectorStoreStats: {
        totalEntries: stats.totalEntries,
        totalSources: stats.totalSources,
        providers: stats.providers
      },
      embeddingInfo: {
        provider: embeddings[0]?.provider || 'unknown',
        model: embeddings[0]?.model || 'unknown',
        dimensions: embeddings[0]?.dimensions || 0
      }
    });
  } catch (error) {
    console.error('❌ Error processing document:', error);
    
    let errorMessage = 'Failed to process document';
    if (error instanceof Error) {
      if (error.message.includes('embedding')) {
        errorMessage = 'Failed to generate embeddings - check API keys';
      } else if (error.message.includes('chunking')) {
        errorMessage = 'Failed to chunk document text';
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const uploadId = searchParams.get('uploadId');

    if (uploadId && sharedDocumentStore.has(uploadId)) {
      const document = sharedDocumentStore.get(uploadId);
      return NextResponse.json(document);
    }

    // Return all documents if no specific ID requested
    const allDocuments = sharedDocumentStore.getAllDocuments();
    return NextResponse.json(allDocuments);
  } catch (error) {
    console.error('Error retrieving documents:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve documents' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { uploadId } = await request.json();

    if (!uploadId) {
      return NextResponse.json(
        { error: 'Upload ID is required' },
        { status: 400 }
      );
    }

    const deleted = sharedDocumentStore.delete(uploadId);

    return NextResponse.json({
      success: deleted,
      message: deleted ? 'Document deleted successfully' : 'Document not found'
    });
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    );
  }
}
