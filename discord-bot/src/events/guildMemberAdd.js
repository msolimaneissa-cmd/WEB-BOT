/**
 * @file events/guildMemberAdd.js
 * @description نظام الترحيب الاحترافي - يشمل رسالة ترحيب جميلة، 
 * إضافة الأدوار التلقائية، وإنشاء سجل للمستخدم.
 */

const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const ServerConfig = require('../database/schemas/serverConfigSchema');
const User = require('../database/schemas/userSchema');
const { isDatabaseConnected } = require('../database/connect');
const { generateWelcomeImage } = require('../utils/canvasHelper');
const logger = require('../utils/logger');
const { config } = require('../config');

/**
 * @module events/guildMemberAdd
 */
module.exports = {
    name: 'guildMemberAdd',

    /**
     * Executes when a new member joins the guild.
     */
    async execute(member, client) {
        // ─── بوابة الأمان (Security Gate) ───
        if (!member.guild || member.guild.id !== config.mainGuildId) return;
        
        // تجاهل البوتات
        if (member.user.bot) return;

        let guildConfig = null;

        // جلب إعدادات السيرفر
        if (isDatabaseConnected()) {
            try {
                guildConfig = await ServerConfig.get();

                // ─── حماية الحسابات الجديدة ───
                const antiNew = guildConfig?.protection?.antiNewAccount;
                if (antiNew?.enabled) {
                    const minAgeDays = antiNew.minAge || 1;
                    const accountAgeMs = Date.now() - member.user.createdAt.getTime();
                    const minAgeMs = minAgeDays * 24 * 60 * 60 * 1000;

                    if (accountAgeMs < minAgeMs) {
                        const action = antiNew.action || 'kick';
                        const reason = `حماية الحسابات الجديدة: عمر الحساب ${Math.floor(accountAgeMs / (24 * 60 * 60 * 1000))} أيام (الحد الأدنى ${minAgeDays} أيام)`;

                        try {
                            const dmEmbed = new EmbedBuilder()
                                .setColor('#FF0000')
                                .setTitle('⚠️ تم طردك/حظرك من السيرفر')
                                .setDescription(`رسالة من **${member.guild.name}**:\n${reason}`)
                                .setTimestamp();
                            await member.send({ embeds: [dmEmbed] }).catch(() => {});
                        } catch (e) {}

                        if (action === 'ban') {
                            await member.ban({ reason });
                        } else {
                            await member.kick(reason);
                        }

                        logger.info(`🚨 تم تنفيذ ${action} لـ ${member.user.tag} بسبب صغر عمر الحساب (${member.guild.name})`);
                        return; // لا تكمل الترحيب أو إضافة الأدوار
                    }
                }

                // إنشاء سجل المستخدم
                await User.findOneAndUpdate(
                    { userId: member.id, guildId: member.guild.id },
                    { userId: member.id, guildId: member.guild.id },
                    { upsert: true, new: true, setDefaultsOnInsert: true }
                );
            } catch (error) {
                logger.error('Database error in guildMemberAdd:', error);
            }
        }

        // ═══════════════════════════════════════════════════════════════
        // 🎭 إضافة الأدوار التلقائية
        // ═══════════════════════════════════════════════════════════════
        const autoRoles = guildConfig?.welcome?.autoRoles || [];
        if (autoRoles.length > 0) {
            for (const roleId of autoRoles) {
                const role = member.guild.roles.cache.get(roleId);
                if (role && member.guild.members.me.permissions.has('ManageRoles') &&
                    member.guild.members.me.roles.highest.position > role.position) {
                    await member.roles.add(role).catch(() => {});
                }
            }
        } else {
            // البحث عن دور افتراضي "عضو"
            const fallbackRole = member.guild.roles.cache.find(r => 
                r.name === 'عضو' || r.name === 'Member' || r.name === 'Members'
            );
            if (fallbackRole && member.guild.members.me.permissions.has('ManageRoles') &&
                member.guild.members.me.roles.highest.position > fallbackRole.position) {
                await member.roles.add(fallbackRole).catch(() => {});
            }
        }

        // ═══════════════════════════════════════════════════════════════
        // 📨 رسالة الترحيب
        // ═══════════════════════════════════════════════════════════════
        const welcomeEnabled = guildConfig?.welcome?.enabled ?? true;
        if (!welcomeEnabled) return;

        // تحديد قناة الترحيب
        let welcomeChannel = null;
        const channelId = guildConfig?.welcome?.channelId;

        if (channelId) {
            welcomeChannel = member.guild.channels.cache.get(channelId);
        } else {
            // البحث عن قناة ترحيب
            welcomeChannel = member.guild.channels.cache.find(c =>
                (c.name.includes('ترحيب') || c.name.includes('welcome') || c.name.includes('general')) &&
                c.isTextBased()
            );
        }

        if (!welcomeChannel) return;

        // التحقق من الصلاحيات
        if (!welcomeChannel.permissionsFor(member.guild.members.me).has(['SendMessages', 'EmbedLinks'])) {
            return;
        }

        // بناء الرسالة
        const memberCount = member.guild.memberCount;
        const userMention = `<@${member.id}>`;
        const guildName = member.guild.name;

        // رسالة مخصصة أو افتراضية
        let customMessage = guildConfig?.welcome?.message ||
            'مرحباً بك في {guild}! نتمنى لك وقتاً ممتعاً 🎉';

        customMessage = customMessage
            .replace('{user}', userMention)
            .replace('{guild}', guildName)
            .replace('{memberCount}', memberCount);

        // إنشاء Embed احترافي
        const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setAuthor({
                name: `👋 مرحباً بك في ${guildName}`,
                iconURL: member.guild.iconURL({ dynamic: true })
            })
            .setDescription(customMessage)
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
            .addFields(
                { name: '👤 العضو', value: userMention, inline: true },
                { name: '👥 أنت العضو رقم', value: `**${memberCount}**`, inline: true },
                { name: '📅 انضم في', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true }
            )
            .setFooter({
                text: `${member.user.tag} | ${member.id}`,
                iconURL: member.user.displayAvatarURL({ dynamic: true })
            })
            .setTimestamp();

        // إضافة معلومات إضافية
        const rulesChannel = member.guild.channels.cache.find(c =>
            c.name.includes('قوانين') || c.name.includes('rules')
        );
        const rolesChannel = member.guild.channels.cache.find(c =>
            c.name.includes('أدوار') || c.name.includes('roles') || c.name.includes('اختيار')
        );
        const announcementsChannel = member.guild.channels.cache.find(c =>
            c.name.includes('إعلانات') || c.name.includes('announcements')
        );

        const extraInfo = [];
        if (rulesChannel) extraInfo.push(`📜 القوانين: ${rulesChannel}`);
        if (rolesChannel) extraInfo.push(`🎭 الأدوار: ${rolesChannel}`);
        if (announcementsChannel) extraInfo.push(`📢 الإعلانات: ${announcementsChannel}`);

        if (extraInfo.length > 0) {
            embed.addFields({ name: '📌 روابط مهمة', value: extraInfo.join('\n'), inline: false });
        }

        // 🖼️ توليد صورة الترحيب
        const welcomeImage = await generateWelcomeImage(member, {
            background: guildConfig?.welcome?.backgroundImage,
            font: guildConfig?.welcome?.font,
            color: guildConfig?.welcome?.color,
        });

        const files = [];
        if (welcomeImage) {
            const attachment = new AttachmentBuilder(welcomeImage, { name: 'welcome.png' });
            embed.setImage('attachment://welcome.png');
            files.push(attachment);
        }

        // إرسال الرسالة
        await welcomeChannel.send({ embeds: [embed], files }).catch(err => logger.error(err));

        // ═══════════════════════════════════════════════════════════════
        // 📩 رسالة خاصة للعضو الجديد
        // ═══════════════════════════════════════════════════════════════
        if (guildConfig?.welcome?.dmEnabled ?? false) {
            try {
                const dmEmbed = new EmbedBuilder()
                    .setColor('#5865F2')
                    .setAuthor({
                        name: `👋 أهلاً بك في ${guildName}`,
                        iconURL: member.guild.iconURL({ dynamic: true })
                    })
                    .setDescription(guildConfig?.welcome?.dmMessage ||
                        'مرحباً بك! نتمنى لك إقامة سعيدة معنا.\n\n💡 لا تنسى قراءة القوانين واختيار أدوارك!')
                    .setThumbnail(member.guild.iconURL({ dynamic: true }))
                    .setFooter({ text: 'Family Legends Bot' })
                    .setTimestamp();

                await member.send({ embeds: [dmEmbed] }).catch(() => {});
            } catch (e) {
                // قد يكون العضو أغلق الرسائل الخاصة
            }
        }
    },
};
