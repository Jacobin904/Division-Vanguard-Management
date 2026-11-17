const { EmbedBuilder, AttachmentBuilder } = require('discord.js');

function collectServerInfo(guild) {
    const date = new Date();

    // 1. Construction du rapport texte complet (TOUT TOUT TOUT, sans émojis)
    let report = `================================================================\n`;
    report += `        RAPPORT COMPLET DU SERVEUR\n`;
    report += `           DIVISION VANGUARD\n`;
    report += `================================================================\n\n`;
    report += `--- INFORMATIONS GÉNÉRALES ---\n`;
    report += `Nom du serveur    : ${guild.name}\n`;
    report += `ID du serveur     : ${guild.id}\n`;
    report += `Propriétaire ID   : ${guild.ownerId}\n`;
    report += `Date de création  : ${guild.createdAt.toUTCString()}\n`;
    report += `Description       : ${guild.description || 'Aucune'}\n`;
    report += `Niveau de vérif.  : ${guild.verificationLevel}\n`;
    report += `Niveau de boost   : ${guild.premiumTier}\n`;
    report += `Nombre de boosts  : ${guild.premiumSubscriptionCount || 0}\n`;
    report += `Fonctionnalités   : ${guild.features.join(', ') || 'Aucune'}\n\n`;

    report += `--- SALONS (${guild.channels.cache.size} au total) ---\n`;
    guild.channels.cache.forEach(channel => {
        report += `[Type ${channel.type}] ${channel.name} | ID: ${channel.id}\n`;
    });
    report += '\n';

    report += `--- RÔLES (${guild.roles.cache.size} au total) ---\n`;
    const sortedRoles = guild.roles.cache.sort((a, b) => b.position - a.position);
    sortedRoles.forEach(role => {
        report += `[Position ${String(role.position).padStart(2)}] ${role.name} | ID: ${role.id} | Couleur: ${role.hexColor}\n`;
    });
    report += '\n';

    report += `--- MEMBRES (${guild.memberCount} au total) ---\n`;
    guild.members.cache.forEach(member => {
        report += `Nom: ${member.user.username} | ID: ${member.user.id} | Bot: ${member.user.bot}\n`;
    });
    report += '\n';

    report += `--- ÉMOJIS ET STICKERS ---\n`;
    report += `Émojis (${guild.emojis.cache.size}):\n`;
    guild.emojis.cache.forEach(emoji => {
        report += `  Nom: ${emoji.name} | ID: ${emoji.id} | Animé: ${emoji.animated}\n`;
    });
    report += `Stickers (${guild.stickers.cache.size}):\n`;
    guild.stickers.cache.forEach(sticker => {
        report += `  Nom: ${sticker.name} | ID: ${sticker.id}\n`;
    });

    report += `\n================================================================\n`;
    report += `Rapport généré le ${date.toUTCString()}\n`;
    report += `================================================================\n`;

    // 2. Création de la pièce jointe (fichier texte)
    const buffer = Buffer.from(report, 'utf-8');
    const attachment = new AttachmentBuilder(buffer, { name: `infos-completes-${guild.id}.txt` });

    // Compteurs détaillés
    const members = guild.members.cache;
    const channels = guild.channels.cache;
    const roles = guild.roles.cache;
    const emojis = guild.emojis.cache;

    const totalMembers = guild.memberCount;
    const humans = members.filter(m => !m.user.bot).size;
    const bots = members.filter(m => m.user.bot).size;

    const categories = channels.filter(c => c.type === 4).size;
    const textChannels = channels.filter(c => c.type === 0).size;
    const voiceChannels = channels.filter(c => c.type === 2).size;
    const announcementChannels = channels.filter(c => c.type === 5).size;
    const forumChannels = channels.filter(c => c.type === 15).size;
    const stageChannels = channels.filter(c => c.type === 13).size;
    const threadChannels = channels.filter(c => c.isThread()).size;

    const staticEmojis = emojis.filter(e => !e.animated).size;
    const animatedEmojis = emojis.filter(e => e.animated).size;

    // 3. Création de l'embed de résumé (TRÈS RICHE)
    const embed = new EmbedBuilder()
        .setAuthor({
            name: `Rapport complet - ${guild.name}`,
            iconURL: guild.iconURL({ size: 64 }) || undefined
        })
        .setTitle('[INVENTAIRE] Données brutes du serveur')
        .setThumbnail(guild.iconURL({ size: 256, dynamic: true }) || null)
        .setImage(guild.bannerURL({ size: 1024 }) || guild.splashURL({ size: 1024 }) || null)
        .setColor(guild.members.me?.displayColor || 0x5865F2)
        .setTimestamp(date)
        .addFields(
            { name: '═══════ IDENTIFICATION ═══════', value: '\u200b', inline: false },
            { name: 'Nom du serveur', value: guild.name, inline: true },
            { name: 'ID', value: `\`${guild.id}\``, inline: true },
            { name: 'Propriétaire', value: `<@${guild.ownerId}>\nID: \`${guild.ownerId}\``, inline: true },
            { name: 'Créé le', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:d>`, inline: true },
            { name: 'Description', value: guild.description || 'Aucune description', inline: true },
            { name: 'Niveau de vérification', value: `\`${guild.verificationLevel}\``, inline: true },
            { name: '═══════ BOOST ═══════', value: '\u200b', inline: false },
            { name: 'Niveau de boost', value: `Niveau \`${guild.premiumTier}\``, inline: true },
            { name: 'Nombre de boosts', value: `\`${guild.premiumSubscriptionCount || 0}\` boost(s)`, inline: true },
            { name: '═══════ MEMBRES ═══════', value: '\u200b', inline: false },
            { name: 'Total', value: `\`${totalMembers}\` membre(s)`, inline: true },
            { name: 'Humains', value: `\`${humans}\` humain(s)`, inline: true },
            { name: 'Bots', value: `\`${bots}\` bot(s)`, inline: true },
            { name: '═══════ SALONS ═══════', value: '\u200b', inline: false },
            { name: 'Total', value: `\`${guild.channels.cache.size}\` salon(s)`, inline: true },
            { name: 'Catégories', value: `\`${categories}\``, inline: true },
            { name: 'Texte', value: `\`${textChannels}\``, inline: true },
            { name: 'Vocaux', value: `\`${voiceChannels}\``, inline: true },
            { name: 'Annonces', value: `\`${announcementChannels}\``, inline: true },
            { name: 'Forums', value: `\`${forumChannels}\``, inline: true },
            { name: 'Scène', value: `\`${stageChannels}\``, inline: true },
            { name: 'Fils', value: `\`${threadChannels}\``, inline: true },
            { name: '═══════ RÔLES ═══════', value: '\u200b', inline: false },
            { name: 'Total', value: `\`${roles.size}\` rôle(s)`, inline: true },
            { name: '═══════ ÉMOJIS ═══════', value: '\u200b', inline: false },
            { name: 'Statiques', value: `\`${staticEmojis}\``, inline: true },
            { name: 'Animés', value: `\`${animatedEmojis}\``, inline: true },
            { name: 'Stickers', value: `\`${guild.stickers.cache.size}\``, inline: true },
            { name: '═══════ FICHIER JOINT ═══════', value: '\u200b', inline: false },
            { name: 'Contenu', value: `Toutes les données détaillées (noms, IDs de tous les salons, rôles, membres, émojis, etc.) sont contenues dans le fichier texte ci-joint. Aucun émoji n'est présent dans le fichier texte.`, inline: false }
        )
        .setFooter({
            text: `Division Vanguard - Rapport officiel | ID: ${guild.id}`,
            iconURL: guild.iconURL() || undefined
        });

    return { embed, attachment };
}

module.exports = { collectServerInfo };
