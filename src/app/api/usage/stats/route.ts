import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const userId = 'default-user'; // Hardcode the user ID to match the rest of the app

    // Find the user, or create them if they don't exist yet.
    // This makes the route resilient and prevents crashes.
    let user = await db.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      user = await db.user.create({
        data: {
          id: userId,
          email: 'default@example.com',
          name: 'Default User',
        },
      });
    }

    // Return the usage stats for the default user
    return NextResponse.json({
      documentsUploaded: user.documentsUploaded,
      questionsAsked: user.questionsAsked,
      tokensUsed: user.tokensUsed,
    });

  } catch (error) {
    console.error("Error in /api/usage/stats:", error);
    return NextResponse.json({ error: "Failed to get usage stats" }, { status: 500 });
  }
}