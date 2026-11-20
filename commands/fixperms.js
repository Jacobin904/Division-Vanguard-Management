'use strict';

const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');

// ============================================================================
// CONFIGURATION DES RÔLES CLÉS (Basée sur ton rapport)
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

// ============================================================================
// MODÈLES DE PERMISSIONS
// ============================================================================
const MODELES = {
    // Modèle pour les salons d'information en lecture seule (règles, faq, liens)
    LECTURE_SEULE: (guild) => [
        { id: guild.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory], deny: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.AddReactions, PermissionFlagsBits.CreatePublicThreads] },
        ...ROLES.ADMIN.map(id => ({ id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageChannels] })),
        ...ROLES.STAFF.map(id => ({ id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages, PermissionFlagsBits.ReadMessageHistory] }))
    ],

    // Modèle pour les salons de communication générale
    COMMUNICATION: (guild) => [
        { id: guild.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.UseApplicationCommands] },
        { id: ROLES.RECRUE, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
        ...ROLES.ADMIN.map(id => ({ id, allow: [PermissionFlagsBits.ManageMessages, PermissionFlagsBits.MuteMembers, PermissionFlagsBits.DeafenMembers] }))
    ],

    // Modèle pour les salons d'administration interne (totalement privés)
    ADMIN_INTERNE: (guild) => [
        { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
        ...ROLES.ADMIN.map(id => ({ id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageMessages, PermissionFlagsBits.ManageChannels] })),
        { id: ROLES.BOT, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] }
    ],

    // Modèle pour les opérations militaires (réservé militaire du rang et plus)
    OPERATIONS: (guild) => [
        { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
        ...[...ROLES.MILITAIRE, ...ROLES.SOUS_OFFICIER, ...ROLES.OFFICIER, ...ROLES.ADMIN, ...ROLES.STAFF].map(id => ({ 
            id, 
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] 
        })),
        ...ROLES.OFFICIER.map(id => ({ id, allow: [PermissionFlagsBits.ManageMessages] }))
    ],

    // Modèle pour la formation (académie ouverte aux recrues, résultats réservés au staff)
    FORMATION: (guild) => [
        { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
        { id: ROLES.RECRUE, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory] },
        ...[...ROLES.MILITAIRE, ...ROLES.SOUS_OFFICIER, ...ROLES.OFFICIER, ...ROLES.ADMIN, ...ROLES.STAFF].map(id => ({ 
            id, 
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] 
        })),
        ...ROLES.ADMIN.map(id => ({ id, allow: [PermissionFlagsBits.ManageMessages, PermissionFlagsBits.ManageChannels] }))
    ],

    // Modèle pour les salons vocaux généraux
    VOCAL_GENERAL: (guild) => [
        { id: guild.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak] },
        { id: ROLES.RECRUE, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak] },
        ...ROLES.ADMIN.map(id => ({ id, allow: [PermissionFlagsBits.MuteMembers, PermissionFlagsBits.DeafenMembers, PermissionFlagsBits.MoveMembers] }))
    ],

    // Modèle pour les salons vocaux restreints (État-Major, Admin)
    VOCAL_RESTREINT: (guild) => [
        { id: guild.id, deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect] },
        ...[...ROLES.OFFICIER, ...ROLES.ADMIN, ...ROLES.STAFF].map(id => ({ 
            id, 
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak, PermissionFlagsBits.MuteMembers, PermissionFlagsBits.DeafenMembers] 
        }))
    ]
};

// ============================================================================
// LOGIQUE DE LA COMMANDE
// ============================================================================

