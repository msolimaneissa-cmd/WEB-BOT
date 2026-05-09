/**
 * @file src/database/schemas/autoResponderSchema.js
 * @description Mongoose schema for auto-responders.
 */

const mongoose = require('mongoose');

const autoResponderSchema = new mongoose.Schema({
    guildId: { type: String, required: true, index: true },
    trigger: { type: String, required: true },
    response: { type: String, required: true },
    exact: { type: Boolean, default: false }, // هل يجب أن تكون الكلمة مطابقة تماماً؟
}, {
    timestamps: true,
});

// Compound index for querying responders per guild
autoResponderSchema.index({ guildId: 1, trigger: 1 });

// Static method to add an auto-responder
autoResponderSchema.statics.addResponder = async function(guildId, trigger, response, exact = false) {
    return await this.findOneAndUpdate(
        { guildId, trigger },
        { response, exact },
        { upsert: true, new: true }
    );
};

// Static method to get all responders for a guild
autoResponderSchema.statics.getResponders = async function(guildId) {
    return await this.find({ guildId });
};

module.exports = mongoose.model('AutoResponder', autoResponderSchema);
