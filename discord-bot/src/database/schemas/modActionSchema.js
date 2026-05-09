/**
 * @file src/database/schemas/modActionSchema.js
 * @description Mongoose schema for tracking moderation actions like tempbans.
 */

const mongoose = require('mongoose');

const modActionSchema = new mongoose.Schema({
    userId: { type: String, required: true, index: true },
    guildId: { type: String, required: true, index: true },
    moderatorId: { type: String, required: true },
    type: { type: String, enum: ['tempban', 'tempmute'], required: true },
    reason: { type: String, default: 'لم يتم تحديد سبب' },
    expiresAt: { type: Date, required: true, index: true },
    completed: { type: Boolean, default: false },
}, {
    timestamps: true,
});

// Compound index for finding active actions for a user in a guild
modActionSchema.index({ userId: 1, guildId: 1, type: 1, completed: 1 });

// Static method to add a tempban
modActionSchema.statics.addTempban = async function(userId, guildId, moderatorId, reason, durationMs) {
    const expiresAt = new Date(Date.now() + durationMs);
    return await this.create({
        userId,
        guildId,
        moderatorId,
        type: 'tempban',
        reason,
        expiresAt,
    });
};

// Static method to get expired actions
modActionSchema.statics.getExpiredActions = async function() {
    return await this.find({
        expiresAt: { $lte: new Date() },
        completed: false,
    });
};

module.exports = mongoose.model('ModAction', modActionSchema);
