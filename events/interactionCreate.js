'use strict';

const { Events, MessageFlags } = require('discord.js');
const { handleRapportModal } = require('../commands/rapport');
const tickets = require('../utils/ticketManager');

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

            // Boutons
            if (interaction.isButton()) {
                const [domaine, module, action, parametre] = interaction.customId.split(':');
                if (domaine !== 'dv' || module !== 'ticket') return;

                if (action === 'ouvrir') {
                    const type = parametre;
                    if (type === 'support') {
                        return interaction.reply({
                            content: 'Étape 1 sur 2 — Sélectionnez le service destinataire de votre demande.',
                            components: [tickets.construireSelecteurDestinataire()],
                            flags: MessageFlags.Ephemeral
                        });
                    }
                    return interaction.showModal(tickets.construireFormulaire('rdv', 'general'));
                }

                if (action === 'prendre') {
                    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
                    return tickets.prendreEnCharge(interaction);
                }

                if (action === 'cloturer') {
                    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
                    return tickets.cloturerTicket(interaction);
                }

                return;
            }

            // Menus déroulants
            if (interaction.isStringSelectMenu()) {
                if (interaction.customId === 'dv:ticket:destinataire:support') {
                    return interaction.showModal(tickets.construireFormulaire('support', interaction.values[0]));
                }
                return;
            }

            // Fenêtres modales
            if (interaction.isModalSubmit()) {
                if (interaction.customId === 'rapport_mission_modal') {
                    return handleRapportModal(interaction);
                }

                if (interaction.customId.startsWith('dv:ticket:formulaire:')) {
                    const [, , , type, categorie] = interaction.customId.split(':');

                    const objet = interaction.fields.getTextInputValue('objet');
                    const motif = interaction.fields.getTextInputValue('motif');
                    const complement = interaction.fields.getTextInputValue('disponibilites') || 'Non renseigné';

                    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

                    const resultat = await tickets.creerTicket({
                        guild: interaction.guild,
                        membre: interaction.member,
                        type,
                        categorie: categorie === 'general' ? null : categorie,
                        objet,
                        motif,
                        complement,
                        client: interaction.client
                    });

                    const message = resultat.dejaExistant
                        ? `Vous disposez déjà d\'un dossier ouvert pour ce service : <#${resultat.salon.id}>. Merci de poursuivre vos échanges dans ce salon.`
                        : `Votre dossier ${resultat.ticket.reference} a été enregistré. Rendez-vous dans <#${resultat.salon.id}> pour poursuivre vos échanges.`;

                    return interaction.editReply({ content: message });
                }
            }
        } catch (erreur) {
            await repondreErreur(interaction, erreur);
        }
    }
};
