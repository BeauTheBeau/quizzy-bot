
const { emojis, trivia_categories } = require('../misc.js');
const {ActionRowBuilder, ButtonStyle, ButtonBuilder, EmbedBuilder} = require("discord.js");
const userSchema = require('../models/userModel.js');
const { logger, Logger } = require('./logger');

async function getUser(userId) {
    let user;
    try {
        user = await userSchema.findOne({ user_id: userId });
        if (!user) user = await userSchema.create({ user_id: userId });
    } catch (err) {
        logger.error(`Failed to get user`);
        logger.error(err.stack)
        return null;
    }

    return user;

}


async function fetchRandomQuestion(category, difficulty) {
    let url = `https://opentdb.com/api.php?amount=1&encode=url3986`;

    if (category) {
        const selectedCategory = trivia_categories.find(cat => cat.id.toString() === category);
        if (!selectedCategory) throw new Error('Invalid category');
        url += `&category=${category}`;
    }

    if (difficulty) url += `&difficulty=${difficulty}`;

    url = encodeURI(url);

    const response = await fetch(url);
    let data = await response.json();

    // Decode the question and answers
    data.results[0].question = decodeURIComponent(data.results[0].question);
    data.results[0].correct_answer = decodeURIComponent(data.results[0].correct_answer);
    data.results[0].incorrect_answers = data.results[0].incorrect_answers.map((answer) => decodeURIComponent(answer));
    data.results[0].category = decodeURIComponent(data.results[0].category);

    return data.results[0];
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }

    return array;

}

function createAnswerButtons(allAnswers, correctAnswer, reveal = false) {
    const answerButtons = new ActionRowBuilder();
    allAnswers.forEach((answer) => {
        answerButtons.addComponents(
            new ButtonBuilder()
                .setCustomId(answer)
                .setLabel(answer)
                .setStyle(reveal ? (answer === correctAnswer ? ButtonStyle.Success : ButtonStyle.Danger) : ButtonStyle.Primary)
                .setDisabled(reveal)
        );
    });
    return answerButtons;
}

function collectAnswers(interaction, correctAnswer, incorrectAnswers) {
    const userAnswers = [];

    const filter = (i) => {
        return i.customId === correctAnswer || incorrectAnswers.includes(i.customId);
    };

    const collector = interaction.channel.createMessageComponentCollector({
        filter,
        time: 15000,
    });

    collector.on('collect', async (i) => {
        if (userAnswers.some((answer) => answer.userId === i.user.id)) return i.reply({ content: 'You have already answered this question', ephemeral: true });
        userAnswers.push({ userId: i.user.id, answer: i.customId });
        await i.reply({ content: `Answered **${i.customId}**! Good luck!`, ephemeral: true });
    });

    return new Promise((resolve) => {
        collector.on('end', async () => {
            resolve(userAnswers);

            // Edit the interaction button row
            const answerButtons = createAnswerButtons([...incorrectAnswers, correctAnswer], correctAnswer, true);
            await interaction.editReply({ components: [answerButtons] });
        });
    });
}

async function awardPoints(difficulty, userId) {
    let points; difficulty = difficulty.toLowerCase();

    if (difficulty === 'easy') points = 1;
    else if (difficulty === 'medium') points = 3;
    else if (difficulty === 'hard') points = 5;
    else points = 0;

    const user = await getUser(userId);
    user.points += points;
    await user.save();

    return points;

}

module.exports = { fetchRandomQuestion, shuffleArray, createAnswerButtons, collectAnswers, awardPoints, getUser };