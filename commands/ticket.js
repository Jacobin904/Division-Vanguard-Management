'use strict';

const fs = require('fs');
const path = require('path');
const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    MessageFlags,
    ChannelType,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    AttachmentBuilder
} = require('discord.js');

const config = require('../config/guildConfig');
const { estAdministrateur, peutGererTicket, gradeLePlusEleve } = require('../utils/permissions');
const { sendToChannel } = require('../utils/logger');
const {
    COULEURS,
    bloc,
    code,
    construireEmbed,
    horodatageComplet,
    horodatageRelatif,
    ligne,
    tronquer
} = require('../utils/ui');

// ============================================================================
// PERSISTANCE
// ============================================================================

const DOSSIER_DONNEES = path.join(__dirname, '..', 'data');
const FICHIER_TICKETS = path.join(DOSSIER_DONNEES, 'tickets.json');
const verrousCloture = new Set();

function structureInitiale() {
    return {
        compteurs: { rdv: 0, support: 0 },
        panneaux: {},
        actifs: {},
        archives: []
    };
}

function charger() {
    try {
        if (!fs.existsSync(DOSSIER_DONNEES)) {
            fs.mkdirSync(DOSSIER_DONNEES, { recursive: true });
        }
        if (!fs.existsSync(FICHIER_TICKETS)) {
            fs.writeFileSync(FICHIER_TICKETS, JSON.stringify(structureInitiale(), null, 2), 'utf8');
            return structureInitiale();
        }
        const brut = JSON.parse(fs.readFileSync(FICHIER_TICKETS, 'utf8'));
        return {
            compteurs: { rdv: 0, support: 0, ...(brut.compteurs || {}) },
            panneaux: brut.panneaux || {},
            actifs: brut.actifs || {},
            archives: Array.isArray(brut.archives) ? brut.archives : []
        };
    } catch (erreur) {
        console.error('[TICKETS] Lecture du registre impossible :', erreur.message);
        return structureInitiale();
    }
}

function sauvegarder(donnees) {
    try {
        if (!fs.existsSync(DOSSIER_DONNEES)) {
            fs.mkdirSync(DOSSIER_DONNEES, { recursive: true });
        }
        const temporaire = `${FICHIER_TICKETS}.tmp`;
        fs.writeFileSync(temporaire, JSON.stringify(donnees, null, 2), 'utf8');
        fs.renameSync(temporaire, FICHIER_TICKETS);
    } catch (erreur) {
        console.error('[TICKETS] Écriture du registre impossible :', erreur.message);
    }
}

function referenceSuivante(type) {
    const donnees = charger();
    donnees.compteurs[type] = (donnees.compteurs[type] || 0) + 1;
    sauvegarder(donnees);
    const prefixe = type === 'rdv' ? 'RDV' : 'SUP';
    return `${prefixe}-${String(donnees.compteurs[type]).padStart(4, '0')}`;
}

// ============================================================================
// PRIORITÉS
// ============================================================================

const PRIORITES = {
    faible: { nom: 'Faible', couleur: 0x95A5A6, description: 'Traitement dans les meilleurs délais' },
    moyen: { nom: 'Moyen', couleur: 0x3498DB, description: 'Traitement prioritaire' },
    eleve: { nom: 'Élevé', couleur: 0xE67E22, description: 'Traitement urgent' },
    critique: { nom: 'Critique', couleur: 0xE74C3C, description: 'Traitement immédiat requis' }
};

// ============================================================================
// UTILITAIRES
// ============================================================================

function libelleType(type) {
    return type === 'rdv' ? 'Rendez-vous' : 'Assistance';
}

function libelleDestinataire(type, categorie) {
    if (type === 'rdv') return 'Cellule de recrutement et administration';
    return categorie === 'armee' ? 'Commandement militaire' : 'Administration du serveur';
}

function identifiantsEncadrement(type, categorie) {
    if (type === 'rdv') return config.tickets.encadrement.rdv;
    return categorie === 'armee'
        ? config.tickets.encadrement.supportArmee
        : config.tickets.encadrement.supportStaff;
}

function assainirNom(valeur) {
    return valeur
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 24) || 'membre';
}

function obtenirTicketActuel(channelId) {
    const donnees = charger();
    return donnees.actifs[channelId] || null;
}

function verifierTicketActif(interaction) {
    const ticket = obtenirTicketActuel(interaction.channel.id);
    if (!ticket) {
        throw new Error("Ce salon n'est pas un ticket actif.");
    }
    return ticket;
}

function ticketOuvertPar(userId, type) {
    const donnees = charger();
    return Object.values(donnees.actifs).find(
        (ticket) => ticket.auteurId === userId && ticket.type === type && ticket.statut === 'ouvert'
    ) || null;
}

// ============================================================================
// CONSTRUCTION DES INTERFACES
// ============================================================================

