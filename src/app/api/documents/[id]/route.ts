import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { del } from '@vercel/blob';

// This function handles GET requests to fetch a single document
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } } // Correct Next.js 13+ App Router signature
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

// This function handles PATCH requests to update a document's status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } } // Correct signature
) {
  try {
    const { status } = await request.json()

    // Validate the status using the enum type from your Prisma schema
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

// This function handles DELETE requests to remove a document
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } } // Correct signature
) {
  try {
    const document = await db.document.findUnique({
      where: { id: params.id }
    })

    if (!document) {
      return NextResponse.json({ 
        error: 'Document not found' 
      }, { status: 404 })
    }

    // Delete from Vercel Blob storage first
    if (document.filePath) {
        try {
            await del(document.filePath);
        } catch (fileError) {
            console.warn('Could not delete file from Blob storage:', fileError);
        }
    }

    // Since your Prisma schema uses onDelete: Cascade, deleting the document
    // will automatically delete its related chunks and messages.
    await db.document.delete({
      where: { id: params.id }
    })

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