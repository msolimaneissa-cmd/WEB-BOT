/**
 * @file src/database/schemas/backupSchema.js
 * @description Mongoose schema for server backups (Channels, Roles, and Settings).
 */

const mongoose = require('mongoose');

const backupSchema = new mongoose.Schema({
    backupId: { type: String, required: true, unique: true },
    guildId: { type: String, required: true, index: true },
    creatorId: { type: String, required: true },
    guildName: String,
    guildIcon: String,
    data: {
        name: String,
        iconURL: String,
        verificationLevel: Number,
        explicitContentFilter: Number,
        defaultMessageNotifications: Number,
        roles: [{
            name: String,
            color: Number,
            hoist: Boolean,
            permissions: String,
            mentionable: Boolean,
            position: Number
        }],
        channels: {
            categories: [{
                name: String,
                permissions: [{ id: String, allow: String, deny: String }],
                children: [{
                    name: String,
                    type: Number,
                    topic: String,
                    nsfw: Boolean,
                    rateLimitPerUser: Number,
                    permissions: [{ id: String, allow: String, deny: String }]
                }]
            }],
            others: [{
                name: String,
                type: Number,
                topic: String,
                nsfw: Boolean,
                rateLimitPerUser: Number,
                permissions: [{ id: String, allow: String, deny: String }]
            }]
        }
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Backup', backupSchema);
