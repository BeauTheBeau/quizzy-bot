const {SlashCommandBuilder, PermissionsBitField, EmbedBuilder} = require('discord.js');
const { getGuild } = require('../utils/quizUtils.js');
const { scheduleRandomQuizzes } = require('../main.js');

module.exports = {

    data: new SlashCommandBuilder()
        .setName(`quizchannel`)
        .setDescription(`Set the channel for the random quiz`)
        .addChannelOption(option => option
            .setName('channel')
            .setDescription('The channel for the random quiz')
            .setRequired(true)
        )
        .addIntegerOption(option => option
            .setName('interval')
            .setDescription('The interval for the random quiz, in minutes')
            .setRequired(false)
        ),

    async execute(interaction) {

        const guild = await getGuild(interaction.guildId);

        const channel = interaction.options.getChannel('channel');
        const interval = interaction.options.getInteger('interval') || 60;

        // Check if the channel is a text channel
        if (channel.type !== 0) return await interaction.reply({content: `The channel must be a text channel!`, ephemeral: true});

        try {

            // Check if the bot can send messages in the channel
            const message = await channel.send({content: `This is a test message to check if the bot can send messages in this channel.`});
            await message.delete();

        } catch (error) {

            // If not, return an error
            return await interaction.reply({content: `The bot cannot send messages in that channel!`, ephemeral: true});

        }

        guild.random_quiz_channel = channel.id;
        guild.random_quiz_interval = interval;
        await guild.save();

        await interaction.reply({embeds: [
            new EmbedBuilder()
                .setTitle(`Quiz channel set!`)
                .setDescription(`The quiz channel has been set to <#${channel.id}> and the interval has been set to ${interval} minutes.`)
        ]});

        await scheduleRandomQuizzes();

    }

}
