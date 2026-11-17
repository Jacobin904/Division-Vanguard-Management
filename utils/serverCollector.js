const { EmbedBuilder, AttachmentBuilder } = require('discord.js');

function collectServerInfo(guild) {
    const date = new Date();

    // 1. Fichier texte brut (inchangé, contient TOUT)
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
        report += `[Pos ${String(role.position).padStart(2)}] ${role.name} | ID: ${role.id} | Couleur: ${role.hexColor}\n`;
    });
    report += '\n';

    report += `--- MEMBRES (${guild.memberCount} au total) ---\n`;
    guild.members.cache.forEach(member => {
        report += `Nom: ${member.user.username} | ID: ${member.user.id} | Bot: ${member.user.bot}\n`;
    });

    report += `\n================================================================\n`;
    report += `Rapport généré le ${date.toUTCString()}\n`;
    report += `================================================================\n`;

    const buffer = Buffer.from(report, 'utf-8');
    const attachment = new AttachmentBuilder(buffer, { name: `infos-completes-${guild.id}.txt` });

    // 2. Embed ÉPURÉ et PROFESSIONNEL (Max 25 fields, ici on en a 8)
    const embed = new EmbedBuilder()
        .setAuthor({
            name: `Division Vanguard - Inventaire Serveur`,
            iconURL: guild.iconURL({ size: 64 }) || undefined
        })
        .setTitle('[DONNÉES] Rapport synthétique')
        .setColor(0x5865F2)
        .setThumbnail(guild.iconURL({ size: 256, dynamic: true }) || null)
        .setImage(guild.bannerURL({ size: 1024 }) || null)
        .setTimestamp(date)
        .addFields(
            { 
                name: '📌 Identification', 
                value: `**Nom :** ${guild.name}\n**ID :** \`${guild.id}\`\n**Propriétaire :** <@${guild.ownerId}> (\`${guild.ownerId}\`)`, 
                inline: true 
            },
            { 
                name: '📈 Statistiques', 
                value: `**Membres :** \`${guild.memberCount}\` (\`${guild.members.cache.filter(m => !m.user.bot).size}\` humains, \`${guild.members.cache.filter(m => m.user.bot).size}\` bots)\n**Boosts :** Niveau \`${guild.premiumTier}\` (\`${guild.premiumSubscriptionCount || 0}\` boosts)`, 
                inline: true 
            },
            { 
                name: '🛡️ Sécurité', 
                value: `**Vérification :** \`${guild.verificationLevel}\`\n**Création :** <t:${Math.floor(guild.createdTimestamp / 1000)}:d>`, 
                inline: true 
            },
            { 
                name: '💬 Salons', 
                value: `**Total :** \`${guild.channels.cache.size}\`\n**Texte :** \`${guild.channels.cache.filter(c => c.type === 0).size}\` | **Vocaux :** \`${guild.channels.cache.filter(c => c.type === 2).size}\`\n**Catégories :** \`${guild.channels.cache.filter(c => c.type === 4).size}\` | **Fils :** \`${guild.channels.cache.filter(c => c.isThread()).size}\``, 
                inline: false 
            },
            { 
                name: '🎭 Rôles & Personnalisation', 
                value: `**Rôles :** \`${guild.roles.cache.size}\`\n**Émojis :** \`${guild.emojis.cache.filter(e => !e.animated).size}\` statiques, \`${guild.emojis.cache.filter(e => e.animated).size}\` animés\n**Stickers :** \`${guild.stickers.cache.size}\``, 
                inline: false 
            },
            {
                name: '📎 Fichier Joint',
                value: 'L\'intégralité des données brutes (noms, IDs de tous les salons, rôles, membres) est disponible dans le fichier `.txt` ci-joint. Aucun émoji n\'est présent dans ce fichier.',
                inline: false
            }
        )
        .setFooter({
            text: `Division Vanguard | Système d'information`,
            iconURL: guild.iconURL() || undefined
        });

    return { embed, attachment };
}

module.exports = { collectServerInfo };
