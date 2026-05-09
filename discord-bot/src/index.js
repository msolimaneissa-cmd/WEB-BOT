/**
 * @file src/index.js
 * @description نقطة الدخول الرئيسية للبوت مع نظام Prefix Commands.
 */

const { Client, GatewayIntentBits, Partials } = require('discord.js');
const { joinVoiceChannel } = require('@discordjs/voice');
const express = require('express');
const cors = require('cors');
const { connectDatabase, isDatabaseConnected } = require('./database/connect');
const { initCache } = require('./utils/cache');
const { config } = require('./config');
const http = require('http');
const { initSocket } = require('./utils/socketManager');
const { setupDistube } = require('./utils/music');
const { validateConfig } = require('./config');
const logger = require('./utils/logger');
const fs = require('fs');
const path = require('path');
const ServerConfig = require('./database/schemas/serverConfigSchema');

// ═══════════════════════════════════════════════════════════════
// ⚙️ إعدادات البوت والوقاية من الأخطاء
// ═══════════════════════════════════════════════════════════════
const PREFIX = process.env.BOT_PREFIX || '!';

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception:', err);
    process.exit(1);
});

process.on('uncaughtExceptionMonitor', (err, origin) => {
    logger.error('Uncaught Exception Monitor:', err, origin);
});

// ═══════════════════════════════════════════════════════════════
// 🤖 إعداد عميل Discord
// ═══════════════════════════════════════════════════════════════
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildMessageReactions,
    ],
    partials: [Partials.User, Partials.Message, Partials.GuildMember, Partials.ThreadMember, Partials.Reaction],
});

// تخزين الأوامر
client.commands = new Map();
client.aliases = new Map();
client.cooldowns = new Map();
client.searchResults = new Map();

// 🧹 تنظيف نتائج البحث (Music Search Results) لمنع تسرب الذاكرة
setInterval(() => {
    const now = Date.now();
    for (const [key, data] of client.searchResults.entries()) {
        if (now - data.timestamp > 300000) { // 5 minutes TTL
            client.searchResults.delete(key);
        }
    }
}, 60000);

// ═══════════════════════════════════════════════════════════════
// 🌐 خادم Express للحفاظ على البوت حياً
// ═══════════════════════════════════════════════════════════════
const app = express();
const server = http.createServer(app);
const io = initSocket(server);

// ─── Periodic Health Updates via Socket.io ───
setInterval(() => {
    if (client.isReady()) {
        const health = {
            ping: client.ws.ping,
            uptime: Math.floor(process.uptime()),
            memory: {
                rss: (process.memoryUsage().rss / 1024 / 1024).toFixed(2) + ' MB',
                heapUsed: (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2) + ' MB',
            },
            guilds: client.guilds.cache.size,
            users: client.users.cache.size,
            timestamp: Date.now()
        };
        io.emit('bot_health', health);
    }
}, 10000); // Every 10 seconds

const PORT = process.env.PORT || 3001;

app.disable('x-powered-by');
app.set('trust proxy', 1);

function createRateLimiter({ windowMs, max }) {
    const hits = new Map();

    // 🧹 تنظيف دوري للإدخالات القديمة لمنع تسرب الذاكرة
    setInterval(() => {
        const now = Date.now();
        for (const [key, entry] of hits.entries()) {
            if (now > entry.resetAt) {
                hits.delete(key);
            }
        }
    }, windowMs);

    return function rateLimiter(req, res, next) {
        const now = Date.now();
        const key = req.ip || 'unknown';
        const entry = hits.get(key) || { count: 0, resetAt: now + windowMs };
        if (now > entry.resetAt) {
            entry.count = 0;
            entry.resetAt = now + windowMs;
        }
        entry.count += 1;
        hits.set(key, entry);
        if (entry.count > max) {
            res.setHeader('Retry-After', Math.ceil((entry.resetAt - now) / 1000));
            return res.status(429).json({ success: false, message: 'Too Many Requests' });
        }
        return next();
    };
}

