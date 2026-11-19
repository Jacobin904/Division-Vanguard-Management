'use strict';

const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { publierPanneau } = require('../utils/ticketManager');
const { estAdministrateur } = require('../utils/permissions');
const { COULEURS, construireEmbed } = require('../utils/ui');
const { logAction } = require('../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticketrdv')
        .setDescription('Publier l\'interface officielle de prise de rendez-vous dans le salon prévu à cet effet.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .setDMPermission(false),

    async execute(interaction) {
        if (!estAdministrateur(interaction.member)) {
            return interaction.reply({
                content: 'Vous n\'êtes pas habilité à publier une interface officielle.',
                flags: MessageFlags.Ephemeral
            });
        }

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        try {
            const { salon } = await publierPanneau(interaction.guild, 'rdv');

            await interaction.editReply({
                embeds: [
                    construireEmbed(interaction.guild, {
                        service: 'Division Vanguard — Administration',
                        titre: 'INTERFACE PUBLIÉE',
                        couleur: COULEURS.succes,
                        description: `L'interface de prise de rendez-vous est désormais disponible dans <#${salon.id}>.`,
                        pied: 'Division Vanguard — Confirmation administrative'
                    })
                ]
            });

            await logAction(interaction.client, {
                title: 'PUBLICATION D\'INTERFACE',
                description: 'L\'interface de prise de rendez-vous a été publiée ou actualisée.',
                color: COULEURS.information,
                fields: [
                    { name: 'SALON', value: `<#${salon.id}>`, inline: true },
                    { name: 'RESPONSABLE', value: `${interaction.user.username} (${interaction.user.id})`, inline: true }
                ]
            });
        } catch (erreur) {
            await interaction.editReply({
                content: `Publication impossible : ${erreur.message}`
            });
        }
    }
};
