/**
 * @fileoverview This file handles the registration and execution of slash commands.
 * @module handlers/commands
 */

// ==================== //

require('dotenv').config();
const {Logger} = require('../utils/logger');
const {REST, Routes} = require('discord.js');
const {join} = require("path");
const fs = require('fs');

const commandsLogger = new Logger('cmds', true);
const token = process.env.DEV_MODE ? process.env.TOKEN : process.env.DEV_TOKEN;
const rest = new REST({version: '9'}).setToken(token);

// ==================== //

/**
 * @name Registers slash commands for a Discord client.
 * @param {Object} client - The Discord client object.
 * @param {Array} commands - An array of commands to register.
 */

async function registerCommands(client, commands) {

    commandsLogger.info(`Registering slash commands...`);

    try {
        await rest.put(
            Routes.applicationCommands(client.user.id),
            {body: commands},
        )

        commandsLogger.success(`Successfully registered slash commands`);

    } catch (error) {
        commandsLogger.error(`Failed to register slash commands`);
        commandsLogger.error(error);
    }
}

// ==================== //

module.exports = async (client) => {

    // Load commands
    const commands = [];
    const commandFiles = fs.readdirSync(join(__dirname, '..', 'commands')).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const command = require(join(__dirname, '..', 'commands', file));
        await client.commands.set(command.data.name, command);
        commands.push(command.data.toJSON());
    }

    // Load buttons
    const buttons = [];
    // const buttonFiles = fs.readdirSync(join(__dirname, '..', 'buttons')).filter(file => file.endsWith('.js'));
    // for (const file of buttonFiles) {
    //     const button = require(join(__dirname, '..', 'buttons', file));
    //     buttons.push(button.data.toJSON());
    // }

    // Register commands and buttons
    await registerCommands(client, commands);
    // await registerCommands(client, buttons);

    // Log registered commands and buttons
    commandsLogger.separator();
    commandsLogger.info(`Registered ${commands.length} slash commands`);
    commandsLogger.info(`Registered ${buttons.length} buttons`);
    commandsLogger.separator();

    client.on('interactionCreate', async interaction => {


        const command = client.commands.get(interaction.commandName);
        if (!command) {
            commandsLogger.error(`Command ${interaction.commandName} does not exist`);
            return;
        }

        if (interaction.isCommand()) {
            try {
                await command.execute(interaction, client);
            } catch (error) {
                commandsLogger.error(error);
                commandsLogger.error(error.stack)
                await interaction.reply({content: 'There was an error while executing this command!', ephemeral: true});
            }
        } else if (interaction.isAutocomplete()) {
            try {
                await command.autocomplete(interaction, client);
            } catch (error) {
                commandsLogger.error(error);
                commandsLogger.error(error.stack)
            }
        }
    });
}