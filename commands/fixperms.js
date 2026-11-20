'use strict';

const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    ChannelType,
    AttachmentBuilder
} = require('discord.js');

// ============================================================================
// IDENTIFIANTS DES RÔLES — DIVISION VANGUARD
// ============================================================================

const ROLES = {
    STAFF: [
        '1502329914224017710', // Fondation
        '1502321921113460827', // Admin interne
        '1502321894462980257', // Manager de communauté
        '1502321920652345484'  // Directeur
    ],

    OFFICIERS_GENERAUX: [
        '1502321913169707089', // Général d'armée
        '1502321912314073251', // Général de corps d'armée
        '1502321911433138387', // Général de division
        '1502321910665580745'  // Général de brigade
    ],

    OFFICIERS_SUPERIEURS: [
        '1502321909596033156', // Colonel
        '1502321908966887424', // Lieutenant-colonel
        '1502321908182552647'  // Commandant
    ],

    OFFICIERS_SUBALTERNES: [
        '1502321907431637132', // Capitaine
        '1502321906353701025', // Lieutenant
        '1569021434125357056', // Sous-lieutenant
        '1502321905212985475'  // Aspirant
    ],

    SOUS_OFFICIERS: [
        '1502321904026124438', // Major
        '1502321903333806225', // Adjudant-chef
        '1502321902020984842', // Adjudant
        '1502321900779737200', // Sergent-chef
        '1502321899751866550'  // Sergent
    ],

    MILITAIRES_DU_RANG: [
        '1569022303034146886', // Caporal-chef de première classe
        '1502321898350972980', // Caporal-chef
        '1502321897147203654', // Caporal
        '1569022882288378017', // Soldat de première classe
        '1502321896212009001', // Soldat
        '1502472415127666780'  // Engagé volontaire initial
    ],

    PILOTES: [
        '1502321914516078652', // Pilote
        '1502321915962986516'  // Pilote chef
    ],

    FORCES_SPECIALES: [
        '1502321917535715328'  // Forces spéciales
    ],

    MEDECINS: [
        '1502321918387425450'  // Médecin
    ],

    SNIPERS: [
        '1502321919662493758'  // Sniper élite
    ],

    OPERATEURS_MISSION: [
        '1502321916692926695'  // Opérateur mission
    ],

    CIRFA: [
        '1503124531391365203', // CIRFA
        '1507547514264485969', // CIRFA spécialité
        '1504628622969798787'  // Centre d'information et de recrutement des Forces armées
    ],

    NOUVEAUX_ARRIVANTS: '1503483501113249792'
};

const GROUPES = {
    STAFF: ROLES.STAFF,

    HAUT_COMMANDEMENT: [
        ...ROLES.STAFF,
        ...ROLES.OFFICIERS_GENERAUX,
        ...ROLES.OFFICIERS_SUPERIEURS
    ],

    OFFICIERS: [
        ...ROLES.OFFICIERS_GENERAUX,
        ...ROLES.OFFICIERS_SUPERIEURS,
        ...ROLES.OFFICIERS_SUBALTERNES
    ],

    MILITAIRES: [
        ...ROLES.OFFICIERS_GENERAUX,
        ...ROLES.OFFICIERS_SUPERIEURS,
        ...ROLES.OFFICIERS_SUBALTERNES,
        ...ROLES.SOUS_OFFICIERS,
        ...ROLES.MILITAIRES_DU_RANG
    ],

    SPECIALITES: [
        ...ROLES.PILOTES,
        ...ROLES.FORCES_SPECIALES,
        ...ROLES.MEDECINS,
        ...ROLES.SNIPERS,
        ...ROLES.OPERATEURS_MISSION
    ]
};

// ============================================================================
// PERMISSIONS DE BASE
// ============================================================================

