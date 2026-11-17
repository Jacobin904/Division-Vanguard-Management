const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const config = require('../config/guildConfig');
const { canRapport } = require('../utils/permissions');
const { logAction, sendToChannel } = require('../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rapport')
        .setDescription('Rédiger un rapport de mission officiel (officiers/sous-officiers)')
        .setDefaultMemberPermissions(0),

    async execute(interaction) {
        // Vérification des permissions
        if (!canRapport(interaction.member)) {
            return interaction.reply({
                content: '[ERREUR] Vous n\'avez pas les permissions nécessaires pour rédiger un rapport de mission. Seuls les sous-officiers et officiers peuvent utiliser cette commande.',
                flags: MessageFlags.Ephemeral
            });
        }

        // Ouverture du modal
        const modal = new ModalBuilder()
            .setCustomId('rapport_mission_modal')
            .setTitle('[AAR] Rapport de Mission');

        // Labels <= 45 caractères (limite Discord)
        const nomOpInput = new TextInputBuilder()
            .setCustomId('nom_operation')
            .setLabel('Nom de code de l\'opération')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Ex : Opération Tempête')
            .setMaxLength(100)
            .setRequired(true);

        const operateursInput = new TextInputBuilder()
            .setCustomId('operateurs')
            .setLabel('Opérateurs présents (noms)')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('Ex : Jacobin904, Felix, Bibibopm')
            .setMaxLength(1000)
            .setRequired(true);

        const resultatInput = new TextInputBuilder()
            .setCustomId('resultat')
            .setLabel('Résultat (SUCCÈS / ÉCHEC / PARTIEL)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('SUCCÈS')
            .setMaxLength(50)
            .setRequired(true);

        const detailsInput = new TextInputBuilder()
            .setCustomId('details')
            .setLabel('Détails et incidents')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('Déroulement, pertes, objectifs atteints...')
            .setMaxLength(2000)
            .setRequired(false);

        const objectifsInput = new TextInputBuilder()
            .setCustomId('objectifs')
            .setLabel('Objectifs atteints / manqués')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('Lister les objectifs et leur statut')
            .setMaxLength(1000)
            .setRequired(false);

        const row1 = new ActionRowBuilder().addComponents(nomOpInput);
        const row2 = new ActionRowBuilder().addComponents(operateursInput);
        const row3 = new ActionRowBuilder().addComponents(resultatInput);
        const row4 = new ActionRowBuilder().addComponents(detailsInput);
        const row5 = new ActionRowBuilder().addComponents(objectifsInput);

        modal.addComponents(row1, row2, row3, row4, row5);

        await interaction.showModal(modal);
    }
};

