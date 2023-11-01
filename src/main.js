require('dotenv').config()

// Import necessary modules
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { logger, Logger } = require('./utils/logger');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const arguments = process.argv.slice(2);

// ==================== //

// Log process information
logger.separator()
logger.info(`Process ID: ${process.pid}`)
logger.info(`Node version: ${process.version}`)
logger.info(`Discord.js version: ${require('discord.js').version}`)
logger.info(`Mongoose version: ${require('mongoose').version}`)
logger.separator()

// ==================== //

// Create a new Discord client and logger
const clientLogger = new Logger('client', false)
const client = new Client({
    // TODO: Change this to only the intents we need, this is not ok
    intents: Object.values(GatewayIntentBits).reduce((a, b) => a | b, 0),
    allowedMentions: { parse: [], repliedUser: true } // Disables mentions by default
});

// Create a new collection for commands and buttons
client.commands = new Collection(); client.buttons = new Collection(); client.aliases = new Collection();

// ==================== //

// Connect to MongoDB
clientLogger.info(`Connecting to MongoDB...`)
clientLogger.info(`${process.env.MONGO_URL}/${process.env.MONGO_DB || process.env.BOT_NAME || 'predicto-bot'}`)

mongoose.connect(`${process.env.MONGO_URL}/${process.env.MONGO_DB || process.env.BOT_NAME || 'predicto-bot'}`, {
    useNewUrlParser: true, useUnifiedTopology: true
}).then(() => {
    clientLogger.success(`Connected to MongoDB database`)
}).catch((err) => {
    clientLogger.error(`Failed to connect to MongoDB database, reason: ${err}`)
});

// ==================== //

// Load commands and buttons
async function loadCommands(dir = './commands') {
    clientLogger.info(`Loading commands from ${dir}...`)
    const commandFiles = fs.readdirSync(path.join(__dirname, '..', dir)).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const command = require(path.join(__dirname, '..', dir, file));
        client.commands.set(command.name, command);
        clientLogger.success(`Loaded command ${command.name}`)
    }
}

async function loadButtons(dir = './buttons') {
    clientLogger.info(`Loading buttons from ${dir}...`)
    const buttonFiles = fs.readdirSync(path.join(__dirname, '..', dir)).filter(file => file.endsWith('.js'));
    for (const file of buttonFiles) {
        const button = require(path.join(__dirname, '..', dir, file));
        client.buttons.set(button.name, button);
        clientLogger.success(`Loaded button ${button.name}`)
    }
}

// ==================== //

// Login to Discord
clientLogger.info(`Logging in to Discord...`)
client.login(process.env.DEV_MODE ? process.env.TOKEN : process.env.DEV_TOKEN).then(async () => {
    clientLogger.success(`Logged in to Discord`)

    // Load commands and buttons, if the directory exists

    // If arg --no-commands is passed, don't load commands
    if (arguments.includes('--no-commands')) clientLogger.warn(`Skipping loading commands`)
    else if (fs.existsSync(path.join(__dirname, '..', 'commands'))) {
        await loadCommands();
        await require('./handlers/commands')(client);
    }
    else clientLogger.warn(`Skipping loading commands as there is no commands directory`)

    // If arg --no-buttons is passed, don't load buttons
    if (arguments.includes('--no-buttons')) clientLogger.warn(`Skipping loading buttons`)
    else if (fs.existsSync(path.join(__dirname, '..', 'buttons'))) {
        await loadButtons();
        await require('./handlers/buttons')(client);
    }
    else clientLogger.warn(`Skipping loading buttons as there is no buttons directory`)

    // Initialize command and button handlers
    // await require('./handlers/buttons')(client);



}).catch((err) => {
    clientLogger.error(`Failed to login to Discord`)
    clientLogger.error(err.stack)
});

// ==================== //

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
    clientLogger.error(`Unhandled rejection`)
    clientLogger.error(err.stack)
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    clientLogger.error(`Uncaught exception`)
    clientLogger.error(err.stack)
})