function construirePanneau(guild, type) {
    const estRdv = type === 'rdv';

    const embed = construireEmbed(guild, {
        service: estRdv
            ? 'Division Vanguard — Service des rendez-vous'
            : "Division Vanguard — Service d'assistance",
        titre: estRdv ? 'PRISE DE RENDEZ-VOUS' : 'ASSISTANCE ET SIGNALEMENTS',
        couleur: estRdv ? COULEURS.information : COULEURS.attention,
        description: estRdv
            ? "Cette interface permet de solliciter un entretien auprès de la cellule de recrutement ou de l'administration. "
              + 'Votre demande est traitée dans un salon strictement confidentiel, visible uniquement par vous-même et par les membres habilités.'
            : "Cette interface permet de signaler une difficulté, de poser une question ou de solliciter une intervention. "
              + "Vous sélectionnerez le service concerné, puis décrirez votre demande dans un formulaire. "
              + 'Un salon confidentiel sera ouvert pour votre suivi.',
        champs: [
            bloc('Procédure', [
                '**1.** Appuyez sur le bouton « Ouvrir un ticket ».',
                estRdv
                    ? "**2.** Renseignez l'objet et le motif de votre entretien."
                    : '**2.** Sélectionnez le service destinataire, puis renseignez le formulaire.',
                '**3.** Un salon privé est créé et le service compétent est avisé.'
            ]),
            bloc('Traitement des demandes', [
                ligne('Délai indicatif', 'vingt-quatre à quarante-huit heures ouvrables'),
                ligne('Confidentialité', "accès restreint au requérant et à l'encadrement"),
                ligne('Clôture', 'une transcription horodatée est archivée automatiquement')
            ]),
            bloc('Rappel', [
                "Toute demande abusive, répétée ou sans objet expose son auteur à une sanction disciplinaire."
            ])
        ],
        pied: 'Division Vanguard — Interface officielle de ticket'
    });

    const rangee = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`dv:ticket:ouvrir:${type}`)
            .setLabel('Ouvrir un ticket')
            .setStyle(estRdv ? ButtonStyle.Primary : ButtonStyle.Secondary)
    );

    return { embeds: [embed], components: [rangee] };
}

function construireSelecteurDestinataire() {
    const menu = new StringSelectMenuBuilder()
        .setCustomId('dv:ticket:destinataire:support')
        .setPlaceholder('Sélectionnez le service destinataire')
        .addOptions([
            {
                label: 'Administration du serveur',
                value: 'staff',
                description: 'Modération, gestion du serveur, problème technique'
            },
            {
                label: 'Commandement militaire',
                value: 'armee',
                description: 'Hiérarchie, opérations, grades et affectations'
            }
        ]);

    return new ActionRowBuilder().addComponents(menu);
}

function construireFormulaire(type, categorie) {
    const estRdv = type === 'rdv';
    const suffixe = categorie || 'general';

    const modal = new ModalBuilder()
        .setCustomId(`dv:ticket:formulaire:${type}:${suffixe}`)
        .setTitle(estRdv ? 'Demande de rendez-vous' : "Demande d'assistance");

    const objet = new TextInputBuilder()
        .setCustomId('objet')
        .setLabel('Objet de la demande')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder(estRdv ? 'Exemple : entretien de recrutement' : "Exemple : signalement d'un comportement")
        .setMinLength(5)
        .setMaxLength(100)
        .setRequired(true);

    const motif = new TextInputBuilder()
        .setCustomId('motif')
        .setLabel(estRdv ? "Motif de l'entretien" : 'Description détaillée')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('Exposez votre demande de manière précise et factuelle.')
        .setMinLength(20)
        .setMaxLength(1500)
        .setRequired(true);

    const disponibilites = new TextInputBuilder()
        .setCustomId('disponibilites')
        .setLabel(estRdv ? 'Disponibilités souhaitées' : 'Éléments complémentaires')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder(estRdv ? 'Exemple : samedi entre 19 h et 22 h' : 'Facultatif : identifiants, dates, captures')
        .setMaxLength(120)
        .setRequired(false);

    modal.addComponents(
        new ActionRowBuilder().addComponents(objet),
        new ActionRowBuilder().addComponents(motif),
        new ActionRowBuilder().addComponents(disponibilites)
    );

    return modal;
}

// ============================================================================
// PUBLICATION
// ============================================================================

async function publierPanneau(guild, type) {
    const identifiant = type === 'rdv'
        ? config.channels.ticketRdvChannel
        : config.channels.ticketSupportChannel;

    const salon = guild.channels.cache.get(identifiant)
        || await guild.channels.fetch(identifiant).catch(() => null);

    if (!salon || salon.type !== ChannelType.GuildText) {
        throw new Error("Le salon de destination est introuvable ou n'est pas un salon textuel.");
    }

    const autorisations = salon.permissionsFor(guild.members.me);
    if (!autorisations?.has([PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks])) {
        throw new Error("Le bot ne dispose pas des autorisations requises dans le salon de destination.");
    }

    const donnees = charger();
    const ancien = donnees.panneaux[type];
    if (ancien?.messageId) {
        const message = await salon.messages.fetch(ancien.messageId).catch(() => null);
        if (message) await message.delete().catch(() => null);
    }

    const contenu = construirePanneau(guild, type);
    const message = await salon.send(contenu);

    donnees.panneaux[type] = { salonId: salon.id, messageId: message.id, publieLe: new Date().toISOString() };
    sauvegarder(donnees);

    return { salon, message };
}

// ============================================================================
// CRÉATION DE TICKET
// ============================================================================