const PERMISSIONS = {
    LECTURE_TEXTE: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.ReadMessageHistory
    ],

    ECRITURE_TEXTE: [
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.SendMessagesInThreads,
        PermissionFlagsBits.CreatePublicThreads,
        PermissionFlagsBits.CreatePrivateThreads,
        PermissionFlagsBits.AttachFiles,
        PermissionFlagsBits.EmbedLinks,
        PermissionFlagsBits.AddReactions,
        PermissionFlagsBits.UseApplicationCommands
    ],

    MODERATION_TEXTE: [
        PermissionFlagsBits.ManageMessages,
        PermissionFlagsBits.ManageThreads,
        PermissionFlagsBits.ModerateMembers
    ],

    GESTION_SALON: [
        PermissionFlagsBits.ManageChannels
    ],

    LECTURE_VOCALE: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.Connect
    ],

    UTILISATION_VOCALE: [
        PermissionFlagsBits.Connect,
        PermissionFlagsBits.Speak,
        PermissionFlagsBits.Stream,
        PermissionFlagsBits.UseVAD
    ],

    MODERATION_VOCALE: [
        PermissionFlagsBits.MuteMembers,
        PermissionFlagsBits.DeafenMembers,
        PermissionFlagsBits.MoveMembers
    ]
};

const REFUS_ECRITURE_TEXTE = [
    PermissionFlagsBits.SendMessages,
    PermissionFlagsBits.SendMessagesInThreads,
    PermissionFlagsBits.CreatePublicThreads,
    PermissionFlagsBits.CreatePrivateThreads,
    PermissionFlagsBits.AddReactions
];

const REFUS_ACCES = [
    PermissionFlagsBits.ViewChannel,
    PermissionFlagsBits.ReadMessageHistory,
    PermissionFlagsBits.SendMessages,
    PermissionFlagsBits.Connect
];

// ============================================================================
// OUTILS
// ============================================================================

function normaliser(texte) {
    return String(texte || '')
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();
}

function contient(texte, morceaux) {
    return morceaux.some((morceau) => texte.includes(normaliser(morceau)));
}

function unique(ids) {
    return [...new Set(ids.filter(Boolean))];
}

function estFil(salon) {
    return Boolean(
        salon.isThread?.() ||
        salon.type === ChannelType.PublicThread ||
        salon.type === ChannelType.PrivateThread ||
        salon.type === ChannelType.AnnouncementThread
    );
}

function nomCategorie(salon, guild) {
    if (salon.type === ChannelType.GuildCategory) {
        return normaliser(salon.name);
    }

    if (!salon.parentId) return '';

    const parent = guild.channels.cache.get(salon.parentId);
    return normaliser(parent?.name || '');
}

function nomSalon(salon) {
    return normaliser(salon.name);
}

function creerConstructeurOverwrites(guild) {
    const overwrites = new Map();

    function ajouter(roleId, allow = [], deny = []) {
        const role = roleId === guild.id
            ? guild.roles.everyone
            : guild.roles.cache.get(roleId);

        if (!role) return;

        if (!overwrites.has(role.id)) {
            overwrites.set(role.id, {
                id: role,
                allow: new Set(),
                deny: new Set()
            });
        }

        const overwrite = overwrites.get(role.id);

        for (const permission of allow) {
            overwrite.allow.add(permission);
            overwrite.deny.delete(permission);
        }

        for (const permission of deny) {
            overwrite.deny.add(permission);
            overwrite.allow.delete(permission);
        }
    }

    function ajouterGroupe(ids, allow = [], deny = []) {
        for (const id of unique(ids)) {
            ajouter(id, allow, deny);
        }
    }

    function construire() {
        return [...overwrites.values()].map((overwrite) => ({
            id: overwrite.id,
            allow: [...overwrite.allow],
            deny: [...overwrite.deny]
        }));
    }

    return { ajouter, ajouterGroupe, construire };
}

function staffComplet(builder) {
    builder.ajouterGroupe(GROUPES.STAFF, [
        ...PERMISSIONS.LECTURE_TEXTE,
        ...PERMISSIONS.ECRITURE_TEXTE,
        ...PERMISSIONS.MODERATION_TEXTE,
        ...PERMISSIONS.GESTION_SALON,
        ...PERMISSIONS.LECTURE_VOCALE,
        ...PERMISSIONS.UTILISATION_VOCALE,
        ...PERMISSIONS.MODERATION_VOCALE
    ]);
}

