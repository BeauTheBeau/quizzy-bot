const {SlashCommandBuilder, EmbedBuilder} = require('discord.js');
const {getCategoryEmoji, capitalizeFirstLetter} = require('../utils/misc.js');
const { getUser } = require('../utils/quizUtils.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stats')
        .setDescription('View a user\'s stats')
        .addUserOption(option => option
            .setName('user')
            .setDescription('The user to view the stats of')
            .setRequired(false)
        ),


    async execute(interaction) {

        const user = interaction.options.getUser('user') || interaction.user;
        const userStats = await getUser(user.id);

        const winLossRatio = userStats.correct_answers.length / userStats.incorrect_answers.length

        // Loop through userStats.correct_answers, userStats.incorrect_answers and find the category with the most/least amount of correct answers
        let categoryCorrectAnswers = {}; let categoryIncorrectAnswers = {};

        userStats.correct_answers.forEach(answer => {
            const category = answer.category;
            if (categoryCorrectAnswers[category]) categoryCorrectAnswers[category] += 1;
            else categoryCorrectAnswers[category] = 1;
        });

        userStats.incorrect_answers.forEach(answer => {
            const category = answer.category;
            if (categoryIncorrectAnswers[category]) categoryIncorrectAnswers[category] += 1;
            else categoryIncorrectAnswers[category] = 1;
        });

        let worstCategory, bestCategory;

        try {
            worstCategory = Object.keys(categoryIncorrectAnswers).reduce((a, b) => categoryIncorrectAnswers[a] > categoryIncorrectAnswers[b] ? a : b);
            bestCategory = Object.keys(categoryCorrectAnswers).reduce((a, b) => categoryCorrectAnswers[a] > categoryCorrectAnswers[b] ? a : b);
        } catch (e) {
            worstCategory = 'None'
            bestCategory = 'None'
        }


        const embed = new EmbedBuilder()
            .setTitle(`${user.displayName}'s stats`)
            .setDescription(
                `**Points:** ${userStats.points}\n` +
                `**Win/loss ratio:** ${winLossRatio.toFixed(2)}\n` +
                `**Correct answers:** ${userStats.correct_answers.length}\n` +
                `**Incorrect answers:** ${userStats.incorrect_answers.length}\n` +
                `\n` +
                `**Worst category:** ${worstCategory}\n` +
                `**Best category:** ${bestCategory}\n`
            )
            .setColor('#FF0000')
            .setThumbnail(user.displayAvatarURL({dynamic: true}))

        await interaction.reply({embeds: [embed], ephemeral: false});



    }
}