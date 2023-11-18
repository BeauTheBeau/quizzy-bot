const {SlashCommandBuilder, EmbedBuilder, Embed} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Replies with latency and API ping'),

    async execute(interaction) {
        const latency = Date.now() - interaction.createdTimestamp;
        const apiLatency = Math.round(interaction.client.ws.ping);
        let apiLatencyMsg;

        if (apiLatency < 0) apiLatencyMsg = '**API Latency:** `N/A` (Issues fetching latency)';
        else apiLatencyMsg = `**API Latency:** \`${apiLatency}ms\``;

        const pingEmbed = new EmbedBuilder()
            .setTitle('Pong!')
            .setDescription(`**Latency:** \`${latency}ms\`\n${apiLatencyMsg}`)
            .setColor('#3498db');

        return interaction.reply({ embeds: [pingEmbed], ephemeral: true });
    }
}