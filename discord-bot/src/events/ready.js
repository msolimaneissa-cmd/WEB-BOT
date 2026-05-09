/**
 * @file events/ready.js
 * @description Handles the ready event. Sets bot presence/status and
 * registers slash commands on startup.
 */

const { REST, Routes, ActivityType } = require('discord.js');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');
const { setBotAvatar } = require('../utils/embeds');
const { config } = require('../config');
const { sendServerStats } = require('../utils/webhook');
const ServerConfig = require('../database/schemas/serverConfigSchema');

const { startModScheduler } = require('../utils/modScheduler');
const { startStreamNotifications, getLiveStreamers } = require('../services/notificationService');
const Stats = require('../database/schemas/statsSchema');

// حالات النشاط المتغيرة
const ACTIVITIES = [
    { name: '🎵 إدارة السيرفر الموحد', type: ActivityType.Listening },
    { name: '🎮 الألعاب مع {users} مستخدم', type: ActivityType.Playing },
    { name: '💡 /مساعدة | /لوحة', type: ActivityType.Watching },
    { name: '🚀 Family Legends Bot', type: ActivityType.Competing },
    { name: '🤖 الذكاء الاصطناعي متاح', type: ActivityType.Playing },
    { name: '🌐 https://family-legends.xyz', type: ActivityType.Watching },
];

let currentActivityIndex = 0;

/**
 * تحديث إحصائيات السيرفر في قاعدة البيانات
 */
async function updateServerStats(client) {
    const guildId = config.mainGuildId;
    if (!guildId) return;

    const guild = client.guilds.cache.get(guildId);
    if (!guild) return;

    try {
        const totalMembers = guild.memberCount;
        const onlineMembers = guild.members.cache.filter(m => 
            m.presence?.status === 'online' || 
            m.presence?.status === 'idle' || 
            m.presence?.status === 'dnd'
        ).size;

        await Stats.findOneAndUpdate(
            { guildId },
            {
                totalMembers,
                onlineMembers,
                boostCount: guild.premiumSubscriptionCount || 0,
                channelCount: guild.channels.cache.size,
                roleCount: guild.roles.cache.size,
                lastUpdated: new Date(),
            },
            { upsert: true }
        );
        // logger.debug(`📊 تم تحديث إحصائيات السيرفر: ${guild.name}`);
    } catch (error) {
        logger.error('❌ خطأ في تحديث إحصائيات السيرفر:', error.message);
    }
}

/**
 * مزامنة رتب أعضاء السيرفر مع قاعدة البيانات
 */
async function syncMemberRoles(client) {
    const guildId = config.guildId;
    if (!guildId) return;

    const guild = client.guilds.cache.get(guildId);
    if (!guild) return;

    logger.info(`🔄 جاري مزامنة رتب ${guild.memberCount} عضو في ${guild.name}...`);

    try {
        const User = require('../database/schemas/userSchema');
        const members = await guild.members.fetch();
        
        const bulkOps = members.map(member => ({
            updateOne: {
                filter: { userId: member.id, guildId: guild.id },
                update: { $set: { roles: member.roles.cache.map(r => r.id) } },
                upsert: true
            }
        }));

        if (bulkOps.length > 0) {
            await User.bulkWrite(bulkOps);
            logger.success(`✅ تمت مزامنة رتب المستخدمين بنجاح.`);
        }
    } catch (error) {
        logger.error('❌ خطأ في مزامنة رتب الأعضاء:', error.message);
    }
}

/**
 * تحديث حالة البوت
 */
async function updateBotStatus(client) {
    const liveStreamers = getLiveStreamers();
    let currentActivity;

    // محاولة جلب الحالة من قاعدة البيانات أولاً
    try {
        const dbConfig = await ServerConfig.get();
        const customStatus = dbConfig?.general?.botStatus;
        const customType = dbConfig?.general?.botActivityType;

        // إذا كانت الحالة في قاعدة البيانات مختلفة عن الافتراضية، نستخدمها
        if (customStatus && customStatus !== 'إدارة السيرفر') {
            currentActivity = {
                name: customStatus,
                type: ActivityType[customType] || ActivityType.Playing
            };
        }
    } catch (error) {
        logger.debug('Couldn\'t fetch bot status from DB, using fallback.');
    }

    if (!currentActivity) {
        // إذا كان هناك ستريمرز مباشرين، نعطي الأولوية لهم في الدوران
        if (liveStreamers.length > 0) {
            const streamer = liveStreamers[Math.floor(Math.random() * liveStreamers.length)];
            currentActivity = {
                name: `🔴 ${streamer.name} مباشر الآن!`,
                type: ActivityType.Streaming,
                url: streamer.channelLink
            };
        } else {
            currentActivity = ACTIVITIES[currentActivityIndex];
            currentActivityIndex = (currentActivityIndex + 1) % ACTIVITIES.length;
        }
    }

    const totalUsers = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
    const totalServers = client.guilds.cache.size;

    let statusName = currentActivity.name
        .replace('{servers}', totalServers)
        .replace('{users}', totalUsers);

    try {
        client.user.setPresence({
            activities: [{
                name: statusName,
                type: currentActivity.type,
                ...(currentActivity.url && { url: currentActivity.url })
            }],
            status: 'online',
        });

        // logger.debug(`🎮 تم تغيير الحالة إلى: ${statusName}`);
    } catch (error) {
        logger.error('خطأ في تحديث الحالة:', error.message);
    }
}

