'use strict';

const config = require('../config/guildConfig');

let clientDiscord = null;
let surveillanceActive = false;

function consommationMemoire() {
    const memoire = process.memoryUsage();
    const utilisee = (memoire.heapUsed / 1024 / 1024).toFixed(1);
    const allouee = (memoire.heapTotal / 1024 / 1024).toFixed(1);
    return `${utilisee} Mo / ${allouee} Mo`;
}

async function consignerAlerte(type, erreur) {
    if (!clientDiscord?.isReady()) return;

    try {
        const guild = clientDiscord.guilds.cache.get(config.guildId);
        if (!guild) return;

        const salon = guild.channels.cache.get(config.channels.logsBot);
        if (!salon?.isTextBased()) return;

        const details = erreur instanceof Error
            ? erreur.stack || erreur.message
            : String(erreur);

        const extrait = details.length > 1800
            ? `${details.slice(0, 1800)}…`
            : details;

        await salon.send({
            content: [
                '[ALERTE TECHNIQUE]',
                `Type : ${type}`,
                `Horodatage : ${new Date().toISOString()}`,
                '```',
                extrait,
                '```'
            ].join('\n')
        });
    } catch (e) {
        console.error(`[SURVEILLANCE] Consignation impossible : ${e.message}`);
    }
}

function initialize(client) {
    if (surveillanceActive) return;

    clientDiscord = client;
    surveillanceActive = true;

    console.log('[SURVEILLANCE] Contrôle périodique de la session activé.');

    setInterval(() => {
        if (!clientDiscord) return;

        if (!clientDiscord.isReady()) {
            console.warn('[SURVEILLANCE] Session indisponible. Le gestionnaire de connexion prend le relais.');
            return;
        }

        console.log(
            `[SURVEILLANCE] Session active. Latence : ${Math.round(clientDiscord.ws.ping)} ms. Mémoire : ${consommationMemoire()}.`
        );
    }, 300000);
}

module.exports = {
    initialize,
    consommationMemoire,
    consignerAlerte
};
