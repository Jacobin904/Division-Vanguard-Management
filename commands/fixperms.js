'use strict';

const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');

// ============================================================================
// CONFIGURATION DES RÔLES (IDs extraits directement de ton rapport)
// ============================================================================
const ROLES = {
    STAFF: [
        '1502329914224017710', // Fondation
        '1502321921113460827', // [ADM-INT] Admin Interne
        '1502321894462980257', // [MNGMT-CMNT] Manager de Communauté
        '1502321920652345484'  // [DIR] Directeur
    ],
    OFFICIER: [
        '1502321913169707089', // [GAR] Général Armée
        '1502321912314073251', // [GCA] Général de Corps Armée
        '1502321911433138387', // [GDI] Général de Division
        '1502321910665580745', // [GBR] Général de Brigade
        '1502321909596033156', // [COL] Colonel
        '1502321908966887424', // [LCL] Lieutenant-Colonel
        '1502321908182552647', // [CDT] Commandant
        '1502321907431637132', // [CNE] Capitaine
        '1502321906353701025', // [LTN] Lieutenant
        '1502321905212985475'  // [ASP] Aspirant
    ],
    SOUS_OFFICIER: [
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

const TOUS_LES_MILITAIRES = [...ROLES.MILITAIRE, ...ROLES.SOUS_OFFICIER, ...ROLES.OFFICIER];
const TOUT_LE_STAFF = [...ROLES.STAFF];

// ============================================================================
// LOGIQUE DE DÉTECTION DES MODÈLES DE PERMISSIONS
// ============================================================================

function obtenirModelePermissions(salon, guild) {
    const nomCategorie = salon.parentId ? (guild.channels.cache.get(salon.parentId)?.name || '').toLowerCase() : '';
    const nomSalon = salon.name.toLowerCase();
    const estVocal = salon.type === ChannelType.GuildVoice;

    const permsBase = (allow = [], deny = []) => ({ id: guild.id, allow, deny });
    const permsRole = (roleId, allow = [], deny = []) => ({ id: roleId, allow, deny });

    // 1. SALONS STRICTEMENT RÉSERVÉS AU STAFF (Invisibles pour tous les autres)
    if (nomCategorie.includes('administration interne') || 
        ['staff-general', 'gestion-membres', 'sanctions-internes', 'logs-bot', 'config-serveur', 'tickets-internes'].some(s => nomSalon.includes(s))) {
        return [
            permsBase([], [PermissionFlagsBits.ViewChannel]),
            ...TOUT_LE_STAFF.map(id => permsRole(id, [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageMessages, PermissionFlagsBits.ManageChannels])),
            permsRole(ROLES.BOT, [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory])
        ];
    }

    // 2. ÉTAT-MAJOR ET HAUT COMMANDEMENT (Invisible pour les militaires du rang et recrues)
    if (nomCategorie.includes('etat major') || 
        ['conseil-officiers', 'decisions-strategiques', 'archives-classifiees', 'registre-promotions', 'sanctions-discipl'].some(s => nomSalon.includes(s))) {
        return [
            permsBase([], [PermissionFlagsBits.ViewChannel]),
            ...ROLES.OFFICIER.map(id => permsRole(id, [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageMessages])),
            ...TOUT_LE_STAFF.map(id => permsRole(id, [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageMessages]))
        ];
    }

    // 3. OPÉRATIONS MILITAIRES ET UNITÉS SPÉCIALES (Invisible pour les recrues/civils)
    if (nomCategorie.includes('operations militaires') || nomCategorie.includes('unites speciales') ||
        ['ordres-operation', 'rapports-mission', 'debrief-apres-mission', 'intel-renseignement', 'sniper-elite', 'forces-speciales', 'pilotes-salon', 'briefing-aerien', 'medical-campagne'].some(s => nomSalon.includes(s))) {
        return [
            permsBase([], [PermissionFlagsBits.ViewChannel]),
            permsRole(ROLES.RECRUE, [], [PermissionFlagsBits.ViewChannel]),
            ...TOUS_LES_MILITAIRES.map(id => permsRole(id, [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory])),
            ...TOUT_LE_STAFF.map(id => permsRole(id, [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageMessages]))
        ];
    }

    // 4. FORMATION ET ACADÉMIE (Visible par les recrues en lecture, écriture pour le staff)
    if (nomCategorie.includes('formation') || nomCategorie.includes('aide recrues') ||
        ['academie-militaire', 'examens-promotions', 'resultats-formation', 'guides-tactiques', 'entrainement-brm5', 'procedure-de-recrutement-cirfa', 'rapports-cirfa'].some(s => nomSalon.includes(s))) {
        
        const isResultat = nomSalon.includes('resultat') || nomSalon.includes('registre');
        return [
            permsBase([], [PermissionFlagsBits.ViewChannel]), // On refuse tout le monde par défaut pour être sûr
            permsRole(ROLES.RECRUE, [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory], isResultat ? [PermissionFlagsBits.SendMessages] : []),
            ...TOUS_LES_MILITAIRES.map(id => permsRole(id, [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory])),
            ...TOUT_LE_STAFF.map(id => permsRole(id, [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageMessages, PermissionFlagsBits.ManageChannels]))
        ];
    }

    // 5. LECTURE SEULE PUBLIQUE (Règles, Annonces, FAQ, Lore, Présentation)
    if (['regle', 'annonce', 'faq', 'lore', 'presentation', 'partenariat', 'liens-utiles'].some(s => nomSalon.includes(s))) {
        return [
            permsBase([PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory], [PermissionFlagsBits.SendMessages, PermissionFlagsBits.AddReactions, PermissionFlagsBits.CreatePublicThreads]),
            ...TOUT_LE_STAFF.map(id => permsRole(id, [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageChannels]))
        ];
    }

    // 6. SALONS VOCAUX (Logique adaptée)
    if (estVocal) {
        if (nomCategorie.includes('administration') || nomSalon.includes('administration') || nomSalon.includes('etat major')) {
            return [
                permsBase([], [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect]),
                ...TOUT_LE_STAFF.map(id => permsRole(id, [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak, PermissionFlagsBits.MuteMembers, PermissionFlagsBits.DeafenMembers]))
            ];
        }
        // Vocal militaire restreint
        if (nomCategorie.includes('operations') || nomCategorie.includes('unites speciales') || ['pilotes', 'forces spec', 'commandement'].some(s => nomSalon.includes(s))) {
            return [
                permsBase([], [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect]),
                permsRole(ROLES.RECRUE, [], [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect]),
                ...TOUS_LES_MILITAIRES.map(id => permsRole(id, [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak])),
                ...TOUT_LE_STAFF.map(id => permsRole(id, [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak, PermissionFlagsBits.MuteMembers]))
            ];
        }
        // Vocal public général
        return [
            permsBase([PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak]),
            ...TOUT_LE_STAFF.map(id => permsRole(id, [PermissionFlagsBits.MuteMembers, PermissionFlagsBits.DeafenMembers, PermissionFlagsBits.MoveMembers]))
        ];
    }

    // 7. COMMUNICATION GÉNÉRALE (Défaut pour tout le reste : général, hors-sujet, media, bot, support)
    return [
        permsBase([PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.UseApplicationCommands]),
        permsRole(ROLES.RECRUE, [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]),
        ...TOUT_LE_STAFF.map(id => permsRole(id, [PermissionFlagsBits.ManageMessages, PermissionFlagsBits.MuteMembers, PermissionFlagsBits.DeafenMembers, PermissionFlagsBits.Timeout]))
    ];
}

// ============================================================================
// EXÉCUTION DE LA COMMANDE
// ============================================================================

module.exports = {
    data: new SlashCommandBuilder()
        .setName('fixperms')
        .setDescription('Réinitialise les permissions des salons selon le protocole (Admin uniquement)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .setDMPermission(false),

    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({ content: '[ERREUR] Vous devez posséder la permission Administrateur pour exécuter cette opération.' });
        }

        await interaction.reply({ content: '[EN COURS] Début de la réinitialisation protocolaire des permissions. Cette opération peut prendre une minute. Veuillez patienter...' });

        const guild = interaction.guild;
        const botMember = guild.members.me;

        if (!botMember.permissions.has(PermissionFlagsBits.ManageChannels) || !botMember.permissions.has(PermissionFlagsBits.ManageRoles)) {
            return interaction.editReply({ content: '[ERREUR CRITIQUE] Le bot ne possède pas les permissions "Gérer les salons" et "Gérer les rôles". Opération annulée.' });
        }

        let salonsTraités = 0;
        let erreurs = 0;

        // On filtre pour ne traiter que les salons (texte, vocal, forum), pas les catégories elles-mêmes
        const salons = guild.channels.cache.filter(c => c.type !== ChannelType.GuildCategory);

        for (const salon of salons.values()) {
            try {
                const nouveauModele = obtenirModelePermissions(salon, guild);
                
                // Application des permissions
                await salon.permissionOverwrites.set(nouveauModele, `Réinitialisation protocolaire par la commande /fixperms`);
                salonsTraités++;
                
                // Pause anti-rate limit de l'API Discord (200ms entre chaque salon)
                await new Promise(resolve => setTimeout(resolve, 200));

            } catch (erreur) {
                console.error(`[FIXPERMS] Erreur sur le salon ${salon.name} (${salon.id}) :`, erreur.message);
                erreurs++;
            }
        }

        // Message de fin public
        if (erreurs > 0) {
            await interaction.editReply({ 
                content: `[TERMINÉ AVEC AVERTISSEMENT] Réinitialisation terminée. ${salonsTraités} salons traités avec succès, mais ${erreurs} erreur(s) ont été rencontrées.\n\nVérifiez impérativement que le rôle du bot est situé **au-dessus** de tous les rôles qu'il est censé modifier dans la hiérarchie du serveur.` 
            });
        } else {
            await interaction.editReply({ 
                content: `[SUCCÈS] Réinitialisation terminée avec succès. ${salonsTraités} salons ont été configurés.\n\nLes salons de règles sont désormais en lecture seule, les salons d'opérations sont réservés aux militaires, et les salons de staff sont totalement invisibles pour les membres non autorisés.` 
            });
        }
    }
};
