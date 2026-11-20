'use strict';

const { EmbedBuilder, AttachmentBuilder, PermissionFlagsBits } = require('discord.js');

const TRADUCTION_NIVEAU_VÉRIFICATION = {
    0: 'Aucun',
    1: 'Faible (e-mail vérifié)',
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

const TRADUCTION_PERMISSIONS = {
    CreateInstantInvite: 'Créer une invitation',
    KickMembers: 'Expulser des membres',
    BanMembers: 'Bannir des membres',
    Administrator: 'Administrateur',
    ManageChannels: 'Gérer les salons',
    ManageGuild: 'Gérer le serveur',
    AddReactions: 'Ajouter des réactions',
    ViewAuditLog: 'Consulter les journaux d\'audit',
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
    ManageEmojisAndStickers: 'Gérer les émojis et autocollants',
    UseApplicationCommands: 'Utiliser les commandes d\'application',
    RequestToSpeak: 'Demander la parole',
    ManageEvents: 'Gérer les événements',
    ManageThreads: 'Gérer les fils',
    CreatePublicThreads: 'Créer des fils publics',
    CreatePrivateThreads: 'Créer des fils privés',
    UseExternalStickers: 'Utiliser des autocollants externes',
    SendMessagesInThreads: 'Envoyer des messages dans les fils',
    UseEmbeddedActivities: 'Utiliser les activités intégrées',
    ModerateMembers: 'Modérer les membres'
};

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

function genererRapportComplet(guild) {
    const date = new Date();
    const lignes = [];

    const ajouter = (texte) => lignes.push(texte);
    const separateur = () => ajouter('================================================================');

    separateur();
    ajouter('        RAPPORT COMPLET DU SERVEUR');
    ajouter('           DIVISION VANGUARD');
    separateur();
    ajouter('');

    ajouter('--- INFORMATIONS GÉNÉRALES ---');
    ajouter(`Nom du serveur        : ${guild.name}`);
    ajouter(`ID du serveur         : ${guild.id}`);
    ajouter(`Propriétaire          : ${guild.members.cache.get(guild.ownerId)?.user.username || 'Inconnu'}`);
    ajouter(`ID du propriétaire    : ${guild.ownerId}`);
    ajouter(`Date de création      : ${guild.createdAt.toUTCString()}`);
    ajouter(`Description           : ${guild.description || 'Aucune'}`);
    ajouter(`Niveau de vérification: ${TRADUCTION_NIVEAU_VÉRIFICATION[guild.verificationLevel] || guild.verificationLevel}`);
    ajouter(`Niveau de boost       : ${TRADUCTION_NIVEAU_BOOST[guild.premiumTier] || guild.premiumTier}`);
    ajouter(`Nombre de boosts      : ${guild.premiumSubscriptionCount || 0}`);
    ajouter(`Membres (total)       : ${guild.memberCount}`);
    ajouter(`Membres (humains)     : ${guild.members.cache.filter(m => !m.user.bot).size}`);
    ajouter(`Membres (bots)        : ${guild.members.cache.filter(m => m.user.bot).size}`);
    ajouter(`Rôles                 : ${guild.roles.cache.size}`);
    ajouter(`Salons (total)        : ${guild.channels.cache.size}`);
    ajouter(`Émojis (statiques)    : ${guild.emojis.cache.filter(e => !e.animated).size}`);
    ajouter(`Émojis (animés)       : ${guild.emojis.cache.filter(e => e.animated).size}`);
    ajouter(`Autocollants          : ${guild.stickers.cache.size}`);
    ajouter(`URL personnalisée     : ${guild.vanityURLCode ? `discord.gg/${guild.vanityURLCode}` : 'Aucune'}`);
    ajouter(`Langue préférée       : ${guild.preferredLocale || 'Non définie'}`);
    ajouter(`Salon AFK             : ${guild.afkChannelId ? guild.channels.cache.get(guild.afkChannelId)?.name || 'Inconnu' : 'Aucun'}`);
    ajouter(`Délai AFK             : ${guild.afkTimeout || 0} secondes`);
    ajouter(`NSFW                  : ${guild.nsfw ? 'Oui' : 'Non'}`);
    ajouter(`Filtrage contenu      : ${TRADUCTION_FILTRAGE_CONTENU[guild.explicitContentFilter] || guild.explicitContentFilter}`);
    ajouter(`MFA requis            : ${guild.mfaLevel === 1 ? 'Oui' : 'Non'}`);
    ajouter(`Barre de progression  : ${guild.premiumProgressBarEnabled ? 'Activée' : 'Désactivée'}`);
    ajouter('');
    ajouter('Fonctionnalités actives :');
    if (guild.features.length > 0) {
        guild.features.forEach(f => ajouter(`  - ${f}`));
    } else {
        ajouter('  Aucune');
    }
    ajouter('');

    ajouter('--- LIENS ET IMAGES ---');
    ajouter(`Icône                 : ${guild.iconURL({ size: 2048, dynamic: true }) || 'Aucune'}`);
    ajouter(`Bannière              : ${guild.bannerURL({ size: 2048 }) || 'Aucune'}`);
    ajouter(`Splash                : ${guild.splashURL({ size: 2048 }) || 'Aucun'}`);
    ajouter(`Splash de découverte  : ${guild.discoverySplashURL({ size: 2048 }) || 'Aucun'}`);
    ajouter('');

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
        ajouter(`  Catégorie     : ${categorie}`);
        ajouter(`  NSFW          : ${salon.nsfw ? 'Oui' : 'Non'}`);
        if (salon.topic) ajouter(`  Sujet         : ${salon.topic}`);
        if (salon.rateLimitPerUser) ajouter(`  Mode lent     : ${salon.rateLimitPerUser} secondes`);
        if (salon.bitrate) ajouter(`  Débit           : ${salon.bitrate / 1000} kbps`);
        if (salon.userLimit) ajouter(`  Limite util.  : ${salon.userLimit}`);
        if (salon.createdAt) ajouter(`  Créé le       : ${salon.createdAt.toUTCString()}`);

        if (salon.permissionOverwrites && salon.permissionOverwrites.cache.size > 0) {
            ajouter('  Permissions spécifiques :');
            salon.permissionOverwrites.cache.forEach(overwrite => {
                let nom;
                if (overwrite.type === 0) {
                    const role = guild.roles.cache.get(overwrite.id);
                    nom = role ? `[Rôle] ${role.name}` : `[Rôle] ID ${overwrite.id}`;
                } else if (overwrite.type === 1) {
                    const membre = guild.members.cache.get(overwrite.id);
                    nom = membre ? `[Membre] ${membre.user.username}` : `[Membre] ID ${overwrite.id}`;
                } else {
                    nom = `[${overwrite.type}] ID ${overwrite.id}`;
                }
                ajouter(`    ${nom} :`);
                const allow = decoderPermissions(overwrite.allow.bitfield);
                const deny = decoderPermissions(overwrite.deny.bitfield);
                if (allow[0] !== 'Aucune') {
                    ajouter(`      Autorisées :`);
                    allow.forEach(p => ajouter(`        + ${p}`));
                }
                if (deny[0] !== 'Aucune') {
                    ajouter(`      Refusées   :`);
                    deny.forEach(p => ajouter(`        - ${p}`));
                }
            });
        } else {
            ajouter('  Permissions spécifiques : Aucune (permissions par défaut)');
        }
        ajouter('');
    });

    ajouter('================================================================');
    ajouter(`--- RÔLES (${guild.roles.cache.size} au total) ---`);
    ajouter('================================================================');
    ajouter('');

    const rolesTries = guild.roles.cache.sort((a, b) => b.position - a.position);
    rolesTries.forEach(role => {
        ajouter(`[Position ${String(role.position).padStart(2)}] ${role.name}`);
        ajouter(`  ID            : ${role.id}`);
        ajouter(`  Couleur       : ${role.hexColor}`);
        ajouter(`  Affiché séparé: ${role.hoist ? 'Oui' : 'Non'}`);
        ajouter(`  Mentionnable  : ${role.mentionable ? 'Oui' : 'Non'}`);
        ajouter(`  Géré par bot  : ${role.managed ? 'Oui' : 'Non'}`);
        ajouter(`  Rôle premium  : ${role.tags?.premiumSubscriberRole ? 'Oui (Boost)' : 'Non'}`);
        ajouter(`  Rôle bot      : ${role.tags?.botId ? `Oui (bot ID: ${role.tags.botId})` : 'Non'}`);
        ajouter(`  Créé le       : ${role.createdAt.toUTCString()}`);
        ajouter('  Permissions   :');
        const permissions = decoderPermissions(role.permissions.bitfield);
        permissions.forEach(p => ajouter(`    - ${p}`));
        ajouter('');
    });

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
        ajouter(`  Compte créé   : ${membre.user.createdAt.toUTCString()}`);
        ajouter(`  A rejoint     : ${membre.joinedAt.toUTCString()}`);
        ajouter(`  Rôles         : ${rolesList}`);
        ajouter(`  Rôle le + haut: ${membre.roles.highest?.name || 'Aucun'} (pos ${membre.roles.highest?.position || 0})`);
        ajouter(`  Couleur       : ${membre.displayHexColor}`);
        ajouter('');
    });

    ajouter('================================================================');
    ajouter('--- ÉMOJIS ET AUTOCOLLANTS ---');
    ajouter('================================================================');
    ajouter('');

    ajouter(`Émojis (${guild.emojis.cache.size}) :`);
    guild.emojis.cache.forEach(emoji => {
        ajouter(`  Nom       : ${emoji.name}`);
        ajouter(`  ID        : ${emoji.id}`);
        ajouter(`  Animé     : ${emoji.animated ? 'Oui' : 'Non'}`);
        ajouter(`  Disponible: ${emoji.available ? 'Oui' : 'Non'}`);
        ajouter(`  URL       : ${emoji.imageURL()}`);
        if (emoji.author) ajouter(`  Créé par  : ${emoji.author.username} (${emoji.author.id})`);
        ajouter('');
    });

    ajouter(`Autocollants (${guild.stickers.cache.size}) :`);
    guild.stickers.cache.forEach(sticker => {
        ajouter(`  Nom       : ${sticker.name}`);
        ajouter(`  ID        : ${sticker.id}`);
        ajouter(`  Format    : ${sticker.format}`);
        ajouter(`  URL       : ${sticker.url}`);
        ajouter('');
    });

    separateur();
    ajouter(`Rapport généré le ${date.toUTCString()}`);
    ajouter(`Durée de génération : quelques secondes`);
    separateur();

    return lignes.join('\n');
}

