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
    OFFICIER: [
        '1502321913169707089', // Général Armée
        '1502321912314073251', // Général de Corps Armée
        '1502321911433138387', // Général de Division
        '1502321910665580745', // Général de Brigade
        '1502321909596033156', // Colonel
        '1502321908966887424', // Lieutenant-Colonel
        '1502321908182552647', // Commandant
        '1502321907431637132', // Capitaine
        '1502321906353701025', // Lieutenant
        '1502321905212985475'  // Aspirant
    ],
    SOUS_OFFICIER: [
        '1502321904026124438', // Major
        '1502321903333806225', // Adjudant-Chef
        '1502321902020984842', // Adjudant
        '1502321900779737200', // Sergent-Chef
        '1502321899751866550'  // Sergent
    ],
    MILITAIRE: [
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

// ============================================================================
// FILTRAGE DYNAMIQUE DES RÔLES ACCESSIBLES
// ============================================================================

function filtrerRolesAccessibles(guild, roleIds) {
    const botRole = guild.members.me.roles.highest;
    if (!botRole) return { accessibles: [], inaccessibles: [] };
    
    const accessibles = [];
    const inaccessibles = [];
    
    for (const id of roleIds) {
        const role = guild.roles.cache.get(id);
        if (!role) continue;
        
        if (role.position < botRole.position) {
            accessibles.push(id);
        } else {
            inaccessibles.push({ id, nom: role.name, position: role.position });
        }
    }
    
    return { accessibles, inaccessibles };
}

function construirePermissions(guild, specifications) {
    const botRole = guild.members.me.roles.highest;
    const permissions = [];
    const rolesIgnorés = [];
    
    for (const spec of specifications) {
        if (spec.id === guild.id) {
            permissions.push({
                id: guild.id,
                allow: spec.allow || [],
                deny: spec.deny || []
            });
        } else {
            const role = guild.roles.cache.get(spec.id);
            if (!role) continue;
            
            if (role.position >= botRole.position) {
                rolesIgnorés.push({ id: spec.id, nom: role.name, position: role.position });
                continue;
            }
            
            permissions.push({
                id: spec.id,
                allow: spec.allow || [],
                deny: spec.deny || []
            });
        }
    }
    
    return { permissions, rolesIgnorés };
}

// ============================================================================
// MODÈLES DE PERMISSIONS
// ============================================================================

function modeleModeratorOnly(guild) {
    return construirePermissions(guild, [
        { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
        ...ROLES.STAFF.map(id => ({
            id,
            allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.ReadMessageHistory,
                PermissionFlagsBits.ManageMessages,
                PermissionFlagsBits.ManageChannels
            ]
        })),
        { id: ROLES.BOT, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] }
    ]);
}

function modeleInformationRP(guild) {
    return construirePermissions(guild, [
        {
            id: guild.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
            deny: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.AddReactions, PermissionFlagsBits.CreatePublicThreads]
        },
        ...ROLES.STAFF.map(id => ({
            id,
            allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.ManageMessages,
                PermissionFlagsBits.ReadMessageHistory,
                PermissionFlagsBits.ManageChannels
            ]
        })),
        { id: ROLES.BOT, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] }
    ]);
}

function modeleAideRecrue(salon, guild) {
    const nomSalon = salon.name.toLowerCase();
    const salonsNouveauxArrivants = ['prendre-rendez-vous', 'information', 'general-recrue', 'géneral-recrue', 'vocal-formation'];
    const estAccessible = salonsNouveauxArrivants.some(s => nomSalon.includes(s));
    
    if (estAccessible) {
        return construirePermissions(guild, [
            { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
            {
                id: ROLES.NOUVEAUX_ARRIVANTS,
                allow: [
                    PermissionFlagsBits.ViewChannel,
                    PermissionFlagsBits.SendMessages,
                    PermissionFlagsBits.ReadMessageHistory,
                    PermissionFlagsBits.Connect,
                    PermissionFlagsBits.Speak
                ]
            },
            ...ROLES.STAFF.map(id => ({
                id,
                allow: [
                    PermissionFlagsBits.ViewChannel,
                    PermissionFlagsBits.SendMessages,
                    PermissionFlagsBits.ManageMessages,
                    PermissionFlagsBits.ReadMessageHistory,
                    PermissionFlagsBits.ManageChannels,
                    PermissionFlagsBits.MuteMembers
                ]
            })),
            { id: ROLES.BOT, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] }
        ]);
    } else {
        return construirePermissions(guild, [
            { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
            ...ROLES.CIRFA.map(id => ({
                id,
                allow: [
                    PermissionFlagsBits.ViewChannel,
                    PermissionFlagsBits.SendMessages,
                    PermissionFlagsBits.ReadMessageHistory
                ]
            })),
            ...ROLES.STAFF.map(id => ({
                id,
                allow: [
                    PermissionFlagsBits.ViewChannel,
                    PermissionFlagsBits.SendMessages,
                    PermissionFlagsBits.ManageMessages,
                    PermissionFlagsBits.ReadMessageHistory,
                    PermissionFlagsBits.ManageChannels
                ]
            })),
            { id: ROLES.BOT, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] }
        ]);
    }
}

