'use strict';

const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const config = require('../config/guildConfig');

// ============================================================================
// CONFIGURATION DES MODÈLES DE PERMISSIONS
// Ajuste ces tableaux d'identifiants si nécessaire pour correspondre à ton serveur.
// ============================================================================

const ROLES_ADMIN = [
    '1502329914224017710', // Fondation
    '1502321921113460827', // Admin Interne
    '1502321894462980257', // Manager de Communauté
    '1502321920652345484'  // Directeur
];

const ROLES_OFFICIERS = [
    '1502321913169707089', // Général d'armée
    '1502321912314073251', // Général de corps d'armée
    '1502321911433138387', // Général de division
    '1502321910665580745', // Général de brigade
    '1502321909596033156', // Colonel
    '1502321908966887424', // Lieutenant-colonel
    '1502321908182552647', // Commandant
    '1502321907431637132', // Capitaine
    '1502321906353701025', // Lieutenant
    '1502321905212985475'  // Aspirant
];

const ROLES_SOUS_OFFICIERS_ET_RANG = [
    '1502321904026124438', // Major
    '1502321903333806225', // Adjudant-chef
    '1502321902020984842', // Adjudant
    '1502321900779737200', // Sergent-chef
    '1502321899751866550', // Sergent
    '1569022303034146886', // Caporal-chef de 1re classe
    '1502321898350972980', // Caporal-chef
    '1502321897147203654', // Caporal
    '1569022882288378017', // Soldat de 1re classe
    '1502321896212009001', // Soldat
    '1502472415127666780', // Engagé volontaire initial
    '1503483501113249792'  // Nouveaux Arrivants
];

// ============================================================================
// LOGIQUE DE LA COMMANDE
// ============================================================================