/**
 * @module events/ready
 * @description Event handler for when the client becomes ready.
 */
module.exports = {
    /** @type {string} Event name */
    name: 'ready',
    /** @type {boolean} Only fire once */
    once: true,

    /**
     * Executes when the Discord client is ready.
     * @async
     * @param {import('discord.js').Client} client - The Discord client.
     * @returns {Promise<void>}
     */
    async execute(client) {
        logger.separator('🚀 البوت جاهز');
        logger.success(`✅ متصل كـ ${client.user.tag}`);
        logger.info(`📊 السيرفرات: ${client.guilds.cache.size}`);
        logger.info(`👥 المستخدمين: ${client.guilds.cache.reduce((acc, g) => acc + g.memberCount, 0)}`);

        // تحديث الحالة كل 30 ثانية
        await updateBotStatus(client);
        setInterval(() => updateBotStatus(client), 30000);

        // تحديث إحصائيات السيرفر كل 5 دقائق
        await updateServerStats(client);
        setInterval(() => updateServerStats(client), 5 * 60 * 1000);

        // بدء جدولة الإجراءات الإدارية
        startModScheduler(client);

        // مزامنة رتب الأعضاء عند التشغيل لتكون لوحة التحكم محدثة
        await syncMemberRoles(client);

        // بدء نظام إشعارات البث
        startStreamNotifications(client);

        // Register Slash Commands
        const commands = [];
        const commandsPath = path.join(__dirname, '..', 'commands');

        if (fs.existsSync(commandsPath)) {
            const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

            for (const file of commandFiles) {
                const filePath = path.join(commandsPath, file);
                const command = require(filePath);
                if ('data' in command && 'execute' in command) {
                    commands.push(command.data.toJSON());
                }
            }

            const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

            try {
                logger.info(`🔄 جاري تحديث ${commands.length} أوامر التطبيق (/).`);

                const clientId = process.env.CLIENT_ID;
                const guildId = config.guildId;

                if (guildId) {
                    await rest.put(
                        Routes.applicationGuildCommands(clientId, guildId),
                        { body: commands },
                    );
                    logger.success(`✅ تم تسجيل الأوامر في السيرفر المخصص: ${guildId}`);
                } else {
                    logger.error('❌ خطأ: GUILD_ID غير محدد في الإعدادات.');
                }
            } catch (error) {
                logger.error('❌ فشل في تسجيل الأوامر:', error);
            }
        }

        // ─── استعادة السحوبات النشطة ───
        try {
            const giveawayCommand = require('../commands/giveaway');
            if (giveawayCommand.restoreActiveGiveaways) {
                await giveawayCommand.restoreActiveGiveaways(client);
            }

            const { startGiveawayScheduler } = require('../utils/giveawayHelper');
            startGiveawayScheduler(client);
            logger.success('✅ تم بدء مجدول السحوبات (Giveaway Scheduler).');
        } catch (error) {
            logger.warn('⚠️ فشل في استعادة السحوبات النشطة أو بدء المجدول:', error.message);
        }

        // ─── نظام التسجيل المتقدم ───
        try {
            const { setupAdvancedLogging } = require('../events/advancedLogging');
            setupAdvancedLogging(client);
            logger.success('✅ تم تفعيل نظام التسجيل المتقدم (Advanced Logging).');
        } catch (error) {
            logger.warn('⚠️ فشل في تفعيل نظام التسجيل المتقدم:', error.message);
        }

        // ─── نظام الإشعارات ───
        try {
            const { startNotificationChecker } = require('../utils/notificationChecker');
            startNotificationChecker(client);
            logger.success('✅ تم تفعيل نظام الإشعارات (Notifications).');
        } catch (error) {
            logger.warn('⚠️ فشل في تفعيل نظام الإشعارات:', error.message);
        }

        // ─── تعيين صورة البوت العالمية للـ embeds ───
        try {
            setBotAvatar(client.user.displayAvatarURL());
            logger.info('🎨 تم تعيين صورة البوت العالمية للـ embeds.');
        } catch (error) {
            logger.warn('⚠️ فشل في تعيين صورة البوت:', error.message);
        }

        // ─── نظام كشف البث المباشر + webhook ───
        if (config.websiteWebhookUrl) {
            logger.info('🌐 جاري تهيئة نظام كشف البث المباشر و webhook...');

            try {
                const guild = client.guilds.cache.get(config.guildId);
                if (guild) {
                    const updateStats = async () => {
                        try {
                            const memberCount = guild.memberCount;
                            const onlineCount = guild.members.cache.filter(m => m.presence?.status !== 'offline').size;
                            const botCount = guild.members.cache.filter(m => m.user.bot).size;

                            await sendServerStats({
                                guildId: guild.id,
                                guildName: guild.name,
                                memberCount,
                                onlineCount,
                                botCount,
                            });
                        } catch (error) {
                            logger.error('❌ خطأ في إرسال إحصائيات السيرفر:', error.message);
                        }
                    };

                    await updateStats();
                    setInterval(updateStats, 300_000);
                    logger.success(`✅ تم تفعيل الفحص الدوري للبث المباشر (كل 300 ثانية).`);
                }
            } catch (error) {
                logger.error('❌ فشل إرسال الإحصائيات الأولية:', error.message);
            }
        } else {
            logger.debug('⏭️ لم يتم تكوين WEBSITE_WEBHOOK_URL - نظام كشف البث معطل.');
        }

        logger.separator('✨ البوت جاهز للاستخدام');
    },
};
