import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { connectBotDB } from '@/lib/bot-mongodb';
import { GuildModel } from '@/lib/bot-schemas';
import { checkApiAuth } from '@/lib/api-auth';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';

/**
 * @api {GET} /api/bot/guilds/[guildId]/notifications
 * @description جلب إعدادات الإشعارات وقائمة الستريمرز.
 */
export async function GET(req: NextRequest) {
  if (!(await checkApiAuth(req))) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      return NextResponse.json(
        { error: 'غير مصرح — تسجيل الدخول مطلوب' },
        { status: 401 }
      );
    }

    const guildId = (process.env.GUILD_ID || process.env.NEXT_PUBLIC_GUILD_ID as string);
    await connectBotDB();

    const guild = await GuildModel.findOne({ guildId }, 'website').lean();

    return NextResponse.json({
      success: true,
      streamDetection: (guild as any)?.website?.streamDetection || { enabled: false, channelId: '', checkInterval: 60 },
      streamers: (guild as any)?.website?.streamers || []
    });
  } catch (error) {
    console.error('Notifications GET Error:', error);
    return NextResponse.json({ success: false, error: 'حدث خطأ داخلي في الخادم' }, { status: 500 });
  }
}

/**
 * @api {POST} /api/bot/guilds/[guildId]/notifications
 * @description إضافة ستريمر جديد أو تحديث إعدادات الكشف.
 */
export async function POST(req: NextRequest) {
  if (!(await checkApiAuth(req))) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      return NextResponse.json(
        { error: 'غير مصرح — تسجيل الدخول مطلوب' },
        { status: 401 }
      );
    }

    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const { allowed, resetInMs } = await checkRateLimit(`notifications:${token.sub || ip}`, { maxRequests: 20, windowMs: 60000 });
    if (!allowed) return rateLimitResponse(resetInMs);

    const guildId = (process.env.GUILD_ID || process.env.NEXT_PUBLIC_GUILD_ID as string);
    const body = await req.json();
    const { streamer, streamDetection } = body;

    await connectBotDB();

    let update = {};
    if (streamer) {
      // إضافة ستريمر جديد
      update = { $push: { 'website.streamers': streamer } };
    } else if (streamDetection) {
      // تحديث إعدادات الكشف
      update = { $set: { 'website.streamDetection': streamDetection } };
    }

    const updated = await GuildModel.findOneAndUpdate(
      { guildId },
      update,
      { new: true, upsert: true }
    );

    return NextResponse.json({ success: true, guild: updated });
  } catch (error) {
    console.error('Notifications POST Error:', error);
    return NextResponse.json({ success: false, error: 'حدث خطأ داخلي في الخادم' }, { status: 500 });
  }
}

/**
 * @api {DELETE} /api/bot/guilds/[guildId]/notifications
 * @description حذف ستريمر من القائمة.
 */
export async function DELETE(req: NextRequest) {
  if (!(await checkApiAuth(req))) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      return NextResponse.json(
        { error: 'غير مصرح — تسجيل الدخول مطلوب' },
        { status: 401 }
      );
    }

    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const { allowed, resetInMs } = await checkRateLimit(`notifications-delete:${token.sub || ip}`, { maxRequests: 20, windowMs: 60000 });
    if (!allowed) return rateLimitResponse(resetInMs);

    const guildId = (process.env.GUILD_ID || process.env.NEXT_PUBLIC_GUILD_ID as string);
    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username');
    const platform = searchParams.get('platform');

    if (!username || !platform) {
      return NextResponse.json({ success: false, error: 'Username and platform are required' }, { status: 400 });
    }

    await connectBotDB();

    const updated = await GuildModel.findOneAndUpdate(
      { guildId },
      { $pull: { 'website.streamers': { username, platform } } },
      { new: true }
    );

    return NextResponse.json({ success: true, streamers: (updated as any)?.website?.streamers || [] });
  } catch (error) {
    console.error('Notifications DELETE Error:', error);
    return NextResponse.json({ success: false, error: 'حدث خطأ داخلي في الخادم' }, { status: 500 });
  }
}
