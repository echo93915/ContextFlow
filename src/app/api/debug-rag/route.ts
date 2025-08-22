import { NextRequest, NextResponse } from 'next/server';
import { sharedDocumentStore } from '@/lib/shared-document-store';

export async function GET(request: NextRequest) {
  try {
    const stats = sharedDocumentStore.getStats();
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      status: 'RAG System Debug Info',
      ...stats,
      detailedInfo: stats.documentList.map(doc => ({
        ...doc,
        firstChunkPreview: sharedDocumentStore.get(doc.uploadId)?.chunks[0]?.text.slice(0, 200) + '...'
      }))
    });
  } catch (error) {
    console.error('Error in RAG debug:', error);
    return NextResponse.json(
      { error: 'Debug failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();
    
    if (action === 'clear') {
      sharedDocumentStore.clear();
      return NextResponse.json({
        success: true,
        message: 'Document store cleared',
        remainingDocuments: sharedDocumentStore.getSize()
      });
    }
    
    return NextResponse.json(
      { error: 'Invalid action. Use "clear" to clear the document store.' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in RAG debug action:', error);
    return NextResponse.json(
      { error: 'Debug action failed' },
      { status: 500 }
    );
  }
}
