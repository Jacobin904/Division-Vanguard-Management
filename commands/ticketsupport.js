const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { generatePresentationEmbed, generateOpenButton } = require('../utils/ticketManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticketsupport')
        .setDescription('Publier l\'embed de support (administration uniquement)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        // Verification des permissions
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({
                content: '[ERREUR] Vous devez avoir la permission Administrateur pour utiliser cette commande.',
                flags: MessageFlags.Ephemeral
            });
        }

        const embed = generatePresentationEmbed('support');
        const row = generateOpenButton('support');

        await interaction.reply({
            content: '[SUCCES] L\'embed de support a ete publie dans ce salon.',
            embeds: [embed],
            components: [row],
            ephemeral: false
        });
    }
};
