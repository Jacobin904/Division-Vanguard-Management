'use strict';

const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    ChannelType,
    AttachmentBuilder
} = require('discord.js');

const ROLES = {
    STAFF: [
        '1502329914224017710',
        '1502321921113460827',
        '1502321894462980257',
        '1502321920652345484'
    ],
    OFFICIER: [
        '1502321913169707089',
        '1502321912314073251',
        '1502321911433138387',
        '1502321910665580745',
        '1502321909596033156',
        '1502321908966887424',
        '1502321908182552647',
        '1502321907431637132',
        '1502321906353701025',
        '1569021434125357056',
        '1502321905212985475'
    ],
    SOUS_OFFICIER: [
        '1502321904026124438',
        '1502321903333806225',
        '1502321902020984842',
        '1502321900779737200',
        '1502321899751866550'
    ],
    MILITAIRE: [
        '1569022303034146886',
        '1502321898350972980',
        '1502321897147203654',
        '1569022882288378017',
        '1502321896212009001',
        '1502472415127666780'
    ],
    SPECIALITES: [
        '1502321914516078652',
        '1502321915962986516',
        '1502321916692926695',
        '1502321917535715328',
        '1502321918387425450',
        '1502321919662493758'
    ],
    CIRFA: [
        '1503124531391365203',
        '1507547514264485969',
        '1504628622969798787'
    ],
    NOUVEAUX_ARRIVANTS: '1503483501113249792',
    BOT: '1503484181735276605'
};

const TOUS_MILITAIRES = [
    ...ROLES.OFFICIER,
    ...ROLES.SOUS_OFFICIER,
    ...ROLES.MILITAIRE,
    ...ROLES.SPECIALITES
];

