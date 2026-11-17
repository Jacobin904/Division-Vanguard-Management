const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { collectServerInfo } = require('../utils/serverCollector');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('serverinfo')
        .setDescription('Recupere absolument toutes les infos du serveur (admin uniquement)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        // Verification stricte des permissions
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({
                content: 'Erreur : Tu dois avoir la permission Administrateur pour utiliser cette commande.',
                ephemeral: true
            });
        }

        await interaction.reply({
            content: 'Collecte des donnees en cours. Envoi du rapport complet en message prive...',
            ephemeral: true
        });

        const { embed, attachment } = collectServerInfo(interaction.guild);

        try {
            // Envoi en DM avec l'embed ET le fichier texte en piece jointe
            await interaction.user.send({ 
                embeds: [embed],
                files: [attachment]
            });
            
            await interaction.editReply({
                content: 'Succes : Le rapport complet avec tous les IDs a ete envoye dans tes messages prives.'
            });
        } catch (error) {
            console.warn(`Impossible d'envoyer un DM a ${interaction.user.tag}`);
            await interaction.editReply({
                content: 'Erreur : Tes messages prives sont fermes. Impossible de t\'envoyer le rapport.',
                ephemeral: true
            });
        }
    }
};