function militairesLectureEcriture(builder) {
    builder.ajouterGroupe(GROUPES.MILITAIRES, [
        ...PERMISSIONS.LECTURE_TEXTE,
        ...PERMISSIONS.ECRITURE_TEXTE,
        ...PERMISSIONS.LECTURE_VOCALE,
        ...PERMISSIONS.UTILISATION_VOCALE
    ]);
}

function militairesLecture(builder) {
    builder.ajouterGroupe(GROUPES.MILITAIRES, [
        ...PERMISSIONS.LECTURE_TEXTE,
        ...PERMISSIONS.LECTURE_VOCALE
    ], REFUS_ECRITURE_TEXTE);
}

// ============================================================================
// MODÈLES PAR SECTION
// ============================================================================

function modeleStaffUniquement(guild) {
    const builder = creerConstructeurOverwrites(guild);

    builder.ajouter(guild.id, [], REFUS_ACCES);
    staffComplet(builder);

    return builder.construire();
}

function modeleInformationRP(guild) {
    const builder = creerConstructeurOverwrites(guild);

    builder.ajouter(guild.id, PERMISSIONS.LECTURE_TEXTE, REFUS_ECRITURE_TEXTE);
    staffComplet(builder);

    return builder.construire();
}

function modeleAideRecrues(salon, guild) {
    const nom = nomSalon(salon);

    const accessibleNouveaux = contient(nom, [
        'prendre rendez vous',
        'information',
        'general recrue',
        'vocal formation'
    ]);

    const builder = creerConstructeurOverwrites(guild);

    builder.ajouter(guild.id, [], REFUS_ACCES);
    staffComplet(builder);

    builder.ajouterGroupe(ROLES.CIRFA, [
        ...PERMISSIONS.LECTURE_TEXTE,
        ...PERMISSIONS.ECRITURE_TEXTE,
        ...PERMISSIONS.MODERATION_TEXTE,
        ...PERMISSIONS.LECTURE_VOCALE,
        ...PERMISSIONS.UTILISATION_VOCALE,
        ...PERMISSIONS.MODERATION_VOCALE
    ]);

    if (accessibleNouveaux) {
        builder.ajouter(ROLES.NOUVEAUX_ARRIVANTS, [
            ...PERMISSIONS.LECTURE_TEXTE,
            ...PERMISSIONS.ECRITURE_TEXTE,
            ...PERMISSIONS.LECTURE_VOCALE,
            ...PERMISSIONS.UTILISATION_VOCALE
        ]);
    }

    return builder.construire();
}

function modeleCommunicationGenerale(salon, guild) {
    const nom = nomSalon(salon);

    const lectureSeule = contient(nom, [
        'support',
        'partenariat',
        'notre pub'
    ]);

    const builder = creerConstructeurOverwrites(guild);

    if (lectureSeule) {
        builder.ajouter(guild.id, PERMISSIONS.LECTURE_TEXTE, REFUS_ECRITURE_TEXTE);
    } else {
        builder.ajouter(guild.id, [
            ...PERMISSIONS.LECTURE_TEXTE,
            ...PERMISSIONS.ECRITURE_TEXTE
        ]);
    }

    staffComplet(builder);

    return builder.construire();
}

function modeleOperationsMilitaires(salon, guild) {
    const nom = nomSalon(salon);
    const builder = creerConstructeurOverwrites(guild);

    builder.ajouter(guild.id, [], REFUS_ACCES);
    staffComplet(builder);

    if (contient(nom, ['protocole'])) {
        militairesLecture(builder);
    } else {
        militairesLectureEcriture(builder);
    }

    return builder.construire();
}