function construireEmbedResume(guild) {
    const date = new Date();
    const membres = guild.members.cache;
    const salons = guild.channels.cache;

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
    if (guild.iconURL()) liens.push(`Icône: ${guild.iconURL({ size: 2048 })}`);
    if (guild.bannerURL()) liens.push(`Bannière: ${guild.bannerURL({ size: 2048 })}`);
    if (guild.splashURL()) liens.push(`Splash: ${guild.splashURL({ size: 2048 })}`);
    if (guild.vanityURLCode) liens.push(`Vanity: discord.gg/${guild.vanityURLCode}`);

    return new EmbedBuilder()
        .setAuthor({
            name: 'Division Vanguard — Inventaire complet',
            iconURL: guild.iconURL({ size: 128 }) || undefined
        })
        .setTitle('[INVENTAIRE] Rapport synthétique du serveur')
        .setColor(0x2B3A55)
        .setThumbnail(guild.iconURL({ size: 256, dynamic: true }) || null)
        .setImage(guild.bannerURL({ size: 1024 }) || null)
        .setTimestamp(date)
        .addFields(
            {
                name: 'IDENTIFICATION',
                value: `**Nom :** ${guild.name}\n**ID :** \`${guild.id}\`\n**Propriétaire :** <@${guild.ownerId}>\n**ID propriétaire :** \`${guild.ownerId}\`\n**Création :** <t:${Math.floor(guild.createdTimestamp / 1000)}:d>`,
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
                name: 'SÉCURITÉ',
                value: `**Vérification :** \`${TRADUCTION_NIVEAU_VÉRIFICATION[guild.verificationLevel]}\`\n**MFA :** \`${guild.mfaLevel === 1 ? 'Activé' : 'Inactif'}\``,
                inline: true
            },
            {
                name: 'SALONS',
                value: `**Total :** \`${totalSalons}\`\n**Texte :** \`${salonsTexte}\` | **Vocaux :** \`${salonsVocaux}\`\n**Catégories :** \`${categories}\` | **Annonces :** \`${annonces}\`\n**Forums :** \`${forums}\` | **Scènes :** \`${scenes}\` | **Fils :** \`${fils}\``,
                inline: false
            },
            {
                name: 'RÔLES',
                value: `**Total :** \`${guild.roles.cache.size}\`\n**Avec permissions spécifiques :** \`${rolesAvecPermsSpecifiques}\``,
                inline: true
            },
            {
                name: 'ÉMOJIS ET AUTOCOLLANTS',
                value: `**Statiques :** \`${guild.emojis.cache.filter(e => !e.animated).size}\`\n**Animés :** \`${guild.emojis.cache.filter(e => e.animated).size}\`\n**Autocollants :** \`${guild.stickers.cache.size}\``,
                inline: true
            },
            {
                name: 'CONFIGURATION',
                value: `**Langue :** \`${guild.preferredLocale || 'Non définie'}\`\n**AFK :** \`${guild.afkChannelId ? guild.channels.cache.get(guild.afkChannelId)?.name || 'Inconnu' : 'Aucun'}\` (${guild.afkTimeout || 0}s)\n**URL personnalisée :** \`${guild.vanityURLCode ? `discord.gg/${guild.vanityURLCode}` : 'Aucune'}\``,
                inline: false
            },
            {
                name: 'FONCTIONNALITÉS',
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
                value: 'L\'intégralité des données brutes (permissions de chaque salon et rôle, liste complète des membres, émojis, etc.) est disponible dans le fichier `.txt` ci-joint.',
                inline: false
            }
        )
        .setFooter({
            text: 'Division Vanguard — Système d\'information',
            iconURL: guild.iconURL() || undefined
        });
}

function collectServerInfo(guild) {
    const rapport = genererRapportComplet(guild);
    const buffer = Buffer.from(rapport, 'utf-8');
    const attachment = new AttachmentBuilder(buffer, { name: `rapport-complet-${guild.id}.txt` });
    const embed = construireEmbedResume(guild);
    return { embed, attachment };
}

module.exports = { collectServerInfo };