// 🛡️ Middleware: CORS & Body Parser
const allowedOrigin = process.env.DASHBOARD_URL || "http://localhost:3000";
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        // Strict exact match for origin validation
        if (origin === allowedOrigin) {
            return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-bot-secret'],
    credentials: true
}));
app.use(express.json({ limit: '200kb' }));
app.use(express.urlencoded({ extended: false, limit: '50kb' }));

app.get('/', (req, res) => {
    res.status(200).json({
        status: 'online',
        bot: client.user ? client.user.tag : 'connecting...',
        uptime: Math.floor(process.uptime()),
        guilds: client.guilds ? client.guilds.cache.size : 0,
        prefix: PREFIX,
        database: isDatabaseConnected() ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString(),
    });
});

app.get('/health', (req, res) => res.status(200).send('OK'));
app.get('/ping', (req, res) => res.status(200).json({ pong: true, timestamp: Date.now() }));

// ─── مسار حالة البوت التقنية ───
app.get('/status', createRateLimiter({ windowMs: 60_000, max: 30 }), (req, res) => {
    const configuredSecret = process.env.BOT_CONTROL_SECRET;
    if (!configuredSecret) {
        return res.status(503).json({ success: false, message: 'Not configured' });
    }
    const secret = req.headers['x-bot-secret'] || (req.headers['authorization'] || '').replace(/^Bearer\s+/i, '');
    // Use timing-safe comparison to prevent timing attacks
    try {
        const secretBuf = Buffer.from(String(secret));
        const configBuf = Buffer.from(String(configuredSecret));
        if (secretBuf.length !== configBuf.length || !require('crypto').timingSafeEqual(secretBuf, configBuf)) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
    } catch {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();

    res.status(200).json({
        success: true,
        status: 'online',
        ping: client.ws.ping,
        uptime: Math.floor(uptime),
        guilds: client.guilds.cache.size,
        users: client.users.cache.size,
        memory: {
            rss: Math.round(memoryUsage.rss / 1024 / 1024) + ' MB',
            heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + ' MB',
        },
        nodeVersion: process.version,
        platform: process.platform,
    });
});

// ═══════════════════════════════════════════════════════════════
// 🛠️ نظام التحكم من لوحة القيادة (Dashboard Control)
// ═══════════════════════════════════════════════════════════════
/**
 * Validates Discord snowflake format (numeric string, 17-20 digits)
 * @param {string} id - The ID to validate
 * @returns {boolean}
 */
function isValidSnowflake(id) {
    if (typeof id !== 'string') return false;
    return /^\d{17,20}$/.test(id);
}

function validateControlRequest(body) {
    if (!body || typeof body !== 'object') return { ok: false, message: 'Invalid body' };
    const { guildId, channelId, type, content, embed } = body;

    // Type validation
    if (typeof type !== 'string' || type.length === 0) return { ok: false, message: 'Missing type' };

    // GuildId validation (snowflake format)
    if (!isValidSnowflake(guildId)) return { ok: false, message: 'Invalid guildId format' };

    // ChannelId validation for specific types (snowflake format)
    if (type === 'SEND_EMBED' || type === 'CREATE_REACTION_ROLES') {
        if (!isValidSnowflake(channelId)) return { ok: false, message: 'Invalid channelId format' };
    }

    // Content length validation
    if (content !== undefined) {
        if (typeof content !== 'string') return { ok: false, message: 'Content must be a string' };
        if (content.length > 2000) return { ok: false, message: 'Content exceeds 2000 characters' };
    }

    // Embed validation
    if (embed !== undefined) {
        if (typeof embed !== 'object' || embed === null) return { ok: false, message: 'Embed must be an object' };
        if (embed.title !== undefined) {
            if (typeof embed.title !== 'string') return { ok: false, message: 'Embed title must be a string' };
            if (embed.title.length > 256) return { ok: false, message: 'Embed title exceeds 256 characters' };
        }
        if (embed.description !== undefined) {
            if (typeof embed.description !== 'string') return { ok: false, message: 'Embed description must be a string' };
            if (embed.description.length > 4096) return { ok: false, message: 'Embed description exceeds 4096 characters' };
        }
        // Validate embed fields are objects, not arbitrary code
        if (embed.fields !== undefined) {
            if (!Array.isArray(embed.fields)) return { ok: false, message: 'Embed fields must be an array' };
            for (const field of embed.fields) {
                if (typeof field !== 'object' || field === null) {
                    return { ok: false, message: 'Each embed field must be an object' };
                }
                if (field.name !== undefined && typeof field.name !== 'string') {
                    return { ok: false, message: 'Embed field name must be a string' };
                }
                if (field.value !== undefined && typeof field.value !== 'string') {
                    return { ok: false, message: 'Embed field value must be a string' };
                }
            }
        }
    }

    return { ok: true };
}

const ReactionRole = require('./database/schemas/reactionRoleSchema');
const Backup = require('./database/schemas/backupSchema');
const { createBackup } = require('./utils/backupHelper');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

// Separate rate limiter for /control endpoint: 15 requests per 60 seconds
const controlRateLimiter = createRateLimiter({ windowMs: 60_000, max: 15 });

app.post('/control', controlRateLimiter, async (req, res) => {
    const { guildId, channelId, embed, content, type, data } = req.body || {};
    const configuredSecret = process.env.BOT_CONTROL_SECRET;
    if (!configuredSecret) {
        return res.status(503).json({ success: false, message: 'Not configured' });
    }
    const secret = req.headers['x-bot-secret'] || (req.headers['authorization'] || '').replace(/^Bearer\s+/i, '');

    // التحقق من السر (Secret) للأمان — timing-safe comparison
    try {
        const secretBuf = Buffer.from(String(secret));
        const configBuf = Buffer.from(String(configuredSecret));
        if (secretBuf.length !== configBuf.length || !require('crypto').timingSafeEqual(secretBuf, configBuf)) {
            return res.status(401).json({ success: false, message: 'Unauthorized: Invalid secret' });
        }
    } catch {
        return res.status(401).json({ success: false, message: 'Unauthorized: Invalid secret' });
    }

    const validation = validateControlRequest(req.body);
    if (!validation.ok) {
        return res.status(400).json({ success: false, message: validation.message });
    }

    if (type === 'CONFIG_UPDATE') {
        logger.info('🔄 Received CONFIG_UPDATE from dashboard. Invalidating configuration cache...');
        ServerConfig.invalidateCache();
        return res.status(200).json({ success: true, message: 'Config cache invalidated successfully' });
    }

    if (type === 'SEND_EMBED') {
        try {
            const guild = client.guilds.cache.get(guildId);
            if (!guild) return res.status(404).json({ success: false, message: 'Guild not found' });

            const channel = guild.channels.cache.get(channelId);
            if (!channel || !channel.isTextBased()) return res.status(404).json({ success: false, message: 'Channel not found or not text-based' });

            // Sanitize embed - only allow safe fields
            const safeEmbed = {};
            if (embed?.title && typeof embed.title === 'string') safeEmbed.title = embed.title.slice(0, 256);
            if (embed?.description && typeof embed.description === 'string') safeEmbed.description = embed.description.slice(0, 4096);
            if (embed?.color && typeof embed.color === 'number') safeEmbed.color = embed.color;
            if (embed?.url && typeof embed.url === 'string' && embed.url.startsWith('http')) safeEmbed.url = embed.url;
            if (embed?.image?.url && typeof embed.image.url === 'string' && embed.image.url.startsWith('http')) safeEmbed.image = { url: embed.image.url };
            if (embed?.thumbnail?.url && typeof embed.thumbnail.url === 'string' && embed.thumbnail.url.startsWith('http')) safeEmbed.thumbnail = { url: embed.thumbnail.url };
            if (embed?.footer?.text && typeof embed.footer.text === 'string') safeEmbed.footer = { text: embed.footer.text.slice(0, 2048) };
            if (embed?.author?.name && typeof embed.author.name === 'string') safeEmbed.author = { name: embed.author.name.slice(0, 256) };
            // Sanitize fields
            if (Array.isArray(embed?.fields)) {
                safeEmbed.fields = embed.fields.slice(0, 25).map(f => ({
                    name: (typeof f.name === 'string' ? f.name : '').slice(0, 256),
                    value: (typeof f.value === 'string' ? f.value : '').slice(0, 1024),
                    inline: !!f.inline,
                }));
            }

            // Sanitize content
            const safeContent = (typeof content === 'string' && content.length > 0) ? content.slice(0, 2000) : null;

            const embedObj = new EmbedBuilder(safeEmbed);
            await channel.send({ content: safeContent, embeds: [embedObj] });
            return res.status(200).json({ success: true, message: 'Embed sent successfully' });
        } catch (error) {
            logger.error('Error sending embed via dashboard control:', error);
            return res.status(500).json({ success: false, message: 'Failed to send embed' });
        }
    }

    if (type === 'CREATE_REACTION_ROLES') {
        try {
            const guild = client.guilds.cache.get(guildId);
            if (!guild) return res.status(404).json({ success: false, message: 'Guild not found' });

            const channel = guild.channels.cache.get(channelId);
            if (!channel || !channel.isTextBased()) return res.status(404).json({ success: false, message: 'Channel not found' });

            const { title, description, roles } = data;

            const embed = new EmbedBuilder()
                .setTitle(title || 'اختر رتبتك')
                .setDescription(description || 'اضغط على الأزرار بالأسفل')
                .setColor('#5865F2');

            const rows = [];
            let currentRow = new ActionRowBuilder();

            roles.forEach((role, index) => {
                if (index > 0 && index % 5 === 0) {
                    rows.push(currentRow);
                    currentRow = new ActionRowBuilder();
                }

                currentRow.addComponents(
                    new ButtonBuilder()
                        .setCustomId(`rr_${role.roleId}`)
                        .setLabel(role.label)
                        .setEmoji(role.emoji || null)
                        .setStyle(ButtonStyle[role.style] || ButtonStyle.Primary)
                );
            });
            rows.push(currentRow);

            const message = await channel.send({ embeds: [embed], components: rows });

            await ReactionRole.create({
                guildId,
                channelId,
                messageId: message.id,
                title,
                description,
                roles
            });

            return res.status(200).json({ success: true, messageId: message.id });
        } catch (error) {
            logger.error('Error creating reaction roles:', error);
            return res.status(500).json({ success: false, message: 'Failed to create reaction roles' });
        }
    }

    if (type === 'CREATE_BACKUP') {
        try {
            const guild = client.guilds.cache.get(guildId);
            if (!guild) return res.status(404).json({ success: false, message: 'Guild not found' });

            const { creatorId } = data;
            const backup = await createBackup(guild, creatorId || 'Dashboard');

            return res.status(200).json({ success: true, backup: { backupId: backup.backupId, createdAt: backup.createdAt } });
        } catch (error) {
            logger.error('Error creating backup via control:', error);
            return res.status(500).json({ success: false, message: 'Failed to create backup' });
        }
    }

    if (type === 'CHECK_ROLE') {
        try {
            const guild = client.guilds.cache.get(guildId);
            if (!guild) return res.status(404).json({ success: false, message: 'Guild not found' });

            const { userId, roleId } = data || {};
            if (!userId) return res.status(400).json({ success: false, message: 'User ID is required' });

            // Force fetch member if not cached
            const member = await guild.members.fetch(userId).catch(() => null);
            if (!member) {
                return res.status(200).json({ success: true, hasRole: false });
            }
            
            // If roleId is missing from config but role check is requested, it means no rule is enforced? 
            // Better to default to false if no role is configured
            if (!roleId) return res.status(200).json({ success: true, hasRole: false });

            const hasRole = member.roles.cache.has(roleId);
            return res.status(200).json({ success: true, hasRole });
        } catch (error) {
            logger.error('Error checking role via control:', error);
            return res.status(500).json({ success: false, message: 'Failed to check role' });
        }
    }

    return res.status(400).json({ success: false, message: 'Invalid control type' });
});

let expressServer;

function startServer() {
    expressServer = server.listen(PORT, '0.0.0.0', () => {
        logger.success(`🌐 خادم Keep-Alive و Socket.io يعمل على المنفذ ${PORT}`);
    }).on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            expressServer = server.listen(0, '0.0.0.0', () => {
                logger.success(`🌐 خادم Keep-Alive و Socket.io يعمل على المنفذ ${expressServer.address().port}`);
            });
        }
    });
}

