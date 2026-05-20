/**
 * API route for managing bot guild settings
 * @endpoint /api/bot/settings
 * @methods GET, PUT
 * @access Protected (requires admin authentication)
 * @description Handles fetching and updating guild-specific bot configuration settings
 */
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { connectBotDB } from '@/lib/bot-mongodb';
import { GuildModel } from '@/lib/bot-schemas';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { withTiming } from '@/lib/api-timing';

const defaultGuildSettings = {
  mod: {
    modRoleId: '',
    adminRoleId: '',
    mutedRoleId: '',
    logChannelId: '',
    maxWarnings: 3,
    autoBan: false,
    staffRoles: [], // رتب الطاقم المسموح لها باستخدام البوت
  },
  welcome: {
    enabled: false,
    channelId: '',
    message: 'مرحباً بك في السيرفر، {user}!',
    autoRoleId: '',
    backgroundImage: '',
    font: 'Cairo',
    color: '#ffffff',
    dmEnabled: false,
    dmMessage: '',
  },
  protection: {
    antiSpam: { enabled: false, maxMessages: 5, interval: 5000, punishment: 'timeout' },
    antiLink: { enabled: false, allowedChannels: [], allowedRoles: [] },
    antiInvite: { enabled: false },
    antiCaps: { enabled: false, minCapsPercentage: 70, minCapsLength: 5 },
    antiSwear: { enabled: false, customWords: [] },
    antiNewAccount: { enabled: false, minAge: 1, action: 'kick' },
    antiMention: { enabled: false, maxMentions: 5, action: 'timeout' },
    antiNuke: {
      enabled: false,
      maxChannelDelete: 3,
      maxRoleDelete: 3,
      maxKick: 5,
      maxBan: 5,
      action: 'quarantine'
    },
    verification: { enabled: false, roleId: '', channelId: '', message: 'اضغط على الزر بالأسفل للتحقق والدخول للسيرفر.' },
  },
  goodbye: {
    enabled: false,
    channelId: '',
    message: 'وداعاً {user}، نتمنا لك وقتاً سعيداً!',
  },
  booster: { // نظام رسائل الدعم (Server Boost)
    enabled: false,
    channelId: '',
    message: 'شكراً لك {user} على دعم السيرفر! أصبح عدد الـ Boosts الآن: {boost_count}',
  },
  welcomeImage: {
    enabled: false,
    background: 'default',
    font: 'Cairo',
    color: '#FFFFFF',
  },
  notifications: { // تنبيهات البث المباشر والمنصات
    streaming: {
      enabled: false,
      channelId: '',
      twitchMessage: '📢 {streamer} بدأ بثاً مباشراً الآن على Twitch!\n{link}',
      youtubeMessage: '🎥 {streamer} قام بنشر فيديو جديد أو بدأ بثاً على YouTube!\n{link}',
      platforms: ['twitch', 'youtube']
    }
  },
  economy: {
    enabled: true,
    currencyName: 'عملات',
    currencyEmoji: '💰',
    dailyMin: 500,
    dailyMax: 1500,
    workMin: 100,
    workMax: 800,
  },
  music: {
    defaultVolume: 80,
    maxQueueSize: 100,
    leaveOnEmpty: true,
    emptyCooldown: 60,
  },
  ai: {
    enabled: false,
    channelId: '',
    model: 'gemini-1.5-flash',
    systemPrompt: 'أنت مساعد ذكي في سيرفر ديسكورد.',
    maxTokens: 500,
  },
  leveling: {
    enabled: true,
    channelId: '',
    message: 'مبروك {user}، لقد وصلت للمستوى {level}!',
    xpRange: { min: 15, max: 25 },
    cooldown: 60000,
    roles: {},
  },
  tickets: {
    enabled: false,
    categoryId: '',
    staffRoleId: '',
    logChannelId: '',
    limitPerUser: 1,
    welcomeMessage: 'مرحباً بك في تذكرتك، سيقوم فريق الدعم بالرد عليك قريباً.',
  },
  services: {
    weather: true,
    delivery: true,
    prayer: true,
    currency: true,
  },
  activityLog: {
    enabled: true,
  },
};

// Allowed fields for PUT requests (security)
const ALLOWED_TOP_LEVEL_FIELDS = [
  'mod', 'welcome', 'goodbye', 'booster', 'welcomeImage', 'protection', 'economy', 'music', 'tickets', 'activityLog', 'modules', 'ai', 'leveling', 'services', 'notifications'
];

