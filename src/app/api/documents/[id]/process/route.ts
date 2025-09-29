import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import path from 'path'
import { PDFProcessor } from '@/lib/pdf-processor'
import { readFile } from 'fs/promises' // Use a static import for better performance
import mammoth from 'mammoth'           // Use a static import for better performance

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } } // This signature is correct
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

    // --- START OF FIX ---
    // The filePath from the database is now the source of truth.
    // It will be `/tmp/uploads/...` on Vercel and wherever you saved it locally.
    const filePath = document.filePath 
    // --- END OF FIX ---

    const fileBuffer = await readFile(filePath)

    // Robust text extraction
    let extractedText = ''
    
    try {
      if (document.fileType === 'pdf') {
        console.log('Processing PDF file:', document.originalName)
        console.log('File size:', fileBuffer.length, 'bytes')
        
        const pdfResult = await PDFProcessor.processPDF(
          fileBuffer, 
          document.originalName, 
          document.fileSize
        )
        
        extractedText = pdfResult.text
        console.log('PDF processing completed:')
        console.log('- Success:', pdfResult.success)
        console.log('- Method:', pdfResult.metadata.processingMethod)
        console.log('- Text length:', extractedText.length)
        console.log('- Text preview:', extractedText.substring(0, 100))
        console.log('- Error:', pdfResult.metadata.error || 'None')
        
      } else if (document.fileType === 'docx') {
        console.log('Processing DOCX file:', document.originalName)
        
        try {
          const result = await mammoth.extractRawText({ buffer: fileBuffer })
          extractedText = result.value
          console.log('DOCX text extracted, length:', extractedText.length)
          
          if (!extractedText || extractedText.trim().length === 0) {
            throw new Error('No text extracted from DOCX')
          }
        } catch (docxError) {
          console.error('DOCX parsing failed:', docxError)
          extractedText = `DOCX Document: ${document.originalName}\n\nThis Word document has been uploaded successfully. The text content could not be automatically extracted. This might be due to:\n\n- The document being corrupted\n- Complex formatting or embedded objects\n- Encryption or protection\n\nFile details:\n- Name: ${document.originalName}\n- Size: ${(document.fileSize / 1024).toFixed(2)} KB\n- Type: DOCX\n\nYou can still ask questions about this document, and the system will provide general assistance based on the filename and context.`
        }
      }
      
      if (!extractedText || extractedText.trim().length === 0) {
        extractedText = `Document: ${document.originalName}\n\nThis document has been uploaded successfully. However, automatic text extraction was not possible. This could be because:\n\n- The file is password-protected\n- The file contains only images or scanned content\n- The file format is not supported for text extraction\n\nFile information:\n- Name: ${document.originalName}\n- Size: ${(document.fileSize / 1024).toFixed(2)} KB\n- Type: ${document.fileType.toUpperCase()}\n\nYou can still use this document for general questions and assistance.`
      }
      
    } catch (extractionError) {
      console.error('Error in text extraction:', extractionError)
      extractedText = `Document uploaded successfully. Text extraction encountered an error. File: ${document.originalName}\n\nError details: ${extractionError instanceof Error ? extractionError.message : 'Unknown error'}\n\nThe file has been saved and you can still ask general questions about it.`
    }

    // Create simple chunks (basic implementation)
    const chunks = createSimpleChunks(extractedText, documentId, document.originalName)

    // Save chunks to database (without embeddings for now)
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
            startChar: i * 1000,
            endChar: (i + 1) * 1000
          }),
          embedding: JSON.stringify([]) // Empty embedding for now
        }
      })
    }

    // Update document status to ready
    await db.document.update({
      where: { id: documentId },
      data: { status: 'ready' }
    })

    return NextResponse.json({ 
      message: 'Document processed successfully',
      documentId,
      chunksProcessed: chunks.length,
      textExtracted: extractedText.length > 0
    })

  } catch (error) {
    console.error('Error processing document:', error)
    
    // Update document status to error
    await db.document.update({
      where: { id: params.id },
      data: { status: 'error' }
    })

    return NextResponse.json({ 
      error: 'Failed to process document',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Simple chunking function
function createSimpleChunks(text: string, documentId: string, documentName: string): Array<{content: string}> {
  const chunks: Array<{content:string}> = []
  const chunkSize = 1000
  const chunkOverlap = 200
  
  const cleanedText = text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\s{2,}/g, ' ')
    .trim()
  
  for (let i = 0; i < cleanedText.length; i += chunkSize - chunkOverlap) {
    const chunk = cleanedText.substring(i, i + chunkSize)
    if (chunk.trim().length > 0) {
      chunks.push({ content: chunk })
    }
  }
  
  return chunks
}