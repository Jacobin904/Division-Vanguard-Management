'use strict';

const { Events, ActivityType } = require('discord.js');
const { initialize } = require('../utils/keepAlive');
const { connecterAuVocal, demarrerSurveillance } = require('../utils/voiceManager');

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        console.log('='.repeat(60));
        console.log('[BOT] Connecté en tant que : ' + client.user.tag);
        console.log('[BOT] ID : ' + client.user.id);
        console.log('[BOT] Serveurs : ' + client.guilds.cache.size);
        console.log('[BOT] Membres totaux : ' + client.guilds.cache.reduce((acc, g) => acc + g.memberCount, 0));
        console.log('[BOT] Heure de connexion : ' + new Date().toUTCString());
        console.log('='.repeat(60));

        // Activation du système de keep-alive
        initialize(client);

        // Connexion au salon vocal
        const guild = client.guilds.cache.get('1501671610879312036');
        if (guild) {
            await connecterAuVocal(guild);
            demarrerSurveillance(client);
        } else {
            console.error('[BOT] Serveur principal introuvable.');
        }

        // Présence personnalisée
        client.user.setPresence({
            activities: [{ name: 'Division Vanguard | Surveillance active', type: ActivityType.Watching }],
            status: 'online'
        });

        // Force le statut en ligne en permanence
        setInterval(() => {
            if (client.user && client.ws.status === 0) {
                client.user.setStatus('online');
            }
        }, 300000); // Toutes les 5 minutes
    }
};
