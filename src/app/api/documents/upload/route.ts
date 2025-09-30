import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { put } from '@vercel/blob';
import { PDFProcessor } from '@/lib/pdf-processor';

// Helper function for chunking text
function createSimpleChunks(text: string): string[] {
  const chunks: string[] = [];
  const chunkSize = 1000;
  const chunkOverlap = 200;
  const cleanedText = text.replace(/\s{2,}/g, ' ').trim();
  
  for (let i = 0; i < cleanedText.length; i += chunkSize - chunkOverlap) {
    const chunkContent = cleanedText.substring(i, i + chunkSize);
    if (chunkContent.trim().length > 0) {
      chunks.push(chunkContent);
    }
  }
  return chunks;
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  
  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  if (!fileExtension || !['pdf', 'docx'].includes(fileExtension)) {
    return NextResponse.json({ error: 'Invalid file type.' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // --- Main Logic: Upload, Process, and Save in One Go ---
  let documentId = '';
  try {
    // 1. Upload the original file to Vercel Blob
    const filename = `${uuidv4()}.${fileExtension}`;
    const blob = await put(filename, file, { access: 'public' });

    // Get or create a default user
    let user = await db.user.findUnique({ where: { id: 'default-user' } });
    if (!user) {
      user = await db.user.create({ data: { id: 'default-user', email: 'default@example.com', name: 'Default User' } });
    }

    // 2. Create the initial document record in the database
    const document = await db.document.create({
      data: {
        filename,
        originalName: file.name,
        fileType: fileExtension,
        fileSize: file.size,
        filePath: blob.url,
        status: 'processing',
        userId: user.id,
      }
    });
    documentId = document.id; // Store ID for error handling

    // 3. Extract text from the document
    let extractedText = '';
    if (fileExtension === 'pdf') {
      const pdfResult = await PDFProcessor.processPDF(buffer, document.originalName);
      if (!pdfResult.success) throw new Error(pdfResult.metadata.error || 'PDF processing failed');
      extractedText = pdfResult.text;
    } else if (fileExtension === 'docx') {
      const mammoth = (await import('mammoth')).default;
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value;
    }

    if (!extractedText.trim()) {
      throw new Error('No text could be extracted from the document.');
    }

    // 4. Create text chunks
    const chunks = createSimpleChunks(extractedText);

    // 5. Save chunks to the database
    await db.documentChunk.createMany({
      data: chunks.map((content, index) => ({
        documentId: document.id,
        content,
        chunkIndex: index,
        embedding: JSON.stringify([]), // Placeholder for now
        metadata: JSON.stringify({ documentName: document.originalName }),
      })),
    });

    // 6. Update document status to 'ready'
    await db.document.update({
      where: { id: document.id },
      data: { status: 'ready' },
    });

    return NextResponse.json({ message: 'File processed successfully', document });

  } catch (error) {
    console.error('Upload and process error:', error);
    // If an error occurs after the document record was created, update its status to 'error'
    if (documentId) {
      await db.document.update({
        where: { id: documentId },
        data: { status: 'error' },
      }).catch(updateError => console.error("Failed to update status to error:", updateError));
    }
    return NextResponse.json({ error: 'Failed to process file' }, { status: 500 });
  }
}