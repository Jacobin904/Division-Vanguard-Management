'use strict';

const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');

// ============================================================================
// CONFIGURATION DES RÔLES
// ============================================================================
const ROLES = {
    STAFF: [
        '1502329914224017710', // Fondation
        '1502321921113460827', // Admin Interne
        '1502321894462980257', // Manager de Communauté
        '1502321920652345484'  // Directeur
    ],
    OFFICIER_GENERAL: [
        '1502321913169707089', // Général Armée
        '1502321912314073251', // Général de Corps Armée
        '1502321911433138387', // Général de Division
        '1502321910665580745'  // Général de Brigade
    ],
    OFFICIER_SUPERIEUR: [
        '1502321909596033156', // Colonel
        '1502321908966887424', // Lieutenant-Colonel
        '1502321908182552647'  // Commandant
    ],
    OFFICIER_SUBALTERNE: [
        '1502321907431637132', // Capitaine
        '1502321906353701025', // Lieutenant
        '1502321905212985475', // Aspirant
        '1502321904026124438'  // Major
    ],
    SOUS_OFFICIER: [
        '1502321903333806225', // Adjudant-Chef
        '1502321902020984842', // Adjudant
        '1502321900779737200', // Sergent-Chef
        '1502321899751866550'  // Sergent
    ],
    MILITAIRE_RANG: [
        '1569022303034146886', // Caporal-chef de 1re classe
        '1502321898350972980', // Caporal-chef
        '1502321897147203654', // Caporal
        '1569022882288378017', // Soldat de 1re classe
        '1502321896212009001', // Soldat
        '1502472415127666780'  // Engagé Volontaire Initial
    ],
    SPECIALITES: [
        '1502321914516078652', // Pilote
        '1502321915962986516', // Pilote Chef
        '1502321916692926695', // Opérateur Mission
        '1502321917535715328', // Forces Spéciales
        '1502321918387425450', // Médecin
        '1502321919662493758'  // Sniper Élite
    ],
    CIRFA: [
        '1503124531391365203', // CIRFA
        '1507547514264485969', // CIRFA spécialité
        '1504628622969798787'  // Centre d'Information et de Recrutement
    ],
    NOUVEAUX_ARRIVANTS: '1503483501113249792',
    BOT: '1503484181735276605'
};

// Groupes logiques
const TOUS_MILITAIRES = [
    ...ROLES.OFFICIER_GENERAL,
    ...ROLES.OFFICIER_SUPERIEUR,
    ...ROLES.OFFICIER_SUBALTERNE,
    ...ROLES.SOUS_OFFICIER,
    ...ROLES.MILITAIRE_RANG,
    ...ROLES.SPECIALITES
];

const HAUT_COMMANDMENT = [
    ...ROLES.STAFF,
    ...ROLES.OFFICIER_GENERAL,
    ...ROLES.OFFICIER_SUPERIEUR
];

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

function permsBase(allow = [], deny = []) {
    return { id: 'everyone', allow, deny };
}

function permsRole(roleId, allow = [], deny = []) {
    return { id: roleId, allow, deny };
}

function permsBot(allow = []) {
    return { id: ROLES.BOT, allow };
}

// ============================================================================
// CONFIGURATION PAR CATÉGORIE
// ============================================================================

function configurerModeratorOnly(salon) {
    return [
        permsBase([], [PermissionFlagsBits.ViewChannel]),
        ...ROLES.STAFF.map(id => permsRole(id, [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.ManageMessages,
            PermissionFlagsBits.ManageChannels
        ])),
        permsBot([PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory])
    ];
}