const ALLOWED_MOD_FIELDS = ['modRoleId', 'adminRoleId', 'mutedRoleId', 'logChannelId', 'maxWarnings', 'autoBan', 'staffRoles'];
const ALLOWED_WELCOME_FIELDS = ['enabled', 'channelId', 'message', 'autoRoleId', 'backgroundImage', 'font', 'color', 'dmEnabled', 'dmMessage'];
const ALLOWED_PROTECTION_SPAM_FIELDS = ['enabled', 'maxMessages', 'interval', 'punishment'];
const ALLOWED_PROTECTION_LINK_FIELDS = ['enabled', 'allowedChannels', 'allowedRoles'];
const ALLOWED_PROTECTION_CAPS_FIELDS = ['enabled', 'minCapsPercentage', 'minCapsLength'];
const ALLOWED_PROTECTION_SWEAR_FIELDS = ['enabled', 'customWords'];
const ALLOWED_PROTECTION_NEWACCOUNT_FIELDS = ['enabled', 'minAge', 'action'];
const ALLOWED_PROTECTION_MENTION_FIELDS = ['enabled', 'maxMentions', 'action'];
const ALLOWED_PROTECTION_VERIFY_FIELDS = ['enabled', 'roleId', 'channelId', 'message'];
const ALLOWED_PROTECTION_NUKE_FIELDS = ['enabled', 'maxChannelDelete', 'maxRoleDelete', 'maxKick', 'maxBan', 'action'];
const ALLOWED_GOODBYE_FIELDS = ['enabled', 'channelId', 'message'];
const ALLOWED_BOOSTER_FIELDS = ['enabled', 'channelId', 'message'];
const ALLOWED_NOTIFICATIONS_FIELDS = ['streaming'];
const ALLOWED_STREAMING_FIELDS = ['enabled', 'channelId', 'twitchMessage', 'youtubeMessage', 'platforms'];
const ALLOWED_WELCOME_IMAGE_FIELDS = ['enabled', 'background', 'font', 'color'];
const ALLOWED_ECONOMY_FIELDS = ['enabled', 'currencyName', 'currencyEmoji', 'dailyMin', 'dailyMax', 'workMin', 'workMax'];
const ALLOWED_MUSIC_FIELDS = ['defaultVolume', 'maxQueueSize', 'leaveOnEmpty', 'emptyCooldown'];
const ALLOWED_TICKET_FIELDS = ['enabled', 'categoryId', 'staffRoleId', 'logChannelId', 'limitPerUser', 'welcomeMessage'];
const ALLOWED_MODULES_FIELDS = ['moderation', 'economy', 'music', 'tickets', 'ai', 'giveaway', 'leveling'];
const ALLOWED_SERVICES_FIELDS = ['weather', 'delivery', 'prayer', 'currency'];

function sanitizeObject(obj: any, allowedFields: string[]): any {
  const sanitized: any = {};
  if (!obj || typeof obj !== 'object') return sanitized;
  for (const key of Object.keys(obj)) {
    if (allowedFields.includes(key)) {
      sanitized[key] = obj[key];
    }
  }
  return sanitized;
}

function sanitizeBody(body: any): any {
  const sanitized: any = {};

  for (const [key, value] of Object.entries(body)) {
    if (!ALLOWED_TOP_LEVEL_FIELDS.includes(key)) continue;

    if (key === 'mod') sanitized.mod = sanitizeObject(value as any, ALLOWED_MOD_FIELDS);
    else if (key === 'welcome') sanitized.welcome = sanitizeObject(value as any, ALLOWED_WELCOME_FIELDS);
    else if (key === 'goodbye') sanitized.goodbye = sanitizeObject(value as any, ALLOWED_GOODBYE_FIELDS);
    else if (key === 'booster') sanitized.booster = sanitizeObject(value as any, ALLOWED_BOOSTER_FIELDS);
    else if (key === 'notifications') {
      const notif = value as any;
      sanitized.notifications = {};
      if (notif.streaming) sanitized.notifications.streaming = sanitizeObject(notif.streaming, ALLOWED_STREAMING_FIELDS);
    }
    else if (key === 'welcomeImage') sanitized.welcomeImage = sanitizeObject(value as any, ALLOWED_WELCOME_IMAGE_FIELDS);
    else if (key === 'economy') sanitized.economy = sanitizeObject(value as any, ALLOWED_ECONOMY_FIELDS);
    else if (key === 'music') sanitized.music = sanitizeObject(value as any, ALLOWED_MUSIC_FIELDS);
    else if (key === 'tickets') sanitized.tickets = sanitizeObject(value as any, ALLOWED_TICKET_FIELDS);
    else if (key === 'modules') sanitized.modules = sanitizeObject(value as any, ALLOWED_MODULES_FIELDS);
    else if (key === 'services') sanitized.services = sanitizeObject(value as any, ALLOWED_SERVICES_FIELDS);
    else if (key === 'activityLog') sanitized.activityLog = value;
    else if (key === 'protection') {
      const prot = value as any;
      sanitized.protection = {};
      if (prot.antiSpam) sanitized.protection.antiSpam = sanitizeObject(prot.antiSpam, ALLOWED_PROTECTION_SPAM_FIELDS);
      if (prot.antiLink) sanitized.protection.antiLink = sanitizeObject(prot.antiLink, ALLOWED_PROTECTION_LINK_FIELDS);
      if (prot.antiInvite) sanitized.protection.antiInvite = sanitizeObject(prot.antiInvite, ['enabled']);
      if (prot.antiCaps) sanitized.protection.antiCaps = sanitizeObject(prot.antiCaps, ALLOWED_PROTECTION_CAPS_FIELDS);
      if (prot.antiSwear) sanitized.protection.antiSwear = sanitizeObject(prot.antiSwear, ALLOWED_PROTECTION_SWEAR_FIELDS);
      if (prot.antiNewAccount) sanitized.protection.antiNewAccount = sanitizeObject(prot.antiNewAccount, ALLOWED_PROTECTION_NEWACCOUNT_FIELDS);
      if (prot.antiMention) sanitized.protection.antiMention = sanitizeObject(prot.antiMention, ALLOWED_PROTECTION_MENTION_FIELDS);
      if (prot.antiNuke) sanitized.protection.antiNuke = sanitizeObject(prot.antiNuke, ALLOWED_PROTECTION_NUKE_FIELDS);
      if (prot.verification) sanitized.protection.verification = sanitizeObject(prot.verification, ALLOWED_PROTECTION_VERIFY_FIELDS);
    }
  }

  return sanitized;
}

