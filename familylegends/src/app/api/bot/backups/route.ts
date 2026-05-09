import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { connectBotDB } from '@/lib/bot-mongodb';
import { Schema, model, models } from 'mongoose';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';

// Define local schema if not in bot-schemas yet
const backupSchema = new Schema({
  backupId: { type: String, required: true },
  guildId: { type: String, required: true },
  creatorId: { type: String, required: true },
  guildName: String,
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true, strict: true });

const BackupModel = models.Backup || model('Backup', backupSchema);

/**
 * @api {GET} /api/bot/guilds/[guildId]/backups
 * @description جلب قائمة النسخ الاحتياطية للسيرفر.
 */
export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      return NextResponse.json(
        { error: 'غير مصرح — تسجيل الدخول مطلوب' },
        { status: 401 }
      );
    }

    // Check admin role
    const ADMIN_IDS = (process.env.ADMIN_DISCORD_IDS || '').split(',').filter(Boolean);
    if (ADMIN_IDS.length === 0 || !token.sub || !ADMIN_IDS.includes(token.sub)) {
      return NextResponse.json(
        { error: 'غير مصرح — صلاحيات المدير مطلوبة' },
        { status: 403 }
      );
    }

    const guildId = (process.env.GUILD_ID || process.env.NEXT_PUBLIC_GUILD_ID as string);
    await connectBotDB();
    const backups = await BackupModel.find({ guildId }).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, backups });
  } catch (error) {
    console.error('Backups GET Error:', error);
    return NextResponse.json({ success: false, error: 'حدث خطأ داخلي في الخادم' }, { status: 500 });
  }
}

/**
 * @api {POST} /api/bot/guilds/[guildId]/backups
 * @description طلب إنشاء نسخة احتياطية جديدة عبر البوت.
 */
export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      return NextResponse.json(
        { error: 'غير مصرح — تسجيل الدخول مطلوب' },
        { status: 401 }
      );
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
    const { allowed, resetInMs } = await checkRateLimit(`backups:${token.sub || ip}`, { maxRequests: 5, windowMs: 60000 });
    if (!allowed) return rateLimitResponse(resetInMs);

    const guildId = (process.env.GUILD_ID || process.env.NEXT_PUBLIC_GUILD_ID as string);
    const { creatorId } = await req.json();

    const BOT_URL = process.env.BOT_INTERNAL_URL || 'http://localhost:8080';
    const BOT_SECRET = (process.env as any)['BOT_CONTROL_SECRET'];

    // إرسال طلب للبوت لإنشاء النسخة الاحتياطية — secret in header, not body
    const response = await fetch(`${BOT_URL}/control`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-bot-secret': BOT_SECRET || '',
      },
      body: JSON.stringify({
        guildId,
        type: 'CREATE_BACKUP',
        data: { creatorId },
      }),
    });

    if (!response.ok) {
      return NextResponse.json({ success: false, error: 'فشل في التواصل مع البوت' }, { status: 502 });
    }

    const result = await response.json();
    return NextResponse.json({ success: true, backup: result.backup });
  } catch (error) {
    console.error('Backups POST Error:', error);
    return NextResponse.json({ success: false, error: 'حدث خطأ داخلي في الخادم' }, { status: 500 });
  }
}
