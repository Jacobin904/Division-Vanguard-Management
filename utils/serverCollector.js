'use strict';

const { EmbedBuilder, AttachmentBuilder, PermissionFlagsBits } = require('discord.js');

// Traduction française des permissions Discord
const TRADUCTION_PERMISSIONS = {
    CreateInstantInvite: 'Créer une invitation',
    KickMembers: 'Expulser des membres',
    BanMembers: 'Bannir des membres',
    Administrator: 'Administrateur',
    ManageChannels: 'Gérer les salons',
    ManageGuild: 'Gérer le serveur',
    AddReactions: 'Ajouter des réactions',
    ViewAuditLog: 'Consulter les logs du serveur',
    PrioritySpeaker: 'Voix prioritaire',
    Stream: 'Vidéo',
    ViewChannel: 'Voir les salons',
    SendMessages: 'Envoyer des messages',
    SendTTSMessages: 'Envoyer des messages TTS',
    ManageMessages: 'Gérer les messages',
    EmbedLinks: 'Intégrer des liens',
    AttachFiles: 'Joindre des fichiers',
    ReadMessageHistory: 'Lire l\'historique des messages',
    MentionEveryone: 'Mentionner @everyone',
    UseExternalEmojis: 'Utiliser des émojis externes',
    ViewGuildInsights: 'Consulter les statistiques du serveur',
    Connect: 'Se connecter',
    Speak: 'Parler',
    MuteMembers: 'Rendre muet des membres',
    DeafenMembers: 'Mettre en sourdine des membres',
    MoveMembers: 'Déplacer des membres',
    UseVAD: 'Utiliser la détection de voix',
    ChangeNickname: 'Changer de pseudo',
    ManageNicknames: 'Gérer les pseudos',
    ManageRoles: 'Gérer les rôles',
    ManageWebhooks: 'Gérer les webhooks',
    ManageEmojisAndStickers: 'Gérer les émojis et stickers',
    ManageGuildExpressions: 'Gérer les expressions',
    UseApplicationCommands: 'Utiliser les commandes d\'application',
    RequestToSpeak: 'Demander la parole',
    ManageEvents: 'Gérer les événements',
    ManageThreads: 'Gérer les fils',
    CreatePublicThreads: 'Créer des fils publics',
    CreatePrivateThreads: 'Créer des fils privés',
    UseExternalStickers: 'Utiliser des stickers externes',
    SendMessagesInThreads: 'Envoyer des messages dans les fils',
    UseEmbeddedActivities: 'Utiliser les activités intégrées',
    ModerateMembers: 'Modérer les membres',
    ViewCreatorMonetizationAnalytics: 'Voir les statistiques de monétisation',
    UseSoundboard: 'Utiliser le soundboard',
    CreateGuildExpressions: 'Créer des expressions',
    CreateEvents: 'Créer des événements',
    UseExternalSounds: 'Utiliser des sons externes',
    SendVoiceMessages: 'Envoyer des messages vocaux',
    SendPolls: 'Envoyer des sondages',
    UseExternalApps: 'Utiliser des applications externes'
};

const TRADUCTION_NIVEAU_VERIFICATION = {
    0: 'Aucun',
    1: 'Faible (email vérifié)',
    2: 'Moyen (inscrit depuis 5 min)',
    3: 'Élevé (membre depuis 10 min)',
    4: 'Très élevé (numéro de téléphone vérifié)'
};

const TRADUCTION_FILTRAGE_CONTENU = {
    0: 'Aucun',
    1: 'Supprimer les messages explicites',
    2: 'Supprimer tous les scans'
};

const TRADUCTION_NIVEAU_BOOST = {
    0: 'Aucun',
    1: 'Niveau 1',
    2: 'Niveau 2',
    3: 'Niveau 3'
};

const TRADUCTION_TYPE_SALON = {
    0: 'Texte',
    2: 'Vocal',
    4: 'Catégorie',
    5: 'Annonces',
    10: 'Fil d\'annonce',
    11: 'Fil public',
    12: 'Fil privé',
    13: 'Scène',
    14: 'Répertoire',
    15: 'Forum',
    16: 'Média'
};

/**
 * Décode un bitfield de permissions en liste de noms lisibles
 */
function decoderPermissions(bitfield) {
    if (!bitfield || bitfield === 0n) return ['Aucune'];
    const permissions = [];
    for (const [cle, valeur] of Object.entries(PermissionFlagsBits)) {
        if ((BigInt(bitfield) & BigInt(valeur)) === BigInt(valeur)) {
            permissions.push(TRADUCTION_PERMISSIONS[cle] || cle);
        }
    }
    return permissions.length > 0 ? permissions : ['Aucune'];
}

