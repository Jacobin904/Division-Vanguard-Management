'use strict';

const fs = require('fs');
const path = require('path');
const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChannelType,
    ModalBuilder,
    PermissionFlagsBits,
    StringSelectMenuBuilder,
    TextInputBuilder,
    TextInputStyle,
    AttachmentBuilder
} = require('discord.js');

const config = require('../config/guildConfig');
const { peutGererTicket, gradeLePlusEleve } = require('../utils/permissions');
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

const DOSSIER_DONNEES = path.join(__dirname, '..', 'data');
const FICHIER_TICKETS = path.join(DOSSIER_DONNEES, 'tickets.json');
const verrousCloture = new Set();

function structureInitiale() {
    return { compteurs: { rdv: 0, support: 0 }, panneaux: {}, actifs: {}, archives: [] };
}

function charger() {
    try {
        if (!fs.existsSync(DOSSIER_DONNEES)) fs.mkdirSync(DOSSIER_DONNEES, { recursive: true });
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
        if (!fs.existsSync(DOSSIER_DONNEES)) fs.mkdirSync(DOSSIER_DONNEES, { recursive: true });
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

function construirePanneau(guild, type) {
    const estRdv = type === 'rdv';

    const embed = construireEmbed(guild, {
        service: estRdv
            ? 'Division Vanguard — Service des rendez-vous'
            : 'Division Vanguard — Service d\'assistance',
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
                    ? '**2.** Renseignez l\'objet et le motif de votre entretien.'
                    : '**2.** Sélectionnez le service destinataire, puis renseignez le formulaire.',
                '**3.** Un salon privé est créé et le service compétent est avisé.'
            ]),
            bloc('Traitement des demandes', [
                ligne('Délai indicatif', 'vingt-quatre à quarante-huit heures ouvrables'),
                ligne('Confidentialité', 'accès restreint au requérant et à l\'encadrement'),
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
        .setTitle(estRdv ? 'Demande de rendez-vous' : 'Demande d\'assistance');

    const objet = new TextInputBuilder()
        .setCustomId('objet')
        .setLabel('Objet de la demande')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder(estRdv ? 'Exemple : entretien de recrutement' : 'Exemple : signalement d\'un comportement')
        .setMinLength(5)
        .setMaxLength(100)
        .setRequired(true);

    const motif = new TextInputBuilder()
        .setCustomId('motif')
        .setLabel(estRdv ? 'Motif de l\'entretien' : 'Description détaillée')
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

function ticketOuvertPar(userId, type) {
    const donnees = charger();
    return Object.values(donnees.actifs).find(
        (ticket) => ticket.auteurId === userId && ticket.type === type && ticket.statut === 'ouvert'
    ) || null;
}

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
        priseEnChargePar: null,
        ouvertLe: new Date().toISOString()
    };

    const donnees = charger();
    donnees.actifs[salon.id] = ticket;
    sauvegarder(donnees);

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

async function prendreEnCharge(interaction) {
    const donnees = charger();
    const ticket = donnees.actifs[interaction.channel.id];

    if (!ticket) {
        return interaction.reply({ content: "Ce salon n'est pas répertorié comme un ticket actif.", ephemeral: true });
    }

    if (!peutGererTicket(interaction.member, ticket.type, ticket.categorie)) {
        return interaction.reply({
            content: "Vous n'êtes pas habilité à prendre en charge ce dossier.",
            ephemeral: true
        });
    }

    if (ticket.priseEnChargePar && ticket.priseEnChargePar !== interaction.user.id) {
        return interaction.reply({
            content: `Ce dossier est déjà suivi par <@${ticket.priseEnChargePar}>.`,
            ephemeral: true
        });
    }

    ticket.priseEnChargePar = interaction.user.id;
    ticket.priseEnChargeNom = interaction.user.username;
    ticket.priseEnChargeLe = new Date().toISOString();
    donnees.actifs[interaction.channel.id] = ticket;
    sauvegarder(donnees);

    await interaction.reply({
        embeds: [
            construireEmbed(interaction.guild, {
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
            })
        ]
    });
}

async function construireTranscription(channel, ticket) {
    const lignes = [
        '================================================================',
        '  DIVISION VANGUARD — TRANSCRIPTION DE TICKET',
        '================================================================',
        `Référence        : ${ticket.reference}`,
        `Service          : ${libelleType(ticket.type)}`,
        `Destinataire     : ${libelleDestinataire(ticket.type, ticket.categorie)}`,
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

async function demanderCloture(interaction) {
    const donnees = charger();
    const ticket = donnees.actifs[interaction.channel.id];

    if (!ticket) {
        return interaction.reply({ content: "Ce salon n'est pas répertorié comme un ticket actif.", ephemeral: true });
    }

    const estAuteur = ticket.auteurId === interaction.user.id;
    if (!estAuteur && !peutGererTicket(interaction.member, ticket.type, ticket.categorie)) {
        return interaction.reply({
            content: 'Seuls le requérant et l\'encadrement habilité peuvent clôturer ce dossier.',
            ephemeral: true
        });
    }

    const confirmation = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('dv:ticket:cloture:confirmer')
            .setLabel('Confirmer la clôture')
            .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
            .setCustomId('dv:ticket:cloture:annuler')
            .setLabel('Annuler')
            .setStyle(ButtonStyle.Secondary)
    );

    return interaction.reply({
        content: `La clôture du ticket ${ticket.reference} entraîne l\'archivage de la transcription puis la suppression du salon. Confirmez-vous cette opération ?`,
        components: [confirmation],
        ephemeral: true
    });
}

async function cloturerTicket(interaction) {
    const channel = interaction.channel;
    const donnees = charger();
    const ticket = donnees.actifs[channel.id];

    if (!ticket) {
        return interaction.update({ content: 'Ce dossier est déjà clôturé.', components: [] });
    }

    if (verrousCloture.has(channel.id)) {
        return interaction.update({ content: 'La clôture de ce dossier est déjà en cours.', components: [] });
    }

    const estAuteur = ticket.auteurId === interaction.user.id;
    if (!estAuteur && !peutGererTicket(interaction.member, ticket.type, ticket.categorie)) {
        return interaction.update({
            content: "Vous n'êtes pas habilité à clôturer ce dossier.",
            components: []
        });
    }

    verrousCloture.add(channel.id);
    await interaction.update({ content: 'Archivage de la transcription en cours.', components: [] });

    const transcription = await construireTranscription(channel, ticket).catch(() => null);
    const clotureLe = new Date();

    const bilan = construireEmbed(interaction.guild, {
        service: 'Division Vanguard — Archive des tickets',
        titre: `CLÔTURE DU TICKET ${ticket.reference}`,
        couleur: COULEURS.neutre,
        champs: [
            bloc('Dossier', [
                ligne('Référence', code(ticket.reference)),
                ligne('Service', libelleType(ticket.type)),
                ligne('Destinataire', libelleDestinataire(ticket.type, ticket.categorie)),
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
        });
        verrousCloture.delete(channel.id);
    }, config.tickets.delaiSuppression * 1000);
}

module.exports = {
    charger,
    publierPanneau,
    construirePanneau,
    construireSelecteurDestinataire,
    construireFormulaire,
    creerTicket,
    prendreEnCharge,
    demanderCloture,
    cloturerTicket,
    ticketOuvertPar
};
