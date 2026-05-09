import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { connectToDatabase } from '@/lib/bot-mongodb';
import { GuildModel } from '@/lib/bot-schemas';
import { checkApiAuth } from '@/lib/api-auth';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';

/**
 * @api {POST} /api/bot/guilds/[guildId]/embed
 * @description إرسال Embed مخصص إلى قناة معينة من خلال لوحة التحكم.
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
    const { allowed, resetInMs } = await checkRateLimit(`embed:${token.sub || ip}`, { maxRequests: 20, windowMs: 60000 });
    if (!allowed) return rateLimitResponse(resetInMs);

    const guildId = (process.env.GUILD_ID || process.env.NEXT_PUBLIC_GUILD_ID as string);
    const body = await req.json();
    const { channelId, embed, content } = body;

    if (!channelId || !embed) {
      return NextResponse.json({ success: false, error: 'Channel ID and Embed data are required' }, { status: 400 });
    }

    await connectToDatabase();
    const guildConfig = await GuildModel.findOne({ guildId });
    if (!guildConfig) {
      return NextResponse.json({ success: false, error: 'Guild not found' }, { status: 404 });
    }

    // هنا نقوم بإرسال الـ Embed عبر الـ Webhook الخاص بالبوت
    // Use x-bot-secret header instead of body for the secret
    const webhookUrl = process.env.BOT_CONTROL_WEBHOOK_URL;
    if (!webhookUrl) {
      return NextResponse.json({ success: false, error: 'Bot Control Webhook not configured' }, { status: 500 });
    }

    const botSecret = process.env.BOT_CONTROL_SECRET;

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-bot-secret': botSecret || '',
      },
      body: JSON.stringify({
        guildId,
        channelId,
        embed,
        content,
        type: 'SEND_EMBED',
      }),
    });

    if (!response.ok) {
      return NextResponse.json({ success: false, error: 'فشل في التواصل مع البوت' }, { status: 502 });
    }

    return NextResponse.json({ success: true, message: 'Embed sent successfully' });
  } catch (error) {
    console.error('Embed API Error:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ داخلي في الخادم' },
      { status: 500 }
    );
  }
}
