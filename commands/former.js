const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const config = require('../config/guildConfig');
const { canForm } = require('../utils/permissions');
const { logAction, sendToChannel } = require('../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('former')
        .setDescription('Certifier un membre dans une spécialité (officiers supérieurs uniquement)')
        .addUserOption(option => option.setName('membre').setDescription('Le membre à former').setRequired(true))
        .addStringOption(option => option.setName('specialite').setDescription('La spécialité à certifier').setRequired(true).setAutocomplete(true))
        .setDefaultMemberPermissions(0),

    async autocomplete(interaction) {
        const focused = interaction.options.getFocused().toLowerCase();
        const choices = Object.keys(config.specialites).filter(s => s.toLowerCase().includes(focused)).slice(0, 25);
        await interaction.respond(choices.map(c => ({ name: c, value: c })));
    },

    async execute(interaction) {
        if (!canForm(interaction.member)) {
            return interaction.reply({ content: '[ERREUR] Permissions insuffisantes. Seuls les officiers supérieurs peuvent utiliser cette commande.', flags: MessageFlags.Ephemeral });
        }

        const membre = interaction.options.getMember('membre');
        const specialiteNom = interaction.options.getString('specialite');
        const specialiteId = config.specialites[specialiteNom];

        if (!specialiteId) {
            return interaction.reply({ content: `[ERREUR] La spécialité "${specialiteNom}" n'existe pas dans le registre CIRFA.`, flags: MessageFlags.Ephemeral });
        }

        if (membre.roles.cache.has(specialiteId)) {
            return interaction.reply({ content: `[ERREUR] ${membre.user.username} possède déjà cette certification.`, flags: MessageFlags.Ephemeral });
        }

        try {
            await membre.roles.add(specialiteId);
        } catch (error) {
            return interaction.reply({ content: '[ERREUR] Impossible d\'ajouter le rôle. Vérifiez la hiérarchie des rôles du bot.', flags: MessageFlags.Ephemeral });
        }

        const date = new Date();

        // Embed propre et aéré
        const embedResultat = new EmbedBuilder()
            .setAuthor({ name: 'CIRFA - Centre de Formation', iconURL: interaction.guild.iconURL({ size: 64 }) || undefined })
            .setTitle('[FORMATION] Certification validée')
            .setColor(0x2ECC71) // Vert émeraude professionnel
            .setTimestamp(date)
            .setThumbnail(membre.user.displayAvatarURL({ size: 256 }))
            .addFields(
                { name: '👤 Candidat', value: `**${membre.user.username}**\nID: \`${membre.id}\``, inline: true },
                { name: '🎖️ Spécialité', value: `\`${specialiteNom}\`\nRôle: <@&${specialiteId}>`, inline: true },
                { name: '📅 Date', value: `<t:${Math.floor(date.getTime() / 1000)}:F>`, inline: true },
                { name: '✅ Formateur', value: `${interaction.user.username} (${require('../utils/permissions').getHighestGrade(interaction.member)})`, inline: false }
            )
            .setFooter({ text: 'Division Vanguard | Registre des formations', iconURL: interaction.user.displayAvatarURL() });

        await sendToChannel(interaction.client, config.channels.resultatsFormation, { embed: embedResultat });

        await logAction(interaction.client, {
            title: 'FORMATION VALIDÉE',
            description: `Certification enregistrée dans le registre CIRFA.`,
            color: 0x2ECC71,
            fields: [
                { name: 'Membre', value: `${membre.user.username} (\`${membre.id}\`)`, inline: true },
                { name: 'Spécialité', value: `\`${specialiteNom}\``, inline: true },
                { name: 'Formateur', value: `${interaction.user.username}`, inline: true }
            ]
        });

        const embedConfirmation = new EmbedBuilder()
            .setTitle('[SUCCÈS] Certification enregistrée')
            .setColor(0x2ECC71)
            .setDescription(`Le membre **${membre.user.username}** a été certifié dans la spécialité \`${specialiteNom}\`.`)
            .setFooter({ text: 'Division Vanguard - CIRFA' });

        await interaction.reply({ embeds: [embedConfirmation], flags: MessageFlags.Ephemeral });
    }
};
