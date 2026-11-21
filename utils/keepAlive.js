'use strict';

let client = null;
let watchdogInterval = null;
let lastHeartbeat = Date.now();

function initialize(clientInstance) {
    client = clientInstance;
    console.log('[KEEP-ALIVE] Système de surveillance activé.');

    process.on('uncaughtException', (error) => {
        console.error('[KEEP-ALIVE] ERREUR NON CAPTURÉE DÉTECTÉE :', error);
        console.error('[KEEP-ALIVE] Le processus ne plantera pas, récupération en cours...');
        logError('UNCAUGHT_EXCEPTION', error);
    });

    process.on('unhandledRejection', (reason, promise) => {
        console.error('[KEEP-ALIVE] PROMESSE REJETÉE NON GÉRÉE :', reason);
        logError('UNHANDLED_REJECTION', reason);
    });

    // Watchdog : vérifie toutes les 60 secondes que le bot est bien connecté
    watchdogInterval = setInterval(() => {
        if (!client || !client.ws) {
            console.warn('[WATCHDOG] Client Discord non disponible.');
            return;
        }

        const ping = client.ws.ping;
        const isConnected = client.ws.status === 0;
        
        if (!isConnected) {
            console.warn(`[WATCHDOG] Bot déconnecté ! Statut WebSocket : ${client.ws.status}. Reconnexion automatique en cours...`);
        } else {
            console.log(`[WATCHDOG] Bot en ligne. Ping : ${ping}ms. Mémoire : ${getMemoryUsage()}`);
        }

        lastHeartbeat = Date.now();
    }, 60000);
}

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
            content: `[ALERTE CRITIQUE] Type : ${type}\nHeure : ${new Date().toUTCString()}\nDétails :\n\`\`\`\n${truncated}\n\`\`\``
        });
    } catch (e) {
        console.error('[KEEP-ALIVE] Impossible d\'envoyer le log d\'erreur :', e);
    }
}

function getMemoryUsage() {
    const mem = process.memoryUsage();
    const mb = (mem.heapUsed / 1024 / 1024).toFixed(2);
    const total = (mem.heapTotal / 1024 / 1024).toFixed(2);
    return `${mb}MB / ${total}MB`;
}

module.exports = {
    initialize,
    getMemoryUsage
};