function modeleEtatMajor(guild) {
    const builder = creerConstructeurOverwrites(guild);

    builder.ajouter(guild.id, [], REFUS_ACCES);
    staffComplet(builder);

    builder.ajouterGroupe(GROUPES.HAUT_COMMANDEMENT, [
        ...PERMISSIONS.LECTURE_TEXTE,
        ...PERMISSIONS.ECRITURE_TEXTE,
        ...PERMISSIONS.MODERATION_TEXTE,
        ...PERMISSIONS.LECTURE_VOCALE,
        ...PERMISSIONS.UTILISATION_VOCALE,
        ...PERMISSIONS.MODERATION_VOCALE
    ]);

    return builder.construire();
}

function modeleUniteSpeciale(salon, guild) {
    const nom = nomSalon(salon);
    const builder = creerConstructeurOverwrites(guild);

    builder.ajouter(guild.id, [], REFUS_ACCES);
    staffComplet(builder);

    let rolesAutorises = [];

    if (contient(nom, ['pilote', 'aerien'])) {
        rolesAutorises = ROLES.PILOTES;
    } else if (contient(nom, ['forces speciales', 'forces spec'])) {
        rolesAutorises = ROLES.FORCES_SPECIALES;
    } else if (contient(nom, ['medical', 'medecin'])) {
        rolesAutorises = ROLES.MEDECINS;
    } else if (contient(nom, ['sniper'])) {
        rolesAutorises = ROLES.SNIPERS;
    } else if (contient(nom, ['operateurs mission', 'operateur mission'])) {
        rolesAutorises = ROLES.OPERATEURS_MISSION;
    }

    builder.ajouterGroupe(rolesAutorises, [
        ...PERMISSIONS.LECTURE_TEXTE,
        ...PERMISSIONS.ECRITURE_TEXTE,
        ...PERMISSIONS.LECTURE_VOCALE,
        ...PERMISSIONS.UTILISATION_VOCALE
    ]);

    return builder.construire();
}

function modeleFormationEtEntrainement(salon, guild) {
    const nom = nomSalon(salon);
    const builder = creerConstructeurOverwrites(guild);

    builder.ajouter(guild.id, [], REFUS_ACCES);
    staffComplet(builder);
    militairesLectureEcriture(builder);

    if (contient(nom, ['academie militaire', 'guides tactiques', 'entrainement brm5'])) {
        builder.ajouter(ROLES.NOUVEAUX_ARRIVANTS, PERMISSIONS.LECTURE_TEXTE, REFUS_ECRITURE_TEXTE);
    }

    return builder.construire();
}

function modeleVocal(salon, guild) {
    const nom = nomSalon(salon);
    const builder = creerConstructeurOverwrites(guild);

    if (contient(nom, ['administration'])) {
        builder.ajouter(guild.id, [], REFUS_ACCES);
        staffComplet(builder);
        return builder.construire();
    }

    if (contient(nom, ['etat major'])) {
        builder.ajouter(guild.id, [], REFUS_ACCES);
        staffComplet(builder);
        builder.ajouterGroupe(GROUPES.HAUT_COMMANDEMENT, [
            ...PERMISSIONS.LECTURE_VOCALE,
            ...PERMISSIONS.UTILISATION_VOCALE,
            ...PERMISSIONS.MODERATION_VOCALE
        ]);
        return builder.construire();
    }

    if (contient(nom, ['commandement'])) {
        builder.ajouter(guild.id, [], REFUS_ACCES);
        staffComplet(builder);
        builder.ajouterGroupe(GROUPES.OFFICIERS, [
            ...PERMISSIONS.LECTURE_VOCALE,
            ...PERMISSIONS.UTILISATION_VOCALE
        ]);
        return builder.construire();
    }

    if (contient(nom, ['pilotes'])) {
        builder.ajouter(guild.id, [], REFUS_ACCES);
        staffComplet(builder);
        builder.ajouterGroupe(ROLES.PILOTES, [
            ...PERMISSIONS.LECTURE_VOCALE,
            ...PERMISSIONS.UTILISATION_VOCALE
        ]);
        return builder.construire();
    }

    if (contient(nom, ['forces spec'])) {
        builder.ajouter(guild.id, [], REFUS_ACCES);
        staffComplet(builder);
        builder.ajouterGroupe(ROLES.FORCES_SPECIALES, [
            ...PERMISSIONS.LECTURE_VOCALE,
            ...PERMISSIONS.UTILISATION_VOCALE
        ]);
        return builder.construire();
    }

    if (contient(nom, ['operations'])) {
        builder.ajouter(guild.id, [], REFUS_ACCES);
        staffComplet(builder);
        builder.ajouterGroupe(GROUPES.MILITAIRES, [
            ...PERMISSIONS.LECTURE_VOCALE,
            ...PERMISSIONS.UTILISATION_VOCALE
        ]);
        return builder.construire();
    }

    builder.ajouter(guild.id, [
        ...PERMISSIONS.LECTURE_VOCALE,
        ...PERMISSIONS.UTILISATION_VOCALE
    ]);

    staffComplet(builder);

    return builder.construire();
}

