import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { connectBotDB } from '@/lib/bot-mongodb';
import { WarningModel, GuildModel } from '@/lib/bot-schemas';

// GET /api/bot/guilds/[guildId]/warnings?userId=xxx — Get warnings for a user or all
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

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (userId) {
      const warnings = await WarningModel.find({ userId, guildId })
        .sort({ createdAt: -1 })
        .lean();

      const count = await WarningModel.countDocuments({ userId, guildId });

      return NextResponse.json({
        userId,
        guildId,
        count,
        maxWarnings: (await GuildModel.findOne({ guildId }))?.mod?.maxWarnings || 3,
        warnings,
      });
    }

    // Get all warnings for the guild
    const warnings = await WarningModel.find({ guildId })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    const stats = await WarningModel.aggregate([
      { $match: { guildId } },
      { $group: { _id: '$userId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    return NextResponse.json({
      guildId,
      total: await WarningModel.countDocuments({ guildId }),
      topUsers: stats,
      recent: warnings,
    });
  } catch (error) {
    console.error('Get warnings error:', error);
    return NextResponse.json(
      { error: 'فشل في جلب التحذيرات' },
      { status: 500 }
    );
  }
}

// DELETE /api/bot/guilds/[guildId]/warnings?userId=xxx — Clear warnings for a user
export async function DELETE(
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

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'يجب تحديد معرف العضو' },
        { status: 400 }
      );
    }

    const result = await WarningModel.deleteMany({ userId, guildId });

    return NextResponse.json({
      success: true,
      deletedCount: result.deletedCount,
      message: `تم مسح ${result.deletedCount} تحذير من العضو ${userId}`,
    });
  } catch (error) {
    console.error('Delete warnings error:', error);
    return NextResponse.json(
      { error: 'فشل في مسح التحذيرات' },
      { status: 500 }
    );
  }
}
