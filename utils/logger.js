'use strict';

const config = require('../config/guildConfig');
const { COULEURS, construireEmbed } = require('./ui');

async function recupererSalon(client, identifiant) {
    if (!identifiant) return null;
    const guild = client.guilds.cache.get(config.guildId);
    if (!guild) return null;
    const salon = guild.channels.cache.get(identifiant)
        || await guild.channels.fetch(identifiant).catch(() => null);
    if (!salon || !salon.isTextBased()) return null;
    return salon;
}

/**
 * Diffuse un message dans un salon donné, sans jamais interrompre le traitement.
 */
async function sendToChannel(client, identifiant, { content, embed, embeds, files, components } = {}) {
    try {
        const salon = await recupererSalon(client, identifiant);
        if (!salon) return null;
        return await salon.send({
            content: content || undefined,
            embeds: embeds || (embed ? [embed] : undefined),
            files: files || undefined,
            components: components || undefined
        });
    } catch (erreur) {
        console.error(`[JOURNAL] Diffusion impossible vers ${identifiant} :`, erreur.message);
        return null;
    }
}

/**
 * Consigne un événement administratif dans le salon de journalisation.
 */
async function logAction(client, { title, description, color = COULEURS.information, fields = [] }) {
    const guild = client.guilds.cache.get(config.guildId);
    const embed = construireEmbed(guild, {
        service: 'Division Vanguard — Journal du service',
        titre: title,
        description,
        couleur: color,
        champs: fields,
        pied: 'Division Vanguard — Journalisation automatique'
    });

    return sendToChannel(client, config.channels.logsBot, { embed });
}

module.exports = { logAction, sendToChannel, recupererSalon };