async function resoudreCategorie(guild) {
    const candidate = config.tickets.categoryId;
    if (candidate) {
        const canal = guild.channels.cache.get(candidate)
            || await guild.channels.fetch(candidate).catch(() => null);
        if (canal?.type === ChannelType.GuildCategory) return canal.id;
        console.warn('[TICKETS] La catégorie configurée est invalide. Création sans catégorie parente.');
    }
    return null;
}

async function creerTicket({ guild, membre, type, categorie, objet, motif, complement, client }) {
    const bot = guild.members.me;
    if (!bot?.permissions.has([PermissionFlagsBits.ManageChannels, PermissionFlagsBits.ManageRoles])) {
        throw new Error("Le bot doit disposer des autorisations « Gérer les salons » et « Gérer les rôles ».");
    }

    const existant = ticketOuvertPar(membre.id, type);
    if (existant) {
        const salon = guild.channels.cache.get(existant.salonId);
        if (salon) return { salon, dejaExistant: true, ticket: existant };
        const donnees = charger();
        delete donnees.actifs[existant.salonId];
        sauvegarder(donnees);
    }

    const reference = referenceSuivante(type);
    const parentId = await resoudreCategorie(guild);
    const nom = `${type === 'rdv' ? 'rdv' : 'sup'}-${reference.split('-')[1]}-${assainirNom(membre.user.username)}`;

    const lecture = [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.AttachFiles,
        PermissionFlagsBits.EmbedLinks
    ];

    const autorisations = [
        { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
        { id: membre.id, allow: lecture },
        {
            id: bot.id,
            allow: [...lecture, PermissionFlagsBits.ManageChannels, PermissionFlagsBits.ManageMessages]
        }
    ];

    for (const identifiant of identifiantsEncadrement(type, categorie)) {
        if (!guild.roles.cache.has(identifiant)) continue;
        autorisations.push({ id: identifiant, allow: lecture });
    }

    const salon = await guild.channels.create({
        name: nom,
        type: ChannelType.GuildText,
        parent: parentId,
        topic: `${reference} — ${libelleType(type)} — ${libelleDestinataire(type, categorie)} — Requérant : ${membre.user.username} (${membre.id})`,
        permissionOverwrites: autorisations,
        reason: `Ouverture du ticket ${reference} par ${membre.user.username}`
    });

    const ticket = {
        reference,
        type,
        categorie: categorie || 'general',
        objet,
        motif,
        complement: complement || 'Non renseigné',
        auteurId: membre.id,
        auteurNom: membre.user.username,
        grade: gradeLePlusEleve(membre),
        salonId: salon.id,
        statut: 'ouvert',
        priorite: 'moyen',
        priseEnChargePar: null,
        priseEnChargeNom: null,
        priseEnChargeLe: null,
        membresAjoutes: [],
        ouvertLe: new Date().toISOString()
    };

    const donnees = charger();
    donnees.actifs[salon.id] = ticket;
    sauvegarder(donnees);

    const prioriteInfo = PRIORITES[ticket.priorite];

    const accueil = construireEmbed(guild, {
        service: `Division Vanguard — ${libelleType(type)}`,
        titre: `TICKET ${reference}`,
        couleur: type === 'rdv' ? COULEURS.information : COULEURS.attention,
        description: "Votre demande a été enregistrée. Un membre habilité prendra connaissance de votre dossier dans les meilleurs délais. "
            + 'Merci de rester disponible et courtois dans ce salon.',
        vignette: membre.user.displayAvatarURL({ size: 256 }),
        champs: [
            bloc('Requérant', [
                ligne('Membre', `${membre}`),
                ligne('Identifiant', code(membre.id)),
                ligne('Grade', ticket.grade),
                ligne('Ouverture', horodatageComplet(new Date(ticket.ouvertLe)))
            ]),
            bloc('Orientation', [
                ligne('Service', libelleType(type)),
                ligne('Destinataire', libelleDestinataire(type, ticket.categorie)),
                ligne('Priorité', `${prioriteInfo.nom} — ${prioriteInfo.description}`),
                ligne('État', 'En attente de prise en charge')
            ]),
            bloc('Objet', [tronquer(objet, 900)]),
            bloc('Exposé de la demande', [tronquer(motif, 1000)]),
            bloc('Éléments complémentaires', [tronquer(ticket.complement, 400)])
        ],
        pied: `Division Vanguard — Ticket ${reference}`
    });

    const actions = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('dv:ticket:prendre')
            .setLabel('Prendre en charge')
            .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId('dv:ticket:cloturer')
            .setLabel('Clôturer le ticket')
            .setStyle(ButtonStyle.Danger)
    );

    const mentions = [`<@${membre.id}>`];
    const premierRole = identifiantsEncadrement(type, ticket.categorie).find((id) => guild.roles.cache.has(id));
    if (premierRole) mentions.push(`<@&${premierRole}>`);

    try {
        await salon.send({ content: mentions.join(' '), embeds: [accueil], components: [actions] });
    } catch (erreur) {
        console.error('[TICKETS] Erreur envoi message accueil :', erreur.message);
    }

    try {
        await sendToChannel(client, config.channels.logsBot, {
            embed: construireEmbed(guild, {
                service: 'Division Vanguard — Journal du service',
                titre: 'OUVERTURE DE TICKET',
                couleur: COULEURS.information,
                description: `Le ticket ${code(reference)} a été ouvert.`,
                champs: [
                    bloc('Dossier', [
                        ligne('Référence', code(reference)),
                        ligne('Service', libelleType(type)),
                        ligne('Destinataire', libelleDestinataire(type, ticket.categorie)),
                        ligne('Priorité', prioriteInfo.nom),
                        ligne('Salon', `<#${salon.id}>`)
                    ]),
                    bloc('Requérant', [
                        ligne('Membre', `${membre.user.username}`),
                        ligne('Identifiant', code(membre.id)),
                        ligne('Grade', ticket.grade)
                    ]),
                    bloc('Objet', [tronquer(objet, 900)])
                ],
                pied: `Division Vanguard — Référence ${reference}`
            })
        });
    } catch (erreur) {
        console.error('[TICKETS] Erreur envoi log :', erreur.message);
    }

    return { salon, dejaExistant: false, ticket };
}

