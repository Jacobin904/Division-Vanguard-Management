const { Client, Collection, GatewayIntentBits, Partials, Events } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('./config');
const clientStatus = require('./events/clientStatus');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildEmojisAndStickers,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildPresences
    ],
    partials: [Partials.Channel, Partials.GuildMember, Partials.User],
    // Parametres de reconnexion agressifs
    ws: {
        large_threshold: 250,
        version: 10
    },
    // Timeout plus long avant de considerer une deconnexion
    closeTimeout: 15000,
    // Retry automatiquement en cas d'echec de connexion
    retryLimit: Infinity
});

client.commands = new Collection();

// Chargement des commandes
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    try {
        const command = require(path.join(commandsPath, file));
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
            console.log(`[CMD] Commande chargee : ${command.data.name}`);
        } else {
            console.warn(`[CMD] La commande ${file} manque data ou execute`);
        }
    } catch (error) {
        console.error(`[CMD] Erreur chargement ${file} :`, error);
    }
}

// Chargement des evenements
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js') && file !== 'clientStatus.js');

for (const file of eventFiles) {
    try {
        const event = require(path.join(eventsPath, file));
        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args, client));
        } else {
            client.on(event.name, (...args) => event.execute(...args, client));
        }
        console.log(`[EVENT] Evenement charge : ${event.name}`);
    } catch (error) {
        console.error(`[EVENT] Erreur chargement ${file} :`, error);
    }
}

// Enregistrement des gestionnaires de statut WebSocket
clientStatus.registerAll(client);

// Gestionnaire de connexion/reconnexion automatique
let reconnectAttempts = 0;
const MAX_RECONNECT_DELAY = 60000;

client.on(Events.ShardDisconnect, () => {
    reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), MAX_RECONNECT_DELAY);
    console.log(`[RECONNECT] Tentative ${reconnectAttempts}. Prochain essai dans ${delay}ms.`);
});

client.on(Events.ShardReady, () => {
    reconnectAttempts = 0;
    console.log('[RECONNECT] Compteur de tentatives reinitialise.');
});

// Login avec retry automatique
async function loginWithRetry() {
    try {
        await client.login(config.token);
    } catch (error) {
        console.error('[LOGIN] Erreur de connexion :', error.message);
        console.log('[LOGIN] Nouvelle tentative dans 10 secondes...');
        setTimeout(loginWithRetry, 10000);
    }
}

loginWithRetry();

// Message final de securite
process.on('exit', (code) => {
    console.log(`[PROCESS] Processus termine avec le code ${code}.`);
});
