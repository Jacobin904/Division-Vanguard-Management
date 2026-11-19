'use strict';

const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const config = require('../config/guildConfig');
const { peutRapporter, gradeLePlusEleve } = require('../utils/permissions');
const { sendToChannel } = require('../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rapport')
        .setDescription('Rédiger un rapport de mission officiel (officiers et sous-officiers)')
        .setDefaultMemberPermissions(0),

    async execute(interaction) {
        if (!peutRapporter(interaction.member)) {
            return interaction.reply({ 
                content: '[ERREUR] Permissions insuffisantes. Seuls les sous-officiers et officiers peuvent rédiger un rapport.', 
                flags: MessageFlags.Ephemeral 
            });
        }

        const modal = new ModalBuilder()
            .setCustomId('rapport_mission_modal')
            .setTitle('[AAR] Rapport de Mission');

        modal.addComponents(
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('nom_operation')
                    .setLabel("Nom de code de l'opération")
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('Ex : Opération Tempête')
                    .setMaxLength(100)
                    .setRequired(true)
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('operateurs')
                    .setLabel('Opérateurs présents (noms)')
                    .setStyle(TextInputStyle.Paragraph)
                    .setPlaceholder('Ex : Jacobin904, Felix')
                    .setMaxLength(1000)
                    .setRequired(true)
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('resultat')
                    .setLabel('Résultat (SUCCÈS / ÉCHEC / PARTIEL)')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('SUCCÈS')
                    .setMaxLength(50)
                    .setRequired(true)
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('details')
                    .setLabel('Détails et incidents')
                    .setStyle(TextInputStyle.Paragraph)
                    .setPlaceholder('Déroulement, pertes, objectifs...')
                    .setMaxLength(2000)
                    .setRequired(false)
            )
        );

        await interaction.showModal(modal);
    }
};

async function handleRapportModal(interaction) {
    const nomOp = interaction.fields.getTextInputValue('nom_operation');
    const operateurs = interaction.fields.getTextInputValue('operateurs');
    const resultat = interaction.fields.getTextInputValue('resultat');
    const details = interaction.fields.getTextInputValue('details') || 'Aucun incident signalé.';
    const date = new Date();
    const operateursCount = operateurs.split(',').map(o => o.trim()).filter(o => o.length > 0).length;

    let actionColor = 0xF39C12;
    const resultatUpper = resultat.toUpperCase();
    if (resultatUpper.includes('SUCC')) {
        actionColor = 0x2E7D32;
    } else if (resultatUpper.includes('ECHEC')) {
        actionColor = 0xC0392B;
    }

    const embedRapport = new EmbedBuilder()
        .setAuthor({ 
            name: 'Division Vanguard — Rapport de Mission', 
            iconURL: interaction.guild.iconURL({ size: 64 }) || undefined 
        })
        .setTitle(`[RAPPORT] ${nomOp}`)
        .setColor(actionColor)
        .setTimestamp(date)
        .addFields(
            { name: '[INFO] Identification', value: `**Opération :** \`${nomOp}\`\n**Résultat :** \`${resultatUpper}\`\n**Date :** <t:${Math.floor(date.getTime() / 1000)}:F>`, inline: true },
            { name: '[CMD] Commandement', value: `**Chef de mission :** ${interaction.user.username}\n**Grade :** \`${gradeLePlusEleve(interaction.member)}\`\n**Effectif :** \`${operateursCount}\` opérateur(s)`, inline: true },
            { name: '[DÉTAILS] Détails de la mission', value: details, inline: false },
            { name: '[EFFECTIF] Opérateurs engagés', value: operateurs, inline: false }
        )
        .setFooter({ text: 'Division Vanguard — Archives des opérations' });

    await sendToChannel(interaction.client, config.channels.rapportsMission, { embed: embedRapport });

    const embedConfirmation = new EmbedBuilder()
        .setTitle('[SUCCÈS] Rapport transmis')
        .setColor(0x2E7D32)
        .setDescription(`Le rapport de l'opération \`${nomOp}\` a été archivé dans <#${config.channels.rapportsMission}>.`)
        .setFooter({ text: 'Division Vanguard — Système de rapport' });

    await interaction.reply({ 
        embeds: [embedConfirmation], 
        flags: MessageFlags.Ephemeral 
    });
}

module.exports.handleRapportModal = handleRapportModal;