// ============================================================================
// GESTION DES TICKETS
// ============================================================================

async function prendreEnCharge(interaction) {
    const ticket = verifierTicketActif(interaction);

    if (!peutGererTicket(interaction.member, ticket.type, ticket.categorie)) {
        throw new Error("Vous n'êtes pas habilité à prendre en charge ce dossier.");
    }

    if (ticket.priseEnChargePar) {
        throw new Error(`Ce dossier est déjà suivi par <@${ticket.priseEnChargePar}>.`);
    }

    ticket.priseEnChargePar = interaction.user.id;
    ticket.priseEnChargeNom = interaction.user.username;
    ticket.priseEnChargeLe = new Date().toISOString();

    const donnees = charger();
    donnees.actifs[interaction.channel.id] = ticket;
    sauvegarder(donnees);

    const embed = construireEmbed(interaction.guild, {
        service: 'Division Vanguard — Suivi de dossier',
        titre: 'PRISE EN CHARGE',
        couleur: COULEURS.succes,
        description: `${interaction.member} assure désormais le suivi du ticket ${code(ticket.reference)}.`,
        champs: [
            bloc('Responsable', [
                ligne('Membre', interaction.user.username),
                ligne('Grade', gradeLePlusEleve(interaction.member)),
                ligne('Horodatage', horodatageComplet(new Date()))
            ])
        ],
        pied: `Division Vanguard — Ticket ${ticket.reference}`
    });

    await interaction.editReply({ embeds: [embed] });
}

async function relacherPriseEnCharge(interaction) {
    const ticket = verifierTicketActif(interaction);

    if (!peutGererTicket(interaction.member, ticket.type, ticket.categorie)) {
        throw new Error("Vous n'êtes pas habilité à gérer ce dossier.");
    }

    if (!ticket.priseEnChargePar) {
        throw new Error("Ce dossier n'est pas actuellement pris en charge.");
    }

    if (ticket.priseEnChargePar !== interaction.user.id && !estAdministrateur(interaction.member)) {
        throw new Error("Vous ne pouvez relâcher que votre propre prise en charge.");
    }

    ticket.priseEnChargePar = null;
    ticket.priseEnChargeNom = null;
    ticket.priseEnChargeLe = null;

    const donnees = charger();
    donnees.actifs[interaction.channel.id] = ticket;
    sauvegarder(donnees);

    const embed = construireEmbed(interaction.guild, {
        service: 'Division Vanguard — Suivi de dossier',
        titre: 'RELÂCHEMENT',
        couleur: COULEURS.attention,
        description: `${interaction.member} a relâché la prise en charge du ticket ${code(ticket.reference)}.`,
        champs: [
            bloc('État', [
                ligne('Statut', 'En attente de prise en charge'),
                ligne('Horodatage', horodatageComplet(new Date()))
            ])
        ],
        pied: `Division Vanguard — Ticket ${ticket.reference}`
    });

    await interaction.editReply({ embeds: [embed] });
}

async function renommerTicket(interaction, nouveauNom) {
    const ticket = verifierTicketActif(interaction);

    if (!peutGererTicket(interaction.member, ticket.type, ticket.categorie)) {
        throw new Error("Vous n'êtes pas habilité à renommer ce ticket.");
    }

    const nomAssaini = assainirNom(nouveauNom);
    const ancienNom = interaction.channel.name;

    try {
        await interaction.channel.setName(nomAssaini, `Ticket renommé par ${interaction.user.username}`);
    } catch (erreur) {
        throw new Error(`Impossible de renommer le salon : ${erreur.message}`);
    }

    const embed = construireEmbed(interaction.guild, {
        service: 'Division Vanguard — Gestion de ticket',
        titre: 'RENONOMMAGE',
        couleur: COULEURS.information,
        description: `Le ticket ${code(ticket.reference)} a été renommé en \`${nomAssaini}\`.`,
        champs: [
            bloc('Détails', [
                ligne('Ancien nom', `\`${ancienNom}\``),
                ligne('Nouveau nom', `\`${nomAssaini}\``),
                ligne('Responsable', interaction.user.username),
                ligne('Horodatage', horodatageComplet(new Date()))
            ])
        ],
        pied: `Division Vanguard — Ticket ${ticket.reference}`
    });

    await interaction.editReply({ embeds: [embed] });
}

