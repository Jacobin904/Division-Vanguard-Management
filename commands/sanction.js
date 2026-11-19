'use strict';

const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const config = require('../config/guildConfig');
const { peutSanctionner, gradeLePlusEleve } = require('../utils/permissions');
const { logAction, sendToChannel } = require('../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sanction')
        .setDescription('Infliger une sanction disciplinaire (officiers et sous-officiers)')
        .addSubcommand(sub =>
            sub.setName('avertissement')
               .setDescription('Donner un avertissement officiel')
               .addUserOption(o => o.setName('membre').setDescription('Le membre à sanctionner').setRequired(true))
               .addStringOption(o => o.setName('raison').setDescription('Raison de la sanction').setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName('mute')
               .setDescription('Rendre muet un membre temporairement')
               .addUserOption(o => o.setName('membre').setDescription('Le membre à rendre muet').setRequired(true))
               .addIntegerOption(o => o.setName('duree').setDescription('Durée en minutes').setRequired(true))
               .addStringOption(o => o.setName('raison').setDescription('Raison du mute').setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName('kick')
               .setDescription('Exclure un membre du serveur')
               .addUserOption(o => o.setName('membre').setDescription('Le membre à exclure').setRequired(true))
               .addStringOption(o => o.setName('raison').setDescription("Raison de l'exclusion").setRequired(true))
        )
        .setDefaultMemberPermissions(0),

    async execute(interaction) {
        if (!peutSanctionner(interaction.member)) {
            return interaction.reply({ 
                content: "[ERREUR] Permissions insuffisantes. Seuls les sous-officiers et officiers peuvent sanctionner.", 
                flags: MessageFlags.Ephemeral 
            });
        }

        const sub = interaction.options.getSubcommand();
        const membre = interaction.options.getMember('membre');
        const raison = interaction.options.getString('raison');
        const date = new Date();

        if (membre.roles.cache.some(r => config.adminRoles.includes(r.id))) {
            return interaction.reply({ 
                content: "[ERREUR] Impossible de sanctionner un membre de l'administration.", 
                flags: MessageFlags.Ephemeral 
            });
        }

        if (membre.roles.highest.position >= interaction.member.roles.highest.position && !interaction.member.roles.cache.some(r => config.adminRoles.includes(r.id))) {
            return interaction.reply({ 
                content: "[ERREUR] Vous ne pouvez pas sanctionner un membre ayant un grade égal ou supérieur au vôtre.", 
                flags: MessageFlags.Ephemeral 
            });
        }

        let action = '', actionColor = 0xffaa00, detailsAction = '';

        switch (sub) {
            case 'avertissement':
                action = 'AVERTISSEMENT OFFICIEL'; 
                actionColor = 0xF39C12; 
                detailsAction = "Un avertissement officiel a été consigné au dossier du membre.";
                break;
            case 'mute':
                const duree = interaction.options.getInteger('duree');
                try {
                    await membre.timeout(duree * 60 * 1000, raison);
                    action = 'MUTE TEMPORAIRE'; 
                    actionColor = 0xE67E22; 
                    detailsAction = `Le membre a été rendu muet pour une durée de ${duree} minute(s).`;
                } catch (error) {
                    return interaction.reply({ 
                        content: `[ERREUR] Impossible de mute ce membre : ${error.message}`, 
                        flags: MessageFlags.Ephemeral 
                    });
                }
                break;
            case 'kick':
                try {
                    await membre.send({ 
                        content: `[NOTIFICATION] Vous avez été exclu du serveur Division Vanguard.\n\nRaison : ${raison}\nAutorité : ${interaction.user.username}\nDate : ${date.toUTCString()}` 
                    }).catch(() => {});
                    await membre.kick(raison);
                    action = 'EXCLUSION DU SERVEUR'; 
                    actionColor = 0xC0392B; 
                    detailsAction = "Le membre a été exclu définitivement du serveur.";
                } catch (error) {
                    return interaction.reply({ 
                        content: `[ERREUR] Impossible d'exclure ce membre : ${error.message}`, 
                        flags: MessageFlags.Ephemeral 
                    });
                }
                break;
        }

        const embedPublic = new EmbedBuilder()
            .setAuthor({ name: 'Registre Disciplinaire', iconURL: interaction.guild.iconURL({ size: 64 }) || undefined })
            .setTitle(`[SANCTION] ${action}`)
            .setColor(actionColor)
            .setTimestamp(date)
            .setThumbnail(membre.user.displayAvatarURL({ size: 256 }))
            .addFields(
                { name: '[SANCTIONNÉ] Sanctionné', value: `**${membre.user.username}**\nIdentifiant : \`${membre.id}\`\nGrade : \`${gradeLePlusEleve(membre)}\``, inline: true },
                { name: '[AUTORITÉ] Autorité', value: `**${interaction.user.username}**\nIdentifiant : \`${interaction.user.id}\`\nGrade : \`${gradeLePlusEleve(interaction.member)}\``, inline: true },
                { name: '[DATE] Date', value: `<t:${Math.floor(date.getTime() / 1000)}:F>`, inline: true },
                { name: '[MOTIF] Motif officiel', value: raison, inline: false },
                { name: '[DÉTAILS] Détails', value: detailsAction, inline: false }
            )
            .setFooter({ text: 'Division Vanguard — Registre disciplinaire officiel' });

        await sendToChannel(interaction.client, config.channels.sanctionsDiscipl, { embed: embedPublic });

        const embedConfirmation = new EmbedBuilder()
            .setTitle(`[SUCCÈS] Sanction appliquée`)
            .setColor(actionColor)
            .setDescription(`La sanction **${action}** a été appliquée à **${membre.user.username}** et enregistrée dans les registres.`)
            .setFooter({ text: 'Division Vanguard — Registre disciplinaire' });

        await interaction.reply({ embeds: [embedConfirmation], flags: MessageFlags.Ephemeral });
    }
};
