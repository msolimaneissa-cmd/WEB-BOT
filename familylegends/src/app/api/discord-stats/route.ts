import { NextRequest, NextResponse } from 'next/server';
import { connectBotDB } from '@/lib/bot-mongodb';
import { UserModel } from '@/lib/bot-schemas';
import { adminDb } from '@/lib/firebase-admin';
import { withTiming } from '@/lib/api-timing';

async function handleGET(request: NextRequest) {
  // Allow public access for stats, as they are displayed on the landing page
  // We only check for API auth if we want to expose more sensitive data
  
  try {
    // Try to get real stats from Firestore first (updated by bot webhook)
    try {
      const db = adminDb();
      if (!db) throw new Error('Firebase Admin not configured');
      const statsDoc = await db.collection('settings').doc('discord-stats').get();
      if (statsDoc.exists) {
        const data = statsDoc.data();
        return NextResponse.json({
          onlineMembers: data?.onlineMembers || 0,
          totalMembers: data?.totalMembers || 0,
          boostCount: data?.boostCount || 0,
          channelCount: data?.channelCount || 0,
          roleCount: data?.roleCount || 0,
          lastUpdated: data?.lastUpdated || Date.now(),
        });
      }
    } catch {
      // Firestore not available, fall back to MongoDB
    }

    // Fallback: Get total members from MongoDB
    const conn = await connectBotDB();
    if (!conn) {
      return NextResponse.json(
        { error: 'Database not connected' },
        { status: 503 }
      );
    }

    const totalMembers = await UserModel.countDocuments();

    return NextResponse.json({
      onlineMembers: 0,
      totalMembers,
      boostCount: 0,
      channelCount: 0,
      roleCount: 0,
      lastUpdated: Date.now(),
    });
  } catch (error) {
    console.error('Discord stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch discord stats' },
      { status: 500 }
    );
  }
}

export const GET = withTiming(handleGET, 'discord-stats/GET');
