const {SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle} = require('discord.js');
const userSchema = require('../models/userModel.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('View the leaderboard')
        .addIntegerOption(option => option
            .setName('page')
            .setDescription('The page of the leaderboard to view')
            .setRequired(false)
        )
        .addStringOption(option => option
            .setName('sort')
            .setDescription('The way to sort the leaderboard')
            .setRequired(false)
            .addChoices(
                {"name": "Points", "value": "points"},
                {"name": "Correct Ratio", "value": "ratio"}
            )),


    async execute(interaction) {

        const page = interaction.options.getInteger('page') || 1;
        const sort = interaction.options.getString('sort') || 'points';
        let leaderboard;

        if (sort === 'points') {
            leaderboard = await userSchema.find({}).sort({points: -1});
        }

        // For the ratio, we need to loop through all users and calculate the ratio
        if (sort === 'ratio') {
            leaderboard = await userSchema.find({});
            leaderboard = leaderboard.map(user => {
                const ratio = user.correct_answers.length / user.incorrect_answers.length;
                return {user_id: user.user_id, points: ratio};
            });
            leaderboard.sort((a, b) => b.points - a.points);
        }


        let embed = new EmbedBuilder()
            .setTitle(`Leaderboard`)
            .setColor('#FF0000')
            .setThumbnail(interaction.client.user.displayAvatarURL({dynamic: true}))

        if (sort === 'points') {
            embed.setDescription(
                leaderboard.slice((page - 1) * 10, page * 10).map((user, index) => {
                    return `**${index + 1 + (page - 1) * 10}.** <@${user.user_id}> - ${user.points} points`
                }).join('\n')
            )
        } else if (sort === 'ratio') {
            embed.setDescription(
                leaderboard.slice((page - 1) * 10, page * 10).map((user, index) => {
                    return `**${index + 1 + (page - 1) * 10}.** <@${user.user_id}> - ${user.points.toFixed(2)} ratio`
                }).join('\n')
            )
        }

        const pageRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('leaderboard_previous')
                    .setLabel('Previous')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(page === 1),
                new ButtonBuilder()
                    .setCustomId('leaderboard_next')
                    .setLabel('Next')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(page * 10 >= leaderboard.length)
            )

        await interaction.reply({embeds: [embed], components: [pageRow], ephemeral: true});

        const collector = interaction.channel.createMessageComponentCollector({
            filter: (i) => i.user.id === interaction.user.id,
            time: 60000,
        });

        collector.on('collect', async (i) => {

            if (i.customId === 'leaderboard_previous') {
                await i.deferUpdate();
                await i.editReply({embeds: [embed], components: [pageRow], ephemeral: true});
            } else if (i.customId === 'leaderboard_next') {
                await i.deferUpdate();
                await i.editReply({embeds: [embed], components: [pageRow], ephemeral: true});
            }

        });

    }

}
