const { Events } = require('discord.js');

/**
 * Surveillance de tous les evenements de connexion/deconnexion
 */
module.exports = {
    registerAll(client) {
        // Deconnexion (Discord a coupe la connexion)
        client.on(Events.ShardDisconnect, (event, shardId) => {
            console.warn(`[SHARD ${shardId}] Deconnecte. Code : ${event.code}. Raison : ${event.reason || 'Inconnue'}`);
            console.log('[SHARD] Reconnexion automatique declenchee par Discord.js...');
        });

        // Reconnexion en cours
        client.on(Events.ShardReconnecting, (shardId) => {
            console.log(`[SHARD ${shardId}] Reconnexion en cours...`);
        });

        // Resume reussi (reconnexion sans perdre d'evenements)
        client.on(Events.ShardResume, (shardId, replayedEvents) => {
            console.log(`[SHARD ${shardId}] Reconnexion reussie. ${replayedEvents} evenements rejoues.`);
        });

        // Erreur WebSocket
        client.on(Events.ShardError, (error, shardId) => {
            console.error(`[SHARD ${shardId}] Erreur WebSocket :`, error);
        });

        // Rate limit (Discord nous demande de ralentir)
        client.on('rateLimit', (rateLimitData) => {
            console.warn('[RATE LIMIT] Detecte :', {
                timeout: rateLimitData.timeout,
                limit: rateLimitData.limit,
                method: rateLimitData.method,
                path: rateLimitData.route,
                route: rateLimitData.route
            });
        });

        // Warn Discord.js
        client.on(Events.Debug, (info) => {
            // On ne log que les messages importants pour eviter le spam
            if (info.includes('Heartbeat') || info.includes('connect') || info.includes('disconnect')) {
                console.log('[DEBUG]', info);
            }
        });

        // Erreur generale du client
        client.on(Events.Error, (error) => {
            console.error('[CLIENT ERROR]', error);
        });

        // Warn du client
        client.on(Events.Warn, (warning) => {
            console.warn('[CLIENT WARN]', warning);
        });

        console.log('[EVENTS] Tous les gestionnaires de statut enregistres.');
    }
};
