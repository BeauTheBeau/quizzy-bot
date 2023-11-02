const {SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle} = require('discord.js');
const {emojis, trivia_categories} = require('../misc.js');
const {getCategoryEmoji, capitalizeFirstLetter} = require('../utils/misc.js');
const { awardPoints, getUser, fetchRandomQuestion, shuffleArray, createAnswerButtons, collectAnswers } = require('../utils/quizUtils.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('quiz')
        .setDescription('Start a quiz!')
        .addIntegerOption(option => option
            .setName('rounds')
            .setDescription('The amount of rounds')
            .setRequired(false)
        )
        .addStringOption(option => option
            .setName('category')
            .setDescription('The category of the question')
            .setRequired(false)
            .setAutocomplete(true))
        .addStringOption(option => option
            .setName('difficulty')
            .setDescription('The difficulty of the question')
            .setRequired(false)
            .addChoices(
                {"name": "Easy", "value": "easy"},
                {"name": "Medium", "value": "medium"},
                {"name": "Hard", "value": "hard"}
            )),

    async autocomplete(interaction) {

        const focus = interaction.options.getFocused(true);

        if (focus.name === 'category') {
            const response = await fetch(`https://opentdb.com/api_category.php`);
            const data = await response.json(); // data: trivia_categories: [{ id, name }]

            const choices = data.trivia_categories.map(category => { return {name: category.name, value: category.id.toString()} });
            const filtered = choices.filter(choice => choice.name.toLowerCase().includes(focus.value.toLowerCase()));

            await interaction.respond(filtered.map(choice => ({name: choice.name, value: choice.value})))
        }
    },

    async execute(interaction) {

        const category = interaction.options.getString('category');
        const difficulty = interaction.options.getString('difficulty');
        const rounds = interaction.options.getInteger('rounds') || 5;
        let loadingMessage;

        let pointsTable = [];

        for (let i = 0; i < rounds; i++) {

            const {
                question,
                difficulty: questionDifficulty,
                correct_answer: correctAnswer,
                incorrect_answers: incorrectAnswers,
                category: questionCategory
            } = await fetchRandomQuestion(category, difficulty).catch((err) => {
                if (err.message === 'Invalid category') interaction.reply({content: 'Invalid category'});
            });


            let allAnswers = [correctAnswer, ...incorrectAnswers];
            allAnswers = shuffleArray(allAnswers);
            allAnswers = allAnswers.map((answer) => decodeURI(answer));

            if (i !== 0) loadingMessage = await interaction.channel.send({content: 'Loading...'});
            else await interaction.deferReply();

            const embed = new EmbedBuilder()
                .setTitle(`Q${i + 1}: ${question}`)
                .setDescription(`Answers due <t:${Math.floor(Date.now() / 1000) + 15}:R>`)
                .setColor(questionDifficulty === 'easy' ? '#4F9D55' : questionDifficulty === 'medium' ? '#B7B120' : '#B44C4E')
                .setFooter({
                    text: `${getCategoryEmoji(questionCategory)} ${questionCategory} | ${emojis.difficulty[questionDifficulty]} `
                        + `${capitalizeFirstLetter(questionDifficulty)}`,
                });

            const initialButtons = createAnswerButtons(allAnswers, correctAnswer);

            if (i !== 0) await loadingMessage.edit({embeds: [embed], components: [initialButtons], content: ''});
            else await interaction.followUp({embeds: [embed], components: [initialButtons]});

            const userAnswers = await collectAnswers(interaction, correctAnswer, incorrectAnswers, loadingMessage);
            const correctUsers = userAnswers.filter((answer) => answer.answer === correctAnswer) || [];
            const correctPercentage = Math.round((correctUsers.length / userAnswers.length) * 100) || 0;
            let answerString = '';

            for (let i = 0; i < allAnswers.length; i++) {
                if (allAnswers[i] === correctAnswer) answerString += `✅ **${allAnswers[i]}** `;
                else answerString += `❌ **${allAnswers[i]}** `;
                const users = userAnswers.filter((answer) => answer.answer === allAnswers[i]);
                for (let j = 0; j < users.length; j++) answerString += `<@${users[j].userId}> `;
                answerString += `\n`;
            }

            const resultEmbed = new EmbedBuilder()
                .setTitle(`The correct answer was ${correctAnswer}`)
                .setDescription(`${correctPercentage}% of people answered correctly\n\n${answerString}`)
                .setColor(correctPercentage >= 50 ? '#4F9D55' : '#B44C4E');

            if (i !== 0) await interaction.channel.send({embeds: [resultEmbed]});
            else await interaction.followUp({embeds: [resultEmbed]});

            for (let i = 0; i < correctUsers.length; i++) {
                const user = await getUser(correctUsers[i].userId);
                await awardPoints(questionDifficulty, correctUsers[i].userId);

                // Check if the user has already answered this question
                if (user.correct_answers.some((answer) => answer.question === question)) {
                    const index = user.correct_answers.findIndex((answer) => answer.question === question);
                    user.correct_answers[index].amountOfTimes++;
                } else {
                    user.correct_answers.push({question, amountOfTimes: 1, category: questionCategory});
                }

                await user.save();
            }

            for (let i = 0; i < userAnswers.length; i++) {
                if (correctUsers.some((user) => user.userId === userAnswers[i].userId)) continue;
                const user = await getUser(userAnswers[i].userId);

                // Check if the user has already answered this question
                if (user.incorrect_answers.some((answer) => answer.question === question)) {
                    const index = user.incorrect_answers.findIndex((answer) => answer.question === question);
                    user.incorrect_answers[index].amountOfTimes++;
                } else {
                    user.incorrect_answers.push({question, amountOfTimes: 1, category: questionCategory});
                }

                await user.save();
            }

            // Update the points table
            pointsTable = pointsTable.filter((user) => !correctUsers.some((correctUser) => correctUser.userId === user.userId));
            pointsTable = pointsTable.concat(correctUsers.map((user) => {
                return {userId: user.userId, points: user.answer === correctAnswer ? 1 : 0};
            }));

            // Wait 5 seconds before starting the next round
            if (i !== rounds - 1) {
                const nextRnd = await interaction.channel.send({content: 'Next round starting in 5 seconds...'});
                await new Promise(resolve => setTimeout(resolve, 5000));
                await nextRnd.delete();
            }
            else {
                interaction.channel.send({content: 'Quiz finished!'});
            }


        }

    },
};

