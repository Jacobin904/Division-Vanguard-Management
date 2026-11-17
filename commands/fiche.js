const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder, MessageFlags } = require('discord.js');
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
        const rolesList = membre.roles.cache
            .filter(r => r.id !== interaction.guild.id && r.name !== '@everyone')
            .sort((a, b) => b.position - a.position)
            .map(r => r.name)
            .join(', ') || 'Aucun';

        const specialitesStr = specialites.length > 0
            ? specialites.join(', ')
            : 'Aucune certification';

        const roleCount = membre.roles.cache.filter(r => r.id !== interaction.guild.id && r.name !== '@everyone').size;

        // 1. Création du fichier texte complet
        let ficheText = `================================================================\n`;
        ficheText += `        FICHE MATRICULE OFFICIELLE\n`;
        ficheText += `           DIVISION VANGUARD\n`;
        ficheText += `================================================================\n\n`;
        ficheText += `--- IDENTIFICATION ---\n`;
        ficheText += `Nom de code       : ${membre.user.username}\n`;
        ficheText += `Identifiant       : ${membre.id}\n`;
        ficheText += `Tag Discord       : ${membre.user.tag}\n`;
        ficheText += `Est un bot        : ${membre.user.bot ? 'Oui' : 'Non'}\n`;
        ficheText += `Date d'entrée     : ${membre.joinedAt.toUTCString()}\n`;
        ficheText += `Création compte   : ${membre.user.createdAt.toUTCString()}\n\n`;
        ficheText += `--- HIÉRARCHIE ---\n`;
        ficheText += `Grade actuel      : ${grade}\n`;
        ficheText += `Nombre de rôles   : ${roleCount}\n`;
        ficheText += `Rôles possédés    :\n`;

        membre.roles.cache
            .filter(r => r.id !== interaction.guild.id && r.name !== '@everyone')
            .sort((a, b) => b.position - a.position)
            .forEach(r => {
                ficheText += `  - [Pos ${String(r.position).padStart(2)}] ${r.name} (ID: ${r.id})\n`;
            });

        ficheText += `\n--- CERTIFICATIONS ---\n`;
        ficheText += `Spécialités       : ${specialitesStr}\n`;
        ficheText += `Nombre de certs.  : ${specialites.length}\n`;

        ficheText += `\n================================================================\n`;
        ficheText += `Document généré le ${date.toUTCString()}\n`;
        ficheText += `================================================================\n`;

        const buffer = Buffer.from(ficheText, 'utf-8');
        const attachment = new AttachmentBuilder(buffer, {
            name: `fiche-matricule-${membre.user.username}.txt`
        });

        // 2. Création de l'embed résumé (TRÈS RICHE)
        const embed = new EmbedBuilder()
            .setAuthor({
                name: `Division Vanguard - Fiche Matricule`,
                iconURL: interaction.guild.iconURL({ size: 64 }) || undefined
            })
            .setTitle(`[FICHE] ${membre.user.username}`)
            .setColor(membre.roles.highest?.color || 0x5865F2)
            .setThumbnail(membre.user.displayAvatarURL({ size: 256 }))
            .setImage(membre.user.bannerURL({ size: 256 }) || null)
            .setTimestamp(date)
            .addFields(
                { name: '═══════ IDENTIFICATION ═══════', value: '\u200b', inline: false },
                { name: 'Nom de code', value: `${membre.user.username}`, inline: true },
                { name: 'ID Discord', value: `\`${membre.id}\``, inline: true },
                { name: 'Bot', value: membre.user.bot ? 'Oui' : 'Non', inline: true },
                { name: 'Compte créé', value: `<t:${Math.floor(membre.user.createdAt.getTime() / 1000)}:d>`, inline: true },
                { name: 'Entrée dans l\'unité', value: `<t:${Math.floor(membre.joinedAt.getTime() / 1000)}:d>`, inline: true },
                { name: 'Ancienneté', value: `<t:${Math.floor(membre.joinedAt.getTime() / 1000)}:R>`, inline: true },
                { name: '═══════ HIÉRARCHIE ═══════', value: '\u200b', inline: false },
                { name: 'Grade actuel', value: `\`${grade}\``, inline: true },
                { name: 'Rôle le plus haut', value: `${membre.roles.highest?.name || 'Aucun'}`, inline: true },
                { name: 'Nombre de rôles', value: `\`${roleCount}\` rôle(s)`, inline: true },
                { name: '═══════ CERTIFICATIONS ═══════', value: '\u200b', inline: false },
                { name: 'Nombre de spécialités', value: `\`${specialites.length}\` certification(s)`, inline: true },
                { name: 'Statut', value: specialites.length > 0 ? 'Opérateur certifié' : 'En formation', inline: true },
                { name: '═══════ LISTE COMPLÈTE ═══════', value: '\u200b', inline: false },
                { name: 'Spécialités obtenues', value: specialitesStr.length > 1024 ? specialitesStr.substring(0, 1020) + '...' : specialitesStr, inline: false },
                { name: 'Tous les rôles', value: rolesList.length > 1024 ? rolesList.substring(0, 1020) + '...' : rolesList, inline: false }
            )
            .setFooter({
                text: `Division Vanguard - Fiche officielle | Généré le`,
                iconURL: membre.user.displayAvatarURL()
            });

        await interaction.editReply({
            embeds: [embed],
            files: [attachment]
        });
    }
};
