'use strict';

require('dotenv').config();

const path = require('path');
const fs = require('fs');
const http = require('http');
const express = require('express');
const cookieParser = require('cookie-parser');
const { Client, Collection, GatewayIntentBits, Partials } = require('discord.js');

const voice = require('./utils/voiceManager');
const clientStatus = require('./events/clientStatus');

const GUILD_ID = '1501671610879312036';
const CODE_ACCES = '3057';
const PORT = Number(process.env.PORT) || 3000;
const SECRET_COOKIE = process.env.SESSION_SECRET || 'division-vanguard-change-ce-secret';
const NOM_COOKIE = 'dv_acces';
const DUREE_COOKIE = 12 * 60 * 60 * 1000;

const TOKEN = process.env.DISCORD_BOT_TOKEN || process.env.TOKEN;

if (!TOKEN) {
    console.error('[ERREUR] Aucun token trouvé. Définis DISCORD_BOT_TOKEN dans les variables d\'environnement.');
    process.exit(1);
}

const ROLES_STAFF = [
    '1502329914224017710', '1502321921113460827', '1502321894462980257', '1502321920652345484'
];

const ROLES_MILITAIRES = [
    '1502321913169707089', '1502321912314073251', '1502321911433138387', '1502321910665580745',
    '1502321909596033156', '1502321908966887424', '1502321908182552647', '1502321907431637132',
    '1502321906353701025', '1569021434125357056', '1502321905212985475', '1502321904026124438',
    '1502321903333806225', '1502321902020984842', '1502321900779737200', '1502321899751866550',
    '1569022303034146886', '1502321898350972980', '1502321897147203654', '1569022882288378017',
    '1502321896212009001', '1502472415127666780'
];

const ROLES_AUTORISES = [...ROLES_STAFF, ...ROLES_MILITAIRES];

// ============================================================================
// CLIENT DISCORD
// ============================================================================

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
        if (!commande?.data || !commande?.execute) continue;
        client.commands.set(commande.data.name, commande);
        console.log(`[COMMANDE] ${commande.data.name} chargée.`);
    } catch (erreur) {
        console.error(`[COMMANDE] ${fichier} : ${erreur.message}`);
    }
}

const dossierEvenements = path.join(__dirname, 'events');

for (const fichier of fs.readdirSync(dossierEvenements).filter((f) => f.endsWith('.js') && f !== 'clientStatus.js')) {
    try {
        const evenement = require(path.join(dossierEvenements, fichier));
        if (!evenement?.name || !evenement?.execute) continue;

        if (evenement.once) {
            client.once(evenement.name, (...args) => evenement.execute(...args, client));
        } else {
            client.on(evenement.name, (...args) => evenement.execute(...args, client));
        }

        console.log(`[ÉVÉNEMENT] ${evenement.name} chargé.`);
    } catch (erreur) {
        console.error(`[ÉVÉNEMENT] ${fichier} : ${erreur.message}`);
    }
}

clientStatus.registerAll(client);

process.on('uncaughtException', (erreur) => {
    console.error(`[ERREUR] ${erreur.stack || erreur.message}`);
});

process.on('unhandledRejection', (raison) => {
    console.error(`[PROMESSE] ${raison instanceof Error ? raison.message : raison}`);
});

// ============================================================================
// PORTAIL WEB — COOKIE SIGNÉ, AUCUNE SESSION EN MÉMOIRE
// ============================================================================

const app = express();

app.set('trust proxy', 1);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(SECRET_COOKIE));

function identifiantSession(req) {
    const valeur = req.signedCookies?.[NOM_COOKIE];
    if (!valeur || typeof valeur !== 'string') return null;
    if (!/^\d{17,20}$/.test(valeur)) return null;
    return valeur;
}

async function recupererMembre(id) {
    const guild = client.guilds.cache.get(GUILD_ID);
    if (!guild) return null;

    try {
        return await guild.members.fetch(id);
    } catch {
        return null;
    }
}

function estAutorise(membre) {
    if (!membre) return false;
    return membre.roles.cache.some((role) => ROLES_AUTORISES.includes(role.id));
}

