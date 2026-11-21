'use strict';

const { Events } = require('discord.js');

const MODE_VERBEUX = process.env.LOGS_VERBEUX === 'true';

/**
 * Codes de fermeture WebSocket imposés par Discord.
 * Ils font partie du fonctionnement normal du service et ne doivent
 * jamais être présentés comme des incidents.
 */
const CODES_ROUTINE = new Set([
    4200, // Reconnexion demandée par Discord, session reprise
    1001, // Le serveur gateway redémarre
    1000  // Fermeture normale
]);

function horodatage() {
    return new Date().toISOString();
}

module.exports = {
    registerAll(client) {
        // Déconnexion du shard
        client.on(Events.ShardDisconnect, (event, shardId) => {
            const code = event?.code;
            const routine = CODES_ROUTINE.has(code);

            if (routine) {
                if (MODE_VERBEUX) {
                    console.log(`[GATEWAY] Entretien Discord (code ${code}). Reprise de la session en cours.`);
                }
                return;
            }

            console.warn(`[GATEWAY] Coupure inattendue (code ${code}). Reconnexion automatique.`);
        });

        // Reprise de session en cours
        client.on(Events.ShardReconnecting, (shardId) => {
            if (MODE_VERBEUX) {
                console.log(`[GATEWAY] Reprise de la session du shard ${shardId}.`);
            }
        });

        // Session reprise avec succès
        client.on(Events.ShardResume, (shardId, replayedEvents) => {
            if (MODE_VERBEUX) {
                console.log(`[GATEWAY] Session reprise. ${replayedEvents} événement(s) rejoué(s).`);
            }
        });

        // Shard prêt
        client.on(Events.ShardReady, (shardId) => {
            console.log(`[GATEWAY] Shard ${shardId} opérationnel.`);
        });

        // Erreur réelle sur le shard
        client.on(Events.ShardError, (error, shardId) => {
            console.error(`[GATEWAY] Erreur sur le shard ${shardId} : ${error.message}`);
        });

        // Limitation de débit
        client.on(Events.RateLimit, (data) => {
            console.warn(`[API] Limitation de débit atteinte sur ${data.route}. Pause de ${data.timeout} ms.`);
        });

        // Avertissement du client
        client.on(Events.Warn, (message) => {
            console.warn(`[CLIENT] ${message}`);
        });

        // Erreur du client
        client.on(Events.Error, (error) => {
            console.error(`[CLIENT] ${error.message}`);
        });

        // Les messages de débogage ne sont affichés qu'en mode verbeux
        if (MODE_VERBEUX) {
            client.on(Events.Debug, (info) => {
                console.log(`[DEBUG] ${info}`);
            });
        }

        console.log('[GATEWAY] Surveillance de la connexion activée.');
    }
};