async function changerPriorite(interaction, niveau) {
    const ticket = verifierTicketActif(interaction);

    if (!peutGererTicket(interaction.member, ticket.type, ticket.categorie)) {
        throw new Error("Vous n'êtes pas habilité à modifier la priorité de ce ticket.");
    }

    const prioriteInfo = PRIORITES[niveau];
    if (!prioriteInfo) {
        throw new Error("Niveau de priorité invalide.");
    }

    const anciennePriorite = PRIORITES[ticket.priorite].nom;
    ticket.priorite = niveau;

    const donnees = charger();
    donnees.actifs[interaction.channel.id] = ticket;
    sauvegarder(donnees);

    const embed = construireEmbed(interaction.guild, {
        service: 'Division Vanguard — Gestion de ticket',
        titre: 'CHANGEMENT DE PRIORITÉ',
        couleur: prioriteInfo.couleur,
        description: `La priorité du ticket ${code(ticket.reference)} a été modifiée.`,
        champs: [
            bloc('Détails', [
                ligne('Ancienne priorité', anciennePriorite),
                ligne('Nouvelle priorité', `${prioriteInfo.nom} — ${prioriteInfo.description}`),
                ligne('Responsable', interaction.user.username),
                ligne('Horodatage', horodatageComplet(new Date()))
            ])
        ],
        pied: `Division Vanguard — Ticket ${ticket.reference}`
    });

    await interaction.editReply({ embeds: [embed] });
}

async function ajouterMembre(interaction, membre) {
    const ticket = verifierTicketActif(interaction);

    if (!peutGererTicket(interaction.member, ticket.type, ticket.categorie)) {
        throw new Error("Vous n'êtes pas habilité à ajouter des membres à ce ticket.");
    }

    if (ticket.membresAjoutes.includes(membre.id)) {
        throw new Error("Ce membre est déjà ajouté au ticket.");
    }

    try {
        await interaction.channel.permissionOverwrites.edit(membre.id, {
            ViewChannel: true,
            SendMessages: true,
            ReadMessageHistory: true,
            AttachFiles: true
        });
    } catch (erreur) {
        throw new Error(`Impossible d'ajouter le membre : ${erreur.message}`);
    }

    ticket.membresAjoutes.push(membre.id);

    const donnees = charger();
    donnees.actifs[interaction.channel.id] = ticket;
    sauvegarder(donnees);

    const embed = construireEmbed(interaction.guild, {
        service: 'Division Vanguard — Gestion de ticket',
        titre: 'AJOUT DE MEMBRE',
        couleur: COULEURS.succes,
        description: `${membre} a été ajouté au ticket ${code(ticket.reference)}.`,
        champs: [
            bloc('Détails', [
                ligne('Membre ajouté', `${membre.user.username} (${membre.id})`),
                ligne('Responsable', interaction.user.username),
                ligne('Horodatage', horodatageComplet(new Date()))
            ])
        ],
        pied: `Division Vanguard — Ticket ${ticket.reference}`
    });

    await interaction.editReply({ embeds: [embed] });
}

async function retirerMembre(interaction, membre) {
    const ticket = verifierTicketActif(interaction);

    if (!peutGererTicket(interaction.member, ticket.type, ticket.categorie)) {
        throw new Error("Vous n'êtes pas habilité à retirer des membres de ce ticket.");
    }

    if (!ticket.membresAjoutes.includes(membre.id)) {
        throw new Error("Ce membre n'est pas ajouté au ticket.");
    }

    if (membre.id === ticket.auteurId) {
        throw new Error("Impossible de retirer le requérant du ticket.");
    }

    try {
        await interaction.channel.permissionOverwrites.delete(membre.id);
    } catch (erreur) {
        throw new Error(`Impossible de retirer le membre : ${erreur.message}`);
    }

    ticket.membresAjoutes = ticket.membresAjoutes.filter(id => id !== membre.id);

    const donnees = charger();
    donnees.actifs[interaction.channel.id] = ticket;
    sauvegarder(donnees);

    const embed = construireEmbed(interaction.guild, {
        service: 'Division Vanguard — Gestion de ticket',
        titre: 'RETRAIT DE MEMBRE',
        couleur: COULEURS.attention,
        description: `${membre} a été retiré du ticket ${code(ticket.reference)}.`,
        champs: [
            bloc('Détails', [
                ligne('Membre retiré', `${membre.user.username} (${membre.id})`),
                ligne('Responsable', interaction.user.username),
                ligne('Horodatage', horodatageComplet(new Date()))
            ])
        ],
        pied: `Division Vanguard — Ticket ${ticket.reference}`
    });

    await interaction.editReply({ embeds: [embed] });
}