app.get('/health', (req, res) => res.status(200).send('OK'));

app.get('/', (req, res) => {
    if (identifiantSession(req)) return res.redirect('/dashboard');
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/verify', async (req, res) => {
    const code = String(req.body.password || '').trim();
    const identifiant = String(req.body.discordId || '').trim();

    if (code !== CODE_ACCES) {
        return res.status(403).sendFile(path.join(__dirname, 'public', 'unauthorized.html'));
    }

    if (!/^\d{17,20}$/.test(identifiant)) {
        return res.status(400).send('Identifiant Discord invalide. Il doit contenir entre 17 et 20 chiffres.');
    }

    if (!client.isReady()) {
        return res.status(503).send('Le service Discord démarre. Réessaie dans quelques secondes.');
    }

    const membre = await recupererMembre(identifiant);

    if (!estAutorise(membre)) {
        return res.status(403).sendFile(path.join(__dirname, 'public', 'unauthorized.html'));
    }

    res.cookie(NOM_COOKIE, identifiant, {
        signed: true,
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: DUREE_COOKIE
    });

    console.log(`[WEB] Accès accordé à ${membre.user.username} (${identifiant}).`);
    res.redirect('/dashboard');
});

app.get('/dashboard', async (req, res) => {
    const identifiant = identifiantSession(req);
    if (!identifiant) return res.redirect('/');

    const membre = await recupererMembre(identifiant);

    if (!estAutorise(membre)) {
        res.clearCookie(NOM_COOKIE);
        return res.status(403).sendFile(path.join(__dirname, 'public', 'unauthorized.html'));
    }

    const roles = membre.roles.cache
        .filter((r) => r.id !== GUILD_ID)
        .sort((a, b) => b.position - a.position)
        .map((r) => ({ name: r.name, color: r.hexColor }));

    res.render('dashboard', {
        user: {
            id: membre.id,
            username: membre.user.username,
            discriminator: membre.user.discriminator,
            avatarURL: membre.user.displayAvatarURL({ size: 256, extension: 'png' })
        },
        roles,
        guild: {
            name: membre.guild.name,
            memberCount: membre.guild.memberCount,
            boostLevel: membre.guild.premiumTier,
            boostCount: membre.guild.premiumSubscriptionCount || 0
        }
    });
});

app.get('/logout', (req, res) => {
    res.clearCookie(NOM_COOKIE);
    res.redirect('/');
});

const serveur = http.createServer(app);

serveur.listen(PORT, () => {
    console.log(`[WEB] Portail sécurisé actif sur le port ${PORT}.`);
});

// ============================================================================
// CONNEXION DISCORD
// ============================================================================

let tentativesConnexion = 0;

async function connecterDiscord() {
    try {
        await client.login(TOKEN);
        tentativesConnexion = 0;
    } catch (erreur) {
        tentativesConnexion += 1;
        const delai = Math.min(10000 * tentativesConnexion, 120000);
        console.error(`[AUTHENTIFICATION] ${erreur.message}`);
        console.log(`[AUTHENTIFICATION] Nouvel essai dans ${delai / 1000} secondes.`);
        setTimeout(connecterDiscord, delai);
    }
}

connecterDiscord();

// ============================================================================
// ARRÊT PROPRE — INDISPENSABLE POUR ÉVITER LES INSTANCES FANTÔMES
// ============================================================================

let arretEnCours = false;

async function arreter(signal) {
    if (arretEnCours) return;
    arretEnCours = true;

    console.log(`[ARRÊT] Signal ${signal} reçu. Fermeture propre.`);

    try { voice.arreter(); } catch {}

    serveur.close(() => console.log('[WEB] Serveur fermé.'));

    try {
        await client.destroy();
        console.log('[DISCORD] Session fermée.');
    } catch {}

    setTimeout(() => process.exit(0), 500);
}

process.on('SIGTERM', () => arreter('SIGTERM'));
process.on('SIGINT', () => arreter('SIGINT'));
