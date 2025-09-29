import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { PDFProcessor } from '@/lib/pdf-processor'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const documentId = params.id
    const document = await db.document.findUnique({ where: { id: documentId } })

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }
    if (document.status !== 'processing') {
      return NextResponse.json({ error: 'Document is not in processing state' }, { status: 400 })
    }

    const response = await fetch(document.filePath);
    if (!response.ok) {
        throw new Error(`Failed to fetch file from Blob storage: ${response.statusText}`);
    }
    const fileBuffer = Buffer.from(await response.arrayBuffer());

    let extractedText = '';
    
    if (document.fileType === 'pdf') {
      const pdfResult = await PDFProcessor.processPDF(fileBuffer, document.originalName, document.fileSize);
      extractedText = pdfResult.text;
    } else if (document.fileType === 'docx') {
      // Dynamically import mammoth ONLY when processing a DOCX file
      const mammoth = (await import('mammoth')).default;
      const result = await mammoth.extractRawText({ buffer: fileBuffer });
      extractedText = result.value;
    }

    if (!extractedText || extractedText.trim().length === 0) {
      throw new Error('No text could be extracted from the document.');
    }

    // Your existing logic for chunking and saving to the DB...
    const chunks = createSimpleChunks(extractedText, documentId);
    for (const chunk of chunks) {
      await db.documentChunk.create({
        data: {
          documentId,
          content: chunk.content,
          chunkIndex: chunk.chunkIndex,
          embedding: JSON.stringify([]), // Placeholder
          metadata: JSON.stringify({ documentName: document.originalName }),
        }
      });
    }

    await db.document.update({
      where: { id: documentId },
      data: { status: 'ready' }
    });

    return NextResponse.json({ message: 'Document processed successfully' });

  } catch (error) {
    console.error('Error processing document:', error);
    if (params.id) {
        await db.document.update({
            where: { id: params.id },
            data: { status: 'error' }
        }).catch(updateError => console.error("Failed to update status to error:", updateError));
    }
    return NextResponse.json({ 
      error: 'Failed to process document',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Simple chunking function - ensure it's defined
function createSimpleChunks(text: string, documentId: string): Array<{content: string, chunkIndex: number}> {
  const chunks: Array<{content: string, chunkIndex: number}> = [];
  const chunkSize = 1000;
  const chunkOverlap = 200;
  const cleanedText = text.replace(/\s{2,}/g, ' ').trim();
  
  for (let i = 0; i < cleanedText.length; i += chunkSize - chunkOverlap) {
    const chunkContent = cleanedText.substring(i, i + chunkSize);
    if (chunkContent.trim().length > 0) {
      chunks.push({ content: chunkContent, chunkIndex: chunks.length });
    }
  }
  return chunks;
}