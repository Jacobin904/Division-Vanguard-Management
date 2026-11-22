'use strict';

const { Events, ActivityType } = require('discord.js');
const { connecterVocal } = require('../utils/voiceManager');

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        console.log('============================================================');
        console.log(`[BOT] Connecté en tant que : ${client.user.tag}`);
        console.log(`[BOT] ID : ${client.user.id}`);
        console.log(`[BOT] Serveurs : ${client.guilds.cache.size}`);
        console.log('============================================================');

        // Statut fixe
        client.user.setPresence({
            activities: [{ name: '.gg/division-vanguard', type: ActivityType.Playing }],
            status: 'online'
        });

        // On attend 5 secondes pour être sûr que tous les salons sont en cache
        setTimeout(() => {
            const guild = client.guilds.cache.get('1501671610879312036');
            if (guild) {
                connecterVocal(guild);
            } else {
                console.error('[VOCAL] ERREUR : Serveur principal introuvable dans le cache.');
            }
        }, 5000);
    }
};
