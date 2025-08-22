/**
 * PDF Processing Library
 * Based on the proven workflow from DocuChat project
 * Uses a more robust approach with better error handling and chunking
 */

import pdf from 'pdf-parse';

export interface DocumentChunk {
  id: string;
  text: string;
  metadata: {
    source: string;
    sourceType: 'pdf' | 'url';
    chunkIndex: number;
    startChar: number;
    endChar: number;
    pageNumber?: number;
  };
}

export interface PDFMetadata {
  title: string;
  author?: string;
  creator?: string;
  producer?: string;
  creationDate?: Date;
  modificationDate?: Date;
  totalPages: number;
  totalCharacters: number;
}

export interface ProcessedDocument {
  id: string;
  chunks: DocumentChunk[];
  metadata: PDFMetadata & {
    sourceType: 'pdf' | 'url';
    source: string;
    processedAt: Date;
  };
}

/**
 * Clean extracted PDF text
 * Removes null bytes, BOM, and excessive whitespace
 */
function cleanText(text: string): string {
  if (!text) {
    return "";
  }

  // Remove excessive whitespace (matching DocuChat)
  text = text.replace(/\s+/g, ' ');
  
  // Remove page markers for chunking (keep the text, remove the markers)
  text = text.replace(/\[PAGE \d+\]\s*/g, '');
  
  // Fix common PDF extraction issues
  text = text.replace(/\x00/g, ''); // Remove null bytes
  text = text.replace(/\ufeff/g, ''); // Remove BOM
  
  // Normalize line endings
  text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  // Remove excessive newlines but preserve paragraph breaks
  text = text.replace(/\n\s*\n\s*\n+/g, '\n\n');
  
  return text.trim();
}

/**
 * Extract text from PDF buffer with enhanced error handling
 */
export async function extractTextFromPDF(buffer: Buffer): Promise<{ text: string; metadata: PDFMetadata }> {
  try {
    // Validate PDF header
    const pdfHeader = buffer.subarray(0, 4).toString();
    if (!pdfHeader.startsWith('%PDF')) {
      throw new Error('File does not appear to be a valid PDF (invalid header)');
    }

    console.log('🔍 Extracting text from PDF with pdf-parse...');
    
    // Parse PDF with simplified options for better reliability
    console.log('🔍 Parsing PDF with pdf-parse...');
    const parsePromise = pdf(buffer, {
      // Process all pages without custom page rendering to avoid [object Object] issues
      max: 0
    });

    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('PDF parsing timed out after 45 seconds')), 45000);
    });

    const data = await Promise.race([parsePromise, timeoutPromise]) as any;

    console.log('📋 Raw PDF data:', {
      hasText: !!data.text,
      textLength: data.text?.length || 0,
      textPreview: data.text?.slice(0, 200) || 'No text',
      pages: data.numpages,
      hasInfo: !!data.info
    });

    if (!data.text || data.text.trim().length === 0) {
      throw new Error('No text content found in PDF. The PDF may be image-based, encrypted, or contain no extractable text.');
    }

    // Clean the extracted text
    const cleanedText = cleanText(data.text);
    
    console.log('🧹 After cleaning:', {
      originalLength: data.text.length,
      cleanedLength: cleanedText.length,
      cleanedPreview: cleanedText.slice(0, 200)
    });

    // Extract metadata
    const metadata: PDFMetadata = {
      title: data.info?.Title || 'Untitled PDF Document',
      author: data.info?.Author || undefined,
      creator: data.info?.Creator || undefined,
      producer: data.info?.Producer || undefined,
      creationDate: data.info?.CreationDate ? new Date(data.info.CreationDate) : undefined,
      modificationDate: data.info?.ModDate ? new Date(data.info.ModDate) : undefined,
      totalPages: data.numpages || 0,
      totalCharacters: cleanedText.length
    };

    console.log('✅ PDF processed successfully:', {
      pages: metadata.totalPages,
      characters: metadata.totalCharacters,
      title: metadata.title || 'Untitled'
    });

    return {
      text: cleanedText,
      metadata
    };

  } catch (error) {
    console.error('❌ PDF extraction failed:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        throw new Error('PDF processing timed out - file may be too large or complex');
      } else if (error.message.includes('invalid header')) {
        throw new Error('File is not a valid PDF document');
      } else if (error.message.includes('No text content')) {
        throw error; // Re-throw as is
      }
    }
    
    throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Smart text chunking with sentence boundary detection
 * Based on the proven algorithm from DocuChat
 */
