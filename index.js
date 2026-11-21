'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const {
    Client,
    Collection,
    GatewayIntentBits,
    Partials,
    Events
} = require('discord.js');

const config = require('./config');
const clientStatus = require('./events/clientStatus');

const PORT = Number(process.env.PORT) || 3000;

const serveur = http.createServer((requete, reponse) => {
    reponse.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    reponse.end('OK');
});

serveur.listen(PORT, () => {
    console.log(`[HTTP] Sonde de disponibilité active sur le port ${PORT}.`);
});

serveur.on('error', (erreur) => {
    console.error(`[HTTP] Erreur du serveur : ${erreur.message}`);
});

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildEmojisAndStickers,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ],
    partials: [Partials.Channel, Partials.GuildMember, Partials.User]
});

client.commands = new Collection();

const dossierCommandes = path.join(__dirname, 'commands');

for (const fichier of fs.readdirSync(dossierCommandes).filter((f) => f.endsWith('.js'))) {
    try {
        const commande = require(path.join(dossierCommandes, fichier));

        if (!commande?.data || !commande?.execute) {
            console.warn(`[COMMANDE] ${fichier} ignoré : structure invalide.`);
            continue;
        }

        client.commands.set(commande.data.name, commande);
        console.log(`[COMMANDE] ${commande.data.name} chargée.`);
    } catch (erreur) {
        console.error(`[COMMANDE] Échec du chargement de ${fichier} : ${erreur.message}`);
    }
}

const dossierEvenements = path.join(__dirname, 'events');

for (const fichier of fs.readdirSync(dossierEvenements).filter((f) => f.endsWith('.js') && f !== 'clientStatus.js')) {
    try {
        const evenement = require(path.join(dossierEvenements, fichier));

        if (!evenement?.name || !evenement?.execute) {
            console.warn(`[ÉVÉNEMENT] ${fichier} ignoré : structure invalide.`);
            continue;
        }

        if (evenement.once) {
            client.once(evenement.name, (...args) => evenement.execute(...args, client));
        } else {
            client.on(evenement.name, (...args) => evenement.execute(...args, client));
        }

        console.log(`[ÉVÉNEMENT] ${evenement.name} chargé.`);
    } catch (erreur) {
        console.error(`[ÉVÉNEMENT] Échec du chargement de ${fichier} : ${erreur.message}`);
    }
}

clientStatus.registerAll(client);

process.on('uncaughtException', (erreur) => {
    console.error(`[ERREUR] Exception non interceptée : ${erreur.stack || erreur.message}`);
});

process.on('unhandledRejection', (raison) => {
    const message = raison instanceof Error ? raison.stack || raison.message : String(raison);
    console.error(`[ERREUR] Promesse rejetée non traitée : ${message}`);
});

process.on('SIGTERM', () => {
    console.log('[SIGNAL] SIGTERM reçu et ignoré. Le service demeure actif.');
});

process.on('SIGINT', () => {
    console.log('[SIGNAL] SIGINT reçu et ignoré. Le service demeure actif.');
});

let tentatives = 0;

async function connecter() {
    try {
        await client.login(config.token);
        tentatives = 0;
    } catch (erreur) {
        tentatives += 1;
        const delai = Math.min(10000 * tentatives, 120000);

        console.error(`[AUTHENTIFICATION] Échec de la connexion : ${erreur.message}`);
        console.log(`[AUTHENTIFICATION] Nouvelle tentative dans ${delai / 1000} secondes.`);

        setTimeout(connecter, delai);
    }
}

connecter();

setInterval(() => {
    if (!client.isReady()) {
        console.warn('[SURVEILLANCE] Session Discord indisponible. Tentative de rétablissement.');
        connecter().catch(() => {});
    }
}, 120000);

process.on('exit', (code) => {
    console.log(`[PROCESSUS] Arrêt avec le code ${code}.`);
});
