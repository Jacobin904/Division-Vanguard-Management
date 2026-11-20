'use strict';

const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { collectServerInfo } = require('../utils/serverCollector');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('serverinfo')
        .setDescription('Genere un rapport complet du serveur avec toutes les permissions (admin uniquement)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .setDMPermission(false),

    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({
                content: '[ERREUR] Tu dois avoir la permission Administrateur pour utiliser cette commande.',
                flags: MessageFlags.Ephemeral
            });
        }

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const { embed, attachment } = collectServerInfo(interaction.guild);

        try {
            await interaction.user.send({
                embeds: [embed],
                files: [attachment]
            });

            await interaction.editReply({
                content: '[SUCCES] Le rapport complet du serveur (incluant toutes les permissions des roles et salons) a ete envoye dans tes messages prives.'
            });
        } catch (error) {
            console.warn(`Impossible d'envoyer un DM a ${interaction.user.tag}`);
            await interaction.editReply({
                embeds: [embed],
                files: [attachment],
                content: '[INFO] Tes messages prives sont fermes. Le rapport est envoye ici.'
            });
        }
    }
};
