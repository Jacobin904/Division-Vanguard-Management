'use strict';

const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    EmbedBuilder
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Supprimer un nombre précis de messages dans un salon (modération)')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .setDMPermission(false)
        .addIntegerOption(option =>
            option.setName('nombre')
                .setDescription('Nombre de messages à supprimer (entre 1 et 100)')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(100)
        )
        .addChannelOption(option =>
            option.setName('salon')
                .setDescription('Salon cible (par défaut : salon actuel)')
                .setRequired(false)
        ),

    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return interaction.reply({
                content: '[ERREUR] Vous devez posséder la permission « Gérer les messages » pour utiliser cette commande.'
            });
        }

        const nombre = interaction.options.getInteger('nombre');
        const salonCible = interaction.options.getChannel('salon') || interaction.channel;

        const droitsBot = salonCible.permissionsFor(interaction.client.user);
        if (!droitsBot?.has(PermissionFlagsBits.ManageMessages)) {
            return interaction.reply({
                content: `[ERREUR] Le bot ne possède pas la permission « Gérer les messages » dans ${salonCible}.`
            });
        }

        await interaction.reply({
            content: `[EN COURS] Suppression de ${nombre} message(s) dans ${salonCible}...`
        });

        try {
            const messagesRecuperes = await salonCible.messages.fetch({ limit: nombre });

            const messagesRecents = messagesRecuperes.filter(
                (message) => Date.now() - message.createdTimestamp < 14 * 24 * 60 * 60 * 1000
            );

            if (messagesRecents.size === 0) {
                return interaction.editReply({
                    content: '[ATTENTION] Aucun message récent (moins de 14 jours) n\'a pu être trouvé. Discord interdit la suppression de messages plus anciens.'
                });
            }

            if (messagesRecents.size === 1) {
                try {
                    await messagesRecents.first().delete();
                } catch (erreur) {
                    if (erreur.code === 10008) {
                        messagesRecents.delete(messagesRecents.first().id);
                    } else {
                        throw erreur;
                    }
                }
            } else {
                const messagesExistants = [];
                for (const [id, message] of messagesRecents) {
                    try {
                        await salonCible.messages.fetch(id);
                        messagesExistants.push(message);
                    } catch (erreur) {
                        if (erreur.code !== 10008) {
                            console.error(`[CLEAR] Erreur fetch message ${id} :`, erreur.message);
                        }
                    }
                }
                
                if (messagesExistants.length > 0) {
                    await salonCible.bulkDelete(messagesExistants, true);
                }
            }

            const messagesTropAnciens = nombre - messagesRecents.size;

            const embed = new EmbedBuilder()
                .setColor(0x2E7D32)
                .setTitle('NETTOYAGE DU SALON')
                .setDescription('Opération de modération exécutée avec succès.')
                .addFields(
                    {
                        name: 'Détails de l\'opération',
                        value: [
                            `**Salon concerné :** ${salonCible}`,
                            `**Messages supprimés :** ${messagesRecents.size}`,
                            `**Messages trop anciens :** ${messagesTropAnciens}`,
                            `**Modérateur :** ${interaction.user}`,
                            `**Horodatage :** <t:${Math.floor(Date.now() / 1000)}:F>`
                        ].join('\n'),
                        inline: false
                    }
                )
                .setFooter({ text: 'Division Vanguard — Module de modération' })
                .setTimestamp();

            if (messagesTropAnciens > 0) {
                embed.addFields({
                    name: 'Note technique',
                    value: `Discord interdit la suppression de messages datant de plus de 14 jours. ${messagesTropAnciens} message(s) n'ont donc pas pu être supprimés.`,
                    inline: false
                });
                embed.setColor(0xE67E22);
            }

            const messageConfirmation = await salonCible.send({ embeds: [embed] });

            await interaction.editReply({
                content: `[SUCCÈS] ${messagesRecents.size} message(s) supprimé(s) dans ${salonCible}.`
            });

            setTimeout(async () => {
                try {
                    await messageConfirmation.delete();
                } catch (erreur) {
                    console.error('[CLEAR] Impossible de supprimer le message de confirmation :', erreur.message);
                }
            }, 10000);

        } catch (erreur) {
            console.error('[CLEAR] Erreur lors de la suppression :', erreur.message);

            let messageErreur = '[ERREUR] La suppression a échoué.';

            if (erreur.code === 50034) {
                messageErreur = '[ERREUR] Impossible de supprimer des messages datant de plus de 14 jours. Discord impose cette limite technique.';
            } else if (erreur.code === 50013) {
                messageErreur = '[ERREUR] Permissions insuffisantes. Le bot ne peut pas supprimer certains messages.';
            } else {
                messageErreur = `[ERREUR] ${erreur.message}`;
            }

            await interaction.editReply({ content: messageErreur });
        }
    }
};
