const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config/guildConfig');
const { canForm } = require('../utils/permissions');
const { logAction, sendToChannel } = require('../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('former')
        .setDescription('Certifier un membre dans une specialite (officiers uniquement)')
        .addUserOption(option =>
            option.setName('membre')
                .setDescription('Le membre a former')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('specialite')
                .setDescription('La specialite a certifier')
                .setRequired(true)
                .setAutocomplete(true)),

    async autocomplete(interaction) {
        const focused = interaction.options.getFocused().toLowerCase();
        const choices = Object.keys(config.specialites).filter(s => 
            s.toLowerCase().includes(focused)
        ).slice(0, 25);
        await interaction.respond(choices.map(c => ({ name: c, value: c })));
    },

    async execute(interaction) {
        // Verification des permissions
        if (!canForm(interaction.member)) {
            return interaction.reply({
                content: '[ERREUR] Vous n\'avez pas les permissions necessaires pour former un membre. Seuls les officiers superieurs et plus peuvent utiliser cette commande.',
                ephemeral: true
            });
        }

        const membre = interaction.options.getMember('membre');
        const specialiteNom = interaction.options.getString('specialite');
        const specialiteId = config.specialites[specialiteNom];

        if (!specialiteId) {
            return interaction.reply({
                content: `[ERREUR] La specialite "${specialiteNom}" n'existe pas dans le registre CIRFA.`,
                ephemeral: true
            });
        }

        // Verification que le membre n'a pas deja la specialite
        if (membre.roles.cache.has(specialiteId)) {
            return interaction.reply({
                content: `[ERREUR] ${membre.user.username} possede deja la certification "${specialiteNom}".`,
                ephemeral: true
            });
        }

        // Ajout du role
        try {
            await membre.roles.add(specialiteId);
        } catch (error) {
            return interaction.reply({
                content: '[ERREUR] Impossible d\'ajouter le role. Verifiez la hierarchie des roles.',
                ephemeral: true
            });
        }

        // Reponse a l'utilisateur
        await interaction.reply({
            content: `[SUCCES] ${membre.user.username} a ete certifie dans la specialite : ${specialiteNom}.`,
            ephemeral: true
        });

        // Message dans resultats-formation
        const embedResultat = new EmbedBuilder()
            .setTitle('[FORMATION] Certification validee')
            .setColor(0x00ff00)
            .setTimestamp()
            .addFields(
                { name: 'Membre', value: `${membre.user.username}\nID: ${membre.id}`, inline: true },
                { name: 'Specialite', value: specialiteNom, inline: true },
                { name: 'Formateur', value: `${interaction.user.username}\nID: ${interaction.user.id}`, inline: true }
            );
        await sendToChannel(interaction.client, config.channels.resultatsFormation, { embed: embedResultat });

        // Log admin
        await logAction(interaction.client, {
            title: 'FORMATION VALIDEE',
            description: `Un membre a ete certifie dans une specialite.`,
            color: 0x00ff00,
            fields: [
                { name: 'Membre', value: `${membre.user.username} (${membre.id})`, inline: true },
                { name: 'Specialite', value: specialiteNom, inline: true },
                { name: 'Formateur', value: `${interaction.user.username} (${interaction.user.id})`, inline: true }
            ]
        });
    }
};
