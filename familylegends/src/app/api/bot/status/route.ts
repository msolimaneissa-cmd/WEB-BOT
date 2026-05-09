import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { NextResponse } from 'next/server';
import { connectBotDB } from '@/lib/bot-mongodb';
import { GuildModel, UserModel } from '@/lib/bot-schemas';

export async function GET() {
  try {
    const conn = await connectBotDB();

    if (!conn) {
      return NextResponse.json({
        online: false,
        database: 'disconnected',
        guildCount: 0,
        userCount: 0,
        uptime: 0,
        message: 'لم يتم تعيين MONGODB_URI',
      });
    }

    const dbState = conn.connection.readyState;
    const isConnected = dbState === 1;

    let guildCount = 0;
    let userCount = 0;
    let totalEconomy = 0;
    let totalMessages = 0;
    const commandCount = 8; // عدد فئات الأوامر في البوت
    let guilds: { guildId: string; name?: string; memberCount?: number }[] = [];

    if (isConnected) {
      guildCount = await GuildModel.countDocuments().lean();
      userCount = await UserModel.countDocuments().lean();

      // حساب إجمالي الاقتصاد عبر كل السيرفرات
      const economyAgg = await UserModel.aggregate([
        {
          $group: {
            _id: null,
            totalBalance: { $sum: { $ifNull: ['$balance', 0] } },
            totalBank: { $sum: { $ifNull: ['$bank', 0] } },
            totalMessages: { $sum: { $ifNull: ['$totalMessages', 0] } },
          },
        },
      ]);

      if (economyAgg.length > 0) {
        totalEconomy = economyAgg[0].totalBalance + economyAgg[0].totalBank;
        totalMessages = economyAgg[0].totalMessages;
      }

      // جلب بيانات السيرفرات
      const guildsData = await GuildModel.find().lean().select('guildId');
      guilds = guildsData.map((g) => ({
        guildId: g.guildId,
      }));
    }

    return NextResponse.json({
      online: true,
      database: isConnected ? 'connected' : 'connecting',
      guildCount,
      userCount,
      uptime: process.uptime(),
      totalEconomy,
      totalMessages,
      commandCount,
      guilds,
    });
  } catch (error) {
    console.error('Bot status error:', error);
    return NextResponse.json({
      online: false,
      database: 'error',
      guildCount: 0,
      userCount: 0,
      uptime: 0,
      totalEconomy: 0,
      totalMessages: 0,
      commandCount: 0,
      guilds: [],
      error: error instanceof Error ? error.message : 'خطأ غير معروف',
    }, { status: 500 });
  }
}
