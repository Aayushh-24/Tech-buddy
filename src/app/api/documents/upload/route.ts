import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { put } from '@vercel/blob';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validation logic...
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type.' }, { status: 400 });
    }
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File size exceeds 10MB limit.' }, { status: 400 });
    }

    // Upload to Vercel Blob
    const fileExtension = file.name.split('.').pop();
    const filename = `${uuidv4()}.${fileExtension}`;
    const blob = await put(filename, file, {
      access: 'public',
    });

    // Get or create default user
    let user = await db.user.findUnique({ where: { id: 'default-user' } });
    if (!user) {
      user = await db.user.create({
        data: { id: 'default-user', email: 'default@example.com', name: 'Default User' }
      });
    }

    // Save the Blob URL to the database
    const document = await db.document.create({
      data: {
        filename,
        originalName: file.name,
        fileType: fileExtension as 'pdf' | 'docx',
        fileSize: file.size,
        filePath: blob.url,
        status: 'processing',
        userId: user.id
      }
    });

    // --- THIS IS THE CORRECTED PART ---
    // Trigger the processing step using the correct live URL
    const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
    fetch(`${baseUrl}/api/documents/${document.id}/process`, {
      method: 'POST',
    }).catch(e => console.error("Failed to trigger processing:", e));
    // --- END OF CORRECTION ---

    return NextResponse.json({ 
      message: 'File uploaded successfully',
      document: { id: document.id, filename: document.originalName }
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}