function modeleCommunicationGenerale(salon, guild) {
    const nomSalon = salon.name.toLowerCase();
    const salonsLectureSeule = ['support', 'partenariat', 'notre-pub'];
    const estLectureSeule = salonsLectureSeule.some(s => nomSalon.includes(s));
    
    if (estLectureSeule) {
        return construirePermissions(guild, [
            {
                id: guild.id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
                deny: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.AddReactions]
            },
            ...ROLES.STAFF.map(id => ({
                id,
                allow: [
                    PermissionFlagsBits.ViewChannel,
                    PermissionFlagsBits.SendMessages,
                    PermissionFlagsBits.ManageMessages,
                    PermissionFlagsBits.ReadMessageHistory,
                    PermissionFlagsBits.ManageChannels
                ]
            })),
            { id: ROLES.BOT, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] }
        ]);
    } else {
        return construirePermissions(guild, [
            {
                id: guild.id,
                allow: [
                    PermissionFlagsBits.ViewChannel,
                    PermissionFlagsBits.SendMessages,
                    PermissionFlagsBits.ReadMessageHistory,
                    PermissionFlagsBits.UseApplicationCommands
                ]
            },
            ...ROLES.STAFF.map(id => ({
                id,
                allow: [
                    PermissionFlagsBits.ManageMessages,
                    PermissionFlagsBits.MuteMembers,
                    PermissionFlagsBits.DeafenMembers
                ]
            })),
            { id: ROLES.BOT, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] }
        ]);
    }
}

function modeleOperationsMilitaires(guild) {
    return construirePermissions(guild, [
        { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
        ...TOUS_MILITAIRES.map(id => ({
            id,
            allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.ReadMessageHistory
            ]
        })),
        ...ROLES.STAFF.map(id => ({
            id,
            allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.ManageMessages,
                PermissionFlagsBits.ReadMessageHistory,
                PermissionFlagsBits.ManageChannels
            ]
        })),
        { id: ROLES.BOT, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] }
    ]);
}

function modeleAdministrationInterne(guild) {
    return construirePermissions(guild, [
        { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
        ...ROLES.STAFF.map(id => ({
            id,
            allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.ReadMessageHistory,
                PermissionFlagsBits.ManageMessages,
                PermissionFlagsBits.ManageChannels
            ]
        })),
        { id: ROLES.BOT, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] }
    ]);
}

function modeleEtatMajor(guild) {
    return construirePermissions(guild, [
        { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
        ...HAUT_COMMANDMENT.map(id => ({
            id,
            allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.ReadMessageHistory,
                PermissionFlagsBits.ManageMessages
            ]
        })),
        { id: ROLES.BOT, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] }
    ]);
}

function modeleUnitesSpeciales(guild) {
    return construirePermissions(guild, [
        { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
        ...ROLES.SPECIALITES.map(id => ({
            id,
            allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.ReadMessageHistory
            ]
        })),
        ...TOUS_MILITAIRES.map(id => ({
            id,
            allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.ReadMessageHistory
            ]
        })),
        ...ROLES.STAFF.map(id => ({
            id,
            allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.ManageMessages,
                PermissionFlagsBits.ReadMessageHistory,
                PermissionFlagsBits.ManageChannels
            ]
        })),
        { id: ROLES.BOT, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] }
    ]);
}

