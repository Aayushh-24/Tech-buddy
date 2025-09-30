import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // This new code safely gets real stats directly from your database
    const documentCount = await db.document.count();
    const chunkCount = await db.documentChunk.count();

    const stats = {
      documents: documentCount,
      chunks: chunkCount,
      embeddings: 0, // This is a placeholder
    };

    return NextResponse.json(stats);

  } catch (error) {
    console.error("Error in /api/rag/stats:", error);
    return NextResponse.json({ error: "Failed to get RAG stats" }, { status: 500 });
  }
}