/**
 * @file src/deploy.js
 * @description Slash Command Deployment Script
 * Run this script manually to deploy/refresh slash commands:
 *   node src/deploy.js        (guild commands - instant)
 *   node src/deploy.js global (global commands - up to 1 hour)
 */

const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const logger = require('./utils/logger');
const { config } = require('./config');

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        commands.push(command.data.toJSON());
        logger.success(`Loaded command: ${command.data.name}`);
    }
}

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        logger.separator('🔄 Deploying Slash Commands');
        logger.info(`Found ${commands.length} commands to deploy.`);

        const clientId = process.env.CLIENT_ID;
        const guildId = config.mainGuildId;
        if (!guildId) throw new Error("MAIN_GUILD_ID is not defined in .env");

        const data = await rest.put(
            Routes.applicationGuildCommands(clientId, guildId),
            { body: commands }
        );
        logger.success(`Successfully reloaded ${data.length} application (/) commands for the guild.`);
    } catch (error) {
        logger.error('Failed to register commands:', error);
    }
})();
