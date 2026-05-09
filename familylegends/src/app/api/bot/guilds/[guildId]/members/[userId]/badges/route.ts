import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { connectBotDB } from '@/lib/bot-mongodb';
import { UserModel } from '@/lib/bot-schemas';
import { checkApiAuth } from '@/lib/api-auth';

/**
 * @api {POST} /api/bot/guilds/[guildId]/members/[userId]/badges
 * @description منح وسام جديد لمستخدم.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ guildId: string, userId: string }> }
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

    const { guildId, userId } = await params;
    const { badgeId, name, emoji } = await req.json();

    if (!badgeId || !name) {
      return NextResponse.json({ success: false, error: 'Badge ID and Name are required' }, { status: 400 });
    }

    await connectBotDB();

    const updated = await UserModel.findOneAndUpdate(
      { guildId, userId },
      { $push: { badges: { badgeId, name, emoji, awardedAt: new Date() } } },
      { new: true, upsert: true }
    );

    return NextResponse.json({ success: true, user: updated });
  } catch (error) {
    console.error('Badges POST Error:', error);
    return NextResponse.json({ success: false, error: 'حدث خطأ داخلي في الخادم' }, { status: 500 });
  }
}

/**
 * @api {DELETE} /api/bot/guilds/[guildId]/members/[userId]/badges
 * @description سحب وسام من مستخدم.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ guildId: string, userId: string }> }
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

    const { guildId, userId } = await params;
    const { searchParams } = new URL(req.url);
    const badgeId = searchParams.get('badgeId');

    if (!badgeId) {
      return NextResponse.json({ success: false, error: 'Badge ID is required' }, { status: 400 });
    }

    await connectBotDB();

    const updated = await UserModel.findOneAndUpdate(
      { guildId, userId },
      { $pull: { badges: { badgeId } } },
      { new: true }
    );

    return NextResponse.json({ success: true, user: updated });
  } catch (error) {
    console.error('Badges DELETE Error:', error);
    return NextResponse.json({ success: false, error: 'حدث خطأ داخلي في الخادم' }, { status: 500 });
  }
}
