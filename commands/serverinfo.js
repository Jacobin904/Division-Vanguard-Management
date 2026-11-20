'use strict';

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { collectServerInfo } = require('../utils/serverCollector');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('serverinfo')
        .setDescription('Génère un rapport complet du serveur avec toutes les permissions (admin uniquement)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .setDMPermission(false),

    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({
                content: '[ERREUR] Vous devez avoir la permission Administrateur pour utiliser cette commande.'
            });
        }

        await interaction.deferReply();

        const { embed, attachment } = collectServerInfo(interaction.guild);

        await interaction.editReply({
            content: '[SUCCÈS] Voici le rapport complet du serveur, incluant toutes les permissions des rôles et des salons.',
            embeds: [embed],
            files: [attachment]
        });
    }
};