module.exports = {
    data: new SlashCommandBuilder()
        .setName('fixperms')
        .setDescription('Réinitialise et configure intégralement les permissions de tous les salons selon le protocole Division Vanguard (Admin uniquement)')
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
            return interaction.editReply({ content: '[ERREUR CRITIQUE] Le bot ne possède pas les permissions "Gérer les salons" et "Gérer les rôles". Opération annulée.' });
        }

        let salonsTraités = 0;
        let erreurs = 0;
        const messagesProgression = [];

        const channels = guild.channels.cache.filter(c => c.type !== ChannelType.GuildCategory);

        for (const salon of channels.values()) {
            try {
                let nouvellesPermissions = [];
                const nomCategorie = salon.parentId ? (guild.channels.cache.get(salon.parentId)?.name || '').toLowerCase() : '';
                const nomSalon = salon.name.toLowerCase();

                // 1. DÉTECTION DU MODÈLE DE BASE SELON LA CATÉGORIE
                if (nomCategorie.includes('information rp')) {
                    nouvellesPermissions = MODELES.LECTURE_SEULE(guild);
                } else if (nomCategorie.includes('communication generale')) {
                    nouvellesPermissions = MODELES.COMMUNICATION(guild);
                } else if (nomCategorie.includes('administration interne')) {
                    nouvellesPermissions = MODELES.ADMIN_INTERNE(guild);
                } else if (nomCategorie.includes('opérations militaires') || nomCategorie.includes('unités spéciales')) {
                    nouvellesPermissions = MODELES.OPERATIONS(guild);
                } else if (nomCategorie.includes('formation et entraînement')) {
                    nouvellesPermissions = MODELES.FORMATION(guild);
                } else if (nomCategorie.includes('état major')) {
                    nouvellesPermissions = MODELES.OPERATIONS(guild); // État-Major suit les règles opérationnelles
                } else if (salon.type === ChannelType.GuildVoice) {
                    if (nomCategorie.includes('salons vocaux') && (nomSalon.includes('général') || nomSalon.includes('afk') || nomSalon.includes('formation'))) {
                        nouvellesPermissions = MODELES.VOCAL_GENERAL(guild);
                    } else {
                        nouvellesPermissions = MODELES.VOCAL_RESTREINT(guild);
                    }
                } else {
                    // Fallback par défaut
                    nouvellesPermissions = MODELES.COMMUNICATION(guild);
                }

                // 2. EXCEPTIONS SPÉCIFIQUES PAR SALON (Surcharge du modèle de base)
                if (nomSalon.includes('règle') || nomSalon.includes('regle')) {
                    // Autoriser les réactions pour les règles
                    const everyoneRule = nouvellesPermissions.find(p => p.id === guild.id);
                    if (everyoneRule) everyoneRule.allow.push(PermissionFlagsBits.AddReactions);
                } 
                else if (nomSalon.includes('annonce')) {
                    // Personne ne peut écrire sauf le staff
                    nouvellesPermissions = [
                        { id: guild.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory], deny: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.AddReactions, PermissionFlagsBits.CreatePublicThreads] },
                        ...ROLES.ADMIN.map(id => ({ id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages, PermissionFlagsBits.ReadMessageHistory] })),
                        ...ROLES.STAFF.map(id => ({ id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages, PermissionFlagsBits.ReadMessageHistory] }))
                    ];
                }
                else if (nomSalon.includes('log') || nomSalon.includes('config') || nomSalon.includes('sanction-interne')) {
                    // Réservé strictement à l'administration interne
                    nouvellesPermissions = MODELES.ADMIN_INTERNE(guild);
                }
                else if (nomSalon.includes('resultat') || nomSalon.includes('registre-promotion')) {
                    // Réservé au staff et officiers
                    nouvellesPermissions = [
                        { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                        ...[...ROLES.ADMIN, ...ROLES.STAFF, ...ROLES.OFFICIER].map(id => ({ id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageMessages] }))
                    ];
                }
                else if (nomSalon.includes('bot-commande')) {
                    // Autoriser l'utilisation des commandes pour tous
                    const everyoneCmd = nouvellesPermissions.find(p => p.id === guild.id);
                    if (everyoneCmd && !everyoneCmd.allow.includes(PermissionFlagsBits.UseApplicationCommands)) {
                        everyoneCmd.allow.push(PermissionFlagsBits.UseApplicationCommands);
                    }
                }

                // 3. APPLICATION DES PERMISSIONS
                await salon.permissionOverwrites.set(nouvellesPermissions, `Réinitialisation protocolaire par la commande /fixperms`);
                salonsTraités++;
                
                // Petite pause pour éviter les limites de taux (Rate Limits) de l'API Discord
                await new Promise(resolve => setTimeout(resolve, 200));

            } catch (erreur) {
                console.error(`[FIXPERMS] Erreur sur le salon ${salon.name} (${salon.id}) :`, erreur.message);
                erreurs++;
            }
        }

        // 4. MESSAGE DE FIN
        if (erreurs > 0) {
            await interaction.editReply({ 
                content: `[TERMINÉ AVEC AVERTISSEMENT] Réinitialisation terminée. ${salonsTraités} salons traités avec succès, mais ${erreurs} erreur(s) ont été rencontrées.\n\nVérifiez que le rôle du bot est situé **au-dessus** de tous les rôles qu'il est censé modifier dans la hiérarchie du serveur.` 
            });
        } else {
            await interaction.editReply({ 
                content: `[SUCCÈS] Réinitialisation terminée avec succès. ${salonsTraités} salons ont été configurés selon le protocole de sécurité Division Vanguard.\n\nTous les salons d'annonces, d'administration et opérationnels sont désormais sécurisés.` 
            });
        }
    }
};
