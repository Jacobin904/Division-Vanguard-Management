const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const config = require('../config/guildConfig');
const { canRapport, getHighestGrade } = require('../utils/permissions');
const { logAction, sendToChannel } = require('../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rapport')
        .setDescription('Rediger un rapport de mission officiel (officiers/sous-officiers)')
        .setDefaultMemberPermissions(0),

    async execute(interaction) {
        if (!canRapport(interaction.member)) {
            return interaction.reply({ content: '[ERREUR] Permissions insuffisantes. Seuls les sous-officiers et officiers peuvent rediger un rapport.', flags: MessageFlags.Ephemeral });
        }

        const modal = new ModalBuilder().setCustomId('rapport_mission_modal').setTitle('[AAR] Rapport de Mission');

        modal.addComponents(
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('nom_operation').setLabel("Nom de code de l'operation").setStyle(TextInputStyle.Short).setPlaceholder('Ex : Operation Tempete').setMaxLength(100).setRequired(true)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('operateurs').setLabel('Operateurs presents (noms)').setStyle(TextInputStyle.Paragraph).setPlaceholder('Ex : Jacobin904, Felix').setMaxLength(1000).setRequired(true)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('resultat').setLabel('Resultat (SUCCES / ECHEC / PARTIEL)').setStyle(TextInputStyle.Short).setPlaceholder('SUCCES').setMaxLength(50).setRequired(true)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('details').setLabel('Details et incidents').setStyle(TextInputStyle.Paragraph).setPlaceholder('Deroulement, pertes, objectifs...').setMaxLength(2000).setRequired(false))
        );

        await interaction.showModal(modal);
    }
};

async function handleRapportModal(interaction) {
    const nomOp = interaction.fields.getTextInputValue('nom_operation');
    const operateurs = interaction.fields.getTextInputValue('operateurs');
    const resultat = interaction.fields.getTextInputValue('resultat');
    const details = interaction.fields.getTextInputValue('details') || 'Aucun incident signale.';
    const date = new Date();
    const operateursCount = operateurs.split(',').map(o => o.trim()).filter(o => o.length > 0).length;

    let actionColor = 0xF39C12;
    const resultatUpper = resultat.toUpperCase();
    if (resultatUpper.includes('SUCC')) actionColor = 0x2ECC71;
    else if (resultatUpper.includes('ECHEC')) actionColor = 0xC0392B;

    const embedRapport = new EmbedBuilder()
        .setAuthor({ name: 'Division Vanguard - Rapport de Mission', iconURL: interaction.guild.iconURL({ size: 64 }) || undefined })
        .setTitle(`[RAPPORT] ${nomOp}`)
        .setColor(actionColor)
       