// ─── إعدادات إضافية للحماية والتشغيل ───
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

function gracefulShutdown() {
    logger.info('🔄 جاري إغلاق البوت...');
    if (expressServer) expressServer.close();
    if (client) client.destroy();
    process.exit(0);
}

// ═══════════════════════════════════════════════════════════════
// 📁 تحميل الأحداث
// ═══════════════════════════════════════════════════════════════
const eventsPath = path.join(__dirname, 'events');
if (fs.existsSync(eventsPath)) {
    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
    for (const file of eventFiles) {
        const events = require(path.join(eventsPath, file));
        
        // دعم تصدير حدث واحد أو مصفوفة أحداث
        const eventList = Array.isArray(events) ? events : [events];
        
        for (const event of eventList) {
            if (!event.name || !event.execute) continue;
            
            if (event.once) {
                client.once(event.name, (...args) => event.execute(...args, client));
            } else {
                client.on(event.name, (...args) => event.execute(...args, client));
            }
        }
    }
}

// ═══════════════════════════════════════════════════════════════
// ⚡ تحميل الأوامر (Prefix System + Slash Commands Support)
// ═══════════════════════════════════════════════════════════════

/**
 * تسجيل أمر واحد في النظام
 * @param {Object} command - الأمر للتسجيل
 */
