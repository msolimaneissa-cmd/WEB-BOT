import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { connectBotDB } from '@/lib/bot-mongodb';
import { AutoResponderModel } from '@/lib/bot-schemas';
import { checkApiAuth } from '@/lib/api-auth';
import { handleApiError } from '@/lib/utils';

/**
 * @api {GET} /api/bot/guilds/[guildId]/auto-responder
 * @description جلب جميع الردود التلقائية للسيرفر.
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

    const { guildId } = await params;
    await connectBotDB();

    const responders = await AutoResponderModel.find({ guildId }).sort({ createdAt: -1 });

    return NextResponse.json({ success: true, responders });
  } catch (error) {
    console.error('AutoResponder GET Error:', error);
    return NextResponse.json({ success: false, error: 'حدث خطأ داخلي في الخادم' }, { status: 500 });
  }
}

/**
 * @api {POST} /api/bot/guilds/[guildId]/auto-responder
 * @description إضافة أو تحديث رد تلقائي.
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

    const { guildId } = await params;
    const { trigger, response, exact } = await req.json();

    if (!trigger || !response) {
      return NextResponse.json({ success: false, error: 'Trigger and response are required' }, { status: 400 });
    }

    await connectBotDB();

    const updated = await AutoResponderModel.findOneAndUpdate(
      { guildId, trigger },
      { response, exact },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true, responder: updated });
  } catch (error) {
    console.error('AutoResponder POST Error:', error);
    return NextResponse.json({ success: false, error: 'حدث خطأ داخلي في الخادم' }, { status: 500 });
  }
}

/**
 * @api {DELETE} /api/bot/guilds/[guildId]/auto-responder
 * @description حذف رد تلقائي.
 */
export async function DELETE(
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

    const { guildId } = await params;
    const { searchParams } = new URL(req.url);
    const trigger = searchParams.get('trigger');

    if (!trigger) {
      return NextResponse.json({ success: false, error: 'Trigger is required' }, { status: 400 });
    }

    await connectBotDB();

    const deleted = await AutoResponderModel.deleteOne({ guildId, trigger });

    if (deleted.deletedCount === 0) {
      return NextResponse.json({ success: false, error: 'Responder not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Responder deleted successfully' });
  } catch (error) {
    console.error('AutoResponder DELETE Error:', error);
    return NextResponse.json({ success: false, error: 'حدث خطأ داخلي في الخادم' }, { status: 500 });
  }
}
