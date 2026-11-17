const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config/guildConfig');
const { canRapport } = require('../utils/permissions');
const { logAction, sendToChannel } = require('../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rapport')
        .setDescription('Rediger un rapport de mission officiel (officiers/sous-officiers)'),

    async execute(interaction) {
        // Verification des permissions
        if (!canRapport(interaction.member)) {
            return interaction.reply({
                content: '[ERREUR] Vous n\'avez pas les permissions necessaires pour rediger un rapport de mission.',
                ephemeral: true
            });
        }

        // Ouverture du modal
        const modal = new ModalBuilder()
            .setCustomId('rapport_mission_modal')
            .setTitle('[AAR] Rapport de Mission');

        const nomOpInput = new TextInputBuilder()
            .setCustomId('nom_operation')
            .setLabel('Nom de code de l\'operation')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Ex : Operation Tempete')
            .setRequired(true);

        const operateursInput = new TextInputBuilder()
            .setCustomId('operateurs')
            .setLabel('Operateurs presents (noms separes par des virgules)')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('Ex : Jacobin904, Felix, Bibibopm')
            .setRequired(true);

        const resultatInput = new TextInputBuilder()
            .setCustomId('resultat')
            .setLabel('Resultat de la mission (SUCCES / ECHEC / PARTIEL)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Ex : SUCCES')
            .setRequired(true);

        const detailsInput = new TextInputBuilder()
            .setCustomId('details')
            .setLabel('Details et incidents (optionnel)')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('Deroulement, pertes, objectifs atteints...')
            .setRequired(false);

        const row1 = new ActionRowBuilder().addComponents(nomOpInput);
        const row2 = new ActionRowBuilder().addComponents(operateursInput);
        const row3 = new ActionRowBuilder().addComponents(resultatInput);
        const row4 = new ActionRowBuilder().addComponents(detailsInput);

        modal.addComponents(row1, row2, row3, row4);

        await interaction.showModal(modal);
    }
};

// Gestionnaire du modal (appele depuis interactionCreate)
async function handleRapportModal(interaction) {
    const nomOp = interaction.fields.getTextInputValue('nom_operation');
    const operateurs = interaction.fields.getTextInputValue('operateurs');
    const resultat = interaction.fields.getTextInputValue('resultat');
    const details = interaction.fields.getTextInputValue('details') || 'Aucun incident signale.';

    const date = new Date().toUTCString();

    // Embed pour rapports-mission
    const embedRapport = new EmbedBuilder()
        .setTitle(`[RAPPORT] ${nomOp}`)
        .setColor(resultat.toUpperCase().includes('SUCCES') ? 0x00ff00 : resultat.toUpperCase().includes('ECHEC') ? 0xff0000 : 0xffaa00)
        .setTimestamp()
        .addFields(
            { name: 'Commandant', value: `${interaction.user.username} (ID: ${interaction.user.id})`, inline: true },
            { name: 'Resultat', value: resultat.toUpperCase(), inline: true },
            { name: 'Date', value: date, inline: true },
            { name: 'Operateurs', value: operateurs.length > 1024 ? operateurs.substring(0, 1020) + '...' : operateurs, inline: false },
            { name: 'Details', value: details.length > 1024 ? details.substring(0, 1020) + '...' : details, inline: false }
        )
        .setFooter({ text: 'Division Vanguard - Rapport officiel' });

    await sendToChannel(interaction.client, config.channels.rapportsMission, { embed: embedRapport });

    // Copie pour debrief
    const embedDebrief = new EmbedBuilder()
        .setTitle(`[DEBRIEF] ${nomOp}`)
        .setColor(0x5865F2)
        .setTimestamp()
        .setDescription(`Rapport transmis par ${interaction.user.username} pour analyse par l'Etat-Major.`)
        .addFields(
            { name: 'Resultat', value: resultat.toUpperCase(), inline: true },
            { name: 'Operateurs', value: operateurs.length > 1024 ? operateurs.substring(0, 1020) + '...' : operateurs, inline: false }
        );

    await sendToChannel(interaction.client, config.channels.debriefMission, { embed: embedDebrief });

    // Log
    await logAction(interaction.client, {
        title: 'RAPPORT DE MISSION',
        description: `Un nouveau rapport a ete soumis.`,
        color: 0x5865F2,
        fields: [
            { name: 'Operation', value: nomOp, inline: true },
            { name: 'Resultat', value: resultat, inline: true },
            { name: 'Auteur', value: `${interaction.user.username} (${interaction.user.id})`, inline: true }
        ]
    });

    await interaction.reply({
        content: `[SUCCES] Rapport de mission "${nomOp}" transmis avec succes aux archives.`,
        ephemeral: true
    });
}

module.exports.handleRapportModal = handleRapportModal;
