import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises'; // Use a standard import for the file system module
import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Only PDF and DOCX files are allowed.' 
      }, { status: 400 });
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'File size exceeds 10MB limit.' 
      }, { status: 400 });
    }

    // --- START OF FIXES ---

    // 1. Define the Vercel-friendly writable directory
    const uploadsDir = path.join('/tmp', 'uploads');

    // 2. Ensure the directory exists using the correct async function
    await fs.mkdir(uploadsDir, { recursive: true });

    // 3. Generate a unique filename and define the full file path
    const fileExtension = file.name.split('.').pop();
    const filename = `${uuidv4()}.${fileExtension}`;
    const filePath = path.join(uploadsDir, filename);

    // --- END OF FIXES ---

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await fs.writeFile(filePath, buffer);

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

    // Save to database
    const document = await db.document.create({
      data: {
        filename,
        originalName: file.name,
        fileType: fileExtension as 'pdf' | 'docx',
        fileSize: file.size,
        filePath,
        status: 'processing',
        userId: user.id
      }
    });

    // Start processing for RAG pipeline (your existing logic is fine)
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