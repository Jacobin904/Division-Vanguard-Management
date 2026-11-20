'use strict';

const { Events, MessageFlags } = require('discord.js');
const { handleRapportModal } = require('../commands/rapport');
const ticketCommand = require('../commands/ticket');

const MESSAGE_ERREUR = 'Une erreur est survenue lors du traitement de votre demande. Le service technique a été avisé.';

async function repondreErreur(interaction, erreur) {
    console.error('[INTERACTION]', erreur);
    const charge = { content: MESSAGE_ERREUR, flags: MessageFlags.Ephemeral };
    try {
        if (interaction.deferred || interaction.replied) {
            await interaction.followUp(charge);
        } else {
            await interaction.reply(charge);
        }
    } catch (e) {
        console.error('[INTERACTION] Réponse d\'erreur impossible :', e.message);
    }
}

module.exports = {
    name: Events.InteractionCreate,

    async execute(interaction) {
        try {
            // Commandes applicatives
            if (interaction.isChatInputCommand()) {
                const commande = interaction.client.commands.get(interaction.commandName);
                if (!commande) return;
                await commande.execute(interaction);
                return;
            }

            // Autocomplétion
            if (interaction.isAutocomplete()) {
                const commande = interaction.client.commands.get(interaction.commandName);
                if (!commande?.autocomplete) return;
                await commande.autocomplete(interaction);
                return;
            }

            // Boutons, menus, modals de tickets
            if (interaction.isButton() || interaction.isStringSelectMenu() || interaction.isModalSubmit()) {
                // Gestion du modal de rapport
                if (interaction.isModalSubmit() && interaction.customId === 'rapport_mission_modal') {
                    return handleRapportModal(interaction);
                }

                // Gestion des tickets
                const gere = await ticketCommand.handleTicketInteraction(interaction);
                if (gere) return;
            }
        } catch (erreur) {
            await repondreErreur(interaction, erreur);
        }
    }
};
