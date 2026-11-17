const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const config = require('../config/guildConfig');
const { canSanction, getHighestGrade } = require('../utils/permissions');
const { logAction, sendToChannel } = require('../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sanction')
        .setDescription('Infliger une sanction disciplinaire (officiers/sous-officiers)')
        .addSubcommand(sub => sub.setName('avertissement').setDescription('Donner un avertissement officiel').addUserOption(o => o.setName('membre').setRequired(true)).addStringOption(o => o.setName('raison').setRequired(true)))
        .addSubcommand(sub => sub.setName('mute').setDescription('Rendre muet un membre temporairement').addUserOption(o => o.setName('membre').setRequired(true)).addIntegerOption(o => o.setName('duree').setDescription('Duree en minutes').setRequired(true)).addStringOption(o => o.setName('raison').setRequired(true)))
        .addSubcommand(sub => sub.setName('kick').setDescription('Exclure un membre du serveur').addUserOption(o => o.setName('membre').setRequired(true)).addStringOption(o => o.setName('raison').setDescription("Raison de l'exclusion").setRequired(true)))
        .setDefaultMemberPermissions(0),

    async execute(interaction) {
        if (!canSanction(interaction.member)) {
            return interaction.reply({ content: "[ERREUR] Permissions insuffisantes. Seuls les sous-officiers et officiers peuvent sanctionner.", flags: MessageFlags.Ephemeral });
        }

        const sub = interaction.options.getSubcommand();
        const membre = interaction.options.getMember('membre');
        const raison = interaction.options.getString('raison');
        const date = new Date();

        if (membre.roles.cache.some(r => config.adminRoles.includes(r.id))) {
            return interaction.reply({ content: "[ERREUR] Impossible de sanctionner un membre de l'administration.", flags: MessageFlags.Ephemeral });
        }

        if (membre.roles.highest.position >= interaction.member.roles.highest.position && !interaction.member.roles.cache.some(r => config.adminRoles.includes(r.id))) {
            return interaction.reply({ content: "[ERREUR] Vous ne pouvez pas sanctionner un membre ayant un grade egal ou superieur au votre.", flags: MessageFlags.Ephemeral });
        }

        let action = '', actionColor = 0xffaa00, detailsAction = '';

        switch (sub) {
            case 'avertissement':
                action = 'AVERTISSEMENT OFFICIEL'; actionColor = 0xF39C12;
                detailsAction = 'Un avertissement officiel a ete consigne au dossier du membre.';
                break;
            case 'mute':
                const duree = interaction.options.getInteger('duree');
                try {
                    await membre.timeout(duree * 60 * 1000, raison);
                    action = 'MUTE TEMPORAIRE'; actionColor = 0xE67E22;
                    detailsAction = `Le membre a ete rendu muet pour une duree de ${duree} minute(s).`;
                } catch (error) {
                    return interaction.reply({ content: `[ERREUR] Impossible de mute ce membre : ${error.message}`, flags: MessageFlags.Ephemeral });
                }
                break;
            case 'kick':
                try {
                    await membre.send({ content: `[NOTIFICATION] Vous avez ete exclu du serveur Division Vanguard.\n\nRaison : ${raison}\nAutorite : ${interaction.user.username}\nDate : ${date.toUTCString()}` }).catch(() => {});
                    await membre.kick(raison);
                    action = 'EXCLUSION DU SERVEUR'; actionColor = 0xC0392B;
                    detailsAction = 'Le membre a ete exclu definitivement du serveur.';
                } catch (error) {
                    return interaction.reply({ content: `[ERREUR] Impossible d'exclure ce membre : ${error.message}`, flags: MessageFlags.Ephemeral });
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
                { name: '[SANCTIONNE] Sanctionne', value: `**${membre.user.username}**\nID: \`${membre.id}\`\nGrade