export function chunkText(
  text: string, 
  chunkSize: number = 1200, 
  overlap: number = 200,
  source: string = '',
  sourceType: 'pdf' | 'url' = 'pdf',
  minChunkSize: number = 100
): DocumentChunk[] {
  // Parameter validation (matching DocuChat)
  if (chunkSize <= 0) {
    throw new Error("chunk_size must be positive");
  }
  if (overlap < 0) {
    throw new Error("overlap cannot be negative");
  }
  if (overlap >= chunkSize) {
    throw new Error("overlap must be less than chunk_size");
  }
  if (minChunkSize <= 0) {
    throw new Error("min_chunk_size must be positive");
  }

  // Clean the text first
  const cleanedText = cleanText(text);
  if (!cleanedText) {
    console.warn("No text to chunk");
    return [];
  }

  console.log(`🔧 Chunking text: ${cleanedText.length} chars, chunkSize: ${chunkSize}, overlap: ${overlap}`);
  
  // For very short documents, return as a single chunk
  if (cleanedText.length <= chunkSize) {
    const chunk = {
      id: crypto.randomUUID(),
      text: cleanedText.trim(),
      metadata: {
        source,
        sourceType,
        chunkIndex: 0,
        startChar: 0,
        endChar: cleanedText.length
      }
    };
    console.log(`📦 Single chunk created: "${chunk.text.slice(0, 100)}${chunk.text.length > 100 ? '...' : ''}"`);
    return [chunk];
  }

  const chunks: DocumentChunk[] = [];
  let start = 0;
  let chunkIndex = 0;

  while (start < cleanedText.length) {
    // Calculate end position
    let end = start + chunkSize;
    
    // If this is not the last chunk, try to find a good break point
    if (end < cleanedText.length) {
      // Look for sentence endings near the chunk boundary (DocuChat algorithm)
      const breakWindow = Math.min(100, Math.floor(chunkSize / 4)); // Look within 100 chars or 25% of chunk_size
      const searchStart = Math.max(end - breakWindow, start + minChunkSize);
      const searchEnd = Math.min(end + breakWindow, cleanedText.length);
      
      // Find the best break point (sentence ending)
      let bestBreak = end;
      for (let i = searchEnd - 1; i >= searchStart; i--) {
        if (cleanedText[i] === '.' || cleanedText[i] === '!' || cleanedText[i] === '?') {
          // Check if it's not an abbreviation (next char should be whitespace)
          if (i < cleanedText.length - 1 && /\s/.test(cleanedText[i + 1])) {
            bestBreak = i + 1;
            break;
          }
        }
      }
      
      end = bestBreak;
    }
    
    // Extract chunk text
    const chunkText = cleanedText.slice(start, end).trim();
    
    // Debug chunk creation
    console.log(`📝 Chunk ${chunkIndex}: ${chunkText.length} chars, preview: "${chunkText.slice(0, 50)}${chunkText.length > 50 ? '...' : ''}"`);
    
    // Skip chunks that are too small (unless it's the last chunk)
    if (chunkText.length >= minChunkSize || end >= cleanedText.length) {
      chunks.push({
        id: crypto.randomUUID(),
        text: chunkText,
        metadata: {
          source,
          sourceType,
          chunkIndex,
          startChar: start,
          endChar: end
        }
      });
      chunkIndex++;
    }
    
    // Move start position for next chunk (with overlap)
    if (end >= cleanedText.length) {
      break;
    }
    start = Math.max(start + 1, end - overlap);
  }

  console.log(`✅ Text chunked into ${chunks.length} chunks (avg: ${Math.round(chunks.reduce((sum, chunk) => sum + chunk.text.length, 0) / chunks.length)} chars per chunk)`);
  
  return chunks;
}

/**
 * Complete PDF processing pipeline
 */
export async function processPDF(
  buffer: Buffer,
  source: string,
  chunkSize: number = 1200,
  overlap: number = 200
): Promise<ProcessedDocument> {
  try {
    // Extract text and metadata
    const { text, metadata } = await extractTextFromPDF(buffer);
    
    // Chunk the text
    const chunks = chunkText(text, chunkSize, overlap, source, 'pdf');
    
    // Create processed document
    const processedDocument: ProcessedDocument = {
      id: crypto.randomUUID(),
      chunks,
      metadata: {
        ...metadata,
        sourceType: 'pdf' as const,
        source,
        processedAt: new Date()
      }
    };
    
    console.log(`🎉 PDF processing complete: ${chunks.length} chunks from ${metadata.totalPages} pages`);
    
    return processedDocument;
    
  } catch (error) {
    console.error('❌ PDF processing pipeline failed:', error);
    throw error;
  }
}

