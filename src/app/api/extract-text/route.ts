import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { extractTextFromPDF } from '@/lib/pdf-processor';

export async function POST(request: NextRequest) {
  console.log('🚀 Extract-text API called at:', new Date().toISOString());
  
  try {
    const formData = await request.formData();
    const type = formData.get('type') as string;
    
    console.log('📥 Received request:', {
      type,
      formDataKeys: Array.from(formData.keys()),
      contentType: request.headers.get('content-type')
    });
    
    if (type === 'pdf') {
      const file = formData.get('file') as File;
      if (!file) {
        console.error('❌ No file provided in request');
        return NextResponse.json({ 
          error: 'No file provided',
          details: 'File field is missing from form data'
        }, { status: 400 });
      }

      console.log('📄 Processing PDF:', {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified
      });

      // Validate file type
      if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
        console.error('❌ Invalid file type:', file.type);
        return NextResponse.json({ 
          error: 'Invalid file type',
          details: 'Only PDF files are supported'
        }, { status: 400 });
      }

      try {
        console.log('📊 Converting file to buffer...');
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        console.log('📊 Buffer created, size:', buffer.length);
        
        if (buffer.length === 0) {
          throw new Error('File appears to be empty');
        }
        
        // Use the enhanced PDF processor
        const { text, metadata } = await extractTextFromPDF(buffer);
        
        return NextResponse.json({ 
          text,
          metadata: {
            ...metadata,
            extractionMethod: 'enhanced-pdf-processor'
          }
        });
      } catch (pdfError) {
        console.error('❌ PDF parsing error:', {
          error: pdfError,
          message: pdfError instanceof Error ? pdfError.message : 'Unknown error',
          stack: pdfError instanceof Error ? pdfError.stack : undefined,
          name: pdfError instanceof Error ? pdfError.name : 'Unknown'
        });
        
        // Provide more specific error messages
        let errorMessage = 'Unknown PDF parsing error';
        if (pdfError instanceof Error) {
          if (pdfError.message.includes('MODULE_NOT_FOUND') || pdfError.message.includes('Cannot find module')) {
            errorMessage = 'PDF parsing library not properly installed';
          } else if (pdfError.message.includes('timeout')) {
            errorMessage = 'PDF processing timed out - file may be too large or complex';
          } else if (pdfError.message.includes('invalid header')) {
            errorMessage = 'File is not a valid PDF document';
          } else if (pdfError.message.includes('No text content')) {
            errorMessage = 'PDF contains no extractable text - it may be image-based or encrypted';
          } else {
            errorMessage = pdfError.message;
          }
        }
        
        return NextResponse.json({ 
          error: 'Failed to parse PDF', 
          details: errorMessage,
          type: 'PDF_PARSE_ERROR'
        }, { status: 500 });
      }
    } 
    
    else if (type === 'url') {
      const url = formData.get('url') as string;
      if (!url) {
        return NextResponse.json({ error: 'No URL provided' }, { status: 400 });
      }

      // Fetch the webpage content
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      // Parse HTML and extract text
      const $ = cheerio.load(response.data);
      
      // Remove script and style elements
      $('script, style, nav, footer, header, aside').remove();
      
      // Extract main content
      let text = '';
      const contentSelectors = ['main', 'article', '.content', '#content', '.post', '.entry'];
      
      for (const selector of contentSelectors) {
        const content = $(selector).text();
        if (content && content.length > text.length) {
          text = content;
        }
      }
      
      // Fallback to body if no specific content found
      if (!text || text.length < 100) {
        text = $('body').text();
      }
      
      // Clean up the text
      text = text
        .replace(/\s+/g, ' ')
        .replace(/\n\s*\n/g, '\n')
        .trim();

      return NextResponse.json({ 
        text,
        metadata: {
          url,
          title: $('title').text(),
          description: $('meta[name="description"]').attr('content') || ''
        }
      });
    }
    
    else {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }
  } catch (error) {
    console.error('❌ Error extracting text:', error);
    return NextResponse.json(
      { 
        error: 'Failed to extract text',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
