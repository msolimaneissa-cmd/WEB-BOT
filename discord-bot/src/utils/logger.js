/**
 * @file src/utils/logger.js
 * @description Professional logging system with colored output,
 * timestamps, and log levels for Discord bot operations.
 */

const chalk = require('chalk');

/**
 * Log levels with their color mappings
 * @enum {Object}
 */
const LOG_LEVELS = {
    INFO: { color: chalk.blue, prefix: 'ℹ️  INFO', badge: '🔵' },
    SUCCESS: { color: chalk.green, prefix: '✅ SUCCESS', badge: '🟢' },
    WARN: { color: chalk.yellow, prefix: '⚠️  WARN', badge: '🟡' },
    ERROR: { color: chalk.red, prefix: '❌ ERROR', badge: '🔴' },
    DEBUG: { color: chalk.gray, prefix: '🔍 DEBUG', badge: '⚪' },
    CMD: { color: chalk.cyan, prefix: '⚡ COMMAND', badge: '⚡' },
    DB: { color: chalk.magenta, prefix: '💾 DATABASE', badge: '🟣' },
    EVENT: { color: chalk.blueBright, prefix: '📡 EVENT', badge: '📡' },
};

/**
 * Get current timestamp string
 * @returns {string} Formatted timestamp HH:MM:SS
 */
function getTimestamp() {
    return new Date().toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });
}

/**
 * Format a log message with timestamp and level
 * @param {string} level - Log level key
 * @param {string} message - Log message
 * @returns {string} Formatted log string
 */
function formatMessage(level, message) {
    const { color, prefix } = LOG_LEVELS[level] || LOG_LEVELS.INFO;
    const timestamp = chalk.dim(`[${getTimestamp()}]`);
    return `${timestamp} ${color(prefix)} ${message}`;
}

/**
 * Professional logger with multiple log levels
 * @namespace logger
 */
const logger = {
    /**
     * Log an informational message
     * @param {...string} messages - Messages to log
     */
    info(...messages) {
        console.log(formatMessage('INFO', messages.join(' ')));
    },

    /**
     * Log a success message
     * @param {...string} messages - Messages to log
     */
    success(...messages) {
        console.log(formatMessage('SUCCESS', messages.join(' ')));
    },

    /**
     * Log a warning message
     * @param {...string} messages - Messages to log
     */
    warn(...messages) {
        console.warn(formatMessage('WARN', messages.join(' ')));
    },

    /**
     * Log an error message
     * @param {...string} messages - Messages to log
     */
    error(...messages) {
        console.error(formatMessage('ERROR', messages.join(' ')));
    },

    /**
     * Log a debug message (only when NODE_ENV is development)
     * @param {...string} messages - Messages to log
     */
    debug(...messages) {
        if (process.env.NODE_ENV === 'development') {
            console.log(formatMessage('DEBUG', messages.join(' ')));
        }
    },

    /**
     * Log a command execution event
     * @param {string} userId - User who executed the command
     * @param {string} guildId - Guild where the command was executed
     * @param {string} commandName - Name of the command
     */
    command(userId, guildId, commandName) {
        console.log(formatMessage('CMD', `${chalk.bold(commandName)} | User: ${chalk.dim(userId)} | Guild: ${chalk.dim(guildId)}`));
    },

    /**
     * Log a database operation
     * @param {string} operation - Database operation description
     * @param {string} [detail] - Additional details
     */
    database(operation, detail) {
        const msg = detail ? `${operation} → ${chalk.dim(detail)}` : operation;
        console.log(formatMessage('DB', msg));
    },

    /**
     * Log a Discord event
     * @param {string} eventName - Name of the event
     * @param {string} [detail] - Additional details
     */
    event(eventName, detail) {
        const msg = detail ? `${chalk.bold(eventName)} → ${detail}` : chalk.bold(eventName);
        console.log(formatMessage('EVENT', msg));
    },

    /**
     * Create a separator line for cleaner log output
     * @param {string} [title] - Optional title for the separator
     */
    separator(title) {
        const line = '─'.repeat(50);
        if (title) {
            console.log(chalk.dim(`\n${line}`));
            console.log(chalk.bold(`  ${title}`));
            console.log(chalk.dim(`${line}\n`));
        } else {
            console.log(chalk.dim(line));
        }
    },
};

module.exports = logger;
