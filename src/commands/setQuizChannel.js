const {SlashCommandBuilder, EmbedBuilder} = require('discord.js');
const { getGuild } = require('../utils/quizUtils.js');


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

        guild.random_quiz_channel = channel.id;
        guild.random_quiz_interval = interval;
        await guild.save();

        await interaction.reply({embeds: [
            new EmbedBuilder()
                .setTitle(`Quiz channel set!`)
                .setDescription(`The quiz channel has been set to <#${channel.id}> and the interval has been set to ${interval} minutes.`)
        ]});

    }

}
