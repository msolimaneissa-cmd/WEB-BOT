import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { connectToDatabase } from '@/lib/bot-mongodb';
import { UserModel, WarningModel, TicketModel, ModActionModel } from '@/lib/bot-schemas';

/**
 * @api {GET} /api/bot/guilds/[guildId]/stats
 * @description جلب إحصائيات السيرفر (عدد الأعضاء، الرسائل، التذاكر، الإجراءات الإدارية).
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ guildId: string }> }
) {
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

    const { guildId } = await params;
    await connectToDatabase();

    // 1. عدد المستخدمين المسجلين في البوت لهذا السيرفر
    const totalUsers = await UserModel.countDocuments({ guildId });

    // 2. إجمالي الرسائل المرسلة
    const users = await UserModel.find({ guildId }, 'totalMessages xp level');
    const totalMessages = users.reduce((acc, user) => acc + (user.totalMessages || 0), 0);
    const totalXP = users.reduce((acc, user) => acc + (user.xp || 0), 0);

    // 3. إجمالي التحذيرات
    const totalWarnings = await WarningModel.countDocuments({ guildId });

    // 4. إجمالي التذاكر (المفتوحة والمغلقة)
    const totalTickets = await TicketModel.countDocuments({ guildId });
    const openTickets = await TicketModel.countDocuments({ guildId, status: 'open' });

    // 5. إجمالي الإجراءات الإدارية (الحظر المؤقت)
    const totalModActions = await ModActionModel.countDocuments({ guildId });

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        totalMessages,
        totalXP,
        totalWarnings,
        totalTickets,
        openTickets,
        totalModActions,
      }
    });
  } catch (error) {
    console.error('Stats API Error:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ داخلي في الخادم' },
      { status: 500 }
    );
  }
}
