/**
 * @file src/commands/status.js
 * @description عرض حالة البوت التقنية مع أزرار تفاعلية.
 */

const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, version } = require('discord.js');
const os = require('os');
const { getLiveStreamers } = require('../services/notificationService');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('status')
        .setDescription('Displays the bot\'s current status and statistics.'),

    /**
     * @param {import('discord.js').CommandInteraction} interaction 
     */
    async execute(interaction) {
        const client = interaction.client;
        const uptime = process.uptime();
        const days = Math.floor(uptime / 86400);
        const hours = Math.floor(uptime / 3600) % 24;
        const minutes = Math.floor(uptime / 60) % 60;
        const seconds = Math.floor(uptime % 60);

        const memoryUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
        const totalMemory = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
        
        const liveStreamers = getLiveStreamers();
        const streamersList = liveStreamers.length > 0 
            ? liveStreamers.map(s => `🔴 **${s.name}** (${s.platform})`).join('\n')
            : 'لا يوجد ستريمرز مباشرين حالياً.';

        const embed = new EmbedBuilder()
            .setColor('#2F3136')
            .setTitle('📊 حالة النظام - Family Legends Ultra')
            .setThumbnail(client.user.displayAvatarURL())
            .addFields(
                { name: '🚀 وقت التشغيل', value: `\`${days}d ${hours}h ${minutes}m ${seconds}s\``, inline: true },
                { name: '🛰️ الاستجابة (Ping)', value: `\`${client.ws.ping}ms\``, inline: true },
                { name: '🧠 استهلاك الذاكرة', value: `\`${memoryUsage}MB / ${totalMemory}GB\``, inline: true },
                { name: '👥 الإحصائيات', value: `السيرفرات: \`${client.guilds.cache.size}\`\nالمستخدمين: \`${client.guilds.cache.reduce((acc, g) => acc + g.memberCount, 0)}\``, inline: true },
                { name: '📦 الإصدارات', value: `Node: \`${process.version}\`\nDiscord.js: \`v${version}\``, inline: true },
                { name: '🔴 من يبث الآن', value: streamersList, inline: false }
            )
            .setFooter({ text: 'Family Legends - Developed with Love', iconURL: client.user.displayAvatarURL() })
            .setTimestamp();

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel('لوحة التحكم')
                    .setURL('https://family-legends.xyz/admin')
                    .setStyle(ButtonStyle.Link),
                new ButtonBuilder()
                    .setLabel('دعوة البوت')
                    .setURL(`https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands`)
                    .setStyle(ButtonStyle.Link),
                new ButtonBuilder()
                    .setLabel('سيرفر الدعم')
                    .setURL('https://discord.gg/familylegends')
                    .setStyle(ButtonStyle.Link)
            );

        await interaction.reply({ embeds: [embed], components: [row] });
    },
};
