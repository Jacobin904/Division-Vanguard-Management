'use strict';

const { Events, ActivityType } = require('discord.js');
const { initialize } = require('../utils/keepAlive');
const { connecterAuVocal, demarrerSurveillance } = require('../utils/voiceManager');

// ============================================================================
// LISTE DES STATUTS EN ROTATION
// ============================================================================

const STATUTS = [
    {
        type: ActivityType.Watching,
        name: 'Division Vanguard | discord.gg/division-vanguard'
    },
    {
        type: ActivityType.Playing,
        name: '/ticket pour ouvrir un dossier'
    },
    {
        type: ActivityType.Watching,
        name: 'Surveillance active du serveur'
    },
    {
        type: ActivityType.Listening,
        name: '/serverinfo pour le rapport complet'
    },
    {
        type: ActivityType.Competing,
        name: 'Division Vanguard — Unité d\'élite'
    },
    {
        type: ActivityType.Watching,
        name: 'discord.gg/division-vanguard'
    },
    {
        type: ActivityType.Playing,
        name: '/message pour les annonces officielles'
    },
    {
        type: ActivityType.Listening,
        name: '/fiche pour consulter un dossier'
    },
    {
        type: ActivityType.Watching,
        name: 'Protection du serveur 24/7'
    },
    {
        type: ActivityType.Competing,
        name: 'Excellence et discipline'
    }
];

let indexStatut = 0;

// ============================================================================
// ÉVÉNEMENT PRÊT
// ============================================================================

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

        // Statut initial
        client.user.setPresence({
            activities: [STATUTS[0]],
            status: 'online'
        });

        // Rotation des statuts toutes les 5 secondes
        setInterval(() => {
            indexStatut = (indexStatut + 1) % STATUTS.length;
            
            client.user.setPresence({
                activities: [STATUTS[indexStatut]],
                status: 'online'
            });
        }, 5000);

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