/**
 * Génère le rapport texte complet avec TOUTES les informations
 */
function genererRapportComplet(guild) {
    const date = new Date();
    const lignes = [];

    const ajouter = (texte) => lignes.push(texte);
    const separateur = () => ajouter('================================================================');
    const sousSeparateur = () => ajouter('----------------------------------------------------------------');

    // =========================================================================
    // EN-TÊTE
    // =========================================================================
    separateur();
    ajouter('        RAPPORT COMPLET DU SERVEUR');
    ajouter('           DIVISION VANGUARD');
    ajouter('================================================================');
    ajouter('');

    // =========================================================================
    // INFORMATIONS GÉNÉRALES
    // =========================================================================
    ajouter('--- INFORMATIONS GENERALES ---');
    ajouter(`Nom du serveur        : ${guild.name}`);
    ajouter(`ID du serveur         : ${guild.id}`);
    ajouter(`Proprietaire          : ${guild.members.cache.get(guild.ownerId)?.user.username || 'Inconnu'}`);
    ajouter(`ID du proprietaire    : ${guild.ownerId}`);
    ajouter(`Date de creation      : ${guild.createdAt.toUTCString()}`);
    ajouter(`Description           : ${guild.description || 'Aucune'}`);
    ajouter(`Niveau de verification: ${TRADUCTION_NIVEAU_VERIFICATION[guild.verificationLevel] || guild.verificationLevel}`);
    ajouter(`Niveau de boost       : ${TRADUCTION_NIVEAU_BOOST[guild.premiumTier] || guild.premiumTier}`);
    ajouter(`Nombre de boosts      : ${guild.premiumSubscriptionCount || 0}`);
    ajouter(`Membres (total)       : ${guild.memberCount}`);
    ajouter(`Membres (humains)     : ${guild.members.cache.filter(m => !m.user.bot).size}`);
    ajouter(`Membres (bots)        : ${guild.members.cache.filter(m => m.user.bot).size}`);
    ajouter(`Roles                 : ${guild.roles.cache.size}`);
    ajouter(`Salons (total)        : ${guild.channels.cache.size}`);
    ajouter(`Emojis (statiques)    : ${guild.emojis.cache.filter(e => !e.animated).size}`);
    ajouter(`Emojis (animes)       : ${guild.emojis.cache.filter(e => e.animated).size}`);
    ajouter(`Stickers              : ${guild.stickers.cache.size}`);
    ajouter(`URL personnalisee     : ${guild.vanityURLCode ? `discord.gg/${guild.vanityURLCode}` : 'Aucune'}`);
    ajouter(`Langue preferee       : ${guild.preferredLocale || 'Non definie'}`);
    ajouter(`AFK salon             : ${guild.afkChannelId ? guild.channels.cache.get(guild.afkChannelId)?.name || 'Inconnu' : 'Aucun'}`);
    ajouter(`AFK delai             : ${guild.afkTimeout || 0} secondes`);
    ajouter(`NSFW                  : ${guild.nsfw ? 'Oui' : 'Non'}`);
    ajouter(`Filtrage contenu      : ${TRADUCTION_FILTRAGE_CONTENU[guild.explicitContentFilter] || guild.explicitContentFilter}`);
    ajouter(`MFA requis            : ${guild.mfaLevel === 1 ? 'Oui' : 'Non'}`);
    ajouter(`Boost progress bar    : ${guild.premiumProgressBarEnabled ? 'Activee' : 'Desactivee'}`);
    ajouter('');
    ajouter('Fonctionnalites actives :');
    if (guild.features.length > 0) {
        guild.features.forEach(f => ajouter(`  - ${f}`));
    } else {
        ajouter('  Aucune');
    }
    ajouter('');

    // =========================================================================
    // LIENS ET IMAGES
    // =========================================================================
    ajouter('--- LIENS ET IMAGES ---');
    ajouter(`Icone                 : ${guild.iconURL({ size: 2048, dynamic: true }) || 'Aucune'}`);
    ajouter(`Banniere              : ${guild.bannerURL({ size: 2048 }) || 'Aucune'}`);
    ajouter(`Splash                : ${guild.splashURL({ size: 2048 }) || 'Aucun'}`);
    ajouter(`Discovery Splash      : ${guild.discoverySplashURL({ size: 2048 }) || 'Aucun'}`);
    ajouter('');

    // =========================================================================
    // SALONS (avec permissions)
    // =========================================================================
    ajouter('================================================================');
    ajouter(`--- SALONS (${guild.channels.cache.size} au total) ---`);
    ajouter('================================================================');
    ajouter('');

    const salonsTries = guild.channels.cache.sort((a, b) => {
        if (a.parentId !== b.parentId) return (a.parentId || '').localeCompare(b.parentId || '');
        return a.position - b.position;
    });

    salonsTries.forEach(salon => {
        const type = TRADUCTION_TYPE_SALON[salon.type] || `Type ${salon.type}`;
        const categorie = salon.parentId ? (guild.channels.cache.get(salon.parentId)?.name || 'Inconnue') : 'Aucune';
        ajouter(`[${type}] ${salon.name}`);
        ajouter(`  ID            : ${salon.id}`);
        ajouter(`  Position      : ${salon.position}`);
        ajouter(`  Categorie     : ${categorie}`);
        ajouter(`  NSFW          : ${salon.nsfw ? 'Oui' : 'Non'}`);
        if (salon.topic) ajouter(`  Sujet         : ${salon.topic}`);
        if (salon.rateLimitPerUser) ajouter(`  Slowmode      : ${salon.rateLimitPerUser} secondes`);
        if (salon.bitrate) ajouter(`  Bitrate       : ${salon.bitrate / 1000} kbps`);
        if (salon.userLimit) ajouter(`  Limite util.  : ${salon.userLimit}`);
        if (salon.createdAt) ajouter(`  Cree le       : ${salon.createdAt.toUTCString()}`);

        // Permissions du salon
        if (salon.permissionOverwrites && salon.permissionOverwrites.cache.size > 0) {
            ajouter('  Permissions specifiques :');
            salon.permissionOverwrites.cache.forEach(overwrite => {
                let nom;
                if (overwrite.type === 0) { // Role
                    const role = guild.roles.cache.get(overwrite.id);
                    nom = role ? `[Role] ${role.name}` : `[Role] ID ${overwrite.id}`;
                } else if (overwrite.type === 1) { // Membre
                    const membre = guild.members.cache.get(overwrite.id);
                    nom = membre ? `[Membre] ${membre.user.username}` : `[Membre] ID ${overwrite.id}`;
                } else {
                    nom = `[${overwrite.type}] ID ${overwrite.id}`;
                }
                ajouter(`    ${nom} :`);
                const allow = decoderPermissions(overwrite.allow.bitfield);
                const deny = decoderPermissions(overwrite.deny.bitfield);
                if (allow[0] !== 'Aucune') {
                    ajouter(`      Autorisees :`);
                    allow.forEach(p => ajouter(`        + ${p}`));
                }
                if (deny[0] !== 'Aucune') {
                    ajouter(`      Refusees   :`);
                    deny.forEach(p => ajouter(`        - ${p}`));
                }
            });
        } else {
            ajouter('  Permissions specifiques : Aucune (permissions par defaut)');
        }
        ajouter('');
    });

    // =========================================================================
    // ROLES (avec permissions)
    // =========================================================================
    ajouter('================================================================');
    ajouter(`--- ROLES (${guild.roles.cache.size} au total) ---`);
    ajouter('================================================================');
    ajouter('');

    const rolesTries = guild.roles.cache.sort((a, b) => b.position - a.position);
    rolesTries.forEach(role => {
        ajouter(`[Position ${String(role.position).padStart(2)}] ${role.name}`);
        ajouter(`  ID            : ${role.id}`);
        ajouter(`  Couleur       : ${role.hexColor}`);
        ajouter(`  Affiche separe: ${role.hoist ? 'Oui' : 'Non'}`);
        ajouter(`  Mentionnable  : ${role.mentionable ? 'Oui' : 'Non'}`);
        ajouter(`  Gere par bot  : ${role.managed ? 'Oui' : 'Non'}`);
        ajouter(`  Role premium  : ${role.tags?.premiumSubscriberRole ? 'Oui (Boost)' : 'Non'}`);
        ajouter(`  Role bot      : ${role.tags?.botId ? `Oui (bot ID: ${role.tags.botId})` : 'Non'}`);
        ajouter(`  Cree le       : ${role.createdAt.toUTCString()}`);
        ajouter('  Permissions   :');
        const permissions = decoderPermissions(role.permissions.bitfield);
        permissions.forEach(p => ajouter(`    - ${p}`));
        ajouter('');
    });

    // =========================================================================
    // MEMBRES
    // =========================================================================
    ajouter('================================================================');
    ajouter(`--- MEMBRES (${guild.memberCount} au total) ---`);
    ajouter('================================================================');
    ajouter('');

    const membresTries = guild.members.cache.sort((a, b) => {
        const roleA = a.roles.highest;
        const roleB = b.roles.highest;
        if (roleA.position !== roleB.position) return roleB.position - roleA.position;
        return a.user.username.localeCompare(b.user.username);
    });

    membresTries.forEach(membre => {
        const rolesList = membre.roles.cache
            .filter(r => r.id !== guild.id)
            .sort((a, b) => b.position - a.position)
            .map(r => r.name)
            .join(', ') || 'Aucun';
        ajouter(`Nom             : ${membre.user.username}`);
        ajouter(`  ID            : ${membre.id}`);
        ajouter(`  Tag           : ${membre.user.tag}`);
        ajouter(`  Bot           : ${membre.user.bot ? 'Oui' : 'Non'}`);
        ajouter(`  Statut        : ${membre.presence?.status || 'Hors ligne'}`);
        ajouter(`  Surnom        : ${membre.nickname || 'Aucun'}`);
        ajouter(`  Compte cree   : ${membre.user.createdAt.toUTCString()}`);
        ajouter(`  A rejoint     : ${membre.joinedAt.toUTCString()}`);
        ajouter(`  Roles         : ${rolesList}`);
        ajouter(`  Role le + haut: ${membre.roles.highest?.name || 'Aucun'} (pos ${membre.roles.highest?.position || 0})`);
        ajouter(`  Couleur       : ${membre.displayHexColor}`);
        ajouter('');
    });

    // =========================================================================
    // EMOJIS ET STICKERS
    // =========================================================================
    ajouter('================================================================');
    ajouter('--- EMOJIS ET STICKERS ---');
    ajouter('================================================================');
    ajouter('');

    ajouter(`Emojis (${guild.emojis.cache.size}) :`);
    guild.emojis.cache.forEach(emoji => {
        ajouter(`  Nom       : ${emoji.name}`);
        ajouter(`  ID        : ${emoji.id}`);
        ajouter(`  Anime     : ${emoji.animated ? 'Oui' : 'Non'}`);
        ajouter(`  Disponible: ${emoji.available ? 'Oui' : 'Non'}`);
        ajouter(`  URL       : ${emoji.imageURL()}`);
        if (emoji.author) ajouter(`  Cree par  : ${emoji.author.username} (${emoji.author.id})`);
        ajouter('');
    });

    ajouter(`Stickers (${guild.stickers.cache.size}) :`);
    guild.stickers.cache.forEach(sticker => {
        ajouter(`  Nom       : ${sticker.name}`);
        ajouter(`  ID        : ${sticker.id}`);
        ajouter(`  Format    : ${sticker.format}`);
        ajouter(`  URL       : ${sticker.url}`);
        ajouter('');
    });

    // =========================================================================
    // PIED DE PAGE
    // =========================================================================
    separateur();
    ajouter(`Rapport genere le ${date.toUTCString()}`);
    ajouter(`Duree de generation : quelques secondes`);
    separateur();

    return lignes.join('\n');
}

