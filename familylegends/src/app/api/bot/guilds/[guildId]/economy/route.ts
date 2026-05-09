import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { connectBotDB } from '@/lib/bot-mongodb';
import { UserModel, GuildModel } from '@/lib/bot-schemas';

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

    // التحقق من صلاحيات المشرف
    const ADMIN_IDS = (process.env.ADMIN_DISCORD_IDS || '').split(',').map(id => id.trim()).filter(Boolean);
    if (ADMIN_IDS.length === 0 || !ADMIN_IDS.includes(token.sub as string)) {
      return NextResponse.json(
        { error: 'ممنوع — صلاحيات المشرف مطلوبة' },
        { status: 403 }
      );
    }

    await connectBotDB();
    const { guildId } = await params;

    const [topUsers, guild, totalCounts] = await Promise.all([
      // أعلى 10 مستخدمين فقط للوحة المتصدرين
      UserModel.find({ guildId }).sort({ balance: -1 }).limit(10).lean(),
      GuildModel.findOne({ guildId }).lean(),
      // حساب الإجماليات من جميع المستخدمين باستخدام التجميع
      UserModel.aggregate([
        { $match: { guildId } },
        {
          $group: {
            _id: null,
            totalBalance: { $sum: { $ifNull: ['$balance', 0] } },
            totalBank: { $sum: { $ifNull: ['$bank', 0] } },
            totalMessages: { $sum: { $ifNull: ['$totalMessages', 0] } },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const totalUsers = totalCounts.length > 0 ? totalCounts[0].count : 0;
    const totalBalance = totalCounts.length > 0 ? totalCounts[0].totalBalance : 0;
    const totalBank = totalCounts.length > 0 ? totalCounts[0].totalBank : 0;
    const totalMessages = totalCounts.length > 0 ? totalCounts[0].totalMessages : 0;

    return NextResponse.json({
      leaderboard: topUsers.map((u, i) => ({
        rank: i + 1,
        userId: u.userId,
        balance: u.balance || 0,
        bank: u.bank || 0,
        level: u.level || 1,
        xp: u.xp || 0,
        totalMessages: u.totalMessages || 0,
        streak: u.streak || 0,
      })),
      totalUsers,
      totalBalance,
      totalBank,
      totalMessages,
      economy: (guild as any)?.economy || null,
    });
  } catch (error) {
    console.error('Get economy stats error:', error);
    return NextResponse.json(
      { error: 'فشل في جلب بيانات الاقتصاد' },
      { status: 500 }
    );
  }
}