function registerCommand(command) {
    if (!command || typeof command !== 'object') return;
    
    // أوامر Prefix (لها name و execute)
    if (command.name && command.execute) {
        client.commands.set(command.name, command);
        if (command.aliases && Array.isArray(command.aliases)) {
            command.aliases.forEach(alias => client.aliases.set(alias, command.name));
        }
        logger.debug(`✅ أمر Prefix: ${command.name}`);
    }
    // أوامر Slash (لها data و execute)
    else if (command.data && command.execute) {
        const name = command.data.name;
        client.commands.set(name, command);
        logger.debug(`✅ أمر Slash: ${name}`);
    }
}

/**
 * تحميل الأوامر من ملف
 * @param {string} filePath - مسار الملف
 */
function loadCommandsFromFile(filePath) {
    try {
        const command = require(filePath);
        if (Array.isArray(command)) {
            command.forEach(cmd => registerCommand(cmd));
        } else {
            registerCommand(command);
        }
    } catch (error) {
        logger.error(`❌ خطأ في تحميل ${filePath}:`, error.message);
    }
}

// تحميل الأوامر من المجلد الرئيسي
const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
    const items = fs.readdirSync(commandsPath);
    for (const item of items) {
        const itemPath = path.join(commandsPath, item);
        if (fs.statSync(itemPath).isDirectory()) {
            const files = fs.readdirSync(itemPath).filter(f => f.endsWith('.js'));
            for (const file of files) {
                loadCommandsFromFile(path.join(itemPath, file));
            }
        } else if (item.endsWith('.js')) {
            loadCommandsFromFile(itemPath);
        }
    }
}

