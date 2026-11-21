'use strict';

require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const session = require('express-session');
const fetch = require('node-fetch');
const { Client, Collection, GatewayIntentBits, Partials } = require('discord.js');

const GUILD_ID = '1501671610879312036';
const MOT_DE_PASSE_SITE = '3057';

const ROLE_STAFF = [
    '1502329914224017710', '1502321921113460827', '1502321894462980257', '1502321920652345484'
];
const ROLE_MILITAIRE = [
    '1502321913169707089', '1502321912314073251', '1502321911433138387', '1502321910665580745',
    '1502321909596033156', '1502321908966887424', '1502321908182552647', '1502321907431637132',
    '1502321906353701025', '1569021434125357056', '1502321905212985475', '1502321904026124438',
    '1502321903333806225', '1502321902020984842', '1502321900779737200', '1502321899751866550',
    '1569022303034146886', '1502321898350972980', '1502321897147203654', '1569022882288378017',
    '1502321896212009001', '1502472415127666780'
];
const ROLES_AUTORISES = [...ROLE_STAFF, ...ROLE_MILITAIRE];

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildEmojisAndStickers, GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildPresences, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent
    ],
    partials: [Partials.Channel, Partials.GuildMember, Partials.User]
});

client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
for (const file of fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'))) {
    try {
        const command = require(path.join(commandsPath, file));
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
        }
    } catch (error) {
        console.error(`[BOT] Erreur chargement ${file} :`, error);
    }
}

const eventsPath = path.join(__dirname, 'events');
for (const file of fs.readdirSync(eventsPath).filter(f => f.endsWith('.js') && f !== 'clientStatus.js')) {
    try {
        const event = require(path.join(eventsPath, file));
        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args, client));
        } else {
            client.on(event.name, (...args) => event.execute(...args, client));
        }
    } catch (error) {
        console.error(`[BOT] Erreur chargement événement ${file} :`, error);
    }
}

process.on('SIGTERM', () => console.log('[SIGNAL] SIGTERM ignoré.'));
process.on('SIGINT', () => console.log('[SIGNAL] SIGINT ignoré.'));

client.login(process.env.DISCORD_BOT_TOKEN).catch(err => {
    console.error('[BOT] Échec connexion Discord :', err.message);
});

const app = express();
const PORT = process.env.PORT || 3000;

app.set('trust proxy', 1);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: process.env.SESSION_SECRET || 'secret_par_defaut',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000
    }
}));

app.get('/', (req, res) => {
    if (req.session.authenticated) {
        return res.redirect('/dashboard');
    }
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/verify', async (req, res) => {
    const { password, discordId } = req.body;

    console.log(`[WEB] Tentative de connexion avec ID: ${discordId}`);

    if (password !== MOT_DE_PASSE_SITE) {
        console.log('[WEB] Mot de passe incorrect');
        return res.status(403).sendFile(path.join(__dirname, 'public', 'unauthorized.html'));
    }

    if (!discordId || discordId.length < 15) {
        console.log('[WEB] ID Discord invalide');
        return res.status(400).send('ID Discord invalide.');
    }

    try {
        const response = await fetch(`https://discord.com/api/v10/guilds/${GUILD_ID}/members/${discordId}`, {
            headers: { 'Authorization': `Bot ${process.env.DISCORD_BOT_TOKEN}` }
        });

        if (!response.ok) {
            console.log(`[WEB] Utilisateur non trouvé sur le serveur (code ${response.status})`);
            return res.status(403).sendFile(path.join(__dirname, 'public', 'unauthorized.html'));
        }

        const member = await response.json();
        const aUnRoleAutorise = member.roles.some(role => ROLES_AUTORISES.includes(role));

        if (!aUnRoleAutorise) {
            console.log('[WEB] Rôles insuffisants');
            return res.status(403).sendFile(path.join(__dirname, 'public', 'unauthorized.html'));
        }

        const userResponse = await fetch(`https://discord.com/api/v10/users/${discordId}`, {
            headers: { 'Authorization': `Bot ${process.env.DISCORD_BOT_TOKEN}` }
        });

        if (!userResponse.ok) {
            return res.status(500).send('Erreur récupération utilisateur.');
        }

        const user = await userResponse.json();

        req.session.authenticated = true;
        req.session.user = {
            id: user.id,
            username: user.username,
            discriminator: user.discriminator,
            avatar: user.avatar,
            roles: member.roles
        };

        console.log(`[WEB] Connexion réussie pour ${user.username}`);
        res.redirect('/dashboard');

    } catch (error) {
        console.error('[WEB] Erreur vérification :', error);
        res.status(500).send('Erreur interne.');
    }
});

app.get('/dashboard', (req, res) => {
    if (!req.session.authenticated) {
        return res.redirect('/');
    }
    
    const guild = client.guilds.cache.get(GUILD_ID);
    const member = guild ? guild.members.cache.get(req.session.user.id) : null;
    
    const userRoles = member ? member.roles.cache
        .filter(r => r.id !== GUILD_ID)
        .sort((a, b) => b.position - a.position)
        .map(r => ({ name: r.name, color: r.hexColor }))
        : [];

    const guildInfo = guild ? {
        name: guild.name,
        memberCount: guild.memberCount,
        boostLevel: guild.premiumTier,
        boostCount: guild.premiumSubscriptionCount || 0
    } : null;

    res.render('dashboard', { 
        user: req.session.user, 
        roles: userRoles, 
        guild: guildInfo 
    });
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

app.listen(PORT, () => {
    console.log(`[WEB] Portail actif sur le port ${PORT}`);
});
