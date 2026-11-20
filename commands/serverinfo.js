'use strict';

const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { collectServerInfo } = require('../utils/serverCollector');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('serverinfo')
        .setDescription('Récupère absolument toutes les infos du serveur (admin uniquement)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({
                content: '[ERREUR] Tu dois avoir la permission **Administrateur** pour utiliser cette commande.',
                flags: MessageFlags.Ephemeral
            });
        }

        await interaction.reply({
            content: '[INFO] Collecte des données en cours. Envoi du rapport complet en message privé...',
            flags: MessageFlags.Ephemeral
        });

        const { embed, attachment } = collectServerInfo(interaction.guild);

        try {
            await interaction.user.send({
                embeds: [embed],
                files: [attachment]
            });

            await interaction.editReply({
                content: '[SUCCÈS] Le rapport complet avec tous les IDs a été envoyé dans tes messages privés.'
            });
        } catch (error) {
            console.warn(`Impossible d'envoyer un DM à ${interaction.user.tag}`);
            await interaction.editReply({
                content: '[ERREUR] Tes messages privés sont fermés. Impossible de t\'envoyer le rapport.',
                flags: MessageFlags.Ephemeral
            });
        }
    }
};
