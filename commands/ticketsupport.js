const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { generateTicketEmbed, generateTicketButton } = require('../utils/ticketManager');
const config = require('../config/guildConfig');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticketsupport')
        .setDescription("Publier l interface de support dans le salon dedie")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({ content: '[ERREUR] Permission requise : Administrateur.', flags: MessageFlags.Ephemeral });
        }

        const channel = interaction.guild.channels.cache.get(config.channels.ticketSupportChannel);
        if (!channel) {
            return interaction.reply({ content: '[ERREUR] Le salon cible de support est introuvable. Verifiez la configuration.', flags: MessageFlags.Ephemeral });
        }

        const embed = generateTicketEmbed('support');
        const row = generateTicketButton('support');

        await channel.send({ embeds: [embed], components: [row] });

        await interaction.reply({ 
            content: '[INFO] L interface de ticket a ete publiee dans le salon dedie.', 
            flags: MessageFlags.Ephemeral 
        });
    }
};