async function afficherInfoTicket(interaction) {
    const ticket = verifierTicketActif(interaction);

    const prioriteInfo = PRIORITES[ticket.priorite];
    const membresAjoutes = ticket.membresAjoutes.length > 0
        ? ticket.membresAjoutes.map(id => `<@${id}>`).join(', ')
        : 'Aucun';

    const embed = construireEmbed(interaction.guild, {
        service: `Division Vanguard — ${libelleType(ticket.type)}`,
        titre: `INFORMATIONS DU TICKET ${ticket.reference}`,
        couleur: prioriteInfo.couleur,
        champs: [
            bloc('Identification', [
                ligne('Référence', code(ticket.reference)),
                ligne('Type', libelleType(ticket.type)),
                ligne('Destinataire', libelleDestinataire(ticket.type, ticket.categorie)),
                ligne('Statut', ticket.statut === 'ouvert' ? 'Ouvert' : 'Clos')
            ]),
            bloc('Requérant', [
                ligne('Membre', `<@${ticket.auteurId}>`),
                ligne('Identifiant', code(ticket.auteurId)),
                ligne('Grade', ticket.grade),
                ligne('Ouverture', horodatageComplet(new Date(ticket.ouvertLe)))
            ]),
            bloc('Gestion', [
                ligne('Priorité', `${prioriteInfo.nom} — ${prioriteInfo.description}`),
                ligne('Pris en charge par', ticket.priseEnChargePar ? `<@${ticket.priseEnChargePar}>` : 'Personne'),
                ligne('Membres ajoutés', membresAjoutes)
            ]),
            bloc('Objet', [tronquer(ticket.objet, 900)]),
            bloc('Exposé de la demande', [tronquer(ticket.motif, 1000)])
        ],
        pied: `Division Vanguard — Ticket ${ticket.reference}`
    });

    await interaction.editReply({ embeds: [embed] });
}

async function transfererTicket(interaction, membre) {
    const ticket = verifierTicketActif(interaction);

    if (!peutGererTicket(interaction.member, ticket.type, ticket.categorie)) {
        throw new Error("Vous n'êtes pas habilité à transférer ce ticket.");
    }

    if (membre.id === ticket.auteurId) {
        throw new Error("Impossible de transférer le ticket au requérant.");
    }

    const ancienProprietaire = ticket.auteurId;
    ticket.auteurId = membre.id;
    ticket.auteurNom = membre.user.username;
    ticket.grade = gradeLePlusEleve(membre);

    try {
        await interaction.channel.permissionOverwrites.edit(membre.id, {
            ViewChannel: true,
            SendMessages: true,
            ReadMessageHistory: true,
            AttachFiles: true
        });

        await interaction.channel.permissionOverwrites.edit(ancienProprietaire, {
            ViewChannel: false
        });
    } catch (erreur) {
        throw new Error(`Impossible de transférer le ticket : ${erreur.message}`);
    }

    const donnees = charger();
    donnees.actifs[interaction.channel.id] = ticket;
    sauvegarder(donnees);

    const embed = construireEmbed(interaction.guild, {
        service: 'Division Vanguard — Gestion de ticket',
        titre: 'TRANSFERT DE TICKET',
        couleur: COULEURS.information,
        description: `Le ticket ${code(ticket.reference)} a été transféré à ${membre}.`,
        champs: [
            bloc('Détails', [
                ligne('Ancien requérant', `<@${ancienProprietaire}>`),
                ligne('Nouveau requérant', `${membre} (${membre.id})`),
                ligne('Grade', ticket.grade),
                ligne('Responsable du transfert', interaction.user.username),
                ligne('Horodatage', horodatageComplet(new Date()))
            ])
        ],
        pied: `Division Vanguard — Ticket ${ticket.reference}`
    });

    await interaction.editReply({ embeds: [embed] });
}

// ============================================================================
// CLÔTURE
// ============================================================================

async function construireTranscription(channel, ticket) {
    const lignes = [
        '================================================================',
        '  DIVISION VANGUARD — TRANSCRIPTION DE TICKET',
        '================================================================',
        `Référence        : ${ticket.reference}`,
        `Service          : ${libelleType(ticket.type)}`,
        `Destinataire     : ${libelleDestinataire(ticket.type, ticket.categorie)}`,
        `Priorité         : ${PRIORITES[ticket.priorite].nom}`,
        `Requérant        : ${ticket.auteurNom} (${ticket.auteurId})`,
        `Grade            : ${ticket.grade}`,
        `Objet            : ${ticket.objet}`,
        `Ouverture        : ${new Date(ticket.ouvertLe).toISOString()}`,
        `Clôture          : ${new Date().toISOString()}`,
        `Prise en charge  : ${ticket.priseEnChargeNom || 'Aucune'}`,
        '----------------------------------------------------------------',
        'MOTIF INITIAL',
        '----------------------------------------------------------------',
        ticket.motif,
        '',
        '----------------------------------------------------------------',
        'ÉCHANGES',
        '----------------------------------------------------------------'
    ];

    let dernier = null;
    let total = 0;

    while (total < config.tickets.limiteTranscription) {
        const lot = await channel.messages.fetch({
            limit: 100,
            ...(dernier ? { before: dernier } : {})
        }).catch(() => null);

        if (!lot || lot.size === 0) break;
        const tries = [...lot.values()].sort((a, b) => a.createdTimestamp - b.createdTimestamp);

        for (const message of tries) {
            const horodatage = new Date(message.createdTimestamp).toISOString();
            const auteur = `${message.author.username} (${message.author.id})`;
            const contenu = message.content?.length ? message.content : '[message sans contenu textuel]';
            lignes.push(`[${horodatage}] ${auteur} : ${contenu}`);
            for (const piece of message.attachments.values()) {
                lignes.push(`[${horodatage}] ${auteur} : pièce jointe — ${piece.url}`);
            }
        }

        total += lot.size;
        dernier = lot.last().id;
        if (lot.size < 100) break;
    }

    lignes.push('', '================================================================', 'Fin de la transcription', '================================================================');

    return new AttachmentBuilder(Buffer.from(lignes.join('\n'), 'utf8'), {
        name: `transcription-${ticket.reference}.txt`
    });
}

