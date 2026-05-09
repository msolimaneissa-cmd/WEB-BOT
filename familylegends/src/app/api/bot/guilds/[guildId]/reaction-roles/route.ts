import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { connectBotDB } from '@/lib/bot-mongodb';
import { Schema, model, models } from 'mongoose';
import { checkApiAuth } from '@/lib/api-auth';

// Define local schema if not in bot-schemas yet or import it
const reactionRoleSchema = new Schema({
  guildId: { type: String, required: true },
  messageId: { type: String, required: true },
  channelId: { type: String, required: true },
  title: { type: String },
  description: { type: String },
  roles: [{ roleId: String, label: String, emoji: String, style: String }]
}, { timestamps: true });

const ReactionRoleModel = models.ReactionRole || model('ReactionRole', reactionRoleSchema);

/**
 * @api {GET} /api/bot/guilds/[guildId]/reaction-roles
 * @description جلب قائمة رسائل الرتب بالتفاعل.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ guildId: string }> }
) {
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

    // التحقق من صلاحيات المشرف
    const ADMIN_IDS = (process.env.ADMIN_DISCORD_IDS || '').split(',').map(id => id.trim()).filter(Boolean);
    if (ADMIN_IDS.length === 0 || !ADMIN_IDS.includes(token.sub as string)) {
      return NextResponse.json(
        { success: false, error: 'ممنوع — صلاحيات المشرف مطلوبة' },
        { status: 403 }
      );
    }

    const { guildId } = await params;
    await connectBotDB();
    const roles = await ReactionRoleModel.find({ guildId }).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, reactionRoles: roles });
  } catch (error) {
    console.error('ReactionRoles GET Error:', error);
    return NextResponse.json({ success: false, error: 'حدث خطأ داخلي في الخادم' }, { status: 500 });
  }
}

/**
 * @api {POST} /api/bot/guilds/[guildId]/reaction-roles
 * @description إنشاء رسالة رتب بالتفاعل جديدة وإرسالها للسيرفر.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ guildId: string }> }
) {
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

    // التحقق من صلاحيات المشرف
    const ADMIN_IDS = (process.env.ADMIN_DISCORD_IDS || '').split(',').map(id => id.trim()).filter(Boolean);
    if (ADMIN_IDS.length === 0 || !ADMIN_IDS.includes(token.sub as string)) {
      return NextResponse.json(
        { success: false, error: 'ممنوع — صلاحيات المشرف مطلوبة' },
        { status: 403 }
      );
    }

    const { guildId } = await params;
    const body = await req.json();
    const { channelId, title, description, roles } = body;

    // Verify bot secret from header (not body)
    const botSecret = req.headers.get('x-bot-secret');
    const BOT_URL = process.env.BOT_INTERNAL_URL || 'http://localhost:8080';
    const BOT_SECRET = (process.env as any)['BOT_CONTROL_SECRET'];

    // إرسال طلب للبوت لإنشاء الرسالة
    const response = await fetch(`${BOT_URL}/control`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-bot-secret': BOT_SECRET || '',
      },
      body: JSON.stringify({
        guildId,
        channelId,
        type: 'CREATE_REACTION_ROLES',
        data: { title, description, roles },
      }),
    });

    if (!response.ok) {
      return NextResponse.json({ success: false, error: 'فشل في التواصل مع البوت' }, { status: 502 });
    }

    const result = await response.json();
    return NextResponse.json({ success: true, messageId: result.messageId });
  } catch (error) {
    console.error('ReactionRoles POST Error:', error);
    return NextResponse.json({ success: false, error: 'حدث خطأ داخلي في الخادم' }, { status: 500 });
  }
}