const HAUT_COMMANDMENT = [
    ...ROLES.STAFF,
    ...ROLES.OFFICIER.slice(0, 7)
];

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
        if (roleId === guild.id) {
            const role = guild.roles.everyone;
            if (!overwrites.has(role.id)) {
                overwrites.set(role.id, { id: role, allow: new Set(), deny: new Set() });
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
        } else {
            const role = guild.roles.cache.get(roleId);
            if (!role) {
                return;
            }

            if (!overwrites.has(role.id)) {
                overwrites.set(role.id, { id: role, allow: new Set(), deny: new Set() });
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
    builder.ajouterGroupe(ROLES.STAFF, [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.ManageMessages,
        PermissionFlagsBits.ManageThreads,
        PermissionFlagsBits.ManageChannels,
        PermissionFlagsBits.Connect,
        PermissionFlagsBits.Speak,
        PermissionFlagsBits.MuteMembers,
        PermissionFlagsBits.DeafenMembers,
        PermissionFlagsBits.MoveMembers
    ]);
}

function militairesLectureEcriture(builder) {
    builder.ajouterGroupe(TOUS_MILITAIRES, [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.Connect,
        PermissionFlagsBits.Speak
    ]);
}

function militairesLecture(builder) {
    builder.ajouterGroupe(TOUS_MILITAIRES, [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.Connect
    ], [
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.Speak
    ]);
}

function modeleStaffUniquement(guild) {
    const builder = creerConstructeurOverwrites(guild);

    builder.ajouter(guild.id, [], [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.Connect
    ]);
    staffComplet(builder);

    return builder.construire();
}

function modeleInformationRP(guild) {
    const builder = creerConstructeurOverwrites(guild);

    builder.ajouter(guild.id, [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.ReadMessageHistory
    ], [
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.SendMessagesInThreads,
        PermissionFlagsBits.CreatePublicThreads,
        PermissionFlagsBits.CreatePrivateThreads,
        PermissionFlagsBits.AddReactions
    ]);
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

    builder.ajouter(guild.id, [], [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.Connect
    ]);
    staffComplet(builder);

    builder.ajouterGroupe(ROLES.CIRFA, [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.ManageMessages,
        PermissionFlagsBits.ManageThreads,
        PermissionFlagsBits.ManageChannels,
        PermissionFlagsBits.Connect,
        PermissionFlagsBits.Speak,
        PermissionFlagsBits.MuteMembers
    ]);

    if (accessibleNouveaux) {
        builder.ajouter(ROLES.NOUVEAUX_ARRIVANTS, [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.Connect,
            PermissionFlagsBits.Speak
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
        builder.ajouter(guild.id, [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.ReadMessageHistory
        ], [
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.SendMessagesInThreads,
            PermissionFlagsBits.CreatePublicThreads,
            PermissionFlagsBits.CreatePrivateThreads,
            PermissionFlagsBits.AddReactions
        ]);
    } else {
        builder.ajouter(guild.id, [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.UseApplicationCommands
        ]);
    }

    staffComplet(builder);

    return builder.construire();
}

function modeleOperationsMilitaires(salon, guild) {
    const nom = nomSalon(salon);
    const builder = creerConstructeurOverwrites(guild);

    builder.ajouter(guild.id, [], [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.Connect
    ]);
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

    builder.ajouter(guild.id, [], [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.Connect
    ]);
    staffComplet(builder);

    builder.ajouterGroupe(HAUT_COMMANDMENT, [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.ManageMessages,
        PermissionFlagsBits.Connect,
        PermissionFlagsBits.Speak,
        PermissionFlagsBits.MuteMembers
    ]);

    return builder.construire();
}

function modeleUniteSpeciale(salon, guild) {
    const nom = nomSalon(salon);
    const builder = creerConstructeurOverwrites(guild);

    builder.ajouter(guild.id, [], [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.Connect
    ]);
    staffComplet(builder);

    let rolesAutorises = [];

    if (contient(nom, ['pilote', 'aerien'])) {
        rolesAutorises = ROLES.SPECIALITES.filter(id => 
            id === ROLES.SPECIALITES[0] || id === ROLES.SPECIALITES[1]
        );
    } else if (contient(nom, ['forces speciales', 'forces spec'])) {
        rolesAutorises = [ROLES.SPECIALITES[3]];
    } else if (contient(nom, ['medical', 'medecin'])) {
        rolesAutorises = [ROLES.SPECIALITES[4]];
    } else if (contient(nom, ['sniper'])) {
        rolesAutorises = [ROLES.SPECIALITES[5]];
    } else if (contient(nom, ['operateurs mission', 'operateur mission'])) {
        rolesAutorises = [ROLES.SPECIALITES[2]];
    }

    builder.ajouterGroupe(rolesAutorises, [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.Connect,
        PermissionFlagsBits.Speak
    ]);

    return builder.construire();
}

function modeleFormationEtEntrainement(salon, guild) {
    const nom = nomSalon(salon);
    const builder = creerConstructeurOverwrites(guild);

    builder.ajouter(guild.id, [], [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.Connect
    ]);
    staffComplet(builder);
    militairesLectureEcriture(builder);

    if (contient(nom, ['academie militaire', 'guides tactiques', 'entrainement brm5'])) {
        builder.ajouter(ROLES.NOUVEAUX_ARRIVANTS, [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.ReadMessageHistory
        ], [
            PermissionFlagsBits.SendMessages
        ]);
    }

    return builder.construire();
}

function modeleVocal(salon, guild) {
    const nom = nomSalon(salon);
    const builder = creerConstructeurOverwrites(guild);

    if (contient(nom, ['administration'])) {
        builder.ajouter(guild.id, [], [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.Connect
        ]);
        staffComplet(builder);
        return builder.construire();
    }

    if (contient(nom, ['etat major'])) {
        builder.ajouter(guild.id, [], [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.Connect
        ]);
        staffComplet(builder);
        builder.ajouterGroupe(HAUT_COMMANDMENT, [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.Connect,
            PermissionFlagsBits.Speak,
            PermissionFlagsBits.MuteMembers,
            PermissionFlagsBits.DeafenMembers
        ]);
        return builder.construire();
    }

    if (contient(nom, ['commandement'])) {
        builder.ajouter(guild.id, [], [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.Connect
        ]);
        staffComplet(builder);
        builder.ajouterGroupe(ROLES.OFFICIER, [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.Connect,
            PermissionFlagsBits.Speak
        ]);
        return builder.construire();
    }

    if (contient(nom, ['pilotes'])) {
        builder.ajouter(guild.id, [], [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.Connect
        ]);
        staffComplet(builder);
        builder.ajouterGroupe([ROLES.SPECIALITES[0], ROLES.SPECIALITES[1]], [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.Connect,
            PermissionFlagsBits.Speak
        ]);
        return builder.construire();
    }

    if (contient(nom, ['forces spec'])) {
        builder.ajouter(guild.id, [], [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.Connect
        ]);
        staffComplet(builder);
        builder.ajouterGroupe([ROLES.SPECIALITES[3]], [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.Connect,
            PermissionFlagsBits.Speak
        ]);
        return builder.construire();
    }

    if (contient(nom, ['operations'])) {
        builder.ajouter(guild.id, [], [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.Connect
        ]);
        staffComplet(builder);
        builder.ajouterGroupe(TOUS_MILITAIRES, [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.Connect,
            PermissionFlagsBits.Speak
        ]);
        return builder.construire();
    }

    builder.ajouter(guild.id, [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.Connect,
        PermissionFlagsBits.Speak
    ]);

    staffComplet(builder);

    return builder.construire();
}

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

module.exports = {
    data: new SlashCommandBuilder()
        .setName('fixperms')
        .setDescription('Réinitialise les permissions des salons (Admin uniquement)')
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
            if (!salon.permissionOverwrites || typeof salon.permissionOverwrites.set !== 'function') {
                ignores++;
                rapport.push(`[IGNORÉ] ${salon.name || salon.id} — Ce type de salon ne supporte pas les permissions.`);
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