async function cloturerTicket(interaction) {
    const channel = interaction.channel;
    const ticket = obtenirTicketActuel(channel.id);

    if (!ticket) {
        throw new Error("Ce salon n'est pas un ticket actif.");
    }

    if (verrousCloture.has(channel.id)) {
        throw new Error("La clôture de ce dossier est déjà en cours.");
    }

    const estAuteur = ticket.auteurId === interaction.user.id;
    if (!estAuteur && !peutGererTicket(interaction.member, ticket.type, ticket.categorie)) {
        throw new Error("Vous n'êtes pas habilité à clôturer ce dossier.");
    }

    verrousCloture.add(channel.id);

    const transcription = await construireTranscription(channel, ticket).catch(() => null);
    const clotureLe = new Date();
    const prioriteInfo = PRIORITES[ticket.priorite];

    const bilan = construireEmbed(interaction.guild, {
        service: 'Division Vanguard — Archive des tickets',
        titre: `CLÔTURE DU TICKET ${ticket.reference}`,
        couleur: COULEURS.neutre,
        champs: [
            bloc('Dossier', [
                ligne('Référence', code(ticket.reference)),
                ligne('Service', libelleType(ticket.type)),
                ligne('Destinataire', libelleDestinataire(ticket.type, ticket.categorie)),
                ligne('Priorité finale', prioriteInfo.nom),
                ligne('Objet', tronquer(ticket.objet, 300))
            ]),
            bloc('Requérant', [
                ligne('Membre', `${ticket.auteurNom}`),
                ligne('Identifiant', code(ticket.auteurId)),
                ligne('Grade', ticket.grade)
            ]),
            bloc('Clôture', [
                ligne('Responsable', `${interaction.user.username} (${interaction.user.id})`),
                ligne('Horodatage', horodatageComplet(clotureLe)),
                ligne('Durée du dossier', horodatageRelatif(new Date(ticket.ouvertLe))),
                ligne('Prise en charge', ticket.priseEnChargeNom || 'Aucune')
            ])
        ],
        pied: `Division Vanguard — Archive ${ticket.reference}`
    });

    const fichiers = transcription ? [transcription] : [];

    await sendToChannel(interaction.client, config.channels.ticketsInternes, { embed: bilan, files: fichiers });
    await sendToChannel(interaction.client, config.channels.logsBot, { embed: bilan });

    const requerant = await interaction.client.users.fetch(ticket.auteurId).catch(() => null);
    if (requerant) {
        await requerant.send({
            content: `Votre ticket ${ticket.reference} relatif à « ${ticket.objet} » a été clôturé. Vous trouverez ci-joint la transcription de vos échanges.`,
            files: fichiers
        }).catch(() => null);
    }

    const donnees = charger();
    delete donnees.actifs[channel.id];
    donnees.archives.unshift({
        ...ticket,
        statut: 'clos',
        clotureLe: clotureLe.toISOString(),
        cloturePar: interaction.user.id,
        clotureNom: interaction.user.username
    });
    donnees.archives = donnees.archives.slice(0, 500);
    sauvegarder(donnees);

    await channel.send({
        content: `Le ticket ${ticket.reference} est clôturé. La transcription a été archivée et transmise au requérant. Ce salon sera supprimé dans ${config.tickets.delaiSuppression} secondes.`
    }).catch(() => null);

    setTimeout(async () => {
        await channel.delete(`Clôture du ticket ${ticket.reference}`).catch((erreur) => {
            console.error('[TICKETS] Suppression du salon impossible :', erreur.message);
            verrousCloture.delete(channel.id);
        });
    }, config.tickets.delaiSuppression * 1000);
}

// ============================================================================
// GESTIONNAIRE D'INTERACTIONS (boutons, menus, modals)
// ============================================================================

