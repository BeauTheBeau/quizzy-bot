require('dotenv').config()
const {SlashCommandBuilder, EmbedBuilder} = require('discord.js');
const {ActionRowBuilder, ButtonBuilder, ButtonStyle} = require('discord.js');
const {getHelp} = require('../main');

const config = require('../../config.json');

const emojis = {
    "github": "<:github:1175470408678510692>",
    "discordjs": "<:discordjs:1175471859697995859>",
    "education": ":student:",
}
const links = {
    "github": "https://github.com/beauthebeau",
    "botGithub": "https://github.com/beauthebeau/quizzy-bot",
    "discordjs": "https://discord.js.org",
    "readme": "https://github.com/beauthebeau/quizzy-bot/blob/master/README.md"
}

module.exports = {

    data: new SlashCommandBuilder()
        .setName('about')
        .setDescription('Get information about the bot'),

    async execute(interaction) {

        const embed = new EmbedBuilder()
            .setTitle('About')
            .setDescription(
                `${process.env.BOT_NAME} was initially made over 3 days for the *DDevs Buildathon * by <@729567972070391848> `
                + `([${emojis.github} GitHub](${links.github})) for the **${emojis.education} Education** category.`
                + `\n\n`
                + `The bot is written in JavaScript using the [${emojis.discordjs} discord.js](${links.discordjs}) library `
                + `and uses the [Open Trivia Database](https://opentdb.com) to generate questions.`
                + `\n\n`
                + `The bot is currently in a usable state, but is still under development and will be improved over `
                + `time. You can view the source code on [${emojis.github} GitHub](${links.botGithub}).`
                + `\n\n`
                + `Got a suggestion or bug report? Tell us on [${emojis.github} GitHub](${links.botGithub}) or `
                + `join our [support server](${config.links.support}).`
                + `\nFor more information, see [the README](${links.readme}).`
            )

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('❔')
                    .setLabel('Help')
                    .setCustomId('help'),
                new ButtonBuilder()
                    .setStyle(ButtonStyle.Link)
                    .setLabel('GitHub')
                    .setEmoji(emojis.github)
                    .setURL(links.botGithub),
                new ButtonBuilder()
                    .setStyle(ButtonStyle.Link)
                    .setLabel('Invite')
                    .setURL(config.links.invite),
                new ButtonBuilder()
                    .setStyle(ButtonStyle.Link)
                    .setLabel('Support Server')
                    .setURL(config.links.support)
            )

        await interaction.reply({embeds: [embed], ephemeral: true, components: [row]});

        const filter = i => i.customId === 'help' && i.user.id === interaction.user.id;
        const collector = interaction.channel.createMessageComponentCollector({filter, time: 60_000});

        collector.on('collect', async i => {
            await i.deferUpdate();
            await getHelp(i.client, i);
        });

        collector.on('end', async () => {
            row.components[0].setDisabled(true);
            await interaction.editReply({components: [row]});
        });

    }
}
