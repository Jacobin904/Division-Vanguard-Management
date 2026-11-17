const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { getHighestGrade, getSpecialites } = require('../utils/permissions');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('fiche')
        .setDescription('Generer la fiche matricule complete d\'un membre')
        .addUserOption(option =>
            option.setName('membre')
                .setDescription('Le membre dont on veut la fiche (par defaut : vous)')
                .setRequired(false)),

    async execute(interaction) {
        const membre = interaction.options.getMember('membre') || interaction.member;

        const grade = getHighestGrade(membre);
        const specialites = getSpecialites(membre);
        const rolesList = membre.roles.cache
            .filter(r => r.id !== interaction.guild.id && r.name !== '@everyone')
            .sort((a, b) => b.position - a.position)
            .map(r => r.name)
            .join(', ') || 'Aucun';

        const specialitesStr = specialites.length > 0 
            ? specialites.join(', ') 
            : 'Aucune certification';

        // 1. Creation du fichier texte complet
        let ficheText = `========================================\n`;
        ficheText += `       FICHE MATRICULE - DIVISION VANGUARD\n`;
        ficheText += `========================================\n\n`;
        ficheText += `NOM DE CODE     : ${membre.user.username}\n`;
        ficheText += `IDENTIFIANT     : ${membre.id}\n`;
        ficheText += `TAG DISCORD     : ${membre.user.tag}\n`;
        ficheText += `EST UN BOT      : ${membre.user.bot ? 'Oui' : 'Non'}\n`;
        ficheText += `DATE D'ENTREE   : ${membre.joinedAt.toUTCString()}\n`;
        ficheText += `CREATION COMPTE : ${membre.user.createdAt.toUTCString()}\n\n`;
        ficheText += `----------------------------------------\n`;
        ficheText += `               HIERARCHIE\n`;
        ficheText += `----------------------------------------\n`;
        ficheText += `GRADE ACTUEL    : ${grade}\n`;
        ficheText += `ROLES POSSEDES  :\n`;
        
        membre.roles.cache
            .filter(r => r.id !== interaction.guild.id && r.name !== '@everyone')
            .sort((a, b) => b.position - a.position)
            .forEach(r => {
                ficheText += `  - [Pos ${r.position}] ${r.name} (ID: ${r.id})\n`;
            });

        ficheText += `\n----------------------------------------\n`;
        ficheText += `            CERTIFICATIONS\n`;
        ficheText += `----------------------------------------\n`;
        ficheText += `SPECIALITES     : ${specialitesStr}\n`;

        ficheText += `\n========================================\n`;
        ficheText += `   Document genere le ${new Date().toUTCString()}\n`;
        ficheText += `========================================\n`;

        const buffer = Buffer.from(ficheText, 'utf-8');
        const attachment = new AttachmentBuilder(buffer, { 
            name: `fiche-matricule-${membre.user.username}.txt` 
        });

        // 2. Creation de l'embed resume
        const embed = new EmbedBuilder()
            .setTitle(`[FICHE MATRICULE] ${membre.user.username}`)
            .setColor(0x5865F2)
            .setThumbnail(membre.user.displayAvatarURL())
            .setTimestamp()
            .addFields(
                { name: 'Grade actuel', value: grade, inline: true },
                { name: 'ID Discord', value: membre.id, inline: true },
                { name: 'Entree dans l\'unite', value: `<t:${Math.floor(membre.joinedAt.getTime() / 1000)}:d>`, inline: true },
                { name: 'Certifications', value: specialitesStr.length > 1024 ? specialitesStr.substring(0, 1020) + '...' : specialitesStr, inline: false },
                { name: 'Tous les roles', value: rolesList.length > 1024 ? rolesList.substring(0, 1020) + '...' : rolesList, inline: false }
            )
            .setFooter({ text: 'Division Vanguard - Fiche matricule officielle' });

        await interaction.reply({ 
            embeds: [embed],
            files: [attachment],
            ephemeral: true
        });
    }
};
