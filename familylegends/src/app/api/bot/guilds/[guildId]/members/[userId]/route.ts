import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { connectBotDB } from '@/lib/bot-mongodb';
import { UserModel } from '@/lib/bot-schemas';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ guildId: string; userId: string }> }
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
    const { guildId, userId } = await params;

    const user = await UserModel.findOne({ guildId, userId }).lean();

    if (!user) {
      return NextResponse.json(
        { error: 'المستخدم غير موجود' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      userId: (user as any).userId,
      guildId: (user as any).guildId,
      balance: (user as any).balance || 0,
      bank: (user as any).bank || 0,
      level: (user as any).level || 1,
      xp: (user as any).xp || 0,
      totalMessages: (user as any).totalMessages || 0,
      streak: (user as any).streak || 0,
      lastDaily: (user as any).lastDaily || null,
      dailyCooldown: (user as any).dailyCooldown || null,
      workCooldown: (user as any).workCooldown || null,
      robCooldown: (user as any).robCooldown || null,
      inventory: (user as any).inventory || [],
    });
  } catch (error) {
    console.error('Get user details error:', error);
    return NextResponse.json(
      { error: 'فشل في جلب بيانات المستخدم' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ guildId: string; userId: string }> }
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

    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const { allowed, resetInMs } = await checkRateLimit(`member-update:${token.sub || ip}`, { maxRequests: 30, windowMs: 60000 });
    if (!allowed) return rateLimitResponse(resetInMs);

    await connectBotDB();
    const { guildId, userId } = await params;
    const body = await request.json();
    const { balance, bank, level, xp } = body;

    // Validate types
    const updateFields: Record<string, number> = {};
    if (typeof balance === 'number') updateFields.balance = Math.max(0, balance);
    if (typeof bank === 'number') updateFields.bank = Math.max(0, bank);
    if (typeof level === 'number') updateFields.level = Math.max(1, level);
    if (typeof xp === 'number') updateFields.xp = Math.max(0, xp);

    if (Object.keys(updateFields).length === 0) {
      return NextResponse.json(
        { error: 'لم يتم تحديد أي حقل للتحديث' },
        { status: 400 }
      );
    }

    const updated = await UserModel.findOneAndUpdate(
      { guildId, userId },
      { $set: updateFields },
      { new: true, lean: true }
    );

    if (!updated) {
      return NextResponse.json(
        { error: 'المستخدم غير موجود' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'تم تحديث بيانات المستخدم بنجاح',
      user: {
        userId: (updated as any).userId,
        guildId: (updated as any).guildId,
        balance: (updated as any).balance || 0,
        bank: (updated as any).bank || 0,
        level: (updated as any).level || 1,
        xp: (updated as any).xp || 0,
        totalMessages: (updated as any).totalMessages || 0,
        streak: (updated as any).streak || 0,
        inventory: (updated as any).inventory || [],
      },
    });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: 'فشل في تحديث بيانات المستخدم' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ guildId: string; userId: string }> }
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

    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const { allowed, resetInMs } = await checkRateLimit(`member-reset:${token.sub || ip}`, { maxRequests: 15, windowMs: 60000 });
    if (!allowed) return rateLimitResponse(resetInMs);

    await connectBotDB();
    const { guildId, userId } = await params;

    const resetData = {
      $set: {
        balance: 0,
        bank: 0,
        level: 1,
        xp: 0,
        totalMessages: 0,
        streak: 0,
        lastDaily: null,
        dailyCooldown: null,
        workCooldown: null,
        robCooldown: null,
        inventory: [],
      },
    };

    const updated = await UserModel.findOneAndUpdate(
      { guildId, userId },
      resetData,
      { new: true, lean: true }
    );

    if (!updated) {
      return NextResponse.json(
        { error: 'المستخدم غير موجود' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'تم إعادة تعيين بيانات المستخدم بنجاح',
      user: {
        userId: (updated as any).userId,
        guildId: (updated as any).guildId,
        balance: 0,
        bank: 0,
        level: 1,
        xp: 0,
        totalMessages: 0,
        streak: 0,
        inventory: [],
      },
    });
  } catch (error) {
    console.error('Reset user error:', error);
    return NextResponse.json(
      { error: 'فشل في إعادة تعيين بيانات المستخدم' },
      { status: 500 }
    );
  }
}
