import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { put } from '@vercel/blob'; // 1. Import the 'put' function from Vercel Blob

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // --- All validation logic remains the same ---
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

    // --- START OF REFACTORED BLOB LOGIC ---

    // 2. Generate a unique filename for the blob
    const fileExtension = file.name.split('.').pop();
    const filename = `${uuidv4()}.${fileExtension}`;

    // 3. Upload the file to Vercel Blob storage
    const blob = await put(filename, file, {
      access: 'public',
    });

    // --- END OF REFACTORED BLOB LOGIC ---

    // Get or create default user
    let user = await db.user.findUnique({
      where: { id: 'default-user' }
    });
    if (!user) {
      user = await db.user.create({
        data: {
          id: 'default-user',
          email: 'default@example.com',
          name: 'Default User'
        }
      });
    }

    // 4. Save the public Blob URL to the database
    const document = await db.document.create({
      data: {
        filename,
        originalName: file.name,
        fileType: fileExtension as 'pdf' | 'docx',
        fileSize: file.size,
        filePath: blob.url, // IMPORTANT: Save the URL from Vercel Blob
        status: 'processing',
        userId: user.id
      }
    });

    // Start processing for RAG pipeline (your existing logic)
    try {
      fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/documents/${document.id}/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      }).catch(error => {
        console.error('Error triggering document processing:', error);
      });
    } catch (error) {
      console.error('Error starting document processing:', error);
    }

    return NextResponse.json({ 
      message: 'File uploaded successfully',
      document: {
        id: document.id,
        filename: document.originalName,
        fileType: document.fileType,
        fileSize: document.fileSize,
        status: document.status
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ 
      error: 'Failed to upload file' 
    }, { status: 500 });
  }
}