const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { collectServerInfo } = require('../utils/serverCollector');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('serverinfo')
        .setDescription('Récupère toutes les infos du serveur (admin uniquement)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        // Double vérification des permissions (au cas où)
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({
                content: '❌ Tu dois avoir la permission **Administrateur** pour utiliser cette commande.',
                ephemeral: true
            });
        }

        // Répondre immédiatement pour éviter le timeout
        await interaction.reply({
            content: '📡 Collecte des informations du serveur en cours... Envoi en DM dans quelques instants.',
            ephemeral: true
        });

        const embed = collectServerInfo(interaction.guild);

        // Envoi en DM
        try {
            await interaction.user.send({ embeds: [embed] });
            await interaction.editReply({
                content: '✅ Les informations complètes du serveur t\'ont été envoyées en **message privé** !'
            });
        } catch (error) {
            // Si les DMs sont fermés, on envoie dans le salon
            console.warn(`⚠️ Impossible d'envoyer un DM à ${interaction.user.tag}`);
            await interaction.editReply({
                content: '⚠️ Tes DMs sont fermés. Les infos sont envoyées dans le salon (visible 5s puis supprimées).',
                embeds: [embed]
            });
            // Suppression après 10s pour limiter l'exposition
            setTimeout(async () => {
                try {
                    const msg = await interaction.fetchReply();
                    await msg.delete();
                } catch (e) { /* ignore */ }
            }, 10000);
        }
    }
};
