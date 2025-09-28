import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import { db } from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
    
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Only PDF and DOCX files are allowed.' 
      }, { status: 400 })
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'File size exceeds 10MB limit.' 
      }, { status: 400 })
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop()
    const filename = `${uuidv4()}.${fileExtension}`
    const filePath = path.join(process.cwd(), 'uploads', filename)

    // Ensure uploads directory exists and save file using dynamic import
    const { writeFile, mkdirSync } = await import('fs/promises')
    const uploadsDir = path.join(process.cwd(), 'uploads')
    try {
      await mkdirSync(uploadsDir, { recursive: true })
    } catch (error) {
      // Directory might already exist
    }

    // Save file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Get or create default user
    let user = await db.user.findUnique({
      where: { id: 'default-user' }
    })
    
    if (!user) {
      user = await db.user.create({
        data: {
          id: 'default-user',
          email: 'default@example.com',
          name: 'Default User'
        }
      })
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
    })

    // Start processing for RAG pipeline
    try {
      // Trigger processing in the background
      fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/documents/${document.id}/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      }).catch(error => {
        console.error('Error triggering document processing:', error)
        // Don't fail the upload if processing fails to start
      })
    } catch (error) {
      console.error('Error starting document processing:', error)
      // Don't fail the upload if processing fails to start
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
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ 
      error: 'Failed to upload file' 
    }, { status: 500 })
  }
}