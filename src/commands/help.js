const {SlashCommandBuilder} = require('discord.js');

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

        const data = [];
        const {commands} = client;


        if (interaction.options.getString('command')) {

            const command = commands.get(interaction.options.getString('command'));
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

        return await interaction.reply({content: data.join('\n'), ephemeral: true});

    }
}
