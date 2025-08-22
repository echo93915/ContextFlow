import { NextRequest, NextResponse } from 'next/server';
import { findRelevantChunks, ProcessedDocument } from '@/lib/text-processing';
import { sharedDocumentStore } from '@/lib/shared-document-store';

export async function POST(request: NextRequest) {
  try {
    const { query, topK = 5, uploadIds } = await request.json();

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    // Get documents to search
    let documentsToSearch: ProcessedDocument[] = [];
    
    if (uploadIds && Array.isArray(uploadIds)) {
      // Search only specific documents
      documentsToSearch = uploadIds
        .map(id => sharedDocumentStore.get(id))
        .filter(doc => doc !== undefined);
    } else {
      // Search all documents
      documentsToSearch = sharedDocumentStore.getAllDocuments();
    }

    if (documentsToSearch.length === 0) {
      return NextResponse.json({
        results: [],
        message: 'No documents available for search'
      });
    }

    // Find relevant chunks
    const results = await findRelevantChunks(query, documentsToSearch, topK);

    // Format results for the frontend
    const formattedResults = results.map(result => ({
      text: result.chunk.text,
      score: result.score,
      source: result.document.metadata.source,
      sourceType: result.document.metadata.sourceType,
      title: result.document.metadata.title,
      chunkIndex: result.chunk.metadata.chunkIndex,
      documentId: result.document.id
    }));

    return NextResponse.json({
      query,
      results: formattedResults,
      totalResults: results.length
    });
  } catch (error) {
    console.error('Error retrieving context:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve context' },
      { status: 500 }
    );
  }
}

// Add a health check endpoint
export async function GET() {
  try {
    const stats = sharedDocumentStore.getStats();

    return NextResponse.json({
      status: 'healthy',
      documentsCount: stats.totalDocuments,
      totalChunks: stats.totalChunks,
      availableDocuments: stats.documentList
    });
  } catch (error) {
    console.error('Error in health check:', error);
    return NextResponse.json(
      { error: 'Health check failed' },
      { status: 500 }
    );
  }
}
