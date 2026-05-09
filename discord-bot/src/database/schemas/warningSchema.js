/**
 * @file src/database/schemas/warningSchema.js
 * @description Mongoose schema for user warnings per guild.
 * Tracks individual warnings with moderator, reason, and timestamp.
 */

const mongoose = require('mongoose');

const warningSchema = new mongoose.Schema({
    userId: { type: String, required: true, index: true },
    guildId: { type: String, required: true, index: true },
    moderatorId: { type: String, required: true },
    moderatorTag: { type: String, default: 'Unknown' },
    reason: { type: String, default: 'لم يتم تحديد سبب' },
    timestamp: { type: Date, default: Date.now },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

// Compound index for querying warnings per user per guild
warningSchema.index({ userId: 1, guildId: 1 });

// Static method to get warning count for a user in a guild
warningSchema.statics.getWarningCount = async function(userId, guildId) {
    return await this.countDocuments({ userId, guildId });
};

// Static method to clear all warnings for a user in a guild
warningSchema.statics.clearWarnings = async function(userId, guildId) {
    const result = await this.deleteMany({ userId, guildId });
    return result.deletedCount;
};

// Static method to add a warning
warningSchema.statics.addWarning = async function(userId, guildId, moderatorId, moderatorTag, reason) {
    const warning = await this.create({ userId, guildId, moderatorId, moderatorTag, reason });
    return warning;
};

// Static method to get all warnings for a user in a guild
warningSchema.statics.getUserWarnings = async function(userId, guildId) {
    return await this.find({ userId, guildId }).sort({ createdAt: -1 });
};

module.exports = mongoose.model('Warning', warningSchema);
