const { EmbedBuilder, AttachmentBuilder } = require('discord.js');

function collectServerInfo(guild) {
    // 1. Construction du rapport texte complet (TOUT TOUT TOUT, sans émojis)
    let report = `=== INFORMATIONS DU SERVEUR : ${guild.name} ===\n`;
    report += `ID du serveur : ${guild.id}\n`;
    report += `Proprietaire ID : ${guild.ownerId}\n`;
    report += `Date de creation : ${guild.createdAt.toUTCString()}\n`;
    report += `Description : ${guild.description || 'Aucune'}\n`;
    report += `Niveau de verification : ${guild.verificationLevel}\n`;
    report += `Niveau de boost : ${guild.premiumTier}\n`;
    report += `Nombre de boosts : ${guild.premiumSubscriptionCount || 0}\n`;
    report += `Fonctionnalites : ${guild.features.join(', ') || 'Aucune'}\n\n`;

    report += `=== SALONS (${guild.channels.cache.size} au total) ===\n`;
    guild.channels.cache.forEach(channel => {
        report += `[${channel.type}] ${channel.name} | ID: ${channel.id}\n`;
    });
    report += '\n';

    report += `=== ROLES (${guild.roles.cache.size} au total) ===\n`;
    const sortedRoles = guild.roles.cache.sort((a, b) => b.position - a.position);
    sortedRoles.forEach(role => {
        report += `[Position ${role.position}] ${role.name} | ID: ${role.id} | Couleur: ${role.hexColor}\n`;
    });
    report += '\n';

    report += `=== MEMBRES (${guild.memberCount} au total) ===\n`;
    guild.members.cache.forEach(member => {
        report += `Nom: ${member.user.username} | ID: ${member.user.id} | EstBot: ${member.user.bot}\n`;
    });
    report += '\n';

    report += `=== EMOJIS ET STICKERS ===\n`;
    report += `Emojis (${guild.emojis.cache.size}):\n`;
    guild.emojis.cache.forEach(emoji => {
        report += `Nom: ${emoji.name} | ID: ${emoji.id} | Anime: ${emoji.animated}\n`;
    });
    report += `Stickers (${guild.stickers.cache.size}):\n`;
    guild.stickers.cache.forEach(sticker => {
        report += `Nom: ${sticker.name} | ID: ${sticker.id}\n`;
    });

    // 2. Création de la pièce jointe (fichier texte)
    const buffer = Buffer.from(report, 'utf-8');
    const attachment = new AttachmentBuilder(buffer, { name: `infos-completes-${guild.id}.txt` });

    // 3. Création de l'embed de résumé (PROPRE, SANS AUCUN ÉMOJI)
    const embed = new EmbedBuilder()
        .setTitle(`Rapport complet du serveur : ${guild.name}`)
        .setColor(0x5865F2)
        .setFooter({ text: `ID du serveur : ${guild.id}` })
        .setTimestamp()
        .addFields(
            { name: 'Proprietaire', value: `<@${guild.ownerId}>\nID: ${guild.ownerId}`, inline: true },
            { name: 'Membres', value: `Total: ${guild.memberCount}\nHumains: ${guild.members.cache.filter(m => !m.user.bot).size}\nBots: ${guild.members.cache.filter(m => m.user.bot).size}`, inline: true },
            { name: 'Salons', value: `Total: ${guild.channels.cache.size}`, inline: true },
            { name: 'Roles', value: `Total: ${guild.roles.cache.size}`, inline: true },
            { name: 'Boosts', value: `Niveau: ${guild.premiumTier}\nCompteur: ${guild.premiumSubscriptionCount || 0}`, inline: true },
            { name: 'Fichier de donnees brutes', value: 'Toutes les donnees detaillees (noms, IDs de tous les salons, roles, membres, etc.) sont contenues dans le fichier .txt ci-joint. Aucun emoji n\'est present dans ce fichier.', inline: false }
        );

    return { embed, attachment };
}

module.exports = { collectServerInfo };
