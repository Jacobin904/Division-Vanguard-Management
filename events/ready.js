'use strict';

const { Events, ActivityType } = require('discord.js');
const { initialize } = require('../utils/keepAlive');
const voice = require('../utils/voiceManager');

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
            activities: [{ name: '.gg/division-vanguard', type: ActivityType.Playing }],
            status: 'online'
        });

        setTimeout(() => voice.initialiser(client), 5000);
    }
};
