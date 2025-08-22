import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    // Test if pdf-parse can be loaded
    const pdfParse = (await import('pdf-parse')).default;
    
    return NextResponse.json({
      status: 'PDF parsing library loaded successfully',
      pdfParseType: typeof pdfParse,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      status: 'PDF parsing library failed to load',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Testing PDF upload endpoint...');
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string;
    
    console.log('📋 Form data received:', {
      fileExists: !!file,
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      type
    });
    
    if (!file) {
      return NextResponse.json({
        error: 'No file provided',
        received: Object.fromEntries(formData.entries())
      }, { status: 400 });
    }
    
    if (type !== 'pdf') {
      return NextResponse.json({
        error: 'This test endpoint only accepts PDF files',
        receivedType: type
      }, { status: 400 });
    }
    
    // Test buffer creation
    const buffer = Buffer.from(await file.arrayBuffer());
    console.log('✅ Buffer created successfully, size:', buffer.length);
    
    // Test pdf-parse loading
    const pdfParse = (await import('pdf-parse')).default;
    console.log('✅ PDF parser loaded successfully');
    
    // Test PDF parsing
    const data = await pdfParse(buffer);
    console.log('✅ PDF parsed successfully:', {
      pages: data.numpages,
      textLength: data.text.length,
      hasText: data.text.length > 0
    });
    
    return NextResponse.json({
      success: true,
      filename: file.name,
      fileSize: file.size,
      pages: data.numpages,
      textLength: data.text.length,
      textPreview: data.text.slice(0, 200) + (data.text.length > 200 ? '...' : ''),
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Test PDF processing failed:', error);
    return NextResponse.json({
      error: 'PDF processing failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
