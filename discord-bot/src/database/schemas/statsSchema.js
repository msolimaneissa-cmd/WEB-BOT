const mongoose = require('mongoose');

const statsSchema = new mongoose.Schema({
    guildId: { type: String, required: true, unique: true },
    totalMembers: { type: Number, default: 0 },
    onlineMembers: { type: Number, default: 0 },
    boostCount: { type: Number, default: 0 },
    channelCount: { type: Number, default: 0 },
    roleCount: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Stats', statsSchema);