async function handleTicketInteraction(interaction) {
    // Boutons
    if (interaction.isButton()) {
        const [domaine, module, action, parametre] = interaction.customId.split(':');
        if (domaine !== 'dv' || module !== 'ticket') return false;

        if (action === 'ouvrir') {
            const type = parametre;
            if (type === 'support') {
                await interaction.reply({
                    content: 'Étape 1 sur 2 — Sélectionnez le service destinataire de votre demande.',
                    components: [construireSelecteurDestinataire()],
                    flags: MessageFlags.Ephemeral
                });
            } else {
                await interaction.showModal(construireFormulaire('rdv', 'general'));
            }
            return true;
        }

        if (action === 'prendre') {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });
            await prendreEnCharge(interaction);
            return true;
        }

        if (action === 'cloturer') {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });
            await cloturerTicket(interaction);
            return true;
        }

        return false;
    }

    // Menus déroulants
    if (interaction.isStringSelectMenu()) {
        if (interaction.customId === 'dv:ticket:destinataire:support') {
            await interaction.showModal(construireFormulaire('support', interaction.values[0]));
            return true;
        }
        return false;
    }

    // Modals
    if (interaction.isModalSubmit()) {
        if (interaction.customId.startsWith('dv:ticket:formulaire:')) {
            const [, , , type, categorie] = interaction.customId.split(':');

            const objet = interaction.fields.getTextInputValue('objet');
            const motif = interaction.fields.getTextInputValue('motif');
            const complement = interaction.fields.getTextInputValue('disponibilites') || 'Non renseigné';

            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            const resultat = await creerTicket({
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
                ? `Vous disposez déjà d'un dossier ouvert pour ce service : <#${resultat.salon.id}>. Merci de poursuivre vos échanges dans ce salon.`
                : `Votre dossier ${resultat.ticket.reference} a été enregistré. Rendez-vous dans <#${resultat.salon.id}> pour poursuivre vos échanges.`;

            await interaction.editReply({ content: message });
            return true;
        }
        return false;
    }

    return false;
}

// ============================================================================
// COMMANDE SLASH
// ============================================================================

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket')
        .setDescription('Système de gestion des tickets')
        .setDefaultMemberPermissions(0)
        .setDMPermission(false)
        .addSubcommand(sub =>
            sub.setName('publier')
               .setDescription("Publier une interface de ticket (administration uniquement)")
               .addStringOption(opt =>
                   opt.setName('type')
                      .setDescription("Type d'interface à publier")
                      .setRequired(true)
                      .addChoices(
                          { name: 'Rendez-vous', value: 'rdv' },
                          { name: 'Support', value: 'support' }
                      )
               )
        )
        .addSubcommand(sub =>
            sub.setName('fermer')
               .setDescription("Fermer le ticket actuel et archiver la transcription")
        )
        .addSubcommand(sub =>
            sub.setName('prendre')
               .setDescription("Prendre en charge le ticket actuel")
        )
        .addSubcommand(sub =>
            sub.setName('relacher')
               .setDescription("Relâcher la prise en charge du ticket actuel")
        )
        .addSubcommand(sub =>
            sub.setName('renommer')
               .setDescription("Renommer le salon du ticket")
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
               .setDescription("Changer le niveau de priorité du ticket")
               .addStringOption(opt =>
                   opt.setName('niveau')
                      .setDescription('Niveau de priorité')
                      .setRequired(true)
                      .addChoices(
                          { name: 'Faible', value: 'faible' },
                          { name: 'Moyen', value: 'moyen' },
                          { name: 'Élevé', value: 'eleve' },
                          { name: 'Critique', value: 'critique' }
                      )
               )
        )
        .addSubcommand(sub =>
            sub.setName('ajouter')
               .setDescription("Ajouter un membre au ticket")
               .addUserOption(opt =>
                   opt.setName('membre')
                      .setDescription('Membre à ajouter')
                      .setRequired(true)
               )
        )
        .addSubcommand(sub =>
            sub.setName('retirer')
               .setDescription("Retirer un membre du ticket")
               .addUserOption(opt =>
                   opt.setName('membre')
                      .setDescription('Membre à retirer')
                      .setRequired(true)
               )
        )
        .addSubcommand(sub =>
            sub.setName('info')
               .setDescription("Afficher les informations détaillées du ticket")
        )
        .addSubcommand(sub =>
            sub.setName('transferer')
               .setDescription("Transférer le ticket à un autre membre")
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
                case 'publier': {
                    if (!estAdministrateur(interaction.member)) {
                        return interaction.reply({
                            content: "Vous n'êtes pas autorisé à publier une interface de ticket.",
                        });
                    }
                    const type = interaction.options.getString('type');
                    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
                    const resultat = await publierPanneau(interaction.guild, type);
                    await interaction.editReply({
                        content: `L'interface de ticket « ${type === 'rdv' ? 'Rendez-vous' : 'Support'} » a été publiée avec succès dans <#${resultat.salon.id}>.`
                    });
                    return;
                }
                case 'fermer':
                    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
                    await cloturerTicket(interaction);
                    return;
                case 'prendre':
                    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
                    await prendreEnCharge(interaction);
                    return;
                case 'relacher':
                    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
                    await relacherPriseEnCharge(interaction);
                    return;
                case 'renommer': {
                    const nouveauNom = interaction.options.getString('nom');
                    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
                    await renommerTicket(interaction, nouveauNom);
                    return;
                }
                case 'priorite': {
                    const niveau = interaction.options.getString('niveau');
                    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
                    await changerPriorite(interaction, niveau);
                    return;
                }
                case 'ajouter': {
                    const membre = interaction.options.getMember('membre');
                    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
                    await ajouterMembre(interaction, membre);
                    return;
                }
                case 'retirer': {
                    const membre = interaction.options.getMember('membre');
                    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
                    await retirerMembre(interaction, membre);
                    return;
                }
                case 'info':
                    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
                    await afficherInfoTicket(interaction);
                    return;
                case 'transferer': {
                    const membre = interaction.options.getMember('membre');
                    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
                    await transfererTicket(interaction, membre);
                    return;
                }
                default:
                    return interaction.reply({
                        content: 'Commande non reconnue.',
                        flags: MessageFlags.Ephemeral
                    });
            }
        } catch (erreur) {
            console.error('[TICKET] Erreur lors de l\'exécution de la commande :', erreur);
            const message = `Une erreur est survenue : ${erreur.message}`;
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: message, flags: MessageFlags.Ephemeral });
            } else {
                await interaction.reply({ content: message, flags: MessageFlags.Ephemeral });
            }
        }
    },

    handleTicketInteraction
};