// Gestionnaire du modal (appelé depuis interactionCreate)
async function handleRapportModal(interaction) {
    const nomOp = interaction.fields.getTextInputValue('nom_operation');
    const operateurs = interaction.fields.getTextInputValue('operateurs');
    const resultat = interaction.fields.getTextInputValue('resultat');
    const details = interaction.fields.getTextInputValue('details') || 'Aucun incident signalé.';
    const objectifs = interaction.fields.getTextInputValue('objectifs') || 'Non renseignés.';

    const date = new Date();
    const dateStr = date.toUTCString();
    const operateursCount = operateurs.split(',').map(o => o.trim()).filter(o => o.length > 0).length;

    // Détermination de la couleur selon le résultat
    let actionColor = 0xffaa00;
    let resultatUpper = resultat.toUpperCase();
    if (resultatUpper.includes('SUCC') || resultatUpper.includes('RÉU')) actionColor = 0x00c853;
    else if (resultatUpper.includes('ÉCHEC') || resultatUpper.includes('ECHEC') || resultatUpper.includes('FAIL')) actionColor = 0xd50000;
    else if (resultatUpper.includes('PART')) actionColor = 0xff8f00;

    // Embed principal pour rapports-mission (TRÈS RICHE)
    const embedRapport = new EmbedBuilder()
        .setAuthor({
            name: `Division Vanguard - Rapport de Mission`,
            iconURL: interaction.guild.iconURL({ size: 64 }) || undefined
        })
        .setTitle(`[RAPPORT] ${nomOp}`)
        .setColor(actionColor)
        .setTimestamp(date)
        .setThumbnail(interaction.guild.iconURL({ size: 256 }) || null)
        .addFields(
            { name: '═══════ IDENTIFICATION ═══════', value: '\u200b', inline: false },
            { name: 'Opération', value: `\`${nomOp}\``, inline: true },
            { name: 'Résultat', value: `\`${resultatUpper}\``, inline: true },
            { name: 'Date et heure', value: `<t:${Math.floor(date.getTime() / 1000)}:F>`, inline: true },
            { name: '═══════ COMMANDEMENT ═══════', value: '\u200b', inline: false },
            { name: 'Commandant de mission', value: `${interaction.user.username}\nID: \`${interaction.user.id}\``, inline: true },
            { name: 'Grade', value: `${require('../utils/permissions').getHighestGrade(interaction.member)}`, inline: true },
            { name: 'Effectif engagé', value: `\`${operateursCount}\` opérateur(s)`, inline: true },
            { name: '═══════ OPÉRATEURS ═══════', value: '\u200b', inline: false },
            { name: 'Liste des opérateurs', value: operateurs.length > 1024 ? operateurs.substring(0, 1020) + '...' : operateurs, inline: false },
            { name: '═══════ OBJECTIFS ═══════', value: '\u200b', inline: false },
            { name: 'Bilan des objectifs', value: objectifs.length > 1024 ? objectifs.substring(0, 1020) + '...' : objectifs, inline: false },
            { name: '═══════ DÉTAILS ═══════', value: '\u200b', inline: false },
            { name: 'Compte-rendu détaillé', value: details.length > 1024 ? details.substring(0, 1020) + '...' : details, inline: false }
        )
        .setFooter({
            text: `Division Vanguard | Rapport officiel | ID: ${interaction.user.id}`,
            iconURL: interaction.user.displayAvatarURL()
        });

    await sendToChannel(interaction.client, config.channels.rapportsMission, { embed: embedRapport });

    // Copie pour debrief (version État-Major)
    const embedDebrief = new EmbedBuilder()
        .setAuthor({
            name: `État-Major - Analyse requise`,
            iconURL: interaction.guild.iconURL({ size: 64 }) || undefined
        })
        .setTitle(`[DEBRIEF] ${nomOp}`)
        .setColor(0x5865F2)
        .setTimestamp(date)
        .addFields(
            { name: '═══════ RÉSUMÉ ═══════', value: '\u200b', inline: false },
            { name: 'Opération', value: `\`${nomOp}\``, inline: true },
            { name: 'Résultat', value: `\`${resultatUpper}\``, inline: true },
            { name: 'Effectif', value: `\`${operateursCount}\` opérateur(s)`, inline: true },
            { name: '═══════ ANALYSE ═══════', value: '\u200b', inline: false },
            { name: 'Rapporteur', value: `${interaction.user.username} (${require('../utils/permissions').getHighestGrade(interaction.member)})\nID: \`${interaction.user.id}\``, inline: true },
            { name: 'Date de soumission', value: `<t:${Math.floor(date.getTime() / 1000)}:R>`, inline: true },
            { name: 'Statut', value: `En attente d'analyse par l'État-Major`, inline: true },
            { name: '═══════ OPÉRATEURS ═══════', value: '\u200b', inline: false },
            { name: 'Participants', value: operateurs.length > 1024 ? operateurs.substring(0, 1020) + '...' : operateurs, inline: false },
            { name: '═══════ OBJECTIFS ═══════', value: '\u200b', inline: false },
            { name: 'Bilan', value: objectifs.length > 1024 ? objectifs.substring(0, 1020) + '...' : objectifs, inline: false }
        )
        .setFooter({
            text: `Division Vanguard - Document confidentiel État-Major`,
            iconURL: interaction.user.displayAvatarURL()
        });

    await sendToChannel(interaction.client, config.channels.debriefMission, { embed: embedDebrief });

    // Log admin
    await logAction(interaction.client, {
        title: 'RAPPORT DE MISSION SOUMIS',
        description: `Un nouveau rapport de mission a été soumis aux archives officielles de la Division Vanguard.`,
        color: actionColor,
        fields: [
            { name: 'Opération', value: `\`${nomOp}\``, inline: true },
            { name: 'Résultat', value: `\`${resultatUpper}\``, inline: true },
            { name: 'Effectif', value: `\`${operateursCount}\` opérateur(s)`, inline: true },
            { name: 'Auteur', value: `${interaction.user.username}\nID: \`${interaction.user.id}\``, inline: true },
            { name: 'Grade', value: require('../utils/permissions').getHighestGrade(interaction.member), inline: true },
            { name: 'Date', value: `<t:${Math.floor(date.getTime() / 1000)}:R>`, inline: true }
        ]
    });

    // Réponse à l'auteur
    const embedConfirmation = new EmbedBuilder()
        .setTitle('[SUCCÈS] Rapport transmis')
        .setColor(0x00c853)
        .setTimestamp()
        .addFields(
            { name: 'Opération', value: `\`${nomOp}\``, inline: true },
            { name: 'Résultat', value: `\`${resultatUpper}\``, inline: true },
            { name: 'Effectif', value: `\`${operateursCount}\` opérateur(s)`, inline: true },
            { name: 'Archives', value: `Le rapport a été transmis au salon <#${config.channels.rapportsMission}> et une copie a été envoyée à l'État-Major dans <#${config.channels.debriefMission}> pour analyse.`, inline: false }
        )
        .setFooter({ text: 'Division Vanguard - Système de rapport officiel' });

    await interaction.reply({ embeds: [embedConfirmation], flags: MessageFlags.Ephemeral });
}

module.exports.handleRapportModal = handleRapportModal;