function configurerInformationRP(salon) {
    return [
        permsBase(
            [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
            [PermissionFlagsBits.SendMessages, PermissionFlagsBits.AddReactions, PermissionFlagsBits.CreatePublicThreads]
        ),
        ...ROLES.STAFF.map(id => permsRole(id, [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ManageMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.ManageChannels
        ])),
        permsBot([PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory])
    ];
}

function configurerAideRecrue(salon) {
    const nomSalon = salon.name.toLowerCase();
    
    // Salons accessibles aux Nouveaux Arrivants
    const salonsNouveauxArrivants = ['prendre-rendez-vous', 'information', 'général-recrue', 'general-recrue', 'vocal-formation'];
    const estAccessibleNouveaux = salonsNouveauxArrivants.some(s => nomSalon.includes(s));
    
    if (estAccessibleNouveauxArrivants) {
        return [
            permsBase([], [PermissionFlagsBits.ViewChannel]),
            permsRole(ROLES.NOUVEAUX_ARRIVANTS, [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.ReadMessageHistory,
                PermissionFlagsBits.Connect,
                PermissionFlagsBits.Speak
            ]),
            ...ROLES.STAFF.map(id => permsRole(id, [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.ManageMessages,
                PermissionFlagsBits.ReadMessageHistory,
                PermissionFlagsBits.ManageChannels,
                PermissionFlagsBits.MuteMembers
            ])),
            permsBot([PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory])
        ];
    } else {
        // Salons CIRFA uniquement
        return [
            permsBase([], [PermissionFlagsBits.ViewChannel]),
            ...ROLES.CIRFA.map(id => permsRole(id, [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.ReadMessageHistory
            ])),
            ...ROLES.STAFF.map(id => permsRole(id, [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.ManageMessages,
                PermissionFlagsBits.ReadMessageHistory,
                PermissionFlagsBits.ManageChannels
            ])),
            permsBot([PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory])
        ];
    }
}

function configurerCommunicationGenerale(salon) {
    const nomSalon = salon.name.toLowerCase();
    
    // Salons où seul le staff peut écrire
    const salonsLectureSeule = ['support', 'partenariat', 'notre-pub'];
    const estLectureSeule = salonsLectureSeule.some(s => nomSalon.includes(s));
    
    if (estLectureSeule) {
        return [
            permsBase(
                [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
                [PermissionFlagsBits.SendMessages, PermissionFlagsBits.AddReactions]
            ),
            ...ROLES.STAFF.map(id => permsRole(id, [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.ManageMessages,
                PermissionFlagsBits.ReadMessageHistory,
                PermissionFlagsBits.ManageChannels
            ])),
            permsBot([PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory])
        ];
    } else {
        // Tout le monde peut écrire
        return [
            permsBase([
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.ReadMessageHistory,
                PermissionFlagsBits.UseApplicationCommands
            ]),
            ...ROLES.STAFF.map(id => permsRole(id, [
                PermissionFlagsBits.ManageMessages,
                PermissionFlagsBits.MuteMembers,
                PermissionFlagsBits.DeafenMembers
            ])),
            permsBot([PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory])
        ];
    }
}

function configurerOperationsMilitaires(salon) {
    return [
        permsBase([], [PermissionFlagsBits.ViewChannel]),
        ...TOUS_MILITAIRES.map(id => permsRole(id, [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory
        ])),
        ...ROLES.STAFF.map(id => permsRole(id, [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ManageMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.ManageChannels
        ])),
        permsBot([PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory])
    ];
}

function configurerAdministrationInterne(salon) {
    return [
        permsBase([], [PermissionFlagsBits.ViewChannel]),
        ...ROLES.STAFF.map(id => permsRole(id, [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.ManageMessages,
            PermissionFlagsBits.ManageChannels
        ])),
        permsBot([PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory])
    ];
}

function configurerEtatMajor(salon) {
    return [
        permsBase([], [PermissionFlagsBits.ViewChannel]),
        ...HAUT_COMMANDMENT.map(id => permsRole(id, [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.ManageMessages
        ])),
        permsBot([PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory])
    ];
}

function configurerUnitesSpeciales(salon) {
    return [
        permsBase([], [PermissionFlagsBits.ViewChannel]),
        ...ROLES.SPECIALITES.map(id => permsRole(id, [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory
        ])),
        ...TOUS_MILITAIRES.map(id => permsRole(id, [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory
        ])),
        ...ROLES.STAFF.map(id => permsRole(id, [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ManageMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.ManageChannels
        ])),
        permsBot([PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory])
    ];
}

function configurerFormationEntrainement(salon) {
    return [
        permsBase([], [PermissionFlagsBits.ViewChannel]),
        ...TOUS_MILITAIRES.map(id => permsRole(id, [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory
        ])),
        permsRole(ROLES.NOUVEAUX_ARRIVANTS, [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.ReadMessageHistory
        ]),
        ...ROLES.STAFF.map(id => permsRole(id, [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ManageMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.ManageChannels
        ])),
        permsBot([PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory])
    ];
}

function configurerSalonsVocaux(salon) {
    const nomSalon = salon.name.toLowerCase();
    const nomCategorie = salon.parentId ? (salon.guild.channels.cache.get(salon.parentId)?.name || '').toLowerCase() : '';
    
    // Vocaux restreints au staff
    if (nomSalon.includes('administration') || nomSalon.includes('état major') || nomSalon.includes('etat major')) {
        return [
            permsBase([], [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect]),
            ...ROLES.STAFF.map(id => permsRole(id, [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.Connect,
                PermissionFlagsBits.Speak,
                PermissionFlagsBits.MuteMembers,
                PermissionFlagsBits.DeafenMembers
            ]))
        ];
    }
    
    // Vocaux réservés aux militaires
    if (nomCategorie.includes('opérations') || nomCategorie.includes('unités spéciales') || 
        nomSalon.includes('opérations') || nomSalon.includes('forces spec') || nomSalon.includes('commandement') || nomSalon.includes('pilotes')) {
        return [
            permsBase([], [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect]),
            ...TOUS_MILITAIRES.map(id => permsRole(id, [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.Connect,
                PermissionFlagsBits.Speak
            ])),
            ...ROLES.STAFF.map(id => permsRole(id, [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.Connect,
                PermissionFlagsBits.Speak,
                PermissionFlagsBits.MuteMembers
            ]))
        ];
    }
    
    // Vocaux publics
    return [
        permsBase([
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.Connect,
            PermissionFlagsBits.Speak
        ]),
        ...ROLES.STAFF.map(id => permsRole(id, [
            PermissionFlagsBits.MuteMembers,
            PermissionFlagsBits.DeafenMembers,
            PermissionFlagsBits.MoveMembers
        ]))
    ];
}

// ============================================================================
// COMMANDE PRINCIPALE
// ============================================================================

module.exports = {
    data: new SlashCommandBuilder()
        .setName('fixperms')
        .setDescription('Réinitialise toutes les permissions des salons (Admin uniquement)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .setDMPermission(false),

    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({ content: '[ERREUR] Vous devez posséder la permission Administrateur pour exécuter cette opération.' });
        }

        await interaction.reply({ content: '[EN COURS] Début de la réinitialisation des permissions. Cette opération peut prendre une minute. Veuillez patienter...' });

        const guild = interaction.guild;
        const botMember = guild.members.me;

        if (!botMember.permissions.has(PermissionFlagsBits.ManageChannels) || !botMember.permissions.has(PermissionFlagsBits.ManageRoles)) {
            return interaction.editReply({ content: '[ERREUR CRITIQUE] Le bot ne possède pas les permissions nécessaires. Opération annulée.' });
        }

        let salonsTraités = 0;
        let erreurs = 0;

        const salons = guild.channels.cache.filter(c => c.type !== ChannelType.GuildCategory);

        for (const salon of salons.values()) {
            try {
                const nomCategorie = salon.parentId ? (guild.channels.cache.get(salon.parentId)?.name || '').toLowerCase() : '';
                const nomSalon = salon.name.toLowerCase();
                let nouvellesPermissions = [];

                // 1. MODERATOR-ONLY (sans catégorie)
                if (nomSalon === 'moderator-only' || !salon.parentId) {
                    nouvellesPermissions = configurerModeratorOnly(salon);
                }
                // 2. INFORMATION RP
                else if (nomCategorie.includes('information rp')) {
                    nouvellesPermissions = configurerInformationRP(salon);
                }
                // 3. AIDE RECRUE
                else if (nomCategorie.includes('aide recrue')) {
                    nouvellesPermissions = configurerAideRecrue(salon);
                }
                // 4. COMMUNICATION GÉNÉRALE
                else if (nomCategorie.includes('communication generale') || nomCategorie.includes('communication générale')) {
                    nouvellesPermissions = configurerCommunicationGenerale(salon);
                }
                // 5. OPÉRATIONS MILITAIRES
                else if (nomCategorie.includes('opérations militaires') || nomCategorie.includes('operations militaires')) {
                    nouvellesPermissions = configurerOperationsMilitaires(salon);
                }
                // 6. ADMINISTRATION INTERNE
                else if (nomCategorie.includes('administration interne')) {
                    nouvellesPermissions = configurerAdministrationInterne(salon);
                }
                // 7. ÉTAT-MAJOR
                else if (nomCategorie.includes('état major') || nomCategorie.includes('etat major')) {
                    nouvellesPermissions = configurerEtatMajor(salon);
                }
                // 8. UNITÉS SPÉCIALES
                else if (nomCategorie.includes('unités spéciales') || nomCategorie.includes('unites speciales')) {
                    nouvellesPermissions = configurerUnitesSpeciales(salon);
                }
                // 9. FORMATION ET ENTRAÎNEMENT
                else if (nomCategorie.includes('formation') || nomCategorie.includes('entrainement') || nomCategorie.includes('entraînement')) {
                    nouvellesPermissions = configurerFormationEntrainement(salon);
                }
                // 10. SALONS VOCAUX
                else if (salon.type === ChannelType.GuildVoice) {
                    nouvellesPermissions = configurerSalonsVocaux(salon);
                }
                // 11. DÉFAUT : Communication générale
                else {
                    nouvellesPermissions = configurerCommunicationGenerale(salon);
                }

                await salon.permissionOverwrites.set(nouvellesPermissions, 'Réinitialisation protocolaire par /fixperms');
                salonsTraités++;
                
                await new Promise(resolve => setTimeout(resolve, 200));

            } catch (erreur) {
                console.error(`[FIXPERMS] Erreur sur le salon ${salon.name} (${salon.id}) :`, erreur.message);
                erreurs++;
            }
        }

        if (erreurs > 0) {
            await interaction.editReply({ 
                content: `[TERMINÉ AVEC AVERTISSEMENT] ${salonsTraités} salons traités avec succès, ${erreurs} erreur(s) rencontrée(s).\n\nVérifiez que le rôle du bot est situé au-dessus de tous les rôles qu'il doit modifier.` 
            });
        } else {
            await interaction.editReply({ 
                content: `[SUCCÈS] ${salonsTraités} salons ont été configurés selon le protocole de sécurité Division Vanguard.\n\nToutes les permissions ont été réinitialisées correctement.` 
            });
        }
    }
};