logger.info(`📦 تم تحميل ${client.commands.size} أمر (Prefix + Slash)`);

// ═══════════════════════════════════════════════════════════════
// 📨 معالج الرسائل (Message Handler)
// ═══════════════════════════════════════════════════════════════
client.on('messageCreate', async message => {
    // تجاهل الرسائل من البوتات والرسائل الخاصة
    if (message.author.bot || !message.guild) return;
    
    // تجاهل الرسائل التي لا تبدأ بالبادئة
    if (!message.content.startsWith(PREFIX)) return;
    
    // استخراج الأمر والarguments
    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const commandName = args.shift()?.toLowerCase();
    
    if (!commandName) return;
    
    // البحث عن الأمر
    const command = client.commands.get(commandName) || 
                   client.commands.get(client.aliases.get(commandName));
    
    if (!command) return;

    // 💡 اقتراح أمر Slash إذا كان الأمر متاحاً كـ Slash Command
    if (command.data) {
        const slashName = command.data.name;
        const hintMsg = `💡 هذا الأمر متاح كأمر Slash! استخدم \`/${slashName}\` بدلاً من \`${PREFIX}${commandName}\``;
        // لا نمنع التنفيذ بل نرسل تنبيه
        message.reply(hintMsg).then(hint => {
            setTimeout(() => hint.delete().catch(() => {}), 10000);
        }).catch(() => {});
    }
    
    // التحقق من cooldown
    if (command.cooldown) {
        const cooldownKey = `${message.author.id}-${command.name}`;
        const now = Date.now();
        const cooldownAmount = command.cooldown * 1000;
        
        if (client.cooldowns.has(cooldownKey)) {
            const expirationTime = client.cooldowns.get(cooldownKey) + cooldownAmount;
            if (now < expirationTime) {
                const timeLeft = Math.ceil((expirationTime - now) / 1000);
                return message.reply(`⏰ انتظر ${timeLeft} ثانية قبل استخدام هذا الأمر مجدداً.`);
            }
        }
        client.cooldowns.set(cooldownKey, now);
        setTimeout(() => client.cooldowns.delete(cooldownKey), cooldownAmount);
    }
    
    // التحقق من الصلاحيات
    const { isStaff } = require('./utils/permissions');
    const guildConfig = await ServerConfig.get();
    
    const isMemberStaff = isStaff(message.member, guildConfig);

    if (command.permissions && !message.member.permissions.has(command.permissions) && !isMemberStaff) {
        return message.reply(`❌ ليس لديك الصلاحية لاستخدام هذا الأمر!`);
    }
    
    // تنفيذ الأمر
    try {
        await command.execute(message, args, client);
    } catch (error) {
        logger.error(`خطأ في تنفيذ الأمر ${command.name}:`, error);
        message.reply('❌ حدث خطأ أثناء تنفيذ الأمر!');
    }
});

