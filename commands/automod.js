'use strict';

const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const bdd = require('../utils/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('automod')
        .setDescription('Configurer le système AutoMod (Admin uniquement)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(sub =>
            sub.setName('statut')
               .setDescription('Afficher le statut de l\'AutoMod')
        )
        .addSubcommand(sub =>
            sub.setName('activer')
               .setDescription('Activer l\'AutoMod')
        )
        .addSubcommand(sub =>
            sub.setName('desactiver')
               .setDescription('Désactiver l\'AutoMod')
        )
        .addSubcommand(sub =>
            sub.setName('spam')
               .setDescription('Configurer la détection de spam')
               .addBooleanOption(opt => opt.setName('actif').setDescription('Activer/désactiver').setRequired(true))
               .addIntegerOption(opt => opt.setName('max').setDescription('Nombre max de messages').setRequired(false))
               .addStringOption(opt => opt.setName('action').setDescription('Action à prendre').addChoices(
                   { name: 'Mute', value: 'mute' },
                   { name: 'Kick', value: 'kick' },
                   { name: 'Ban', value: 'ban' }
               ).setRequired(false))
        )
        .addSubcommand(sub =>
            sub.setName('liens')
               .setDescription('Configurer la détection de liens')
               .addBooleanOption(opt => opt.setName('actif').setDescription('Activer/désactiver').setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName('mots')
               .setDescription('Gérer les mots interdits')
               .addStringOption(opt => opt.setName('action').setDescription('Action').addChoices(
                   { name: 'Ajouter', value: 'ajouter' },
                   { name: 'Retirer', value: 'retirer' },
                   { name: 'Lister', value: 'lister' }
               ).setRequired(true))
               .addStringOption(opt => opt.setName('mot').setDescription('Mot à ajouter/retirer').setRequired(false))
        ),

    async execute(interaction) {
        const sousCommande = interaction.options.getSubcommand();

        switch (sousCommande) {
            case 'statut': {
                const config = bdd.getAutomod();
                const embed = new EmbedBuilder()
                    .setTitle('Configuration AutoMod')
                    .setColor(config.actif ? 0x2E7D32 : 0xE74C3C)
                    .addFields(
                        { name: 'Statut global', value: config.actif ? 'Actif' : 'Inactif', inline: true },
                        { name: 'Spam', value: config.spam.actif ? 'Actif' : 'Inactif', inline: true },
                        { name: 'Liens', value: config.liens.actif ? 'Actif' : 'Inactif', inline: true },
                        { name: 'Mentions', value: config.mentions.actif ? 'Actif' : 'Inactif', inline: true },
                        { name: 'Mots interdits', value: config.motsInterdits.actif ? `${config.motsInterdits.mots.length} mots` : 'Inactif', inline: true },
                        { name: 'Caps', value: config.caps.actif ? 'Actif' : 'Inactif', inline: true }
                    );
                return interaction.reply({ embeds: [embed] });
            }

            case 'activer': {
                bdd.setAutomod({ actif: true });
                return interaction.reply({ content: '[SUCCÈS] AutoMod activé.' });
            }

            case 'desactiver': {
                bdd.setAutomod({ actif: false });
                return interaction.reply({ content: '[SUCCÈS] AutoMod désactivé.' });
            }

            case 'spam': {
                const actif = interaction.options.getBoolean('actif');
                const max = interaction.options.getInteger('max');
                const action = interaction.options.getString('action');

                const config = bdd.getAutomod();
                config.spam.actif = actif;
                if (max) config.spam.maxMessages = max;
                if (action) config.spam.action = action;
                bdd.setAutomod(config);

                return interaction.reply({ content: `[SUCCÈS] Configuration spam mise à jour.` });
            }

            case 'liens': {
                const actif = interaction.options.getBoolean('actif');
                const config = bdd.getAutomod();
                config.liens.actif = actif;
                bdd.setAutomod(config);
                return interaction.reply({ content: `[SUCCÈS] Détection de liens ${actif ? 'activée' : 'désactivée'}.` });
            }

            case 'mots': {
                const action = interaction.options.getString('action');
                const mot = interaction.options.getString('mot');
                const config = bdd.getAutomod();

                if (action === 'ajouter' && mot) {
                    if (!config.motsInterdits.mots.includes(mot)) {
                        config.motsInterdits.mots.push(mot);
                        bdd.setAutomod(config);
                        return interaction.reply({ content: `[SUCCÈS] Mot "${mot}" ajouté.` });
                    }
                    return interaction.reply({ content: `[ERREUR] Ce mot est déjà dans la liste.` });
                }

                if (action === 'retirer' && mot) {
                    const index = config.motsInterdits.mots.indexOf(mot);
                    if (index > -1) {
                        config.motsInterdits.mots.splice(index, 1);
                        bdd.setAutomod(config);
                        return interaction.reply({ content: `[SUCCÈS] Mot "${mot}" retiré.` });
                    }
                    return interaction.reply({ content: `[ERREUR] Ce mot n'est pas dans la liste.` });
                }

                if (action === 'lister') {
                    const liste = config.motsInterdits.mots.length > 0
                        ? config.motsInterdits.mots.join(', ')
                        : 'Aucun mot interdit';
                    return interaction.reply({ content: `[LISTE] Mots interdits : ${liste}` });
                }

                return interaction.reply({ content: '[ERREUR] Action invalide.' });
            }
        }
    }
};
