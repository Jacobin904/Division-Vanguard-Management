const { EmbedBuilder } = require('discord.js');

/**
 * Envoie un log dans le salon logs-bot
 */
async function logAction(client, { title, description, color = 0x5865F2, fields = [] }) {
    const guild = client.guilds.cache.get('1501671610879312036');
    if (!guild) return;

    const logsChannel = guild.channels.cache.get('1502321982082125995');
    if (!logsChannel) return;

    const embed = new EmbedBuilder()
        .setTitle(`[LOG] ${title}`)
        .setDescription(description)
        .setColor(color)
        .setTimestamp()
        .setFooter({ text: `Division Vanguard Management` });

    if (fields.length > 0) {
        embed.addFields(fields);
    }

    try {
        await logsChannel.send({ embeds: [embed] });
    } catch (error) {
        console.error('Erreur lors de l\'envoi du log :', error);
    }
}

/**
 * Envoie un message formate dans un salon specifique
 */
async function sendToChannel(client, channelId, { content, embed }) {
    const guild = client.guilds.cache.get('1501671610879312036');
    if (!guild) return;

    const channel = guild.channels.cache.get(channelId);
    if (!channel) return;

    try {
        await channel.send({ content, embeds: embed ? [embed] : undefined });
    } catch (error) {
        console.error(`Erreur envoi salon ${channelId} :`, error);
    }
}

module.exports = { logAction, sendToChannel };
