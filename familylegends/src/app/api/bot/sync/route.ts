import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
        const identifier = session.user?.id || ip;
        const { allowed, resetInMs } = await checkRateLimit(`sync:${identifier}`, { maxRequests: 10, windowMs: 60000 });
        if (!allowed) return rateLimitResponse(resetInMs);

        const BOT_URL = process.env.BOT_INTERNAL_URL || "http://localhost:8080";
        const BOT_SECRET = process.env.BOT_CONTROL_SECRET;
        const GUILD_ID = process.env.GUILD_ID || process.env.NEXT_PUBLIC_GUILD_ID;

        if (!BOT_SECRET || !GUILD_ID) {
            return NextResponse.json({ error: 'Bot communication not configured' }, { status: 500 });
        }

        const response = await fetch(`${BOT_URL}/control`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-bot-secret': BOT_SECRET
            },
            body: JSON.stringify({
                type: 'CONFIG_UPDATE',
                guildId: GUILD_ID
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            return NextResponse.json({ error: errorData.message || 'Failed to sync with bot' }, { status: response.status });
        }

        return NextResponse.json({ success: true, message: 'Sync signal sent to bot' });
    } catch (error: any) {
        console.error('Sync Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
