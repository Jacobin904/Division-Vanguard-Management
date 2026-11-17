const { EmbedBuilder } = require('discord.js');

/**
 * Collecte toutes les informations du serveur et retourne un embed formaté
 */
function collectServerInfo(guild) {
    const owner = guild.ownerId ? `<@${guild.ownerId}>` : 'Inconnu';
    const members = guild.members.cache;
    const channels = guild.channels.cache;
    const roles = guild.roles.cache;
    const emojis = guild.emojis.cache;
    const stickers = guild.stickers.cache;

    // Compteurs de membres
    const totalMembers = guild.memberCount;
    const humans = members.filter(m => !m.user.bot).size;
    const bots = members.filter(m => m.user.bot).size;

    // Compteurs de salons
    const categories = channels.filter(c => c.type === 4).size;
    const textChannels = channels.filter(c => c.type === 0).size;
    const voiceChannels = channels.filter(c => c.type === 2).size;
    const announcementChannels = channels.filter(c => c.type === 5).size;
    const forumChannels = channels.filter(c => c.type === 15).size;
    const stageChannels = channels.filter(c => c.type === 13).size;
    const threadChannels = channels.filter(c => c.isThread()).size;

    // Compteurs d'émojis
    const staticEmojis = emojis.filter(e => !e.animated).size;
    const animatedEmojis = emojis.filter(e => e.animated).size;

    // Boost
    const boostLevel = guild.premiumTier || 0;
    const boostCount = guild.premiumSubscriptionCount || 0;

    // Features
    const features = guild.features.length > 0 
        ? guild.features.map(f => `\`${f}\``).join(', ')
        : 'Aucune';

    // Rôles (top 20)
    const topRoles = roles
        .filter(r => r.id !== guild.id)
        .sort((a, b) => b.position - a.position)
        .first(20)
        .map(r => r.toString())
        .join(', ') || 'Aucun';

    const embed = new EmbedBuilder()
        .setTitle(`📊 Informations complètes de ${guild.name}`)
        .setThumbnail(guild.iconURL({ size: 256, dynamic: true }) || null)
        .setImage(guild.bannerURL({ size: 1024 }) || guild.splashURL({ size: 1024 }) || null)
        .setColor(guild.members.me?.displayColor || 0x5865F2)
        .setFooter({ text: `ID: ${guild.id}` })
        .setTimestamp()
        .addFields(
            { name: '👑 Propriétaire', value: owner, inline: true },
            { name: '📅 Créé le', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`, inline: true },
            { name: '🆔 ID du serveur', value: `\`${guild.id}\``, inline: true },

            { name: '📝 Description', value: guild.description || 'Aucune description', inline: false },

            { name: '👥 Membres', value: `Total : **${totalMembers}**\nHumains : **${humans}**\nBots : **${bots}**`, inline: true },
            { name: '🚀 Boost', value: `Niveau : **${boostLevel}**\nBoosts : **${boostCount}**`, inline: true },
            { name: '🔒 Vérification', value: `\`${verificationLevel(guild.verificationLevel)}\``, inline: true },

            { name: '💬 Salons', value: `Catégories : **${categories}**\nTexte : **${textChannels}**\nVocaux : **${voiceChannels}**\nAnnonces : **${announcementChannels}**\nForums : **${forumChannels}**\nScène : **${stageChannels}**\nFils : **${threadChannels}**`, inline: true },
            { name: '🎭 Rôles', value: `Total : **${roles.size}**\nTop 20 : ${topRoles}`, inline: true },
            { name: '😀 Emojis & Stickers', value: `Statiques : **${staticEmojis}**\nAnimés : **${animatedEmojis}**\nStickers : **${stickers.size}**`, inline: true },

            { name: '⚙️ Fonctionnalités', value: features.length > 1024 ? features.substring(0, 1020) + '...' : features, inline: false }
        );

    // Liens utiles
    const links = [];
    if (guild.iconURL()) links.push(`[Icône](${guild.iconURL({ size: 2048 })})`);
    if (guild.bannerURL()) links.push(`[Bannière](${guild.bannerURL({ size: 2048 })})`);
    if (guild.splashURL()) links.push(`[Splash](${guild.splashURL({ size: 2048 })})`);
    if (guild.discoverySplashURL()) links.push(`[Discovery](${guild.discoverySplashURL({ size: 2048 })})`);
    if (guild.vanityURLCode) links.push(`[Vanity: ${guild.vanityURLCode}](https://discord.gg/${guild.vanityURLCode})`);

    if (links.length > 0) {
        embed.addFields({ name: '🔗 Liens', value: links.join(' • '), inline: false });
    }

    return embed;
}

function verificationLevel(level) {
    const levels = ['Aucun', 'Faible', 'Moyen', 'Élevé', 'Très élevé'];
    return levels[level] || 'Inconnu';
}

module.exports = { collectServerInfo };
