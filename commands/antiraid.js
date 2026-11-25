'use strict';

const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const bdd = require('../utils/database');
const { declencherLockdown, desactiverLockdown } = require('../utils/antiraid');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('antiraid')
        .setDescription('Configurer le système Anti-Raid (Admin uniquement)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(sub =>
            sub.setName('statut')
               .setDescription('Afficher le statut de l\'Anti-Raid')
        )
        .addSubcommand(sub =>
            sub.setName('activer')
               .setDescription('Activer l\'Anti-Raid')
        )
        .addSubcommand(sub =>
            sub.setName('desactiver')
               .setDescription('Désactiver l\'Anti-Raid')
        )
        .addSubcommand(sub =>
            sub.setName('config')
               .setDescription('Configurer la détection de raid')
               .addIntegerOption(opt => opt.setName('maxjoins').setDescription('Nombre max de joins').setRequired(false))
               .addIntegerOption(opt => opt.setName('periode').setDescription('Période en secondes').setRequired(false))
        )
        .addSubcommand(sub =>
            sub.setName('lockdown')
               .setDescription('Activer/désactiver manuellement le lockdown')
               .addBooleanOption(opt => opt.setName('actif').setDescription('Activer/désactiver').setRequired(true))
        ),

    async execute(interaction) {
        const sousCommande = interaction.options.getSubcommand();

        switch (sousCommande) {
            case 'statut': {
                const config = bdd.getAntiraid();
                const embed = new EmbedBuilder()
                    .setTitle('Configuration Anti-Raid')
                    .setColor(config.actif ? 0x2E7D32 : 0xE74C3C)
                    .addFields(
                        { name: 'Statut global', value: config.actif ? 'Actif' : 'Inactif', inline: true },
                        { name: 'Lockdown', value: config.lockdown.actif ? 'ACTIF' : 'Inactif', inline: true },
                        { name: 'Détection', value: `${config.detection.maxJoins} joins / ${config.detection.periode / 1000}s`, inline: true },
                        { name: 'Comptes récents', value: config.comptesRecents.actif ? `${config.comptesRecents.ageMin / 3600000}h minimum` : 'Inactif', inline: true }
                    );
                return interaction.reply({ embeds: [embed] });
            }

            case 'activer': {
                bdd.setAntiraid({ actif: true });
                return interaction.reply({ content: '[SUCCÈS] Anti-Raid activé.' });
            }

            case 'desactiver': {
                bdd.setAntiraid({ actif: false });
                return interaction.reply({ content: '[SUCCÈS] Anti-Raid désactivé.' });
            }

            case 'config': {
                const maxJoins = interaction.options.getInteger('maxjoins');
                const periode = interaction.options.getInteger('periode');

                const config = bdd.getAntiraid();
                if (maxJoins) config.detection.maxJoins = maxJoins;
                if (periode) config.detection.periode = periode * 1000;
                bdd.setAntiraid(config);

                return interaction.reply({ content: '[SUCCÈS] Configuration Anti-Raid mise à jour.' });
            }

            case 'lockdown': {
                const actif = interaction.options.getBoolean('actif');
                
                if (actif) {
                    await declencherLockdown(interaction.guild, bdd.getAntiraid());
                    return interaction.reply({ content: '[SUCCÈS] Lockdown activé manuellement.' });
                } else {
                    await desactiverLockdown(interaction.guild);
                    return interaction.reply({ content: '[SUCCÈS] Lockdown désactivé manuellement.' });
                }
            }
        }
    }
};
