import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { del } from '@vercel/blob'; // 1. Import 'del' from Vercel Blob

// No changes needed for the GET function, it's already correct.
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

// No changes needed for the PATCH function, it's already correct.
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


// --- START OF UPDATED DELETE FUNCTION ---
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get document first to find its Blob storage URL
    const document = await db.document.findUnique({
      where: { id: params.id }
    })

    if (!document) {
      return NextResponse.json({ 
        error: 'Document not found' 
      }, { status: 404 })
    }

    // 2. Delete the file from Vercel Blob storage using its URL
    if (document.filePath) {
        try {
            await del(document.filePath);
        } catch (fileError) {
            console.warn('Could not delete file from Blob storage:', fileError);
            // Don't fail the operation if Blob deletion fails, just log it
        }
    }

    // Delete document chunks from the database
    await db.documentChunk.deleteMany({
      where: { documentId: params.id }
    })

    // Delete the main document record from the database
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
// --- END OF UPDATED DELETE FUNCTION ---