const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config/guildConfig');
const { canSanction } = require('../utils/permissions');
const { logAction, sendToChannel } = require('../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sanction')
        .setDescription('Infliger une sanction disciplinaire (officiers/sous-officiers)')
        .addSubcommand(sub =>
            sub.setName('avertissement')
                .setDescription('Donner un avertissement officiel')
                .addUserOption(o => o.setName('membre').setDescription('Membre sanctionne').setRequired(true))
                .addStringOption(o => o.setName('raison').setDescription('Raison de la sanction').setRequired(true)))
        .addSubcommand(sub =>
            sub.setName('mute')
                .setDescription('Rendre muet un membre temporairement')
                .addUserOption(o => o.setName('membre').setDescription('Membre a mute').setRequired(true))
                .addIntegerOption(o => o.setName('duree').setDescription('Duree en minutes').setRequired(true))
                .addStringOption(o => o.setName('raison').setDescription('Raison du mute').setRequired(true)))
        .addSubcommand(sub =>
            sub.setName('kick')
                .setDescription('Exclure un membre du serveur')
                .addUserOption(o => o.setName('membre').setDescription('Membre a exclure').setRequired(true))
                .addStringOption(o => o.setName('raison').setDescription('Raison de l\'exclusion').setRequired(true))),

    async execute(interaction) {
        // Verification des permissions
        if (!canSanction(interaction.member)) {
            return interaction.reply({
                content: '[ERREUR] Vous n\'avez pas les permissions necessaires pour infliger une sanction.',
                ephemeral: true
            });
        }

        const sub = interaction.options.getSubcommand();
        const membre = interaction.options.getMember('membre');
        const raison = interaction.options.getString('raison');
        const date = new Date().toUTCString();

        // Verification que le membre n'est pas un admin
        if (membre.roles.cache.some(r => config.adminRoles.includes(r.id))) {
            return interaction.reply({
                content: '[ERREUR] Impossible de sanctionner un membre de l\'administration.',
                ephemeral: true
            });
        }

        // Verification hierarchie (on ne peut pas sanctionner quelqu'un de plus haut place)
        if (membre.roles.highest.position >= interaction.member.roles.highest.position && !interaction.member.roles.cache.some(r => config.adminRoles.includes(r.id))) {
            return interaction.reply({
                content: '[ERREUR] Vous ne pouvez pas sanctionner un membre ayant un grade egal ou superieur au votre.',
                ephemeral: true
            });
        }

        let action = '';
        let actionColor = 0xffaa00;

        switch (sub) {
            case 'avertissement':
                action = 'AVERTISSEMENT';
                actionColor = 0xffaa00;
                break;

            case 'mute':
                const duree = interaction.options.getInteger('duree');
                try {
                    await membre.timeout(duree * 60 * 1000, raison);
                    action = `MUTE (${duree} minutes)`;
                    actionColor = 0xff8800;
                } catch (error) {
                    return interaction.reply({
                        content: `[ERREUR] Impossible de mute ce membre : ${error.message}`,
                        ephemeral: true
                    });
                }
                break;

            case 'kick':
                try {
                    // DM au membre avant le kick
                    try {
                        await membre.send({
                            content: `[NOTIFICATION] Vous avez ete exclu du serveur Division Vanguard.\nRaison : ${raison}\nAutorite : ${interaction.user.username}`
                        });
                    } catch (e) { /* DM fermes */ }
                    
                    await membre.kick(raison);
                    action = 'EXCLUSION';
                    actionColor = 0xff0000;
                } catch (error) {
                    return interaction.reply({
                        content: `[ERREUR] Impossible d'exclure ce membre : ${error.message}`,
                        ephemeral: true
                    });
                }
                break;
        }

        // Reponse a l'auteur
        await interaction.reply({
            content: `[SUCCES] Sanction "${action}" appliquee avec succes a ${membre.user.username}.`,
            ephemeral: true
        });

        // Embed pour sanctions-discipl (public)
        const embedPublic = new EmbedBuilder()
            .setTitle(`[SANCTION] ${action}`)
            .setColor(actionColor)
            .setTimestamp()
            .addFields(
                { name: 'Membre sanctionne', value: `${membre.user.username}\nID: ${membre.id}`, inline: true },
                { name: 'Autorite', value: `${interaction.user.username}\nID: ${interaction.user.id}`, inline: true },
                { name: 'Date', value: date, inline: true },
                { name: 'Raison', value: raison, inline: false }
            )
            .setFooter({ text: 'Division Vanguard - Registre disciplinaire' });

        await sendToChannel(interaction.client, config.channels.sanctionsDiscipl, { embed: embedPublic });

        // Embed pour sanctions-internes (plus detaille, admin only)
        const embedInterne = new EmbedBuilder()
            .setTitle(`[LOG INTERNE] Sanction enregistree`)
            .setColor(actionColor)
            .setTimestamp()
            .addFields(
                { name: 'Type', value: action, inline: true },
                { name: 'Membre', value: `${membre.user.username} (${membre.id})`, inline: true },
                { name: 'Autorite', value: `${interaction.user.username} (${interaction.user.id})`, inline: true },
                { name: 'Raison', value: raison, inline: false }
            );

        await sendToChannel(interaction.client, config.channels.sanctionsInternes, { embed: embedInterne });

        // Log general
        await logAction(interaction.client, {
            title: 'SANCTION ENREGISTREE',
            description: `Une sanction a ete appliquee.`,
            color: actionColor,
            fields: [
                { name: 'Type', value: action, inline: true },
                { name: 'Membre', value: `${membre.user.username} (${membre.id})`, inline: true },
                { name: 'Autorite', value: `${interaction.user.username} (${interaction.user.id})`, inline: true },
                { name: 'Raison', value: raison, inline: false }
            ]
        });
    }
};