// ============================================================================
// DÉTECTION DU MODÈLE
// ============================================================================

function detecterModele(salon, guild) {
    const categorie = nomCategorie(salon, guild);
    const nom = nomSalon(salon);

    if (nom === 'moderator only') {
        return {
            nom: 'Moderator-only',
            overwrites: modeleStaffUniquement(guild)
        };
    }

    if (categorie.includes('information rp')) {
        return {
            nom: 'Information RP',
            overwrites: modeleInformationRP(guild)
        };
    }

    if (categorie.includes('aide recrues') || categorie.includes('aide recrue')) {
        return {
            nom: 'Aide Recrues',
            overwrites: modeleAideRecrues(salon, guild)
        };
    }

    if (categorie.includes('communication generale')) {
        return {
            nom: 'Communication Générale',
            overwrites: modeleCommunicationGenerale(salon, guild)
        };
    }

    if (categorie.includes('operations militaires')) {
        return {
            nom: 'Opérations Militaires',
            overwrites: modeleOperationsMilitaires(salon, guild)
        };
    }

    if (categorie.includes('administration interne')) {
        return {
            nom: 'Administration Interne',
            overwrites: modeleStaffUniquement(guild)
        };
    }

    if (categorie.includes('etat major')) {
        return {
            nom: 'État-Major',
            overwrites: modeleEtatMajor(guild)
        };
    }

    if (categorie.includes('unites speciales')) {
        return {
            nom: 'Unités Spéciales',
            overwrites: modeleUniteSpeciale(salon, guild)
        };
    }

    if (categorie.includes('formation et entrainement')) {
        return {
            nom: 'Formation et Entraînement',
            overwrites: modeleFormationEtEntrainement(salon, guild)
        };
    }

    if (salon.type === ChannelType.GuildVoice || salon.type === ChannelType.GuildStageVoice) {
        return {
            nom: 'Vocal',
            overwrites: modeleVocal(salon, guild)
        };
    }

    if (salon.type === ChannelType.GuildCategory && categorie.includes('salons vocaux')) {
        return {
            nom: 'Catégorie vocale publique',
            overwrites: modeleVocal(salon, guild)
        };
    }

    return {
        nom: 'Sécurisation par défaut',
        overwrites: modeleStaffUniquement(guild)
    };
}

// ============================================================================
// COMMANDE
// ============================================================================

