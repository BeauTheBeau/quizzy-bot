const {SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle} = require('discord.js');
const userSchema = require('../models/userModel.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('delete-me')
        .setDescription('Deletes your data from our database'),

    async execute(interaction) {

        const user = await userSchema.findOne({ user_id: interaction.user.id });
        if (!user) return interaction.reply({content: 'You don\'t have any data stored in our database', ephemeral: true});
        await userSchema.deleteOne({ user_id: interaction.user.id });
        await interaction.reply({content: 'Your data has been deleted from our database', ephemeral: true});

    }
}