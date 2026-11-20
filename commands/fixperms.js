'use strict';

const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');

// ============================================================================
// CONFIGURATION DES RÔLES (Basée sur ton rapport)
// ============================================================================
const ROLES = {
    ADMIN: [
        '1502329914224017710', // Fondation
        '1502321921113460827', // [ADM-INT] Admin Interne
        '1502321920652345484'  // [DIR] Directeur
    ],
    STAFF: [
        '1502321894462980257'  // [MNGMT-CMNT] Manager de Communauté
    ],
    OFFICIER: [
        '1502321913169707089', // [GAR] Général Armée
        '1502321912314073251', // [GCA] Général de Corps Armée
        '1502321911433138387', // [GDI] Général de Division
        '1502321910665580745', // [GBR] Général de Brigade
        '1502321909596033156', // [COL] Colonel
        '1502321908966887424', // [LCL] Lieutenant-Colonel
        '1502321908182552647'  // [CDT] Commandant
    ],
    SOUS_OFFICIER: [
        '1502321907431637132', // [CNE] Capitaine
        '1502321906353701025', // [LTN] Lieutenant
        '1502321905212985475', // [ASP] Aspirant
        '1502321904026124438', // [MAJ] Major
        '1502321903333806225', // [ADC] Adjudant-Chef
        '1502321902020984842', // [ADJ] Adjudant
        '1502321900779737200', // [SCH] Sergent-Chef
        '1502321899751866550'  // [SGT] Sergent
    ],
    MILITAIRE: [
        '1569022303034146886', // [CC1] Caporal-chef de 1re classe
        '1502321898350972980', // [CCH] Caporal-chef
        '1502321897147203654', // [CPL] Caporal
        '1569022882288378017', // [1CL] Soldat de 1re classe
        '1502321896212009001', // [SDT] Soldat
        '1502472415127666780'  // [EVI] Engagé Volontaire Initial
    ],
    RECRUE: '1503483501113249792', // Nouveaux Arrivants
    BOT: '1503484181735276605'    // Rôle BOT
};

const TOUS_LES_STAFF = [...ROLES.ADMIN, ...ROLES.STAFF, ...ROLES.OFFICIER, ...ROLES.SOUS_OFFICIER];
const TOUTE_LA_HIERARCHIE = [...TOUS_LES_STAFF, ...ROLES.MILITAIRE];

// ============================================================================
// LOGIQUE DE DÉTECTION DES SALONS (ORDRE CRITIQUE : DU PLUS RESTRICTIF AU MOINS RESTRICTIF)
// ============================================================================

function estSalonStaffUniquement(nomCategorie, nomSalon) {
    const categoriesStaff = ['administration interne', 'état major', 'etat major'];
    const salonsSpecifiques = ['staff-general', 'gestion-membres', 'sanctions-internes', 'logs-bot', 'config-serveur', 'tickets-internes', 'conseil-officiers', 'moderator-only'];
    
    return categoriesStaff.some(c => nomCategorie.includes(c)) || salonsSpecifiques.some(s => nomSalon.includes(s));
}

function estSalonLectureSeule(nomCategorie, nomSalon) {
    const salonsSpecifiques = ['règle', 'regle', 'annonce', 'faq', 'liens-utiles', 'presentation', 'partenariat'];
    return salonsSpecifiques.some(s => nomSalon.includes(s));
}

function estSalonMilitaireRestreint(nomCategorie, nomSalon) {
    const categoriesMilitaires = ['opérations militaires', 'operations militaires', 'unités spéciales', 'unites speciales'];
    const salonsSpecifiques = ['ordres-operation', 'rapports-mission', 'debrief-apres-mission', 'sniper-elite', 'forces-speciales', 'pilotes-salon', 'briefing-aerien', 'intel-renseignement'];
    
    return categoriesMilitaires.some(c => nomCategorie.includes(c)) || salonsSpecifiques.some(s => nomSalon.includes(s));
}

function estSalonFormation(nomCategorie, nomSalon) {
    const categories = ['formation et entraînement', 'formation et entrainement', 'aide recrues'];
    return categories.some(c => nomCategorie.includes(c));
}

// ============================================================================
// COMMANDE
// ============================================================================

