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
            // Dans la section de gestion des boutons, ajoute :
            
            if (interaction.isButton()) {
                // Gestion des boutons de navigation des règlements
                if (interaction.customId.startsWith('reglement_chapitre_')) {
                    const chapitre = interaction.customId.replace('reglement_chapitre_', '');
                    
                    let embedChapitre;
                    switch (chapitre) {
                            case '1':
                            embedChapitre = require('../commands/message').creerEmbedChapitre1 ? 
                                    require('../commands/message').creerEmbedChapitre1() : null;
                            break;
                        case '2':
                            embedChapitre = require('../commands/message').creerEmbedChapitre2 ? 
                                require('../commands/message').creerEmbedChapitre2() : null;
                            break;
                        case '3':
                            embedChapitre = require('../commands/message').creerEmbedChapitre3 ? 
                                require('../commands/message').creerEmbedChapitre3() : null;
                            break;
                        case '4':
                            embedChapitre = require('../commands/message').creerEmbedChapitre4 ? 
                                require('../commands/message').creerEmbedChapitre4() : null;
                            break;
                        case '5':
                            embedChapitre = require('../commands/message').creerEmbedChapitre5 ? 
                                require('../commands/message').creerEmbedChapitre5() : null;
                            break;
                        }
        
                    if (embedChapitre) {
                        await interaction.reply({
                            embeds: [embedChapitre],
                            flags: MessageFlags.Ephemeral
                        });
                    } else {
                        await interaction.reply({
                            content: '[ERREUR] Chapitre non trouvé.',
                            flags: MessageFlags.Ephemeral
                        });
                    }
                      return;
                }
    
    // ... reste du code existant pour les autres boutons
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
