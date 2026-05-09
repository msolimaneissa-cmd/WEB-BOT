/**
 * @file commands/help.js
 * @description أمر المساعدة الرئيسي - يعرض كل أوامر البوت بشكل منظم وجميل (Slash Command)
 */

const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { COLORS } = require('../utils/embeds');

const data = new SlashCommandBuilder()
    .setName('مساعدة')
    .setDescription('📋 عرض أوامر البوت والتحكم');

async function execute(interaction, client) {
    const userId = interaction.user.id;

    // إنشاء Embed رئيسي احترافي
    const mainEmbed = new EmbedBuilder()
        .setColor('#5865F2')
        .setAuthor({
            name: `${client.user.username} - قائمة الأوامر`,
            iconURL: client.user.displayAvatarURL({ dynamic: true })
        })
        .setThumbnail(client.user.displayAvatarURL({ dynamic: true, size: 256 }))
        .setDescription(
            '**أهلاً بك! 👋**\n\n' +
            'أنا بوت متعدد المهام يساعدك في إدارة السيرفر والاستمتاع!\n\n' +
            '📊 **إحصائيات البوت:**\n' +
            `• 🖥️ السيرفرات: **${client.guilds.cache.size}**\n` +
            `• 👥 المستخدمين: **${client.guilds.cache.reduce((a, g) => a + g.memberCount, 0)}**\n` +
            `• ⚡ الأوامر: \`/\` (Slash Commands)`
        )
        .addFields(
            {
                name: '🎵 الموسيقى',
                value: '`/موسيقى شغل` `/موسيقى وقف` `/موسيقى كمل` `/موسيقى تخطي` `/موسيقى انهاء`\n`/موسيقى قائمة` `/موسيقى صوت` `/موسيقى كرر` `/موسيقى حالي` `/موسيقى تحكم`',
                inline: false
            },
            {
                name: '🎮 الألعاب',
                value: '`/العاب` - لعبة حجر ورقة مقص، نرد، عملة\n`/تكلم` - تحدث مع البوت الذكي',
                inline: false
            },
            {
                name: '💰 الاقتصاد',
                value: '`/اقتصاد رصيد` - رصيد، يومي، عمل، تحويل، متجر',
                inline: false
            },
            {
                name: '🛡️ الإدارة',
                value: '`/ادارة` (حظر، طرد، إسكات، الخ)\n`/تهيئة` (الترحيب، البث، الداعمين)\n`/لوحة` (الإدارة السريعة)',
                inline: false
            },
            {
                name: '🛠️ الأدوات',
                value: '`/لوحة` - لوحة التحكم الرئيسية\n`/بنق` - سرعة البوت\n`/معلومات` - معلومات السيرفر',
                inline: false
            }
        )
        .setFooter({
            text: `💡 استخدم /مساعدة لمزيد من التفاصيل | Family Legends Bot`,
            iconURL: client.user.displayAvatarURL({ dynamic: true })
        })
        .setTimestamp();

    // أزرار سريعة
    const row1 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`help_${userId}_music`)
                .setLabel('🎵 الموسيقى')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId(`help_${userId}_games`)
                .setLabel('🎮 الألعاب')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId(`help_${userId}_economy`)
                .setLabel('💰 الاقتصاد')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId(`help_${userId}_admin`)
                .setLabel('🛡️ الإدارة')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId(`help_${userId}_tickets`)
                .setLabel('🎫 التذاكر')
                .setStyle(ButtonStyle.Success),
        );

    const row2 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`help_${userId}_panel`)
                .setLabel('📋 لوحة التحكم')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId(`help_${userId}_info`)
                .setLabel('ℹ️ معلومات البوت')
                .setStyle(ButtonStyle.Secondary),
        );

    await interaction.reply({ embeds: [mainEmbed], components: [row1, row2] });
}

/**
 * معالج تفاعلات المساعدة
 */
