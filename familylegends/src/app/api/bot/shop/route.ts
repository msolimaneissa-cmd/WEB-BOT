import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { connectBotDB } from '@/lib/bot-mongodb';
import { UserModel, GuildModel } from '@/lib/bot-schemas';

// عناصر المتجر الافتراضية (Fallback)
const DEFAULT_SHOP_ITEMS = [
  { id: 'vip', name: 'VIP', price: 5000, emoji: '👑', description: 'رتبة VIP مميزة' },
  { id: 'premium', name: 'بريميوم', price: 10000, emoji: '💎', description: 'رتبة بريميوم فاخرة' },
  { id: 'noble', name: 'نوبل', price: 20000, emoji: '🏆', description: 'رتبة نوبل راقية' },
  { id: 'legend', name: 'أسطوري', price: 50000, emoji: '🌟', description: 'رتبة أسطورية نادرة' },
  { id: 'fishing_rod', name: 'صيدلة', price: 500, emoji: '🎣', description: 'عصا صيد لصيد الأسماك' },
  { id: 'hunting_gun', name: 'بندقية صيد', price: 2000, emoji: '🔫', description: 'بندقية لصيد الحيوانات' },
  { id: 'laptop', name: 'حاسوب محمول', price: 3000, emoji: '💻', description: 'حاسوب للعمل من المنزل' },
  { id: 'phone', name: 'هاتف ذكي', price: 1500, emoji: '📱', description: 'هاتف ذكي جديد' },
  { id: 'car', name: 'سيارة', price: 15000, emoji: '🚗', description: 'سيارة فاخرة' },
  { id: 'house', name: 'منزل', price: 100000, emoji: '🏠', description: 'منزل أحلامك' },
  { id: 'sword', name: 'سيف', price: 3000, emoji: '⚔️', description: 'سيف قوي للمعارك' },
  { id: 'shield', name: 'درع', price: 2500, emoji: '🛡️', description: 'درع للحماية من السرقة' },
];

export async function GET(
  request: NextRequest
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
    const guildId = (process.env.GUILD_ID || process.env.NEXT_PUBLIC_GUILD_ID as string);

    // جلب إعدادات السيرفر للحصول على المتجر المخصص
    const guild = await GuildModel.findOne({ guildId }).lean();
    const shopItems = ((guild as any)?.economy?.shopItems?.length > 0) 
      ? (guild as any).economy.shopItems 
      : DEFAULT_SHOP_ITEMS;

    // جلب المستخدمين الذين لديهم عناصر في المخزون
    const usersWithInventory = await UserModel.find({
      guildId,
      'inventory.0': { $exists: true },
    })
      .select('userId inventory')
      .lean();

    // بناء خريطة المشتريات لكل عنصر
    const purchaseMap: Record<string, { userId: string; name: string; quantity: number }[]> = {};

    for (const user of usersWithInventory) {
      if (user.inventory && Array.isArray(user.inventory)) {
        for (const item of user.inventory) {
          if (!purchaseMap[item.itemId]) {
            purchaseMap[item.itemId] = [];
          }
          purchaseMap[item.itemId].push({
            userId: user.userId,
            name: item.name || item.itemId,
            quantity: item.quantity || 1,
          });
        }
      }
    }

    // دمج بيانات المتجر مع المشتريات
    const itemsWithPurchases = shopItems.map((item: any) => ({
      ...item,
      purchasedBy: purchaseMap[item.id] || [],
      totalPurchases: (purchaseMap[item.id] || []).reduce(
        (sum, p) => sum + p.quantity,
        0
      ),
    }));

    return NextResponse.json({
      items: itemsWithPurchases,
    });
  } catch (error) {
    console.error('Get shop items error:', error);
    return NextResponse.json(
      { error: 'فشل في جلب بيانات المتجر' },
      { status: 500 }
    );
  }
}
