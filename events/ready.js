const { Events, ActivityType } = require('discord.js');
const { initialize } = require('../utils/keepAlive');

module.exports = {
    name: Events.ClientReady,
    once: true,
    execute(client) {
        console.log('='.repeat(60));
        console.log('[BOT] Connecte en tant que : ' + client.user.tag);
        console.log('[BOT] ID : ' + client.user.id);
        console.log('[BOT] Serveurs : ' + client.guilds.cache.size);
        console.log('[BOT] Membres totaux : ' + client.guilds.cache.reduce((acc, g) => acc + g.memberCount, 0));
        console.log('[BOT] Heure de connexion : ' + new Date().toUTCString());
        console.log('='.repeat(60));

        // Activation du systeme de keep-alive
        initialize(client);

        // Presence personnalisee
        client.user.setPresence({
            activities: [{ name: 'Division Vanguard | Surveillance active', type: ActivityType.Watching }],
            status: 'online'
        });

        // Force le statut en ligne en permanence (empeche Discord de le mettre idle)
        setInterval(() => {
            if (client.user && client.ws.status === 0) {
                client.user.setStatus('online');
            }
        }, 300000); // Toutes les 5 minutes
    }
};
