/**
 * @file src/database/schemas/auditLogSchema.js
 * @description Mongoose schema for detailed guild audit logging.
 * Stores who did what, to whom, when, and any relevant metadata.
 */

const mongoose = require('mongoose');

/** @type {import('mongoose').Schema} AuditLog schema */
const auditLogSchema = new mongoose.Schema({
    guildId: { type: String, required: true, index: true },
    eventType: {
        type: String,
        required: true,
        index: true,
    },
    executorId: { type: String, default: null },
    executorTag: { type: String, default: null },
    targetId: { type: String, default: null },
    targetTag: { type: String, default: null },
    channelId: { type: String, default: null },
    reason: { type: String, default: null },
    metadata: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

// ── Indexes ──────────────────────────────────────────────────────────────
// guildId and eventType already indexed via schema options.
// timestamp is available via the `timestamps: true` schema option as `createdAt`.

// Compound index for efficient time-range queries per guild
auditLogSchema.index({ guildId: 1, createdAt: -1 });

// ── Static Helpers ───────────────────────────────────────────────────────

/**
 * Get paginated audit logs for a guild with optional filters.
 * @param {string} guildId
 * @param {Object} [options={}]
 * @param {string} [options.eventType]  - filter by event type
 * @param {Date}   [options.startDate]  - inclusive lower bound
 * @param {Date}   [options.endDate]    - inclusive upper bound
 * @param {number} [options.page=1]     - page number (1-based)
 * @param {number} [options.limit=25]   - docs per page
 * @returns {Promise<{ logs: AuditLog[], total: number, page: number, totalPages: number }>}
 */
auditLogSchema.statics.getGuildLogs = async function (guildId, options = {}) {
    const {
        eventType,
        startDate,
        endDate,
        page = 1,
        limit = 25,
    } = options;

    const query = { guildId };

    if (eventType) query.eventType = eventType;
    if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = startDate;
        if (endDate) query.createdAt.$lte = endDate;
    }

    const total = await this.countDocuments(query);
    const logs = await this.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

    return {
        logs,
        total,
        page,
        totalPages: Math.ceil(total / limit),
    };
};

/**
 * Get the most recent logs for a guild, optionally filtered by event type.
 * @param {string} guildId
 * @param {string} [eventType]
 * @param {number} [limit=10]
 * @returns {Promise<AuditLog[]>}
 */
auditLogSchema.statics.getRecentLogs = async function (guildId, eventType, limit = 10) {
    const query = { guildId };
    if (eventType) query.eventType = eventType;
    return this.find(query).sort({ createdAt: -1 }).limit(limit);
};

/**
 * Convenience helper – create and persist a new audit log entry.
 * @param {Object} data
 * @returns {Promise<AuditLog>}
 */
auditLogSchema.statics.logEvent = async function (data) {
    return this.create(data);
};

module.exports = mongoose.model('AuditLog', auditLogSchema);
