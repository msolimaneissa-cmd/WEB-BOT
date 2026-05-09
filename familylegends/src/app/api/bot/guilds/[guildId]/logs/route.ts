import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { NextRequest, NextResponse } from 'next/server';
import { connectBotDB } from '@/lib/bot-mongodb';
import { AuditLogModel } from '@/lib/bot-schemas';
import { getToken } from 'next-auth/jwt';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ guildId: string }> }
) {
  const { guildId } = await params;
  const token = await getToken({ req });

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // التحقق من صلاحيات المشرف
  const ADMIN_IDS = (process.env.ADMIN_DISCORD_IDS || '').split(',').map(id => id.trim()).filter(Boolean);
  if (ADMIN_IDS.length === 0 || !ADMIN_IDS.includes(token.sub as string)) {
    return NextResponse.json({ error: 'Forbidden — Admin access required' }, { status: 403 });
  }

  try {
    await connectBotDB();
    
    const { searchParams } = new URL(req.url);
    const eventType = searchParams.get('eventType');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

    const query: any = { guildId };
    if (eventType && eventType !== 'all') {
      query.eventType = eventType;
    }

    const total = await AuditLogModel.countDocuments(query);
    const logs = await AuditLogModel.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return NextResponse.json({
      logs,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error fetching logs:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
