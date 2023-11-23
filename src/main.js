require('dotenv').config()

// Import necessary modules
const {Client, GatewayIntentBits, Collection, EmbedBuilder} = require('discord.js');
const {logger, Logger} = require('./utils/logger');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const guildModel = require('./models/guildModel.js');
const cron = require('node-cron');
const chalk = require('chalk');

const {fetchRandomQuestion} = require('./utils/quizUtils.js');
const {getCategoryEmoji, capitalizeFirstLetter} = require('./utils/misc.js');
const {shuffleArray, createAnswerButtons, awardPoints, getUser} = require("./utils/quizUtils");
const {emojis} = require('./misc.js');
const { latencyLogger } = require('./utils/latencyLogger.js');

const arguments = process.argv.slice(2);

// ==================== //

// Log process information
logger.separator()
logger.info(`====== Process Information ======`)
logger.info(`Process ID: ${process.pid}`)
logger.info(`Node version: ${process.version}`)
logger.info(`Discord.js version: ${require('discord.js').version}`)
logger.info(`Mongoose version: ${require('mongoose').version}`)
logger.info(`Environment: ${process.env.DEV_MODE ? 'Development' : 'Production'}`)
logger.info(`=================================`)
logger.separator()

// ==================== //

// Create a new Discord client and logger
const clientLogger = new Logger('client', false)
const client = new Client({
    intents: [GatewayIntentBits.Guilds],
    allowedMentions: {parse: [], repliedUser: true} // Disables mentions by default
});

// Create a new collection for commands and buttons
client.commands = new Collection();
client.buttons = new Collection();
client.aliases = new Collection();

// ==================== //

// Connect to MongoDB
clientLogger.info(`Connecting to MongoDB...`)
mongoose.connect(`${process.env.MONGO_URL}`).then(() => {
    clientLogger.success(`Connected to MongoDB database`)
}).catch((err) => {
    clientLogger.error(`Failed to connect to MongoDB database, reason: ${err}`)
});

// ==================== //

async function runRandomQuiz(guild) {

    // Check if the guild has a quiz channel set
    const newGuild = await guildModel.findOne({guild_id: guild.guild_id});
    if (newGuild.random_quiz_interval <= 0 || !newGuild.random_quiz_channel) return;
    clientLogger.info(`Starting random quiz for guild ${guild.guild_id}...`)

    // Get the channel
    const channel = await client.channels.fetch(guild.random_quiz_channel);
    if (!channel) return clientLogger.warn(`Channel ${guild.random_quiz_channel} does not exist, skipping`)

    // Send the first question
    const {
        question,
        difficulty: questionDifficulty,
        correct_answer: correctAnswer,
        incorrect_answers: incorrectAnswers,
        category: questionCategory
    } = await fetchRandomQuestion();

    let allAnswers = [correctAnswer, ...incorrectAnswers];
    allAnswers = shuffleArray(allAnswers);
    allAnswers = allAnswers.map((answer) => decodeURI(answer));

    const embed = new EmbedBuilder()
        .setTitle(decodeURI(question))
        .setDescription(`Expires <t:${Math.floor(Date.now() / 1000) + 120}:R> or when someone answers correctly. `
            + `1.5x points for the first correct answer!`)
        .setColor(questionDifficulty === 'easy' ? '#4F9D55' : questionDifficulty === 'medium' ? '#B7B120' : '#B44C4E')
        .setFooter({text: `${getCategoryEmoji(questionCategory)} ${questionCategory} | ${emojis.difficulty[questionDifficulty]} ${capitalizeFirstLetter(questionDifficulty)}`});

    const buttons = createAnswerButtons(allAnswers, correctAnswer);
    let message;

    try {
        message = await channel.send({embeds: [embed], components: [buttons]});
    } catch (error) {
        clientLogger.error(`Failed to send message in channel ${guild.random_quiz_channel}`)
        clientLogger.error(error)
        return;
    }

    // Collect answers
    const userAnswers = [];
    const filter = (i) => {
        return i.customId === correctAnswer || incorrectAnswers.includes(i.customId);
    };

    const collector = message.createMessageComponentCollector({filter, time: 120000});
    let correctlyAnswered = false;

    // End the quiz when a user is correct
    collector.on('collect', async (i) => {

        // Check if the user has already answered
        if (userAnswers.some((answer) => answer.userId === i.user.id)) return i.reply({
            content: 'You have already answered this question',
            ephemeral: true
        });
        await i.reply({content: 'You answered **' + i.customId + '**', ephemeral: true});

        // Add the user to the list of users who answered correctly
        userAnswers.push({userId: i.user.id, answer: i.customId});

        // Award points to the user
        await awardPoints(questionDifficulty, i.user.id, 1.5);

        // Check if the user has already answered this question
        const user = await getUser(i.user.id);
        if (i.customId === correctAnswer) {

            correctlyAnswered = true;

            // Remove all buttons
            const newButtons = createAnswerButtons(allAnswers, correctAnswer, true);
            await message.edit({embeds: [embed], components: [newButtons]});

            // Send the result embed, saying that the user won
            const resultEmbed = new EmbedBuilder()
                .setTitle(`${i.user.displayName} won!`)
                .setDescription(`The correct answer was ${correctAnswer}`)
                .setColor('#4F9D55')

            await message.reply({embeds: [resultEmbed]});
            collector.stop();

        } else {
            user.correct_answers.push({question, amountOfTimes: 1, category: questionCategory});
        }
        await user.save();

    });

    // End the quiz when the time is up
    collector.on('end', async (collected) => {

        if (correctlyAnswered) return;

        // Remove all buttons
        const newButtons = createAnswerButtons(allAnswers, correctAnswer, true);
        await message.edit({embeds: [embed], components: [newButtons]});

        const resultEmbed = new EmbedBuilder()
            .setTitle(`The correct answer was ${correctAnswer}`)
            .setDescription(`Nobody answered correctly. The answer was **${correctAnswer}**`)
            .setColor('#B44C4E')

        await message.reply({embeds: [resultEmbed]});

    });

}

