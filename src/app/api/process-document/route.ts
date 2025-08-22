import { NextRequest, NextResponse } from 'next/server';
import { processDocument } from '@/lib/text-processing';
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

    // Process the document into chunks with embeddings
    const processedDocument = await processDocument(text, source, sourceType, title);

    // Store the processed document (associate with upload ID)
    if (uploadId) {
      sharedDocumentStore.set(uploadId, processedDocument);
    }

    return NextResponse.json({
      success: true,
      documentId: processedDocument.id,
      chunksCount: processedDocument.chunks.length,
      title: processedDocument.metadata.title
    });
  } catch (error) {
    console.error('Error processing document:', error);
    return NextResponse.json(
      { error: 'Failed to process document' },
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
