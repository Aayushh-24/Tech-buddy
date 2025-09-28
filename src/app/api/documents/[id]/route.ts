import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import path from 'path'
import { unlink } from 'fs/promises'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const document = await db.document.findUnique({
      where: { id: params.id },
      include: {
        chunks: true
      }
    })

    if (!document) {
      return NextResponse.json({ 
        error: 'Document not found' 
      }, { status: 404 })
    }

    return NextResponse.json({ document })
  } catch (error) {
    console.error('Error fetching document:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch document' 
    }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { status } = await request.json()

    if (!status || !['processing', 'ready', 'error'].includes(status)) {
      return NextResponse.json({ 
        error: 'Invalid status' 
      }, { status: 400 })
    }

    const document = await db.document.update({
      where: { id: params.id },
      data: { status }
    })

    return NextResponse.json({ document })
  } catch (error) {
    console.error('Error updating document:', error)
    return NextResponse.json({ 
      error: 'Failed to update document' 
    }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get document first to check if it exists
    const document = await db.document.findUnique({
      where: { id: params.id }
    })

    if (!document) {
      return NextResponse.json({ 
        error: 'Document not found' 
      }, { status: 404 })
    }

    // Delete document chunks first
    await db.documentChunk.deleteMany({
      where: { documentId: params.id }
    })

    // Delete document from database
    await db.document.delete({
      where: { id: params.id }
    })

    // Try to delete the file from filesystem
    try {
      const filePath = path.join(process.cwd(), 'uploads', document.filename)
      await unlink(filePath)
    } catch (fileError) {
      console.warn('Could not delete file from filesystem:', fileError)
      // Don't fail the operation if file deletion fails
    }

    return NextResponse.json({ 
      message: 'Document deleted successfully',
      documentId: params.id
    })
  } catch (error) {
    console.error('Error deleting document:', error)
    return NextResponse.json({ 
      error: 'Failed to delete document' 
    }, { status: 500 })
  }
}