async function handleHelpInteraction(interaction, client) {
    const customId = interaction.customId;
    const parts = customId.split('_');
    const actionUserId = parts[1];
    const category = parts[2];

    if (interaction.user.id !== actionUserId) {
        return interaction.reply({ content: '⚠️ هذه القائمة خاصة بشخص آخر!', ephemeral: true });
    }

    let embed;

    switch (category) {
        case 'music': {
            embed = new EmbedBuilder()
                .setColor('#0099FF')
                .setTitle('🎵 أوامر الموسيقى')
                .setDescription('**المنصات المدعومة:** يوتيوب، سبوتيفاي، ساوندكلاود')
                .addFields(
                    { name: '▶️ التشغيل', value: '`/موسيقى شغل [اسم/رابط]` - تشغيل أغنية', inline: false },
                    { name: '⏯️ التحكم', value: '`/موسيقى وقف` - إيقاف مؤقت\n`/موسيقى كمل` - استئناف\n`/موسيقى تخطي` - تخطي\n`/موسيقى انهاء` - إيقاف الكل', inline: false },
                    { name: '📋 القائمة', value: '`/موسيقى قائمة` - عرض القائمة\n`/موسيقى ازالة [رقم]` - إزالة أغنية\n`/موسيقى خلط` - خلط القائمة', inline: false },
                    { name: '🔊 الصوت', value: '`/موسيقى صوت [1-150]` - ضبط الصوت\n`/موسيقى فلتر [النوع]` - فلتر صوتي', inline: false },
                    { name: '🔄 أخرى', value: '`/موسيقى كرر [0/1/2]` - التكرار\n`/موسيقى تلقائي` - تشغيل تلقائي\n`/موسيقى حالي` - الأغنية الحالية', inline: false },
                    { name: '🎮 لوحة التحكم', value: '`/موسيقى تحكم` - لوحة تحكم تفاعلية', inline: false },
                )
                .setFooter({ text: '💡 نصيحة: روابط سبوتيفاي أسرع وأكثر استقراراً!' });
            break;
        }
        case 'games': {
            embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('🎮 الألعاب والترفيه')
                .addFields(
                    { name: '✊✋✌️ حجر ورقة مقص', value: '`/العاب حجر` - العب ضد البوت', inline: false },
                    { name: '🎲 النرد', value: '`/العاب نرد` - ارمي نرد\n`/نرد [الوجوه]` - نرد مخصص', inline: false },
                    { name: '🪙 العملة', value: '`/العاب عملة` - ارمي عملة', inline: false },
                    { name: '🎱 كرة الحظ', value: '`/ترفيه كرة_الحظ` - اسأل كرة الحظ', inline: false },
                    { name: '🤖 البوت الذكي', value: '`/تكلم [رسالتك]` - تحدث مع البوت\n`@Bot [رسالتك]` - بالمنشن', inline: false },
                    { name: '🎰 السلوتس', value: 'قريباً!', inline: false },
                );
            break;
        }
        case 'economy': {
            embed = new EmbedBuilder()
                .setColor('#FFD700')
                .setTitle('💰 نظام الاقتصاد')
                .addFields(
                    { name: '💵 الرصيد', value: '`/اقتصاد رصيد` - عرض رصيدك\n`/اقتصاد رصيد @[عضو]` - رصيد عضو آخر', inline: false },
                    { name: '🎁 المكافآت', value: '`/اقتصاد يومي` - مكافأة يومية\n`/اقتصاد عمل` - اعمل واكسب', inline: false },
                    { name: '💸 التحويل', value: '`/اقتصاد تحويل @[عضو] [مبلغ]` - حول أموال', inline: false },
                    { name: '🏦 البنك', value: '`/اقتصاد ايداع [مبلغ]` - إيداع\n`/اقتصاد سحب [مبلغ]` - سحب', inline: false },
                    { name: '🏪 المتجر', value: '`/اقتصاد متجر` - عرض المتجر\n`/اقتصاد شراء [عنصر]` - شراء', inline: false },
                    { name: '🏆 المتصدرون', value: '`/اقتصاد المتصدرون` - أغنى الأعضاء', inline: false },
                );
            break;
        }
        case 'admin': {
            embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('🛡️ أوامر الإدارة')
                .setDescription('⚠️ تتطلب صلاحيات خاصة')
                .addFields(
                    { name: '🔨 الحظر والطرد', value: '`/ادارة حظر` - حظر عضو\n`/ادارة طرد` - طرد عضو\n`/ادارة الغاء_الحظر` - إلغاء الحظر', inline: false },
                    { name: '⏰ الإسكات', value: '`/ادارة اسكات` - إسكات عضو\n`/ادارة الغاء_الاسكات` - إلغاء الإسكات', inline: false },
                    { name: '⚠️ التحذيرات', value: '`/ادارة تحذير` - تحذير عضو\n`/ادارة التحذيرات` - عرض التحذيرات\n`/ادارة مسح_التحذيرات` - مسح التحذيرات', inline: false },
                    { name: '🗑️ المسح', value: '`/ادارة مسح [عدد]` - مسح رسائل', inline: false },
                    { name: '⚙️ الإعدادات المتقدمة', value: '`/تهيئة` - إعداد الترحيب، البث المباشر، ورسائل الداعمين (Boosters)', inline: false },
                    { name: '🏴 نظام الحماية', value: 'البوت يحتوي على نظام Anti-Nuke لحماية الرتب والقنوات، وكشف الحسابات الوهمية تلقائياً.', inline: false },
                    { name: '👥 رتب الطاقم', value: 'يمكنك تحديد رتب الإدارة من لوحة تحكم الموقع لتتخطى حواجز الصلاحيات!', inline: false },
                );
            break;
        }
        case 'panel': {
            embed = new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle('📋 لوحة التحكم')
                .setDescription('لوحة تحكم تفاعلية سهلة الاستخدام!')
                .addFields(
                    { name: '🎮 كيفية الاستخدام', value: 'استخدم `/لوحة` لفتح القائمة الرئيسية', inline: false },
                    { name: '🎵 لوحة الموسيقى', value: '`/لوحة موسيقى`', inline: false },
                    { name: '🎮 لوحة الألعاب', value: '`/لوحة العاب`', inline: false },
                    { name: '🔒 خصوصية', value: 'اللوحة تظهر لك فقط - لا يراها أحد آخر!', inline: false },
                );
            break;
        }
        case 'tickets': {
            embed = new EmbedBuilder()
                .setColor('#00FFFF')
                .setTitle('🎫 نظام التذاكر (Tickets)')
                .setDescription('نظام متكامل لفتح وإدارة تذاكر الدعم الفني.')
                .addFields(
                    { name: '⚙️ الإعداد', value: '`/تذكرة اعداد` - إعداد القسم ورتبة الدعم', inline: false },
                    { name: '📋 اللوحة', value: '`/تذكرة لوحة` - إرسال رسالة "فتح تذكرة"', inline: false },
                    { name: '🔒 الإغلاق', value: '`/تذكرة اغلاق` - إغلاق التذكرة الحالية مع حفظ السجل', inline: false },
                    { name: '👥 فريق الدعم', value: 'فريق الدعم المختار سيتمكن من رؤية التذاكر والرد عليها فوراً.', inline: false },
                );
            break;
        }
        case 'info': {
            const mem = process.memoryUsage();
            const uptime = process.uptime();
            const days = Math.floor(uptime / 86400);
            const hours = Math.floor((uptime % 86400) / 3600);
            const minutes = Math.floor((uptime % 3600) / 60);

            embed = new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle('ℹ️ معلومات البوت')
                .setThumbnail(client.user.displayAvatarURL({ dynamic: true, size: 256 }))
                .addFields(
                    { name: '🤖 الاسم', value: client.user.tag, inline: true },
                    { name: '🆔 المعرف', value: client.user.id, inline: true },
                    { name: '📅 تم إنشاؤه', value: `<t:${Math.floor(client.user.createdTimestamp / 1000)}:D>`, inline: true },
                    { name: '🖥️ السيرفرات', value: `${client.guilds.cache.size}`, inline: true },
                    { name: '👥 المستخدمين', value: `${client.guilds.cache.reduce((a, g) => a + g.memberCount, 0)}`, inline: true },
                    { name: '⏱️ وقت التشغيل', value: `${days}ي ${hours}س ${minutes}د`, inline: true },
                    { name: '💾 الذاكرة', value: `${Math.round(mem.heapUsed / 1024 / 1024)}MB`, inline: true },
                    { name: '🏓 البنق', value: `${Math.round(client.ws.ping)}ms`, inline: true },
                    { name: '⚡ Node.js', value: process.version, inline: true },
                )
                .setFooter({ text: 'صنع بـ ❤️ للعائلة' });
            break;
        }
        default:
            return interaction.reply({ content: '❌ قسم غير معروف!', ephemeral: true });
    }

    await interaction.update({ embeds: [embed] });
}

module.exports = { data, execute };
module.exports.handleHelpInteraction = handleHelpInteraction;
