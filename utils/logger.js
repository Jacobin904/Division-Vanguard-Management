const { EmbedBuilder } = require('discord.js');

/**
 * Envoie un log dans le salon logs-bot
 */
async function logAction(client, { title, description, color = 0x5865F2, fields = [] }) {
    const guild = client.guilds.cache.get('1501671610879312036');
    if (!guild) return;

    const logsChannel = guild.channels.cache.get('1502321982082125995');
    if (!logsChannel) return;

    const date = new Date();

    const embed = new EmbedBuilder()
        .setAuthor({
            name: `Division Vanguard Management - Journal`,
            iconURL: guild.iconURL({ size: 64 }) || undefined
        })
        .setTitle(`[JOURNAL] ${title}`)
        .setDescription(description)
        .setColor(color)
        .setTimestamp(date)
        .setFooter({ text: `Division Vanguard - Système de log automatique` });

    if (fields.length > 0) {
        // Ajouter un séparateur visuel avant les fields
        const newFields = [
            { name: '═══════ DÉTAILS ═══════', value: '\u200b', inline: false },
            ...fields
        ];
        embed.addFields(newFields);
    }

    try {
        await logsChannel.send({ embeds: [embed] });
    } catch (error) {
        console.error('Erreur lors de l\'envoi du log :', error);
    }
}

/**
 * Envoie un message formaté dans un salon spécifique
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