module.exports = {
    data: new SlashCommandBuilder()
        .setName('fixperms')
        .setDescription('Applique les permissions officielles de tous les salons.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .setDMPermission(false),

    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({
                content: '[ERREUR] Vous devez posséder la permission Administrateur pour exécuter cette commande.'
            });
        }

        await interaction.reply({
            content: '[EN COURS] Chargement des salons et des rôles, puis application des permissions officielles.'
        });

        const guild = interaction.guild;
        const botMember = guild.members.me;

        if (!botMember.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.editReply({
                content: '[ERREUR] Le bot doit posséder la permission Administrateur pour appliquer toutes les permissions sans exception.'
            });
        }

        await guild.roles.fetch();
        await guild.channels.fetch();

        const rapport = [];
        const erreurs = [];
        const statistiques = new Map();

        let reussis = 0;
        let ignores = 0;

        const salons = guild.channels.cache
            .filter((salon) => !estFil(salon))
            .sort((a, b) => {
                const positionA = a.position ?? 0;
                const positionB = b.position ?? 0;
                return positionA - positionB;
            });

        for (const salon of salons.values()) {
            if (!salon.permissionOverwrites?.set) {
                ignores++;
                rapport.push(`[IGNORÉ] ${salon.id} — Ce type de salon ne possède pas de permissions modifiables.`);
                continue;
            }

            const modele = detecterModele(salon, guild);

            try {
                await salon.permissionOverwrites.set(
                    modele.overwrites,
                    `Application du protocole de permissions par ${interaction.user.id}`
                );

                reussis++;

                if (!statistiques.has(modele.nom)) {
                    statistiques.set(modele.nom, { reussis: 0, erreurs: 0 });
                }

                statistiques.get(modele.nom).reussis++;

                rapport.push(
                    `[SUCCÈS] ${normaliser(salon.name) || salon.id} — ${modele.nom} — ${salon.id}`
                );

                await new Promise((resolve) => setTimeout(resolve, 250));
            } catch (erreur) {
                if (!statistiques.has(modele.nom)) {
                    statistiques.set(modele.nom, { reussis: 0, erreurs: 0 });
                }

                statistiques.get(modele.nom).erreurs++;

                erreurs.push({
                    salonId: salon.id,
                    salonNom: normaliser(salon.name) || salon.name,
                    modele: modele.nom,
                    message: erreur.message
                });

                rapport.push(
                    `[ERREUR] ${normaliser(salon.name) || salon.id} — ${modele.nom} — ${salon.id}\n${erreur.message}`
                );
            }
        }

        const lignesFinales = [
            '================================================================',
            'DIVISION VANGUARD — RAPPORT DE RÉINITIALISATION DES PERMISSIONS',
            '================================================================',
            '',
            `Salons traités avec succès : ${reussis}`,
            `Salons ignorés : ${ignores}`,
            `Erreurs rencontrées : ${erreurs.length}`,
            '',
            'DÉTAILS PAR MODÈLE',
            '----------------------------------------------------------------'
        ];

        for (const [nom, stats] of statistiques.entries()) {
            lignesFinales.push(`${nom} : ${stats.reussis} succès, ${stats.erreurs} erreur(s)`);
        }

        lignesFinales.push('', 'DÉTAILS COMPLETS', '----------------------------------------------------------------', ...rapport);

        if (erreurs.length > 0) {
            lignesFinales.push('', 'ERREURS DÉTAILLÉES', '----------------------------------------------------------------');

            for (const erreur of erreurs) {
                lignesFinales.push(
                    `${erreur.salonNom} (${erreur.salonId})`,
                    `Modèle : ${erreur.modele}`,
                    `Erreur : ${erreur.message}`,
                    ''
                );
            }
        }

        lignesFinales.push('', '================================================================');
        lignesFinales.push(`Rapport généré le ${new Date().toISOString()}`);
        lignesFinales.push('================================================================');

        const fichier = new AttachmentBuilder(
            Buffer.from(lignesFinales.join('\n'), 'utf8'),
            { name: `rapport-permissions-${guild.id}.txt` }
        );

        let message = `[RAPPORT] Réinitialisation terminée.\n`;
        message += `Salons traités avec succès : ${reussis}\n`;
        message += `Salons ignorés : ${ignores}\n`;
        message += `Erreurs rencontrées : ${erreurs.length}\n\n`;

        if (erreurs.length === 0) {
            message += '[SUCCÈS] Les permissions ont été appliquées selon le protocole défini.';
        } else {
            message += '[ATTENTION] Certaines erreurs sont survenues. Le détail complet est disponible dans le fichier joint.';
        }

        await interaction.editReply({
            content: message,
            files: [fichier]
        });
    }
};