// ═══════════════════════════════════════════════════════════════
// 🔗 التهيئة الرئيسية
// ═══════════════════════════════════════════════════════════════
async function initializeBot() {
    startServer();

    const { valid, missing, warnings } = validateConfig();
    if (!valid) {
        logger.error(`❌ متغيرات البيئة المفقودة: ${missing.join(', ')}`);
    }
    if (warnings && warnings.length > 0) {
        logger.warn(`⚠️ متغيرات البيئة الموصى بها مفقودة: ${warnings.join(', ')}`);
    }

    logger.separator('🔄 تهيئة البوت');
    logger.info(`⚡ Prefix: ${PREFIX} | يدعم أيضاً أوامر Slash (/)`);
    
    await connectDatabase();
    await initCache(config.guildId);
    
    logger.info('🎵 جاري تهيئة نظام الموسيقى...');
    setupDistube(client);

    logger.info('🤖 جاري تسجيل الدخول...');
    await client.login(process.env.DISCORD_TOKEN);
}

initializeBot();

// مراقبة الأداء
setInterval(() => {
    if (client.user) {
        const mem = process.memoryUsage();
        logger.info(`📊 الذاكرة: ${Math.round(mem.heapUsed / 1024 / 1024)}MB | السيرفرات: ${client.guilds.cache.size}`);
    }
}, 3600000);
