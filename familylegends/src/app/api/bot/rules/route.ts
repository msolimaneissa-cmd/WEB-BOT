/**
 * API route for managing server rules
 * @endpoint /api/bot/rules
 * @methods GET, POST, DELETE
 * @access Protected (requires admin authentication)
 * @description Handles CRUD operations for guild-specific moderation rules
 *import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { connectBotDB } from '@/lib/bot-mongodb';
import { RuleModel } from '@/lib/bot-schemas';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { withTiming } from '@/lib/api-timing';

// GET: Fetch rules for a specific guild
$functionHeader`nasync function handleGET(
  request: NextRequest
) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const ADMIN_IDS = (process.env.ADMIN_DISCORD_IDS || '').split(',').map(id => id.trim()).filter(Boolean);
    if (!ADMIN_IDS.includes(token.sub as string)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await connectBotDB();
    const guildId = (process.env.GUILD_ID || process.env.NEXT_PUBLIC_GUILD_ID as string);

    const rules = await RuleModel.find({ guildId }).sort({ order: 1 }).lean();
    return NextResponse.json({ rules });
  } catch (error) {
    console.error('Get rules error:', error);
    return NextResponse.json({ error: 'Failed to fetch rules' }, { status: 500 });
  }
}

// POST: Add a new rule
async function handlePOST(
  request: NextRequest
) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const { allowed, resetInMs } = await checkRateLimit(`rules:${token.sub || ip}`, { maxRequests: 20, windowMs: 60000 });
    if (!allowed) return rateLimitResponse(resetInMs);

    const guildId = (process.env.GUILD_ID || process.env.NEXT_PUBLIC_GUILD_ID as string);
    const { title, description, order } = await request.json();

    await connectBotDB();
    const rule = await RuleModel.create({
      guildId,
      title,
      description,
      order: order || 0
    });

    return NextResponse.json(rule);
  } catch (error) {
    console.error('Add rule error:', error);
    return NextResponse.json({ error: 'Failed to add rule' }, { status: 500 });
  }
}

// PUT: Update rules order or bulk update (Optional for now, we'll use individual updates if needed)
// For simplicity, let's keep POST/DELETE and a single PUT for individual rule edit if we need it.
// Or we can use a single DELETE?

async function handleDELETE(
  request: NextRequest
) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const { allowed, resetInMs } = await checkRateLimit(`rules-delete:${token.sub || ip}`, { maxRequests: 20, windowMs: 60000 });
    if (!allowed) return rateLimitResponse(resetInMs);

    const { searchParams } = new URL(request.url);
    const ruleId = searchParams.get('id');
    if (!ruleId) return NextResponse.json({ error: 'Rule ID required' }, { status: 400 });

    await connectBotDB();
    await RuleModel.findByIdAndDelete(ruleId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete rule error:', error);
    return NextResponse.json({ error: 'Failed to delete rule' }, { status: 500 });
  }
}

export const GET = withTiming(handleGET, 'bot-rules/GET');
export const POST = withTiming(handlePOST, 'bot-rules/POST');
export const DELETE = withTiming(handleDELETE, 'bot-rules/DELETE');