function modeleFormationEntrainement(guild) {
    return construirePermissions(guild, [
        { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
        ...TOUS_MILITAIRES.map(id => ({
            id,
            allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.ReadMessageHistory
            ]
        })),
        {
            id: ROLES.NOUVEAUX_ARRIVANTS,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory]
        },
        ...ROLES.STAFF.map(id => ({
            id,
            allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.ManageMessages,
                PermissionFlagsBits.ReadMessageHistory,
                PermissionFlagsBits.ManageChannels
            ]
        })),
        { id: ROLES.BOT, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] }
    ]);
}

function modeleSalonVocal(salon, guild) {
    const nomSalon = salon.name.toLowerCase();
    const nomCategorie = salon.parentId ? (guild.channels.cache.get(salon.parentId)?.name || '').toLowerCase() : '';
    
    if (nomSalon.includes('administration') || nomSalon.includes('état major') || nomSalon.includes('etat major')) {
        return construirePermissions(guild, [
            { id: guild.id, deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect] },
            ...ROLES.STAFF.map(id => ({
                id,
                allow: [
                    PermissionFlagsBits.ViewChannel,
                    PermissionFlagsBits.Connect,
                    PermissionFlagsBits.Speak,
                    PermissionFlagsBits.MuteMembers,
                    PermissionFlagsBits.DeafenMembers
                ]
            }))
        ]);
    }
    
    if (nomCategorie.includes('opérations') || nomCategorie.includes('unités spéciales') ||
        nomSalon.includes('opérations') || nomSalon.includes('forces spec') || 
        nomSalon.includes('commandement') || nomSalon.includes('pilotes')) {
        return construirePermissions(guild, [
            { id: guild.id, deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect] },
            ...TOUS_MILITAIRES.map(id => ({
                id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak]
            })),
            ...ROLES.STAFF.map(id => ({
                id,
                allow: [
                    PermissionFlagsBits.ViewChannel,
                    PermissionFlagsBits.Connect,
                    PermissionFlagsBits.Speak,
                    PermissionFlagsBits.MuteMembers
                ]
            }))
        ]);
    }
    
    return construirePermissions(guild, [
        {
            id: guild.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak]
        },
        ...ROLES.STAFF.map(id => ({
            id,
            allow: [PermissionFlagsBits.MuteMembers, PermissionFlagsBits.DeafenMembers, PermissionFlagsBits.MoveMembers]
        }))
    ]);
}

// ============================================================================
// DÉTECTION DU MODÈLE
// ============================================================================

function detecterModele(salon, guild) {
    const nomCategorie = salon.parentId ? (guild.channels.cache.get(salon.parentId)?.name || '').toLowerCase() : '';
    const nomSalon = salon.name.toLowerCase();
    
    if (nomSalon === 'moderator-only') {
        return { nom: 'Moderator-Only', ...modeleModeratorOnly(guild) };
    }
    
    if (nomCategorie.includes('information rp')) {
        return { nom: 'Information RP', ...modeleInformationRP(guild) };
    }
    
    if (nomCategorie.includes('aide recrue')) {
        return { nom: 'Aide Recrue', ...modeleAideRecrue(salon, guild) };
    }
    
    if (nomCategorie.includes('communication generale') || nomCategorie.includes('communication générale')) {
        return { nom: 'Communication Générale', ...modeleCommunicationGenerale(salon, guild) };
    }
    
    if (nomCategorie.includes('opérations militaires') || nomCategorie.includes('operations militaires')) {
        return { nom: 'Opérations Militaires', ...modeleOperationsMilitaires(guild) };
    }
    
    if (nomCategorie.includes('administration interne')) {
        return { nom: 'Administration Interne', ...modeleAdministrationInterne(guild) };
    }
    
    if (nomCategorie.includes('état major') || nomCategorie.includes('etat major')) {
        return { nom: 'État-Major', ...modeleEtatMajor(guild) };
    }
    
    if (nomCategorie.includes('unités spéciales') || nomCategorie.includes('unites speciales')) {
        return { nom: 'Unités Spéciales', ...modeleUnitesSpeciales(guild) };
    }
    
    if (nomCategorie.includes('formation') || nomCategorie.includes('entrainement') || nomCategorie.includes('entraînement')) {
        return { nom: 'Formation', ...modeleFormationEntrainement(guild) };
    }
    
    if (salon.type === ChannelType.GuildVoice) {
        return { nom: 'Vocal', ...modeleSalonVocal(salon, guild) };
    }
    
    return { nom: 'Défaut', ...modeleCommunicationGenerale(salon, guild) };
}

