'use strict';

const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    MessageFlags,
    ChannelType
} = require('discord.js');

const { estAdministrateur } = require('../utils/permissions');
const {
    publierPanneau,
    prendreEnCharge,
    relacherPriseEnCharge,
    cloturerTicket,
    renommerTicket,
    changerPriorite,
    ajouterMembre,
    retirerMembre,
    afficherInfoTicket,
    transfererTicket
} = require('../utils/ticketManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket')
        .setDescription('Système de gestion des tickets')
        .setDefaultMemberPermissions(0)
        .setDMPermission(false)
        
        // Sous-commande : Publier une interface (admin seulement)
        .addSubcommand(sub =>
            sub.setName('publier')
               .setDescription('Publier une interface de ticket (administration uniquement)')
               .addStringOption(opt =>
                   opt.setName('type')
                      .setDescription('Type d\'interface à publier')
                      .setRequired(true)
                      .addChoices(
                          { name: 'Rendez-vous', value: 'rdv' },
                          { name: 'Support', value: 'support' }
                      )
               )
        )
        
        // Sous-commande : Fermer un ticket
        .addSubcommand(sub =>
            sub.setName('fermer')
               .setDescription('Fermer le ticket actuel et archiver la transcription')
        )
        
        // Sous-commande : Prendre en charge
        .addSubcommand(sub =>
            sub.setName('prendre')
               .setDescription('Prendre en charge le ticket actuel')
        )
        
        // Sous-commande : Relâcher la prise en charge
        .addSubcommand(sub =>
            sub.setName('relâcher')
               .setDescription('Relâcher la prise en charge du ticket actuel')
        )
        
        // Sous-commande : Renommer le ticket
        .addSubcommand(sub =>
            sub.setName('renommer')
               .setDescription('Renommer le salon du ticket')
               .addStringOption(opt =>
                   opt.setName('nom')
                      .setDescription('Nouveau nom du salon (sans espaces)')
                      .setRequired(true)
                      .setMinLength(3)
                      .setMaxLength(50)
               )
        )
        
        // Sous-commande : Changer la priorité
        .addSubcommand(sub =>
            sub.setName('priorité')
               .setDescription('Changer le niveau de priorité du ticket')
               .addStringOption(opt =>
                   opt.setName('niveau')
                      .setDescription('Niveau de priorité')
                      .setRequired(true)
                      .addChoices(
                          { name: 'Faible', value: 'faible' },
                          { name: 'Moyen', value: 'moyen' },
                          { name: 'Élevé', value: 'élevé' },
                          { name: 'Critique', value: 'critique' }
                      )
               )
        )
        
        // Sous-commande : Ajouter un membre
        .addSubcommand(sub =>
            sub.setName('ajouter')
               .setDescription('Ajouter un membre au ticket')
               .addUserOption(opt =>
                   opt.setName('membre')
                      .setDescription('Membre à ajouter')
                      .setRequired(true)
               )
        )
        
        // Sous-commande : Retirer un membre
        .addSubcommand(sub =>
            sub.setName('retirer')
               .setDescription('Retirer un membre du ticket')
               .addUserOption(opt =>
                   opt.setName('membre')
                      .setDescription('Membre à retirer')
                      .setRequired(true)
               )
        )
        
        // Sous-commande : Afficher les infos
        .addSubcommand(sub =>
            sub.setName('info')
               .setDescription('Afficher les informations détaillées du ticket')
        )
        
        // Sous-commande : Transférer le ticket
        .addSubcommand(sub =>
            sub.setName('transférer')
               .setDescription('Transférer le ticket à un autre membre')
               .addUserOption(opt =>
                   opt.setName('membre')
                      .setDescription('Membre à qui transférer le ticket')
                      .setRequired(true)
               )
        ),

    async execute(interaction) {
        const sousCommande = interaction.options.getSubcommand();

        try {
            switch (sousCommande) {
                case 'publier':
                    return await gererPublier(interaction);
                case 'fermer':
                    return await gererFermer(interaction);
                case 'prendre':
                    return await gererPrendre(interaction);
                case 'relâcher':
                    return await gererRelacher(interaction);
                case 'renommer':
                    return await gererRenommer(interaction);
                case 'priorité':
                    return await gererPriorite(interaction);
                case 'ajouter':
                    return await gererAjouter(interaction);
                case 'retirer':
                    return await gererRetirer(interaction);
                case 'info':
                    return await gererInfo(interaction);
                case 'transférer':
                    return await gererTransferer(interaction);
                default:
                    return interaction.reply({
                        content: 'Commande non reconnue.',
                        flags: MessageFlags.Ephemeral
                    });
            }
        } catch (erreur) {
            console.error('[TICKET] Erreur lors de l\'exécution de la commande :', erreur);
            const message = interaction.replied || interaction.deferred
                ? { content: `Une erreur est survenue : ${erreur.message}` }
                : { content: `Une erreur est survenue : ${erreur.message}`, flags: MessageFlags.Ephemeral };
            
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(message);
            } else {
                await interaction.reply(message);
            }
        }
    }
};

async function gererPublier(interaction) {
    if (!estAdministrateur(interaction.member)) {
        return interaction.reply({
            content: 'Vous n\'êtes pas autorisé à publier une interface de ticket.',
            flags: MessageFlags.Ephemeral
        });
    }

    const type = interaction.options.getString('type');
    
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const resultat = await publierPanneau(interaction.guild, type);
    
    await interaction.editReply({
        content: `L'interface de ticket « ${type === 'rdv' ? 'Rendez-vous' : 'Support'} » a été publiée avec succès dans <#${resultat.salon.id}>.`
    });
}

async function gererFermer(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    await cloturerTicket(interaction);
}

async function gererPrendre(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    await prendreEnCharge(interaction);
}

async function gererRelacher(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    await relacherPriseEnCharge(interaction);
}

async function gererRenommer(interaction) {
    const nouveauNom = interaction.options.getString('nom');
    
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    await renommerTicket(interaction, nouveauNom);
}

async function gererPriorite(interaction) {
    const niveau = interaction.options.getString('niveau');
    
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    await changerPriorite(interaction, niveau);
}

async function gererAjouter(interaction) {
    const membre = interaction.options.getMember('membre');
    
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    await ajouterMembre(interaction, membre);
}

async function gererRetirer(interaction) {
    const membre = interaction.options.getMember('membre');
    
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    await retirerMembre(interaction, membre);
}

async function gererInfo(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    await afficherInfoTicket(interaction);
}

async function gererTransferer(interaction) {
    const membre = interaction.options.getMember('membre');
    
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    await transfererTicket(interaction, membre);
}
