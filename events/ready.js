'use strict';

const { Events, ActivityType } = require('discord.js');
const { initialize } = require('../utils/keepAlive');
const { connecterAuVocal, demarrerSurveillance } = require('../utils/voiceManager');

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

        // Statut fixe
        client.user.setPresence({
            activities: [
                {
                    name: '.gg/division-vanguard',
                    type: ActivityType.Playing
                }
            ],
            status: 'online'
        });

        // Force le statut en ligne en permanence
        setInterval(() => {
            if (client.user && client.ws.status === 0) {
                client.user.setStatus('online');
            }
        }, 300000);

        // Connexion vocale différée
        setTimeout(async () => {
            const guild = client.guilds.cache.get('1501671610879312036');
            if (guild) {
                const succes = await connecterAuVocal(guild);
                demarrerSurveillance(client);
                
                if (!succes) {
                    console.log('[VOCAL] Première tentative échouée, la surveillance continuera de réessayer.');
                }
            } else {
                console.error('[BOT] Serveur principal introuvable.');
            }
        }, 8000);
    }
};
