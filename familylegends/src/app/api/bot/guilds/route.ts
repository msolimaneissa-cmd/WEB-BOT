import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { connectBotDB } from '@/lib/bot-mongodb';
import { GuildModel, UserModel } from '@/lib/bot-schemas';

export async function GET(request: NextRequest) {
    const defaultIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const { allowed, resetInMs } = await checkRateLimit(`api-${request.nextUrl?.pathname || 'unknown'}:${defaultIp}`, { maxRequests: 60, windowMs: 60000 });
    if (!allowed) return rateLimitResponse(resetInMs);

  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      return NextResponse.json(
        { error: 'غير مصرح — تسجيل الدخول مطلوب' },
        { status: 401 }
      );
    }

    await connectBotDB();

    const guildId = process.env.GUILD_ID;
    const query = guildId ? { guildId } : {};
    const guilds = await GuildModel.find(query).lean();

    const guildsWithStats = await Promise.all(
      guilds.map(async (guild) => {
        const memberCount = await UserModel.countDocuments({ guildId: guild.guildId }).lean();
        return {
          guildId: guild.guildId,
          mod: guild.mod,
          welcome: guild.welcome,
          antiSpam: guild.antiSpam,
          antiLink: guild.antiLink,
          economy: guild.economy,
          music: guild.music,
          memberCount,
        };
      })
    );

    return NextResponse.json({ guilds: guildsWithStats });
  } catch (error) {
    console.error('Get guilds error:', error);
    return NextResponse.json(
      { error: 'فشل في جلب بيانات السيرفرات' },
      { status: 500 }
    );
  }
}