// ============================================================================
// COMMANDE PRINCIPALE
// ============================================================================

module.exports = {
    data: new SlashCommandBuilder()
        .setName('fixperms')
        .setDescription('Réinitialise les permissions des salons (Admin uniquement)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .setDMPermission(false),

    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({ content: '[ERREUR] Vous devez posséder la permission Administrateur pour exécuter cette opération.' });
        }

        await interaction.reply({ content: '[EN COURS] Début de la réinitialisation des permissions. Cette opération peut prendre une minute. Veuillez patienter...' });

        const guild = interaction.guild;
        const botMember = guild.members.me;
        const botRole = botMember.roles.highest;

        if (!botMember.permissions.has(PermissionFlagsBits.ManageChannels) || !botMember.permissions.has(PermissionFlagsBits.ManageRoles)) {
            return interaction.editReply({ content: '[ERREUR CRITIQUE] Le bot ne possède pas les permissions nécessaires. Opération annulée.' });
        }

        let salonsReussis = 0;
        let salonsEchoues = 0;
        let totalRolesIgnorés = 0;
        const detailsParModele = {};
        const tousLesRolesIgnorés = new Map();

        const salons = guild.channels.cache.filter(c => c.type !== ChannelType.GuildCategory);

        for (const salon of salons.values()) {
            try {
                const { nom, permissions, rolesIgnorés } = detecterModele(salon, guild);
                
                if (!detailsParModele[nom]) {
                    detailsParModele[nom] = { reussis: 0, echoues: 0 };
                }

                await salon.permissionOverwrites.set(permissions, 'Réinitialisation protocolaire par /fixperms');
                salonsReussis++;
                detailsParModele[nom].reussis++;
                
                if (rolesIgnorés.length > 0) {
                    totalRolesIgnorés += rolesIgnorés.length;
                    for (const role of rolesIgnorés) {
                        if (!tousLesRolesIgnorés.has(role.id)) {
                            tousLesRolesIgnorés.set(role.id, { nom: role.nom, position: role.position, count: 0 });
                        }
                        tousLesRolesIgnorés.get(role.id).count++;
                    }
                }
                
                await new Promise(resolve => setTimeout(resolve, 250));
            } catch (erreur) {
                salonsEchoues++;
                const nomCategorie = salon.parentId ? (guild.channels.cache.get(salon.parentId)?.name || 'sans catégorie') : 'sans catégorie';
                const { nom } = detecterModele(salon, guild);
                if (!detailsParModele[nom]) detailsParModele[nom] = { reussis: 0, echoues: 0 };
                detailsParModele[nom].echoues++;
                
                console.error(`[FIXPERMS] Erreur sur ${salon.name} (${nomCategorie}) : ${erreur.message}`);
            }
        }

        let rapport = `[RAPPORT] Réinitialisation terminée.\n`;
        rapport += `Salons traités avec succès : ${salonsReussis}\n`;
        rapport += `Salons en échec : ${salonsEchoues}\n`;
        rapport += `Rôles ignorés (au-dessus du bot) : ${totalRolesIgnorés}\n\n`;
        
        rapport += `Détails par catégorie :\n`;
        for (const [modele, stats] of Object.entries(detailsParModele)) {
            rapport += `  - ${modele} : ${stats.reussis} succès, ${stats.echoues} échecs\n`;
        }

        if (tousLesRolesIgnorés.size > 0) {
            rapport += `\nRôles ignorés car situés au-dessus du bot (position ${botRole.position}) :\n`;
            for (const [id, info] of tousLesRolesIgnorés) {
                rapport += `  - ${info.nom} (position ${info.position}) - ignoré ${info.count} fois\n`;
            }
            rapport += `\n[IMPORTANT] Ces rôles n'ont pas pu être configurés car ils sont situés au-dessus du bot dans la hiérarchie. Pour les inclure, déplacez le rôle du bot au-dessus d'eux dans les paramètres du serveur.`;
        } else {
            rapport += `\n[SUCCÈS] Toutes les permissions ont été configurées correctement.`;
        }

        await interaction.editReply({ content: rapport });
    }
};
