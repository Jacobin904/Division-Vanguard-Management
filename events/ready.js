'use strict';

const { Events, ActivityType } = require('discord.js');
const { initialize } = require('../utils/keepAlive');
const config = require('../config/guildConfig');

module.exports = {
    name: Events.ClientReady,
    once: true,

    async execute(client) {
        console.log('============================================================');
        console.log(`[BOT] Session ouverte : ${client.user.tag}`);
        console.log(`[BOT] Identifiant : ${client.user.id}`);
        console.log(`[BOT] Serveurs desservis : ${client.guilds.cache.size}`);
        console.log(`[BOT] Horodatage : ${new Date().toISOString()}`);
        console.log('============================================================');

        initialize(client);

        client.user.setPresence({
            activities: [
                {
                    name: 'Division Vanguard — Surveillance active',
                    type: ActivityType.Watching
                }
            ],
            status: 'online'
        });

        // Connexion vocale différée pour ne pas concurrencer l'ouverture de session
        setTimeout(async () => {
            try {
                const { connecterAuVocal, demarrerSurveillance } = require('../utils/voiceManager');
                const guild = client.guilds.cache.get(config.guildId);

                if (!guild) {
                    console.warn('[VOCAL] Serveur principal introuvable.');
                    return;
                }

                await connecterAuVocal(guild);
                demarrerSurveillance(client);
            } catch (erreur) {
                console.error(`[VOCAL] Initialisation impossible : ${erreur.message}`);
            }
        }, 8000);
    }
};
