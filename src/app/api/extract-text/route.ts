import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';

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
        return NextResponse.json({ error: 'No file provided' }, { status: 400 });
      }

      console.log('📄 Processing PDF:', file.name, 'Size:', file.size, 'Type:', file.type);

      try {
        // Dynamic import of pdf-parse to handle potential module issues
        const pdfParse = (await import('pdf-parse')).default;
        
        const buffer = Buffer.from(await file.arrayBuffer());
        console.log('📊 Buffer created, size:', buffer.length);
        
        const data = await pdfParse(buffer);
        console.log('✅ PDF parsed successfully, pages:', data.numpages, 'text length:', data.text.length);
        
        return NextResponse.json({ 
          text: data.text,
          metadata: {
            pages: data.numpages,
            info: data.info
          }
        });
      } catch (pdfError) {
        console.error('❌ PDF parsing error:', pdfError);
        return NextResponse.json({ 
          error: 'Failed to parse PDF', 
          details: pdfError instanceof Error ? pdfError.message : 'Unknown PDF error'
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