/**
 * Construit l'embed de résumé (max 25 fields)
 */
function construireEmbedResume(guild) {
    const date = new Date();

    const membres = guild.members.cache;
    const salons = guild.channels.cache;
    const roles = guild.roles.cache;
    const emojis = guild.emojis.cache;

    const totalSalons = guild.channels.cache.size;
    const salonsTexte = salons.filter(c => c.type === 0).size;
    const salonsVocaux = salons.filter(c => c.type === 2).size;
    const categories = salons.filter(c => c.type === 4).size;
    const annonces = salons.filter(c => c.type === 5).size;
    const forums = salons.filter(c => c.type === 15).size;
    const scenes = salons.filter(c => c.type === 13).size;
    const fils = salons.filter(c => c.isThread()).size;

    const rolesAvecPermsSpecifiques = salons.reduce((acc, salon) => {
        if (salon.permissionOverwrites) {
            salon.permissionOverwrites.cache.forEach(ow => {
                if (ow.type === 0) acc.add(ow.id);
            });
        }
        return acc;
    }, new Set()).size;

    const liens = [];
    if (guild.iconURL()) liens.push(`Icone: ${guild.iconURL({ size: 2048 })}`);
    if (guild.bannerURL()) liens.push(`Banniere: ${guild.bannerURL({ size: 2048 })}`);
    if (guild.splashURL()) liens.push(`Splash: ${guild.splashURL({ size: 2048 })}`);
    if (guild.vanityURLCode) liens.push(`Vanity: discord.gg/${guild.vanityURLCode}`);

    const embed = new EmbedBuilder()
        .setAuthor({
            name: `Division Vanguard — Inventaire complet`,
            iconURL: guild.iconURL({ size: 128 }) || undefined
        })
        .setTitle('[INVENTAIRE] Rapport synthetique du serveur')
        .setColor(0x2B3A55)
        .setThumbnail(guild.iconURL({ size: 256, dynamic: true }) || null)
        .setImage(guild.bannerURL({ size: 1024 }) || null)
        .setTimestamp(date)
        .addFields(
            {
                name: 'IDENTIFICATION',
                value: `**Nom :** ${guild.name}\n**ID :** \`${guild.id}\`\n**Proprietaire :** <@${guild.ownerId}>\n**ID proprietaire :** \`${guild.ownerId}\`\n**Creation :** <t:${Math.floor(guild.createdTimestamp / 1000)}:d>`,
                inline: false
            },
            {
                name: 'DESCRIPTION',
                value: guild.description || 'Aucune description',
                inline: false
            },
            {
                name: 'MEMBRES',
                value: `**Total :** \`${guild.memberCount}\`\n**Humains :** \`${membres.filter(m => !m.user.bot).size}\`\n**Bots :** \`${membres.filter(m => m.user.bot).size}\``,
                inline: true
            },
            {
                name: 'BOOST',
                value: `**Niveau :** \`${guild.premiumTier}\`\n**Nombre :** \`${guild.premiumSubscriptionCount || 0}\``,
                inline: true
            },
            {
                name: 'SECURITE',
                value: `**Verification :** \`${TRADUCTION_NIVEAU_VERIFICATION[guild.verificationLevel]}\`\n**MFA :** \`${guild.mfaLevel === 1 ? 'Active' : 'Inactif'}\``,
                inline: true
            },
            {
                name: 'SALONS',
                value: `**Total :** \`${totalSalons}\`\n**Texte :** \`${salonsTexte}\` | **Vocaux :** \`${salonsVocaux}\`\n**Categories :** \`${categories}\` | **Annonces :** \`${annonces}\`\n**Forums :** \`${forums}\` | **Scenes :** \`${scenes}\` | **Fils :** \`${fils}\``,
                inline: false
            },
            {
                name: 'ROLES',
                value: `**Total :** \`${roles.size}\`\n**Avec permissions specifiques :** \`${rolesAvecPermsSpecifiques}\``,
                inline: true
            },
            {
                name: 'EMOJIS ET STICKERS',
                value: `**Statiques :** \`${emojis.filter(e => !e.animated).size}\`\n**Animes :** \`${emojis.filter(e => e.animated).size}\`\n**Stickers :** \`${guild.stickers.cache.size}\``,
                inline: true
            },
            {
                name: 'CONFIGURATION',
                value: `**Langue :** \`${guild.preferredLocale || 'Non definie'}\`\n**AFK :** \`${guild.afkChannelId ? guild.channels.cache.get(guild.afkChannelId)?.name || 'Inconnu' : 'Aucun'}\` (${guild.afkTimeout || 0}s)\n**URL personnalisee :** \`${guild.vanityURLCode ? `discord.gg/${guild.vanityURLCode}` : 'Aucune'}\``,
                inline: false
            },
            {
                name: 'FONCTIONNALITES',
                value: guild.features.length > 0 ? guild.features.map(f => `\`${f}\``).join(', ') : 'Aucune',
                inline: false
            },
            {
                name: 'LIENS',
                value: liens.length > 0 ? liens.join('\n') : 'Aucun lien disponible',
                inline: false
            },
            {
                name: 'FICHIER JOINT',
                value: 'L\'integralite des donnees brutes (permissions de chaque salon et role, liste complete des membres, emojis, etc.) est disponible dans le fichier `.txt` ci-joint.',
                inline: false
            }
        )
        .setFooter({
            text: `Division Vanguard — Systeme d'information`,
            iconURL: guild.iconURL() || undefined
        });

    return embed;
}

/**
 * Point d'entrée principal : retourne l'embed + le fichier
 */
function collectServerInfo(guild) {
    const rapport = genererRapportComplet(guild);
    const buffer = Buffer.from(rapport, 'utf-8');
    const attachment = new AttachmentBuilder(buffer, { name: `rapport-complet-${guild.id}.txt` });
    const embed = construireEmbedResume(guild);
    return { embed, attachment };
}

module.exports = { collectServerInfo };
