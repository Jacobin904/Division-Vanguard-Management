'use strict';

const { Client, Collection, GatewayIntentBits, Partials, Events } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('./config');
const clientStatus = require('./events/clientStatus');
const http = require('http');

// ============================================================================
// SERVEUR HTTP POUR HEALTH CHECK RENDER
// ============================================================================

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
    if (req.url === '/health' || req.url === '/') {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('OK');
    } else {
        res.writeHead(404);
        res.end();
    }
});

server.listen(PORT, () => {
    console.log(`[HTTP] Serveur de health check actif sur le port ${PORT}`);
});

// ============================================================================
// CLIENT DISCORD
// ============================================================================

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildEmojisAndStickers,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ],
    partials: [Partials.Channel, Partials.GuildMember, Partials.User],
    ws: {
        large_threshold: 250,
        version: 10
    },
    closeTimeout: 15000,
    retryLimit: Infinity
});

client.commands = new Collection();

// ============================================================================
// CHARGEMENT DES COMMANDES
// ============================================================================

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    try {
        const command = require(path.join(commandsPath, file));
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
            console.log(`[CMD] Commande chargée : ${command.data.name}`);
        } else {
            console.warn(`[CMD] La commande ${file} manque data ou execute`);
        }
    } catch (error) {
        console.error(`[CMD] Erreur chargement ${file} :`, error);
    }
}

// ============================================================================
// CHARGEMENT DES ÉVÉNEMENTS
// ============================================================================

const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => 
    file.endsWith('.js') && file !== 'clientStatus.js'
);

for (const file of eventFiles) {
    try {
        const event = require(path.join(eventsPath, file));
        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args, client));
        } else {
            client.on(event.name, (...args) => event.execute(...args, client));
        }
        console.log(`[EVENT] Événement chargé : ${event.name}`);
    } catch (error) {
        console.error(`[EVENT] Erreur chargement ${file} :`, error);
    }
}

// Enregistrement des gestionnaires de statut WebSocket
clientStatus.registerAll(client);

// ============================================================================
// GESTIONNAIRE DE CONNEXION/RECONNEXION
// ============================================================================

let reconnectAttempts = 0;
const MAX_RECONNECT_DELAY = 60000;

client.on(Events.ShardDisconnect, () => {
    reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), MAX_RECONNECT_DELAY);
    console.log(`[RECONNECT] Tentative ${reconnectAttempts}. Prochain essai dans ${delay}ms.`);
});

client.on(Events.ShardReady, () => {
    reconnectAttempts = 0;
    console.log('[RECONNECT] Compteur de tentatives réinitialisé.');
});

// ============================================================================
// GESTION DES ERREURS GLOBALES
// ============================================================================

process.on('uncaughtException', (error) => {
    console.error('[ERREUR NON CAPTURÉE]', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('[PROMESSE REJETÉE]', reason);
});

// ============================================================================
// ARRÊT PROPRE
// ============================================================================

let isShuttingDown = false;

function gracefulShutdown(signal) {
    if (isShuttingDown) return;
    isShuttingDown = true;
    
    console.log(`[ARRÊT] Signal ${signal} reçu. Arrêt propre en cours...`);
    
    // Fermer le serveur HTTP
    server.close(() => {
        console.log('[HTTP] Serveur fermé.');
    });
    
    // Déconnecter le client Discord
    if (client.isReady()) {
        client.destroy().then(() => {
            console.log('[DISCORD] Client déconnecté proprement.');
            process.exit(0);
        }).catch((err) => {
            console.error('[DISCORD] Erreur lors de la déconnexion :', err);
            process.exit(1);
        });
    } else {
        process.exit(0);
    }
    
    // Timeout de sécurité
    setTimeout(() => {
        console.error('[ARRÊT] Timeout atteint, arrêt forcé.');
        process.exit(1);
    }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ============================================================================
// CONNEXION À DISCORD
// ============================================================================

async function loginWithRetry() {
    try {
        await client.login(config.token);
        console.log('[DISCORD] Connexion réussie.');
    } catch (error) {
        console.error('[DISCORD] Erreur de connexion :', error.message);
        console.log('[DISCORD] Nouvelle tentative dans 10 secondes...');
        setTimeout(loginWithRetry, 10000);
    }
}

loginWithRetry();

process.on('exit', (code) => {
    console.log(`[PROCESS] Processus terminé avec le code ${code}.`);
});
