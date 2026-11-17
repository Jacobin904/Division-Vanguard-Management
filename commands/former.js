const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const config = require('../config/guildConfig');
const { canForm } = require('../utils/permissions');
const { logAction, sendToChannel } = require('../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('former')
        .setDescription('Certifier un membre dans une specialite (officiers superieurs uniquement)')
        .addUserOption(option => option.setName('membre').setDescription('Le membre a former').setRequired(true))
        .addStringOption(option => option.setName('specialite').setDescription('La specialite a certifier').setRequired(true).setAutocomplete(true))
        .setDefaultMemberPermissions(0),

    async autocomplete(interaction) {
        const focused = interaction.options.getFocused().toLowerCase();
        const choices = Object.keys(config.specialites).filter(s => s.toLowerCase().includes(focused)).slice(0, 25);
        await interaction.respond(choices.map(c => ({ name: c, value: c })));
    },

    async execute(interaction) {
        if (!canForm(interaction.member)) {
            return interaction.reply({ content: '[ERREUR] Permissions insuffisantes. Seuls les officiers superieurs peuvent utiliser cette commande.', flags: MessageFlags.Ephemeral });
        }

        const membre = interaction.options.getMember('membre');
        const specialiteNom = interaction.options.getString('specialite');
        const specialiteId = config.specialites[specialiteNom];

        if (!specialiteId) {
            return interaction.reply({ content: `[ERREUR] La specialite "${specialiteNom}" n'existe pas dans le registre CIRFA.`, flags: MessageFlags.Ephemeral });
        }

        if (membre.roles.cache.has(specialiteId)) {
            return interaction.reply({ content: `[ERREUR] ${membre.user.username} possede deja cette certification.`, flags: MessageFlags.Ephemeral });
        }

        try {
            await membre.roles.add(specialiteId);
        } catch (error) {
            return interaction.reply({ content: '[ERREUR] Impossible d\'ajouter le role. Verifiez la hierarchie des roles du bot.', flags: MessageFlags.Ephemeral });
        }

        const date = new Date();

        const embedResultat = new EmbedBuilder()
            .setAuthor({ name: 'CIRFA - Centre de Formation', iconURL: interaction.guild.iconURL({ size: 64 }) || undefined })
            .setTitle('[FORMATION] Certification validee')
            .setColor(0x2ECC71)
            .setTimestamp(date)
            .setThumbnail(membre.user.displayAvatarURL({ size: 256 }))
            .addFields(
                { name: '[CANDIDAT] Candidat', value: `**${membre.user.username}**\nID: \`${membre.id}\``, inline: true },
                { name: '[SPECIALITE] Specialite', value: `\`${specialiteNom}\`\nRole: <@&${specialiteId}>`, inline: true },
                { name: '[DATE] Date', value: `<t:${Math.floor(date.getTime() / 1000)}:F>`, inline: true },
                { name: '[FORMATEUR] Formateur', value: `${interaction.user.username} (${require('../utils/permissions').getHighestGrade(interaction.member)})`, inline: false }
            )
            .setFooter({ text: 'Division Vanguard | Registre des formations', iconURL: interaction.user.displayAvatarURL() });

        await sendToChannel(interaction.client, config.channels.resultatsFormation, { embed: embedResultat });

        await logAction(interaction.client, {
            title: 'FORMATION VALIDEE',
            description: `Certification enregistree dans le registre CIRFA.`,
            color: 0x2ECC71,
            fields: [
                { name: 'Membre', value: `${membre.user.username} (\`${membre.id}\`)`, inline: true },
                { name: 'Specialite', value: `\`${specialiteNom}\``, inline: true },
                { name: 'Formateur', value: `${interaction.user.username}`, inline: true }
            ]
        });

        const embedConfirmation = new EmbedBuilder()
            .setTitle('[SUCCES] Certification enregistree')
            .setColor(0x2ECC71)
            .setDescription(`Le membre **${membre.user.username}** a ete certifie dans la specialite \`${specialiteNom}\`.`)
            .setFooter({ text: 'Division Vanguard - CIRFA' });

        await interaction.reply({ embeds: [embedConfirmation], flags: MessageFlags.Ephemeral });
    }
};