module.exports = {
    data: new SlashCommandBuilder()
        .setName('fixperms')
        .setDescription('Réinitialise intégralement les permissions selon le protocole de sécurité (Admin uniquement)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .setDMPermission(false),

    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({ content: '[ERREUR] Vous devez posséder la permission Administrateur pour exécuter cette opération.' });
        }

        // Message PUBLIC comme demandé
        await interaction.reply({ content: '[EN COURS] Début de la réinitialisation des permissions. Cette opération peut prendre une minute. Veuillez patienter...' });

        const guild = interaction.guild;
        const botMember = guild.members.me;

        if (!botMember.permissions.has(PermissionFlagsBits.ManageChannels) || !botMember.permissions.has(PermissionFlagsBits.ManageRoles)) {
            return interaction.editReply({ content: '[ERREUR CRITIQUE] Le bot ne possède pas les permissions "Gérer les salons" et "Gérer les rôles". Opération annulée.' });
        }

        let salonsTraités = 0;
        let erreurs = 0;

        // On exclut les catégories de la boucle principale pour ne modifier que les salons
        const salons = guild.channels.cache.filter(c => c.type !== ChannelType.GuildCategory);

        for (const salon of salons.values()) {
            try {
                let nouvellesPermissions = [];
                const nomCategorie = salon.parentId ? (guild.channels.cache.get(salon.parentId)?.name || '').toLowerCase() : '';
                const nomSalon = salon.name.toLowerCase();

                // 1. SALONS STRICTEMENT RÉSERVÉS AU STAFF (Invisibles pour le public)
                if (estSalonStaffUniquement(nomCategorie, nomSalon)) {
                    nouvellesPermissions = [
                        { id: guild.id, deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
                        ...TOUS_LES_STAFF.map(id => ({ 
                            id, 
                            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageMessages, PermissionFlagsBits.ManageChannels] 
                        })),
                        { id: ROLES.BOT, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] }
                    ];
                } 
                // 2. SALONS EN LECTURE SEULE POUR LE PUBLIC (Règles, Annonces, etc.)
                else if (estSalonLectureSeule(nomCategorie, nomSalon)) {
                    nouvellesPermissions = [
                        { id: guild.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory], deny: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.AddReactions, PermissionFlagsBits.CreatePublicThreads] },
                        ...ROLES.ADMIN.map(id => ({ id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageChannels] })),
                        ...ROLES.STAFF.map(id => ({ id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages, PermissionFlagsBits.ReadMessageHistory] }))
                    ];
                }
                // 3. SALONS MILITAIRES RESTREINTS (Invisibles pour les recrues/civils)
                else if (estSalonMilitaireRestreint(nomCategorie, nomSalon)) {
                    nouvellesPermissions = [
                        { id: guild.id, deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
                        ...TOUTE_LA_HIERARCHIE.map(id => ({ 
                            id, 
                            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] 
                        })),
                        ...ROLES.OFFICIER.map(id => ({ id, allow: [PermissionFlagsBits.ManageMessages] }))
                    ];
                }
                // 4. SALONS DE FORMATION (Visibles par les recrues en lecture, écriture pour le staff)
                else if (estSalonFormation(nomCategorie, nomSalon)) {
                    nouvellesPermissions = [
                        { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] }, // On refuse tout le monde par défaut
                        { id: ROLES.RECRUE, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory] }, // Les recrues peuvent seulement lire
                        ...TOUTE_LA_HIERARCHIE.map(id => ({ 
                            id, 
                            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] 
                        })),
                        ...ROLES.ADMIN.map(id => ({ id, allow: [PermissionFlagsBits.ManageMessages, PermissionFlagsBits.ManageChannels] }))
                    ];
                }
                // 5. SALONS VOCAUX
                else if (salon.type === ChannelType.GuildVoice) {
                    if (nomCategorie.includes('administration') || nomSalon.includes('administration') || nomSalon.includes('etat major')) {
                        // Vocal Staff
                        nouvellesPermissions = [
                            { id: guild.id, deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect] },
                            ...TOUS_LES_STAFF.map(id => ({ id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak, PermissionFlagsBits.MuteMembers] }))
                        ];
                    } else {
                        // Vocal Public
                        nouvellesPermissions = [
                            { id: guild.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak] },
                            ...ROLES.ADMIN.map(id => ({ id, allow: [PermissionFlagsBits.MuteMembers, PermissionFlagsBits.DeafenMembers, PermissionFlagsBits.MoveMembers] }))
                        ];
                    }
                }
                // 6. DÉFAUT : COMMUNICATION GÉNÉRALE (Pour tout le reste)
                else {
                    nouvellesPermissions = [
                        { id: guild.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.UseApplicationCommands] },
                        ...ROLES.ADMIN.map(id => ({ id, allow: [PermissionFlagsBits.ManageMessages, PermissionFlagsBits.MuteMembers, PermissionFlagsBits.DeafenMembers] }))
                    ];
                }

                // APPLICATION DES PERMISSIONS
                await salon.permissionOverwrites.set(nouvellesPermissions, `Réinitialisation protocolaire par la commande /fixperms`);
                salonsTraités++;
                
                // Pause anti-rate limit
                await new Promise(resolve => setTimeout(resolve, 150));

            } catch (erreur) {
                console.error(`[FIXPERMS] Erreur sur le salon ${salon.name} (${salon.id}) :`, erreur.message);
                erreurs++;
            }
        }

        // MESSAGE DE FIN PUBLIC
        if (erreurs > 0) {
            await interaction.editReply({ 
                content: `[TERMINÉ AVEC AVERTISSEMENT] Réinitialisation terminée. ${salonsTraités} salons traités avec succès, mais ${erreurs} erreur(s) ont été rencontrées.\n\nVérifiez que le rôle du bot est situé **au-dessus** de tous les rôles qu'il est censé modifier dans la hiérarchie du serveur.` 
            });
        } else {
            await interaction.editReply({ 
                content: `[SUCCÈS] Réinitialisation terminée avec succès. ${salonsTraités} salons ont été configurés.\n\nLes salons de règles sont désormais en lecture seule, et les salons de staff sont totalement invisibles pour les membres non autorisés.` 
            });
        }
    }
};
