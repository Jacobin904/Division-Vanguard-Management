const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('serverinfo')
        .setDescription('Génère un rapport détaillé du serveur Division Vanguard')
        .addStringOption(option =>
            option.setName('section')
                .setDescription('Quelle section du rapport souhaitez-vous ?')
                .setRequired(false)
                .addChoices(
                    { name: '📊 Rapport Complet (Embed + Fichier)', value: 'complet' },
                    { name: 'ℹ️ Informations Générales', value: 'general' },
                    { name: '📁 Liste des Salons', value: 'salons' },
                    { name: '🎭 Liste des Rôles', value: 'roles' },
                    { name: '👥 Liste des Membres', value: 'membres' }
                )
        ),

    async execute(interaction) {
        // On diffère la réponse car la génération peut prendre quelques secondes
        await interaction.deferReply({ ephemeral: true });

        const guild = interaction.guild;
        const section = interaction.options.getString('section') || 'complet';
        const now = new Date();
        const dateStr = now.toUTCString();

        // --- 1. GÉNÉRATION DU CONTENU TEXTE (POUR LE FICHIER .TXT) ---
        let fullReport = `================================================================\n`;
        fullReport += `        RAPPORT COMPLET DU SERVEUR\n`;
        fullReport += `           ${guild.name.toUpperCase()}\n`;
        fullReport += `================================================================\n\n`;

        // [SECTION GÉNÉRALE]
        fullReport += `--- INFORMATIONS GENERALES ---\n`;
        fullReport += `Nom du serveur    : ${guild.name}\n`;
        fullReport += `ID du serveur     : ${guild.id}\n`;
        fullReport += `Proprietaire ID   : ${guild.ownerId}\n`;
        fullReport += `Date de creation  : ${guild.createdAt.toUTCString()}\n`;
        fullReport += `Description       : ${guild.description || 'Aucune'}\n`;
        fullReport += `Niveau de verif.  : ${guild.verificationLevel}\n`;
        fullReport += `Niveau de boost   : ${guild.premiumTier}\n`;
        fullReport += `Nombre de boosts  : ${guild.premiumSubscriptionCount || 0}\n`;
        fullReport += `Fonctionnalites   : ${guild.features.join(', ')}\n\n`;

        // [SECTION SALONS]
        fullReport += `--- SALONS (${guild.channels.cache.size} au total) ---\n`;
        guild.channels.cache.forEach(channel => {
            fullReport += `[Type ${channel.type}] ${channel.name} | ID: ${channel.id}\n`;
        });
        fullReport += `\n`;

        // [SECTION RÔLES]
        fullReport += `--- ROLES (${guild.roles.cache.size} au total) ---\n`;
        guild.roles.cache.sort((a, b) => b.position - a.position).forEach(role => {
            fullReport += `[Pos ${role.position}] ${role.name} | ID: ${role.id} | Couleur: ${role.hexColor}\n`;
        });
        fullReport += `\n`;

        // [SECTION MEMBRES]
        fullReport += `--- MEMBRES (${guild.memberCount} au total) ---\n`;
        guild.members.cache.forEach(member => {
            fullReport += `Nom: ${member.user.tag} | ID: ${member.id} | Bot: ${member.user.bot}\n`;
        });
        fullReport += `\n================================================================\n`;
        fullReport += `Rapport genere le ${dateStr}\n`;
        fullReport += `================================================================\n`;

        // --- 2. CRÉATION DU FICHIER .TXT ---
        const tempDir = path.join(__dirname, '../temp');
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
        
        const filePath = path.join(tempDir, `rapport_${guild.id}_${Date.now()}.txt`);
        fs.writeFileSync(filePath, fullReport, 'utf8');
        const attachment = new AttachmentBuilder(filePath, { name: `Rapport_${guild.name}_${Date.now()}.txt` });

        // --- 3. CRÉATION DE L'EMBED DE RÉSUMÉ ---
        const embed = new EmbedBuilder()
            .setColor('#000000')
            .setTitle(`📊 Rapport Serveur : ${guild.name}`)
            .setTimestamp()
            .setFooter({ text: `Demandé par ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });

        // On adapte l'embed selon l'option choisie
        if (section === 'complet' || section === 'general') {
            embed.addFields(
                { name: '👑 Propriétaire', value: `<@${guild.ownerId}>`, inline: true },
                { name: '📅 Créé le', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:d>`, inline: true },
                { name: '👥 Membres', value: `${guild.memberCount} (dont ${guild.members.cache.filter(m => m.user.bot).size} bots)`, inline: true },
                { name: '🚀 Boosts', value: `Niveau ${guild.premiumTier} (${guild.premiumSubscriptionCount || 0} boosts)`, inline: true },
                { name: '📁 Salons', value: `${guild.channels.cache.size} total`, inline: true },
                { name: '🎭 Rôles', value: `${guild.roles.cache.size} rôles`, inline: true }
            );
            if (guild.description) embed.setDescription(guild.description);
        }

        if (section === 'complet' || section === 'salons') {
            const textChannels = guild.channels.cache.filter(c => c.type === 0 || c.type === 15).size;
            const voiceChannels = guild.channels.cache.filter(c => c.type === 2).size;
            const categories = guild.channels.cache.filter(c => c.type === 4).size;
            embed.addFields({ name: '📁 Répartition Salons', value: `Texte/Fils: ${textChannels} | Vocaux: ${voiceChannels} | Catégories: ${categories}`, inline: false });
        }

        if (section === 'complet') {
            embed.addFields({ name: '📎 Fichier Joint', value: `L'intégralité des données brutes est disponible dans le fichier \`.txt\` ci-joint.`, inline: false });
        }

        // --- 4. ENVOI DE LA RÉPONSE ---
        // Si l'utilisateur veut TOUT, on envoie l'embed + le fichier.
        // Sinon, on envoie juste le fichier avec un petit message.
        if (section === 'complet') {
            await interaction.editReply({ embeds: [embed], files: [attachment], ephemeral: true });
        } else {
            const msg = `Voici le rapport pour la section **${section}** du serveur.`;
            await interaction.editReply({ content: msg, files: [attachment], ephemeral: true });
        }

        // Nettoyage du fichier temporaire après envoi (optionnel mais recommandé)
        setTimeout(() => {
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }, 5000);
    }
};
