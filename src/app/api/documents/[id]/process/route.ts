import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { PDFProcessor } from '@/lib/pdf-processor'
import mammoth from 'mammoth'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const documentId = params.id

    // Get document from database
    const document = await db.document.findUnique({
      where: { id: documentId }
    })

    if (!document) {
      return NextResponse.json({ 
        error: 'Document not found' 
      }, { status: 404 })
    }

    if (document.status !== 'processing') {
      return NextResponse.json({ 
        error: 'Document is not in processing state' 
      }, { status: 400 })
    }

    // --- START OF BLOB LOGIC FIX ---
    
    // 1. Download the file from the Vercel Blob URL stored in the database
    const response = await fetch(document.filePath);
    if (!response.ok) {
        throw new Error(`Failed to fetch file from Blob storage: ${response.statusText}`);
    }
    const fileBuffer = Buffer.from(await response.arrayBuffer());

    // --- END OF BLOB LOGIC FIX ---

    // Robust text extraction (your existing logic is fine)
    let extractedText = ''
    try {
      if (document.fileType === 'pdf') {
        console.log('Processing PDF file:', document.originalName);
        const pdfResult = await PDFProcessor.processPDF(
          fileBuffer, 
          document.originalName, 
          document.fileSize
        );
        extractedText = pdfResult.text;
        console.log('PDF processing completed:', pdfResult.success);
        
      } else if (document.fileType === 'docx') {
        console.log('Processing DOCX file:', document.originalName);
        const result = await mammoth.extractRawText({ buffer: fileBuffer });
        extractedText = result.value;
        if (!extractedText || extractedText.trim().length === 0) {
            throw new Error('No text extracted from DOCX');
        }
      }
      
      if (!extractedText || extractedText.trim().length === 0) {
        extractedText = `Document: ${document.originalName}\n\nThis document has been uploaded successfully, but automatic text extraction was not possible.`;
      }
      
    } catch (extractionError) {
      console.error('Error in text extraction:', extractionError);
      extractedText = `Document uploaded successfully. Text extraction encountered an error. File: ${document.originalName}`;
    }

    // Create simple chunks (your existing logic is fine)
    const chunks = createSimpleChunks(extractedText, documentId, document.originalName);

    // Save chunks to database
    for (let i = 0; i < chunks.length; i++) {
      await db.documentChunk.create({
        data: {
          documentId,
          content: chunks[i].content,
          chunkIndex: i,
          metadata: JSON.stringify({
            documentId,
            chunkIndex: i,
            documentName: document.originalName,
          }),
          embedding: JSON.stringify([])
        }
      });
    }

    // Update document status to ready
    await db.document.update({
      where: { id: documentId },
      data: { status: 'ready' }
    });

    return NextResponse.json({ 
      message: 'Document processed successfully',
      documentId,
      chunksProcessed: chunks.length,
    });

  } catch (error) {
    console.error('Error processing document:', error);
    
    // Update document status to error if something fails
    await db.document.update({
      where: { id: params.id },
      data: { status: 'error' }
    });

    return NextResponse.json({ 
      error: 'Failed to process document',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Simple chunking function (your existing logic is fine)
function createSimpleChunks(text: string, documentId: string, documentName: string): Array<{content: string}> {
  const chunks: Array<{content:string}> = [];
  const chunkSize = 1000;
  const chunkOverlap = 200;
  
  const cleanedText = text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\s{2,}/g, ' ')
    .trim();
  
  for (let i = 0; i < cleanedText.length; i += chunkSize - chunkOverlap) {
    const chunk = cleanedText.substring(i, i + chunkSize);
    if (chunk.trim().length > 0) {
      chunks.push({ content: chunk });
    }
  }
  
  return chunks;
}