async function scheduleRandomQuizzes(guildId = null) {
    const guilds = await guildModel.find({random_quiz_interval: {$gt: 0}});
    const scheduledTasks = new Map();

    async function updateTask(guild) {
        const intervalInMinutes = guild.random_quiz_interval;
        const guildId = guild.guild_id;

        // Check if a task for this guild already exists and destroy it
        if (scheduledTasks.has(guildId)) scheduledTasks.get(guildId).destroy();


        // // Create new cron job to run the quiz
        // const task = cron.schedule(`*/${intervalInMinutes} * * * *`, async () => {
        //     await runRandomQuiz(guild);
        // });

        // Every 15 seconds
        const task2 = cron.schedule(`*/15 * * * * *`, async () => {
            await runRandomQuiz(guild);
        });

        scheduledTasks.set(guildId, task2);
    }

    // Create, update scheduled tasks for each guild
    if (guildId) {
        const guild = guilds.find((guild) => guild.guild_id === guildId);
        if (!guild) return clientLogger.warn(`Guild ${guildId} not found, skipping`);
        await updateTask(guild);
    } else {
        guilds.forEach((guild) => {
            updateTask(guild);
        });
    }

    // Handle guilds that no longer have scheduled tasks (e.g., when interval is set to 0) or ones with multiple tasks
    scheduledTasks.forEach((task, guildId) => {
        if (!guilds.some((guild) => guild.guild_id === guildId)) {
            task.destroy();
            scheduledTasks.delete(guildId);
        }

        if (guilds.filter((guild) => guild.guild_id === guildId).length > 1) {
            task.destroy();
            scheduledTasks.delete(guildId);
            updateTask(guilds.find((guild) => guild.guild_id === guildId));
        }
    });

}

async function getHelp(client, interaction, queriedCommand = null) {

    const data = [];
    const {commands} = client;

    if (queriedCommand) {

        const command = commands.get(queriedCommand);
        if (!command) return await interaction.reply({content: 'That\'s not a valid command!', ephemeral: true});

        data.push(`# ${command.data.name}`);
        data.push(`**Description** ${command.data.description}`);
        data.push(`**Usage** \`${command.data.name}${command.data.options ? command.data.options.map(option => ` <${option.name}>`) : ''}\``);

        if (command.data.options) {
            data.push(`## Arguments`);

            for (const option of command.data.options) {
                data.push(`- **${option.name}** ${option.description}`);
                data.push(`  - **Required** ${option.required}`);
                data.push(` - **Choices** ${option.choices ? option.choices.map(choice => `${choice.name}`).join(', ') : 'None'}`);
            }
        }


    } else {
        data.push('Here\'s a list of all my commands:');

        for (const command of commands) {
            data.push(`- **${command[1].data.name}** - ${command[1].data.description}`);
            data.push(`  - **Usage** \`${command[1].data.name}${command[1].data.options ? command[1].data.options.map(option => ` <${option.name}>`) : ''}\``);
        }

        data.push(`\nYou can send \`/help [command name]\` to get more info on a specific command!`);

    }

    const embed = new EmbedBuilder()
        .setTitle('Help')
        .setDescription(data.join('\n'))
        .setColor('#4F9D55')

    if (interaction.deferred) await interaction.followUp({embeds: [embed], ephemeral: true});
    else await interaction.reply({embeds: [embed], ephemeral: true});
}

// ==================== //

// Load commands and buttons
async function loadCommands(dir = './src/commands') {
    clientLogger.info(`Loading commands from ${dir}...`)
    const commandFiles = fs.readdirSync(path.join(__dirname, '..', dir)).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const command = require(path.join(__dirname, '..', dir, file));
        client.commands.set(command.name, command);
        clientLogger.success(`Loaded command ${chalk.bold(command.data.name)}`)
    }
}

async function loadButtons(dir = './src/buttons') {
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
    await latencyLogger(client);

    // Load commands and buttons, if the appropriate directory exists

    // If arg --no-commands is passed, don't load commands
    if (arguments.includes('--no-commands')) clientLogger.warn(`Skipping loading commands`)
    else if (fs.existsSync(path.join(__dirname, './commands/'))) {
        await loadCommands();
        await require('./handlers/commands')(client);
    } else clientLogger.warn(`Skipping loading commands as there is no commands directory`)

    // If arg --no-buttons is passed, don't load buttons
    if (arguments.includes('--no-buttons')) clientLogger.warn(`Skipping loading buttons`)
    else if (fs.existsSync(path.join(__dirname, './buttons/'))) {
        await loadButtons();
        await require('./handlers/buttons')(client);
    } else clientLogger.warn(`Skipping loading buttons as there is no buttons directory`)

    await scheduleRandomQuizzes(); // Schedule random quizzes
    setInterval(scheduleRandomQuizzes, 60 * 60 * 1000); // Update scheduled quizzes every hour

}).catch((err) => {
    clientLogger.error(`Failed to login to Discord`)
    clientLogger.error(err.stack)
});

// ==================== //

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
    clientLogger.error(`Unhandled rejection`)
    clientLogger.error(err)
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    clientLogger.error(`Uncaught exception`)
    clientLogger.error(err)
})

module.exports = {scheduleRandomQuizzes, getHelp};
