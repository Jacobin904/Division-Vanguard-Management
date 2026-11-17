const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const { getHighestGrade, getSpecialites } = require('../utils/permissions');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('fiche')
        .setDescription('Générer la fiche matricule complète d\'un membre')
        .addUserOption(option =>
            option.setName('membre')
                .setDescription('Le membre dont on veut la fiche (par défaut : vous)')
                .setRequired(false)),

    async execute(interaction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const membre = interaction.options.getMember('membre') || interaction.member;
        const date = new Date();

        const grade = getHighestGrade(membre);
        const specialites = getSpecialites(membre);
        const roleCount = membre.roles.cache.filter(r => r.id !== interaction.guild.id && r.name !== '@everyone').size;

        // 1. Fichier texte
        let ficheText = `================================================================\n`;
        ficheText += `        FICHE MATRICULE OFFICIELLE\n`;
        ficheText += `           DIVISION VANGUARD\n`;
        ficheText += `================================================================\n\n`;
        ficheText += `--- IDENTIFICATION ---\n`;
        ficheText += `Nom de code       : ${membre.user.username}\n`;
        ficheText += `Identifiant       : ${membre.id}\n`;
        ficheText += `Date d'entrée     : ${membre.joinedAt.toUTCString()}\n\n`;
        ficheText += `--- HIÉRARCHIE ---\n`;
        ficheText += `Grade actuel      : ${grade}\n`;
        ficheText += `Nombre de rôles   : ${roleCount}\n\n`;
        ficheText += `--- CERTIFICATIONS ---\n`;
        ficheText += `Spécialités       : ${specialites.length > 0 ? specialites.join(', ') : 'Aucune'}\n`;
        ficheText += `================================================================\n`;

        const buffer = Buffer.from(ficheText, 'utf-8');
        const attachment = new AttachmentBuilder(buffer, { name: `fiche-matricule-${membre.user.username}.txt` });

        // 2. Embed ÉPURÉ
        const embed = new EmbedBuilder()
            .setAuthor({ name: 'Division Vanguard - Fiche Matricule', iconURL: interaction.guild.iconURL({ size: 64 }) || undefined })
            .setTitle(`[FICHE] ${membre.user.username}`)
            .setColor(membre.roles.highest?.color || 0x5865F2)
            .setThumbnail(membre.user.displayAvatarURL({ size: 256 }))
            .setTimestamp(date)
            .addFields(
                { name: '👤 Identification', value: `**Grade :** \`${grade}\`\n**ID :** \`${membre.id}\`\n**Compte créé :** <t:${Math.floor(membre.user.createdAt.getTime() / 1000)}:d>`, inline: true },
                { name: '📅 Ancienneté', value: `**Entrée dans l'unité :** <t:${Math.floor(membre.joinedAt.getTime() / 1000)}:d>\n**Depuis :** <t:${Math.floor(membre.joinedAt.getTime() / 1000)}:R>`, inline: true },
                { name: '🎖️ Certifications', value: `**Nombre :** \`${specialites.length}\`\n**Détails :** ${specialites.length > 0 ? specialites.join(', ') : 'En formation'}`, inline: false }
            )
            .setFooter({ text: 'Division Vanguard | Document officiel', iconURL: membre.user.displayAvatarURL() });

        // 3. COMPOSANT V2 : Bouton d'action
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`view_profile_${membre.id}`)
                    .setLabel('Voir le profil Discord')
                    .setStyle(ButtonStyle.Link)
                    .setURL(`https://discord.com/users/${membre.id}`)
            );

        await interaction.editReply({
            embeds: [embed],
            files: [attachment],
            components: [row]
        });
    }
};
