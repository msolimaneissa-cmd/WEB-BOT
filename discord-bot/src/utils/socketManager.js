/**
 * @file src/utils/socketManager.js
 * @description Real-time bridge between Bot and Dashboard using Socket.io
 */

const { Server } = require('socket.io');
const crypto = require('crypto');
const logger = require('./logger');
const { config } = require('../config');

let io;

/**
 * Initializes the Socket.io server
 * @param {import('http').Server} server 
 */
function initSocket(server) {
    io = new Server(server, {
        cors: {
            origin: process.env.DASHBOARD_URL || "http://localhost:9002",
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    // Socket authentication middleware
    io.use((socket, next) => {
        const secret = socket.handshake.auth?.token || socket.handshake.headers?.['x-bot-secret'];
        const configuredSecret = process.env.BOT_CONTROL_SECRET;
        
        if (configuredSecret) {
            try {
                const secretBuf = Buffer.from(String(secret || ''));
                const configBuf = Buffer.from(String(configuredSecret));
                
                if (secretBuf.length !== configBuf.length || !crypto.timingSafeEqual(secretBuf, configBuf)) {
                    logger.warn(`🔌 Unauthorized socket connection attempt: ${socket.id}`);
                    return next(new Error('Unauthorized'));
                }
            } catch (error) {
                logger.warn(`🔌 Error during socket authentication: ${error.message}`);
                return next(new Error('Unauthorized'));
            }
        }
        next();
    });

    io.on('connection', (socket) => {
        logger.info(`🔌 Authenticated dashboard connection: ${socket.id}`);

        socket.on('disconnect', () => {
            logger.info(`🔌 Dashboard disconnected: ${socket.id}`);
        });

        // Handle manual sync request from dashboard
        const ServerConfig = require('../database/schemas/serverConfigSchema');
        const { updateGuildCache } = require('./cache');

        socket.on('config_update', async () => {
            await ServerConfig.invalidateCache();
            await updateGuildCache(config.mainGuildId);
            logger.info('[Socket] Cache invalidated due to dashboard update.');
        });

        socket.on('request_sync', () => {
            logger.info('🔄 Manual sync requested from dashboard');
        });
    });

    return io;
}

/**
 * Emits an event to all connected dashboards
 * @param {string} event 
 * @param {any} data 
 */
function emitToDashboard(event, data) {
    if (io) {
        io.emit(event, data);
    }
}

module.exports = {
    initSocket,
    emitToDashboard,
    getIO: () => io
};
