const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { generatePresentationEmbed, generateOpenButton } = require('../utils/ticketManager');
const config = require('../config/guildConfig');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticketrdv')
        .setDescription('Publier l\'embed de prise de rendez-vous (administration uniquement)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        // Verification des permissions
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({
                content: '[ERREUR] Vous devez avoir la permission Administrateur pour utiliser cette commande.',
                flags: MessageFlags.Ephemeral
            });
        }

        const embed = generatePresentationEmbed('rdv');
        const row = generateOpenButton('rdv');

        await interaction.reply({
            content: '[SUCCES] L\'embed de prise de rendez-vous a ete publie dans ce salon.',
            embeds: [embed],
            components: [row],
            ephemeral: false
        });
    }
};
