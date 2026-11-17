const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const config = require('../config/guildConfig');
const { canForm } = require('../utils/permissions');
const { logAction, sendToChannel } = require('../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('former')
        .setDescription('Certifier un membre dans une spécialité (officiers supérieurs uniquement)')
        .addUserOption(option =>
            option.setName('membre')
                .setDescription('Le membre à former')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('specialite')
                .setDescription('La spécialité à certifier')
                .setRequired(true)
                .setAutocomplete(true))
        .setDefaultMemberPermissions(0),

    async autocomplete(interaction) {
        const focused = interaction.options.getFocused().toLowerCase();
        const choices = Object.keys(config.specialites).filter(s =>
            s.toLowerCase().includes(focused)
        ).slice(0, 25);
        await interaction.respond(choices.map(c => ({ name: c, value: c })));
    },

    async execute(interaction) {
        // Vérification des permissions
        if (!canForm(interaction.member)) {
            return interaction.reply({
                content: '[ERREUR] Vous n\'avez pas les permissions nécessaires pour former un membre. Seuls les officiers supérieurs (Commandant et grades supérieurs) peuvent utiliser cette commande.',
                flags: MessageFlags.Ephemeral
            });
        }

        const membre = interaction.options.getMember('membre');
        const specialiteNom = interaction.options.getString('specialite');
        const specialiteId = config.specialites[specialiteNom];

        if (!specialiteId) {
            return interaction.reply({
                content: `[ERREUR] La spécialité "${specialiteNom}" n'existe pas dans le registre CIRFA.`,
                flags: MessageFlags.Ephemeral
            });
        }

        // Vérification que le membre n'a pas déjà la spécialité
        if (membre.roles.cache.has(specialiteId)) {
            return interaction.reply({
                content: `[ERREUR] ${membre.user.username} possède déjà la certification "${specialiteNom}".`,
                flags: MessageFlags.Ephemeral
            });
        }

        // Ajout du rôle
        try {
            await membre.roles.add(specialiteId);
        } catch (error) {
            return interaction.reply({
                content: '[ERREUR] Impossible d\'ajouter le rôle. Vérifiez la hiérarchie des rôles du bot.',
                flags: MessageFlags.Ephemeral
            });
        }

        const date = new Date();

        // Embed pour résultats-formation (TRÈS RICHE)
        const embedResultat = new EmbedBuilder()
            .setAuthor({
                name: `Centre d'Information et de Recrutement - CIRFA`,
                iconURL: interaction.guild.iconURL({ size: 64 }) || undefined
            })
            .setTitle('[FORMATION] Certification validée')
            .setColor(0x00c853)
            .setTimestamp(date)
            .setThumbnail(membre.user.displayAvatarURL({ size: 256 }))
            .addFields(
                { name: '═══════ CANDIDAT ═══════', value: '\u200b', inline: false },
                { name: 'Membre certifié', value: `${membre.user.username}\nID: \`${membre.id}\``, inline: true },
                { name: 'Compte créé le', value: `<t:${Math.floor(membre.user.createdAt.getTime() / 1000)}:d>`, inline: true },
                { name: 'Entrée dans l\'unité', value: `<t:${Math.floor(membre.joinedAt.getTime() / 1000)}:d>`, inline: true },
                { name: '═══════ CERTIFICATION ═══════', value: '\u200b', inline: false },
                { name: 'Spécialité obtenue', value: `\`${specialiteNom}\``, inline: true },
                { name: 'Rôle attribué', value: `<@&${specialiteId}>`, inline: true },
                { name: 'Date de certification', value: `<t:${Math.floor(date.getTime() / 1000)}:F>`, inline: true },
                { name: '═══════ AUTORITÉ ═══════', value: '\u200b', inline: false },
                { name: 'Formateur', value: `${interaction.user.username}\nID: \`${interaction.user.id}\``, inline: true },
                { name: 'Grade du formateur', value: require('../utils/permissions').getHighestGrade(interaction.member), inline: true },
                { name: 'Statut', value: `Certification officielle enregistrée`, inline: true }
            )
            .setFooter({
                text: `Division Vanguard - CIRFA | ID du formateur: ${interaction.user.id}`,
                iconURL: interaction.user.displayAvatarURL()
            });

        await sendToChannel(interaction.client, config.channels.resultatsFormation, { embed: embedResultat });

        // Log admin
        await logAction(interaction.client, {
            title: 'FORMATION VALIDÉE - CIRFA',
            description: `Un membre a été officiellement certifié dans une spécialité militaire par le CIRFA.`,
            color: 0x00c853,
            fields: [
                { name: 'Membre', value: `${membre.user.username}\nID: \`${membre.id}\``, inline: true },
                { name: 'Spécialité', value: `\`${specialiteNom}\``, inline: true },
                { name: 'Rôle attribué', value: `<@&${specialiteId}>`, inline: true },
                { name: 'Formateur', value: `${interaction.user.username}\nID: \`${interaction.user.id}\``, inline: true },
                { name: 'Grade', value: require('../utils/permissions').getHighestGrade(interaction.member), inline: true },
                { name: 'Date', value: `<t:${Math.floor(date.getTime() / 1000)}:R>`, inline: true }
            ]
        });

        // Réponse à l'auteur
        const embedConfirmation = new EmbedBuilder()
            .setTitle('[SUCCÈS] Certification enregistrée')
            .setColor(0x00c853)
            .setTimestamp()
            .setThumbnail(membre.user.displayAvatarURL({ size: 64 }))
            .addFields(
                { name: 'Membre certifié', value: `${membre.user.username}\nID: \`${membre.id}\``, inline: true },
                { name: 'Spécialité', value: `\`${specialiteNom}\``, inline: true },
                { name: 'Rôle attribué', value: `<@&${specialiteId}>`, inline: true },
                { name: 'Archives', value: `La certification a été enregistrée dans <#${config.channels.resultatsFormation}>.`, inline: false }
            )
            .setFooter({ text: 'Division Vanguard - CIRFA' });

        await interaction.reply({ embeds: [embedConfirmation], flags: MessageFlags.Ephemeral });
    }
};
