const { Events, MessageFlags, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const { handleRapportModal } = require('../commands/rapport');
const {
    generateCategorySelect,
    generateReasonModal,
    createTicketChannel,
    closeTicket
} = require('../utils/ticketManager');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);
            if (!command) return;

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error('[CMD ERROR]', error);
                const reply = { content: '[ERREUR] Une erreur est survenue lors de l execution de cette commande.', flags: MessageFlags.Ephemeral };
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp(reply);
                } else {
                    await interaction.reply(reply);
                }
            }
            return;
        }

        if (interaction.isAutocomplete()) {
            const command = interaction.client.commands.get(interaction.commandName);
            if (!command || !command.autocomplete) return;
            try {
                await command.autocomplete(interaction);
            } catch (error) {
                console.error('[AUTOCOMPLETE ERROR]', error);
            }
            return;
        }

        if (interaction.isButton()) {
            if (interaction.customId.startsWith('ticket_open_')) {
                const type = interaction.customId.replace('ticket_open_', '');
                
                if (type === 'support') {
                    const selectMenu = generateCategorySelect();
                    await interaction.reply({
                        content: '[ETAPE 1/2] Veuillez selectionner le destinataire de votre demande :',
                        components: [selectMenu],
                        flags: MessageFlags.Ephemeral
                    });
                } else {
                    const modal = generateReasonModal('rdv', 'general');
                    await interaction.showModal(modal);
                }
                return;
            }

            if (interaction.customId.startsWith('ticket_close_')) {
                const channelId = interaction.customId.replace('ticket_close_', '');
                if (interaction.channel.id !== channelId) {
                    return interaction.reply({ content: '[ERREUR] Salon introuvable.', flags: MessageFlags.Ephemeral });
                }

                const confirmRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId(`ticket_confirm_close_${channelId}`).setLabel('Confirmer la fermeture').setStyle(ButtonStyle.Danger),
                    new ButtonBuilder().setCustomId('ticket_cancel_close').setLabel('Annuler').setStyle(ButtonStyle.Secondary)
                );

                await interaction.reply({
                    content: '[CONFIRMATION] Etes-vous certain de vouloir fermer ce ticket ? Cette action est irreversible.',
                    components: [confirmRow],
                    flags: MessageFlags.Ephemeral
                });
                return;
            }

            if (interaction.customId.startsWith('ticket_confirm_close_')) {
                const channelId = interaction.customId.replace('ticket_confirm_close_', '');
                if (interaction.channel.id !== channelId) return;

                await interaction.update({ content: '[INFO] Fermeture du ticket en cours...', components: [] });
                await closeTicket(interaction.channel, interaction.member);
                return;
            }

            if (interaction.customId === 'ticket_cancel_close') {
                await interaction.update({ content: '[INFO] Fermeture annulee.', components: [] });
                return;
            }
        }

        if (interaction.isStringSelectMenu()) {
            if (interaction.customId === 'ticket_category_support') {
                const category = interaction.values[0];
                const modal = generateReasonModal('support', category);
                await interaction.showModal(modal);
                return;
            }
        }

        if (interaction.isModalSubmit()) {
            if (interaction.customId === 'rapport_mission_modal') {
                try {
                    await handleRapportModal(interaction);
                } catch (error) {
                    console.error('[MODAL ERROR]', error);
                    const reply = { content: '[ERREUR] Une erreur est survenue lors de la soumission du rapport.', flags: MessageFlags.Ephemeral };
                    if (interaction.replied || interaction.deferred) {
                        await interaction.followUp(reply);
                    } else {
                        await interaction.reply(reply);
                    }
                }
                return;
            }

            if (interaction.customId.startsWith('ticket_reason_')) {
                const parts = interaction.customId.replace('ticket_reason_', '').split('_');
                const type = parts[0];
                const category = parts[1];

                const subject = interaction.fields.getTextInputValue('subject');
                const details = interaction.fields.getTextInputValue('details');

                await interaction.deferReply({ flags: MessageFlags.Ephemeral });

                try {
                    const channel = await createTicketChannel(
                        interaction.guild,
                        interaction.member,
                        type,
                        category,
                        subject,
                        details,
                        interaction.client
                    );

                    await interaction.editReply({
                        content: `[SUCCES] Votre ticket a ete cree avec succes. Rendez-vous dans <#${channel.id}> pour poursuivre la discussion.`
                    });
                } catch (error) {
                    console.error('[TICKET CREATION ERROR]', error);
                    await interaction.editReply({
                        content: `[ERREUR] Impossible de creer le ticket : ${error.message}`
                    });
                }
                return;
            }
        }
    }
};