// GET: Fetch settings
async function handleGET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      return NextResponse.json(
        { error: 'غير مصرح — تسجيل الدخول مطلوب' },
        { status: 401 }
      );
    }

    // التحقق من صلاحيات المشرف باستخدام token.isAdmin الجديد
    if (!token.isAdmin) {
      return NextResponse.json(
        { error: 'ممنوع — صلاحيات المشرف مطلوبة' },
        { status: 403 }
      );
    }

    await connectBotDB();
    const guildId = (process.env.GUILD_ID || process.env.NEXT_PUBLIC_GUILD_ID as string);

    const guild = await GuildModel.findOne({ guildId }).lean();

    if (!guild) {
      return NextResponse.json({
        guildId,
        ...defaultGuildSettings,
      });
    }

    return NextResponse.json(guild);
  } catch (error) {
    console.error('Get guild settings error:', error);
    return NextResponse.json(
      { error: 'فشل في جلب إعدادات السيرفر' },
      { status: 500 }
    );
  }
}

// PUT: Update settings
async function handlePUT(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (token?.sub) {
      const { allowed, resetInMs } = await checkRateLimit(`settings:${token.sub}`, { maxRequests: 30, windowMs: 60000 });
      if (!allowed) return rateLimitResponse(resetInMs);
    }
    if (!token) {
      return NextResponse.json(
        { error: 'غير مصرح — تسجيل الدخول مطلوب' },
        { status: 401 }
      );
    }

    // التحقق من صلاحيات المشرف باستخدام token.isAdmin الجديد
    if (!token.isAdmin) {
      return NextResponse.json(
        { error: 'ممنوع — صلاحيات المشرف مطلوبة' },
        { status: 403 }
      );
    }

    await connectBotDB();
    const guildId = (process.env.GUILD_ID || process.env.NEXT_PUBLIC_GUILD_ID as string);
    const body = await request.json();

    // Sanitize input
    const sanitized = sanitizeBody(body);

    if (Object.keys(sanitized).length === 0) {
      return NextResponse.json(
        { error: 'لا توجد بيانات صالحة للتحديث' },
        { status: 400 }
      );
    }

    const updated = await GuildModel.findOneAndUpdate(
      { guildId },
      { $set: sanitized },
      { new: true, upsert: true }
    ).lean();

    // إرسال إشارة تزامن للبوت تلقائياً عند التحديث
    try {
      const BOT_URL = process.env.BOT_INTERNAL_URL || "http://localhost:8080";
      const BOT_SECRET = process.env.BOT_CONTROL_SECRET;
      
      if (BOT_SECRET && BOT_URL) {
        await fetch(`${BOT_URL}/control`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-bot-secret': BOT_SECRET
          },
          body: JSON.stringify({
            type: 'CONFIG_UPDATE',
            guildId
          })
        });
      }
    } catch (syncError) {
      console.error('Auto-Sync Error:', syncError);
      // We don't fail the request if sync fails, but we log it
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Update guild settings error:', error);
    return NextResponse.json(
      { error: 'فشل في تحديث إعدادات السيرفر' },
      { status: 500 }
    );
  }
}

export const GET = withTiming(handleGET, 'bot-settings/GET');
export const PUT = withTiming(handlePUT, 'bot-settings/PUT');
