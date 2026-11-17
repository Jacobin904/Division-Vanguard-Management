/**
 * Systeme de surveillance et de maintien en ligne du bot
 * Empeche le processus de crasher et surveille l'etat de la connexion
 */

let client = null;
let watchdogInterval = null;
let lastHeartbeat = Date.now();

/**
 * Initialise le systeme de keep-alive
 */
function initialize(clientInstance) {
    client = clientInstance;
    console.log('[KEEP-ALIVE] Systeme de surveillance active.');

    // Gestionnaire d'erreurs non capturees (empeche le crash)
    process.on('uncaughtException', (error) => {
        console.error('[KEEP-ALIVE] ERREUR NON CAPTUREE DETECTEE :', error);
        console.error('[KEEP-ALIVE] Le processus ne plantera pas, recuperation en cours...');
        logError('UNCAUGHT_EXCEPTION', error);
    });

    process.on('unhandledRejection', (reason, promise) => {
        console.error('[KEEP-ALIVE] PROMESSE REJETEE NON GERE :', reason);
        logError('UNHANDLED_REJECTION', reason);
    });

    process.on('SIGTERM', () => {
        console.log('[KEEP-ALIVE] Signal SIGTERM recu. Arret propre en cours...');
        gracefulShutdown('SIGTERM');
    });

    process.on('SIGINT', () => {
        console.log('[KEEP-ALIVE] Signal SIGINT recu. Arret propre en cours...');
        gracefulShutdown('SIGINT');
    });

    // Watchdog : verifie toutes les 60 secondes que le bot est bien connecte
    watchdogInterval = setInterval(() => {
        if (!client || !client.ws) {
            console.warn('[WATCHDOG] Client Discord non disponible.');
            return;
        }

        const ping = client.ws.ping;
        const isConnected = client.ws.status === 0; // 0 = READY
        
        if (!isConnected) {
            console.warn(`[WATCHDOG] Bot deconnecte ! Statut WebSocket : ${client.ws.status}. Reconnexion automatique en cours...`);
        } else {
            console.log(`[WATCHDOG] Bot en ligne. Ping : ${ping}ms. Memoire : ${getMemoryUsage()}`);
        }

        lastHeartbeat = Date.now();
    }, 60000);
}

/**
 * Arret propre du bot
 */
function gracefulShutdown(signal) {
    console.log(`[KEEP-ALIVE] Arret propre declenche par ${signal}.`);
    
    if (watchdogInterval) {
        clearInterval(watchdogInterval);
    }

    if (client && client.isReady()) {
        client.destroy().then(() => {
            console.log('[KEEP-ALIVE] Client Discord detruit proprement.');
            process.exit(0);
        }).catch((err) => {
            console.error('[KEEP-ALIVE] Erreur lors de la destruction du client :', err);
            process.exit(1);
        });
    } else {
        process.exit(0);
    }
}

/**
 * Log une erreur dans le salon logs-bot
 */
async function logError(type, error) {
    if (!client) return;

    try {
        const guild = client.guilds.cache.get('1501671610879312036');
        if (!guild) return;

        const logsChannel = guild.channels.cache.get('1502321982082125995');
        if (!logsChannel) return;

        const errorMessage = error instanceof Error ? error.stack || error.message : String(error);
        const truncated = errorMessage.length > 1900 ? errorMessage.substring(0, 1900) + '...' : errorMessage;

        await logsChannel.send({
            content: `[ALERTE CRITIQUE] Type : ${type}\nHeure : ${new Date().toUTCString()}\nDetails :\n\`\`\`\n${truncated}\n\`\`\``
        });
    } catch (e) {
        console.error('[KEEP-ALIVE] Impossible d\'envoyer le log d\'erreur :', e);
    }
}

/**
 * Retourne l'utilisation memoire formatee
 */
function getMemoryUsage() {
    const mem = process.memoryUsage();
    const mb = (mem.heapUsed / 1024 / 1024).toFixed(2);
    const total = (mem.heapTotal / 1024 / 1024).toFixed(2);
    return `${mb}MB / ${total}MB`;
}

/**
 * Force une reconnexion si le bot est deconnecte depuis trop longtemps
 */
function forceReconnectIfDead() {
    const timeSinceLastHeartbeat = Date.now() - lastHeartbeat;
    if (timeSinceLastHeartbeat > 300000 && client) { // 5 minutes sans heartbeat
        console.error('[WATCHDOG] Aucun heartbeat depuis 5 minutes. Reconnexion forcee...');
        logError('WATCHDOG_TIMEOUT', 'Aucun heartbeat depuis 5 minutes');
        try {
            client.destroy();
            setTimeout(() => {
                const config = require('../config');
                client.login(config.token);
            }, 5000);
        } catch (e) {
            console.error('[WATCHDOG] Erreur lors de la reconnexion forcee :', e);
        }
    }
}

module.exports = {
    initialize,
    getMemoryUsage,
    forceReconnectIfDead
};
