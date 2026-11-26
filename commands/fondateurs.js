'use strict';

const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    EmbedBuilder
} = require('discord.js');

const ID_ROLE_FONDATION = '1502329914224017710';

const FONDATEURS = [
    { id: '1281784488854159421', nom: 'jacobin904' },
    { id: '1416237976043786323', nom: 'Bibibopm' },
    { id: '1413301937067003914', nom: 'Felix' }
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('fondateurs')
        .setDescription('Vérifie et attribue le rôle Fondation aux membres désignés')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .setDMPermission(false),

    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({
                content: '[ERREUR] Vous devez posséder la permission Administrateur pour exécuter cette commande.'
            });
        }

        await interaction.reply({
            content: '[EN COURS] Vérification des fondateurs et attribution du rôle Fondation...'
        });

        const guild = interaction.guild;
        const roleFondation = guild.roles.cache.get(ID_ROLE_FONDATION);

        if (!roleFondation) {
            return interaction.editReply({
                content: '[ERREUR] Le rôle Fondation est introuvable sur ce serveur. Vérifiez l\'identifiant du rôle.'
            });
        }

        const botMember = guild.members.me;
        if (botMember.roles.highest.position <= roleFondation.position) {
            return interaction.editReply({
                content: '[ERREUR] Le rôle du bot doit être situé au-dessus du rôle Fondation dans la hiérarchie pour pouvoir l\'attribuer.'
            });
        }

        const resultats = [];
        let attribues = 0;
        let dejaPossede = 0;
        let erreurs = 0;

        for (const fondateur of FONDATEURS) {
            try {
                const membre = await guild.members.fetch(fondateur.id).catch(() => null);

                if (!membre) {
                    resultats.push({
                        nom: fondateur.nom,
                        statut: 'INTRouvable',
                        details: 'Ce membre n\'est plus présent sur le serveur.'
                    });
                    erreurs++;
                    continue;
                }

                if (membre.roles.cache.has(ID_ROLE_FONDATION)) {
                    resultats.push({
                        nom: `${membre.user.username} (${fondateur.nom})`,
                        statut: 'DEJA POSSEDE',
                        details: 'Le rôle Fondation est déjà attribué.'
                    });
                    dejaPossede++;
                } else {
                    await membre.roles.add(roleFondation, `Attribution automatique du rôle Fondation par ${interaction.user.username}`);
                    resultats.push({
                        nom: `${membre.user.username} (${fondateur.nom})`,
                        statut: 'ATTRIBUE',
                        details: 'Le rôle Fondation vient d\'être attribué avec succès.'
                    });
                    attribues++;
                }
            } catch (erreur) {
                resultats.push({
                    nom: fondateur.nom,
                    statut: 'ERREUR',
                    details: erreur.message
                });
                erreurs++;
            }
        }

        const embed = new EmbedBuilder()
            .setColor(0x4B0000)
            .setTitle('VÉRIFICATION DES FONDATEURS')
            .setDescription('Processus de vérification et d\'attribution du rôle Fondation terminé.')
            .addFields(
                {
                    name: 'Résumé de l\'opération',
                    value: [
                        `**Rôles attribués :** ${attribues}`,
                        `**Déjà possédés :** ${dejaPossede}`,
                        `**Erreurs rencontrées :** ${erreurs}`,
                        `**Total vérifié :** ${FONDATEURS.length}`
                    ].join('\n'),
                    inline: false
                },
                {
                    name: 'Détails par membre',
                    value: resultats.map(r => `**${r.nom}** — ${r.statut}\n${r.details}`).join('\n\n'),
                    inline: false
                }
            )
            .setFooter({ text: 'Division Vanguard — Vérification des fondateurs' })
            .setTimestamp();

        let messageFinal = '[SUCCÈS] Vérification terminée.\n';
        messageFinal += `Rôles attribués : ${attribues}\n`;
        messageFinal += `Déjà possédés : ${dejaPossede}\n`;
        messageFinal += `Erreurs : ${erreurs}`;

        await interaction.editReply({
            content: messageFinal,
            embeds: [embed]
        });
    }
};
