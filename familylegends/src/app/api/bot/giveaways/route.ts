import { NextRequest, NextResponse } from 'next/server';
import { connectBotDB } from '@/lib/bot-mongodb';
import { GiveawayModel } from '@/lib/bot-schemas';
import { getToken } from 'next-auth/jwt';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';

export async function GET(req: NextRequest) {
  const guildId = (process.env.GUILD_ID || process.env.NEXT_PUBLIC_GUILD_ID as string);
  const token = await getToken({ req });

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check admin role
  const ADMIN_IDS = (process.env.ADMIN_DISCORD_IDS || '').split(',').filter(Boolean);
  if (ADMIN_IDS.length === 0 || !token.sub || !ADMIN_IDS.includes(token.sub)) {
    return NextResponse.json(
      { error: 'غير مصرح — صلاحيات المدير مطلوبة' },
      { status: 403 }
    );
  }

  try {
    await connectBotDB();
    
    const { searchParams } = new URL(req.url);
    const ended = searchParams.get('ended') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

    const query: any = { guildId };
    if (searchParams.has('ended')) {
      query.ended = ended;
    }

    const total = await GiveawayModel.countDocuments(query);
    const giveaways = await GiveawayModel.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return NextResponse.json({
      giveaways,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error fetching giveaways:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const guildId = (process.env.GUILD_ID || process.env.NEXT_PUBLIC_GUILD_ID as string);
  const token = await getToken({ req });

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check admin role
  const ADMIN_IDS = (process.env.ADMIN_DISCORD_IDS || '').split(',').filter(Boolean);
  if (ADMIN_IDS.length === 0 || !token.sub || !ADMIN_IDS.includes(token.sub)) {
    return NextResponse.json(
      { error: 'غير مصرح — صلاحيات المدير مطلوبة' },
      { status: 403 }
    );
  }

  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  const { allowed, resetInMs } = await checkRateLimit(`giveaways:${token.sub || ip}`, { maxRequests: 10, windowMs: 60000 });
  if (!allowed) return rateLimitResponse(resetInMs);

  try {
    const body = await req.json();
    await connectBotDB();
    
    // Whitelist allowed fields only (prevent mass assignment)
    const allowedFields = ['prize', 'description', 'duration', 'winnersCount', 'channelId', 'requiredRole'];
    const safeBody: Record<string, any> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        safeBody[field] = body[field];
      }
    }
    
    const giveaway = await GiveawayModel.create({
      ...safeBody,
      guildId,
      hostId: token.sub,
      hostTag: token.name,
      ended: false,
    });

    return NextResponse.json(giveaway);
  } catch (error) {
    console.error('Error creating giveaway:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
