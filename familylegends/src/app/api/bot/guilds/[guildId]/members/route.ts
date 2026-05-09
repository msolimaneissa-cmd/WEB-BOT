import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { connectBotDB } from '@/lib/bot-mongodb';
import { UserModel } from '@/lib/bot-schemas';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ guildId: string }> }
) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      return NextResponse.json(
        { error: 'غير مصرح — تسجيل الدخول مطلوب' },
        { status: 401 }
      );
    }

    await connectBotDB();
    const { guildId } = await params;

    const members = await UserModel.find({ guildId })
      .sort({ balance: -1 })
      .lean();

    return NextResponse.json({ members });
  } catch (error) {
    console.error('Get members error:', error);
    return NextResponse.json(
      { error: 'فشل في جلب بيانات الأعضاء' },
      { status: 500 }
    );
  }
}