module.exports = {
    data: new SlashCommandBuilder()
        .setName('fixperms')
        .setDescription('Réinitialise et corrige intégralement les permissions de tous les salons et rôles (Admin uniquement)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .setDMPermission(false),

    async execute(interaction) {
        // 1. Vérification de sécurité ultime
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({
                content: '[ERREUR] Vous devez posséder la permission Administrateur pour exécuter cette opération.'
            });
        }

        // 2. Message public d'avertissement et de début
        await interaction.reply({
            content: '[ATTENTION] Début de la réinitialisation des permissions. Cette opération peut prendre une à deux minutes. Veuillez ne pas éteindre le bot.'
        });

        const guild = interaction.guild;
        const botMember = guild.members.me;

        // Vérification que le bot a les droits nécessaires
        if (!botMember.permissions.has(PermissionFlagsBits.ManageChannels) || !botMember.permissions.has(PermissionFlagsBits.ManageRoles)) {
            return interaction.followUp({
                content: '[ERREUR CRITIQUE] Le bot ne possède pas les permissions "Gérer les salons" et "Gérer les rôles". Opération annulée.'
            });
        }

        let salonsTraités = 0;
        let erreurs = 0;

        // 3. Itération sur toutes les catégories et tous les salons
        const categories = guild.channels.cache.filter(c => c.type === ChannelType.GuildCategory);
        
        for (const categorie of categories.values()) {
            const nomCategorie = categorie.name.toLowerCase();
            const salons = guild.channels.cache.filter(c => c.parentId === categorie.id && c.type !== ChannelType.GuildCategory);

            for (const salon of salons.values()) {
                try {
                    const nouvellesPermissions = [];

                    // --- MODÈLE 1 : ADMINISTRATION INTERNE ---
                    if (nomCategorie.includes('administration interne')) {
                        // @everyone : Aucun accès
                        nouvellesPermissions.push({
                            id: guild.id,
                            deny: [PermissionFlagsBits.ViewChannel]
                        });
                        // Rôles Admin : Accès total
                        for (const roleId of ROLES_ADMIN) {
                            if (guild.roles.cache.has(roleId)) {
                                nouvellesPermissions.push({
                                    id: roleId,
                                    allow: [
                                        PermissionFlagsBits.ViewChannel,
                                        PermissionFlagsBits.SendMessages,
                                        PermissionFlagsBits.ManageMessages,
                                        PermissionFlagsBits.ReadMessageHistory,
                                        PermissionFlagsBits.ManageChannels
                                    ]
                                });
                            }
                        }
                    } 
                    // --- MODÈLE 2 : ÉTAT-MAJOR ---
                    else if (nomCategorie.includes('état major') || nomCategorie.includes('etat major')) {
                        nouvellesPermissions.push({ id: guild.id, deny: [PermissionFlagsBits.ViewChannel] });
                        for (const roleId of [...ROLES_ADMIN, ...ROLES_OFFICIERS]) {
                            if (guild.roles.cache.has(roleId)) {
                                nouvellesPermissions.push({
                                    id: roleId,
                                    allow: [
                                        PermissionFlagsBits.ViewChannel,
                                        PermissionFlagsBits.SendMessages,
                                        PermissionFlagsBits.ReadMessageHistory
                                    ]
                                });
                            }
                        }
                    }
                    // --- MODÈLE 3 : INFORMATION RP / RÈGLES (Lecture seule pour la base) ---
                    else if (nomCategorie.includes('information rp') || nomCategorie.includes('aide recrues')) {
                        // @everyone : Peut voir, mais ne peut pas parler dans les salons de règles
                        nouvellesPermissions.push({
                            id: guild.id,
                            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
                            deny: [PermissionFlagsBits.SendMessages]
                        });
                        // Admin : Peut tout gérer
                        for (const roleId of ROLES_ADMIN) {
                            if (guild.roles.cache.has(roleId)) {
                                nouvellesPermissions.push({
                                    id: roleId,
                                    allow: [
                                        PermissionFlagsBits.ViewChannel,
                                        PermissionFlagsBits.SendMessages,
                                        PermissionFlagsBits.ManageMessages,
                                        PermissionFlagsBits.ManageChannels
                                    ]
                                });
                            }
                        }
                    }
                    // --- MODÈLE 4 : OPÉRATIONS MILITAIRES / UNITÉS SPÉCIALES ---
                    else if (nomCategorie.includes('opérations militaires') || nomCategorie.includes('unités spéciales')) {
                        nouvellesPermissions.push({ id: guild.id, deny: [PermissionFlagsBits.ViewChannel] });
                        // Les militaires du rang et supérieurs ont accès
                        for (const roleId of [...ROLES_ADMIN, ...ROLES_OFFICIERS, ...ROLES_SOUS_OFFICIERS_ET_RANG]) {
                            if (guild.roles.cache.has(roleId)) {
                                nouvellesPermissions.push({
                                    id: roleId,
                                    allow: [
                                        PermissionFlagsBits.ViewChannel,
                                        PermissionFlagsBits.SendMessages,
                                        PermissionFlagsBits.ReadMessageHistory
                                    ]
                                });
                            }
                        }
                    }
                    // --- MODÈLE 5 : SALONS VOCAUX ---
                    else if (categorie.children.cache.some(c => c.type === ChannelType.GuildVoice)) {
                        if (salon.type === ChannelType.GuildVoice) {
                            if (nomCategorie.includes('administration') || salon.name.toLowerCase().includes('administration')) {
                                // Vocal restreint
                                nouvellesPermissions.push({ id: guild.id, deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect] });
                                for (const roleId of ROLES_ADMIN) {
                                    if (guild.roles.cache.has(roleId)) {
                                        nouvellesPermissions.push({
                                            id: roleId,
                                            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak]
                                        });
                                    }
                                }
                            } else {
                                // Vocal public
                                nouvellesPermissions.push({
                                    id: guild.id,
                                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak]
                                });
                            }
                        }
                    }
                    // --- MODÈLE 6 : COMMUNICATION GÉNÉRALE (Défaut) ---
                    else {
                        nouvellesPermissions.push({
                            id: guild.id,
                            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
                        });
                        for (const roleId of ROLES_ADMIN) {
                            if (guild.roles.cache.has(roleId)) {
                                nouvellesPermissions.push({
                                    id: roleId,
                                    allow: [PermissionFlagsBits.ManageMessages, PermissionFlagsBits.MuteMembers, PermissionFlagsBits.DeafenMembers]
                                });
                            }
                        }
                    }

                    // 4. Application des permissions au salon
                    await salon.permissionOverwrites.set(nouvellesPermissions, `Réinitialisation des permissions par la commande /fixperms`);
                    salonsTraités++;
                    
                    // Petite pause pour éviter les limites de taux (Rate Limits) de Discord
                    await new Promise(resolve => setTimeout(resolve, 250));

                } catch (erreur) {
                    console.error(`[FIXPERMS] Erreur sur le salon ${salon.name} (${salon.id}) :`, erreur.message);
                    erreurs++;
                }
            }
        }

        // 5. Message public de fin
        const messageFinal = erreurs > 0 
            ? `[TERMINÉ] Réinitialisation terminée. ${salonsTraités} salons traités avec succès, mais ${erreurs} erreur(s) ont été rencontrées (vérifiez que le rôle du bot est bien supérieur aux rôles qu'il tente de modifier).`
            : `[SUCCÈS] Réinitialisation terminée avec succès. ${salonsTraités} salons ont été configurés selon le protocole de sécurité Division Vanguard.`;

        await interaction.followUp({ content: messageFinal });
    }
};
