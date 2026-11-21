'use strict';

require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const fetch = require('node-fetch');
const { Client, Collection, GatewayIntentBits, Partials } = require('discord.js');

// ============================================================================
// VÉRIFICATION DES VARIABLES D'ENVIRONNEMENT
// ============================================================================

const variablesManquantes = [];

if (!process.env.DISCORD_BOT_TOKEN) {
    variablesManquantes.push('DISCORD_BOT_TOKEN');
}

if (!process.env.DISCORD_CLIENT_ID) {
    variablesManquantes.push('DISCORD_CLIENT_ID');
}

if (!process.env.DISCORD_CLIENT_SECRET) {
    variablesManquantes.push('DISCORD_CLIENT_SECRET');
}

if (!process.env.DISCORD_REDIRECT_URI) {
    variablesManquantes.push('DISCORD_REDIRECT_URI');
}

if (variablesManquantes.length > 0) {
    console.error('='.repeat(70));
    console.error('[ERREUR CRITIQUE] Variables d\'environnement manquantes:');
    variablesManquantes.forEach(v => console.error(`  - ${v}`));
    console.error('');
    console.error('Allez sur Render > Environment > Add Environment Variable');
    console.error('et ajoutez toutes les variables listées ci-dessus.');
    console.error('='.repeat(70));
    process.exit(1);
}

console.log('[CONFIG] Toutes les variables d\'environnement sont présentes.');

// ============================================================================
// CONFIGURATION
// ============================================================================

const GUILD_ID = '1501671610879312036';
const MOT_DE_PASSE_SITE = '3057';

const ROLE_STAFF = [
    '1502329914224017710', // Fondation
    '1502321921113460827', // Admin Interne
    '1502321894462980257', // Manager de Communauté
    '1502321920652345484'  // Directeur
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

client.login(process.env.DISCORD_BOT_TOKEN)
    .then(() => console.log('[BOT] Connexion Discord réussie.'))
    .catch(err => {
        console.error('[BOT] Échec de connexion Discord :', err.message);
        process.exit(1);
    });

// ============================================================================
// SERVEUR WEB
// ============================================================================

const app = express();
const PORT = process.env.PORT || 3000;

app.set('trust proxy', 1);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: process.env.SESSION_SECRET || 'secret_par_defaut_change_le',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: true,
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000
    }
}));

app.use(passport.initialize());
app.use(passport.session());

// ============================================================================
// STRATÉGIE D'AUTHENTIFICATION DISCORD
// ============================================================================

try {
    passport.use(new DiscordStrategy({
        clientID: process.env.DISCORD_CLIENT_ID,
        clientSecret: process.env.DISCORD_CLIENT_SECRET,
        callbackURL: process.env.DISCORD_REDIRECT_URI,
        scope: ['identify', 'guilds']
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            console.log(`[AUTH] Tentative de connexion de ${profile.username} (${profile.id})`);

            const response = await fetch(`https://discord.com/api/v10/guilds/${GUILD_ID}/members/${profile.id}`, {
                headers: { 'Authorization': `Bot ${process.env.DISCORD_BOT_TOKEN}` }
            });

            if (!response.ok) {
                console.log(`[AUTH] Utilisateur ${profile.username} non trouvé sur le serveur.`);
                return done(null, false, { message: 'Utilisateur non trouvé sur le serveur.' });
            }

            const member = await response.json();
            const aUnRoleAutorise = member.roles.some(role => ROLES_AUTORISES.includes(role));

            if (!aUnRoleAutorise) {
                console.log(`[AUTH] Utilisateur ${profile.username} n'a pas les rôles requis.`);
                return done(null, false, { message: 'Accès refusé : Rôle insuffisant.' });
            }

            console.log(`[AUTH] Utilisateur ${profile.username} authentifié avec succès.`);

            return done(null, {
                id: profile.id,
                username: profile.username,
                discriminator: profile.discriminator,
                avatar: profile.avatar,
                roles: member.roles
            });
        } catch (error) {
            console.error('[AUTH] Erreur lors de la vérification des rôles :', error);
            return done(error, null);
        }
    }));

    passport.serializeUser((user, done) => done(null, user));
    passport.deserializeUser((obj, done) => done(null, obj));

    console.log('[AUTH] Stratégie Discord OAuth2 configurée.');
} catch (error) {
    console.error('[AUTH] Erreur configuration OAuth2 :', error.message);
    process.exit(1);
}

// ============================================================================
// ROUTES
// ============================================================================

app.get('/', (req, res) => {
    if (req.session.passwordVerified && req.isAuthenticated()) {
        return res.redirect('/dashboard');
    }
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/verify-password', (req, res) => {
    if (req.body.password === MOT_DE_PASSE_SITE) {
        req.session.passwordVerified = true;
        console.log('[WEB] Mot de passe vérifié avec succès.');
        res.redirect('/auth/discord');
    } else {
        console.log('[WEB] Mot de passe incorrect.');
        res.status(403).sendFile(path.join(__dirname, 'public', 'unauthorized.html'));
    }
});

app.get('/auth/discord', (req, res, next) => {
    if (!req.session.passwordVerified) {
        return res.redirect('/');
    }
    passport.authenticate('discord')(req, res, next);
});

app.get('/auth/discord/callback', 
    passport.authenticate('discord', { 
        failureRedirect: '/unauthorized',
        failureMessage: true
    }), 
    (req, res) => {
        console.log(`[WEB] Redirection vers le dashboard après authentification.`);
        res.redirect('/dashboard');
    }
);

app.get('/dashboard', (req, res) => {
    if (!req.session.passwordVerified || !req.isAuthenticated()) {
        console.log('[WEB] Tentative d\'accès au dashboard sans session valide.');
        return res.redirect('/');
    }
    
    const guild = client.guilds.cache.get(GUILD_ID);
    const member = guild ? guild.members.cache.get(req.user.id) : null;
    
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
        user: req.user, 
        roles: userRoles, 
        guild: guildInfo 
    });
});

app.get('/unauthorized', (req, res) => {
    req.session.destroy();
    res.sendFile(path.join(__dirname, 'public', 'unauthorized.html'));
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

// ============================================================================
// DÉMARRAGE DU SERVEUR
// ============================================================================

app.listen(PORT, () => {
    console.log(`[WEB] Portail sécurisé actif sur le port ${PORT}`);
    console.log(`[WEB] URL publique : https://division-vanguard-management.canner.app`);
});
