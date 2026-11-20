'use strict';

const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    MessageFlags
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
        .addSubcommand(sub =>
            sub.setName('fermer')
               .setDescription('Fermer le ticket actuel et archiver la transcription')
        )
        .addSubcommand(sub =>
            sub.setName('prendre')
               .setDescription('Prendre en charge le ticket actuel')
        )
        .addSubcommand(sub =>
            sub.setName('relacher')
               .setDescription('Relâcher la prise en charge du ticket actuel')
        )
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
        .addSubcommand(sub =>
            sub.setName('priorite')
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
        .addSubcommand(sub =>
            sub.setName('ajouter')
               .setDescription('Ajouter un membre au ticket')
               .addUserOption(opt =>
                   opt.setName('membre')
                      .setDescription('Membre à ajouter')
                      .setRequired(true)
               )
        )
        .addSubcommand(sub =>
            sub.setName('retirer')
               .setDescription('Retirer un membre du ticket')
               .addUserOption(opt =>
                   opt.setName('membre')
                      .setDescription('Membre à retirer')
                      .setRequired(true)
               )
        )
        .addSubcommand(sub =>
            sub.setName('info')
               .setDescription('Afficher les informations détaillées du ticket')
        )
        .addSubcommand(sub =>
            sub.setName('transferer')
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
                case 'relacher':
                    return await gererRelacher(interaction);
                case 'renommer':
                    return await gererRenommer(interaction);
                case 'priorite':
                    return await gererPriorite(interaction);
                case 'ajouter':
                    return await gererAjouter(interaction);
                case 'retirer':
                    return await gererRetirer(interaction);
                case 'info':
                    return await gererInfo(interaction);
                case 'transferer':
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
