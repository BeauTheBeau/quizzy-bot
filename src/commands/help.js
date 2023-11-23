const {SlashCommandBuilder, EmbedBuilder} = require('discord.js');
const {getHelp} = require('../main');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('List all of my commands or info about a specific command.')
        .addStringOption(option =>
            option.setName('command')
                .setDescription('The command to get info on')
                .setRequired(false)
                .setAutocomplete(true)),

    async autocomplete(interaction, client) {

        const focusedValue = interaction.options.getFocused();
        const {commands} = client;

        const commandNames = Array.from(commands.keys()).filter(name => name)
        const filteredCommands = commandNames.filter(name => name.includes(focusedValue));
        await interaction.respond(filteredCommands.map(commandName => ({name: commandName, value: commandName})));

    },

    async execute(interaction, client) {
        await getHelp(client, interaction, interaction.options.getString('command'));
    }
}
