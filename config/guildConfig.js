'use strict';

/**
 * Configuration officielle — Division Vanguard
 * Tous les identifiants proviennent du registre du serveur.
 * Aucune donnée sensible ne doit figurer dans ce fichier.
 */
module.exports = {
    guildId: '1501671610879312036',

    channels: {
        logsBot: '1502321982082125995',
        ticketsInternes: '1502321983633887234',
        carteIdentite: '1568436661635911760',
        resultatsFormation: '1502321965938118686',
        registresPromotions: '1502321973076820163',
        rapportsMission: '1502321948582219816',
        debriefMission: '1502321949542453360',
        sanctionsInternes: '1502321980387496097',
        sanctionsDiscipl: '1502321975350263838',
        botCommandes: '1502321945826295927',

        // Salons de destination des interfaces de ticket.
        ticketRdvChannel: '1503487120332034089',
        ticketSupportChannel: '1566930356098310307'
    },

    tickets: {
        /**
         * Catégorie parente des salons de ticket.
         * La valeur null active la détection automatique : le bot utilise la
         * catégorie du salon de destination, puis se rabat sur une création
         * sans catégorie si aucune catégorie valide n'est disponible.
         * Renseigner un identifiant de catégorie (type 4) pour forcer l'emplacement.
         */
        categoryId: null,

        // Nombre maximal de tickets ouverts simultanément par membre.
        maxOuvertsParMembre: 1,

        // Nombre maximal de messages retranscrits lors de la clôture.
        limiteTranscription: 500,

        // Délai avant suppression du salon, en secondes.
        delaiSuppression: 8,

        // Rôles habilités à prendre en charge et à clôturer un ticket.
        encadrement: {
            rdv: [
                '1502329914224017710', // Fondation
                '1502321921113460827', // Admin interne
                '1502321894462980257', // Manager de communauté
                '1503124531391365203', // CIRFA
                '1507547514264485969'  // CIRFA (spécialité)
            ],
            supportStaff: [
                '1502329914224017710',
                '1502321921113460827',
                '1502321894462980257',
                '1502321920652345484'  // Directeur
            ],
            supportArmee: [
                '1502329914224017710',
                '1502321921113460827',
                '1502321920652345484',
                '1502321913169707089', // Général d'armée
                '1502321912314073251', // Général de corps d'armée
                '1502321911433138387', // Général de division
                '1502321910665580745', // Général de brigade
                '1502321909596033156', // Colonel
                '1502321908966887424', // Lieutenant-colonel
                '1502321908182552647'  // Commandant
            ]
        }
    },

    // Rôles disposant de l'ensemble des prérogatives.
    adminRoles: [
        '1502329914224017710',
        '1502321921113460827',
        '1502321894462980257',
        '1502321920652345484'
    ],

    // Rôles habilités à certifier une spécialité.
    formationRoles: [
        '1502329914224017710',
        '1502321921113460827',
        '1502321894462980257',
        '1502321920652345484',
        '1503124531391365203',
        '1507547514264485969',
        '1502321913169707089',
        '1502321912314073251',
        '1502321911433138387',
        '1502321910665580745',
        '1502321909596033156',
        '1502321908966887424',
        '1502321908182552647',
        '1503144132628185251' // Formé instructeur
    ],

    // Rôles habilités à prononcer une sanction.
    sanctionRoles: [
        '1502329914224017710',
        '1502321921113460827',
        '1502321894462980257',
        '1502321920652345484',
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
        '1502321905212985475',
        '1502321904026124438',
        '1502321903333806225',
        '1502321902020984842'
    ],

    // Rôles habilités à rédiger un compte rendu de mission.
    rapportRoles: [
        '1502329914224017710',
        '1502321921113460827',
        '1502321894462980257',
        '1502321920652345484',
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
        '1502321905212985475',
        '1502321904026124438',
        '1502321903333806225',
        '1502321902020984842',
        '1502321900779737200',
        '1502321899751866550'
    ],

    /**
     * Hiérarchie militaire, du grade le plus élevé au plus modeste.
     * La résolution s'effectue par identifiant de rôle afin de rester fiable
     * même lorsque les positions sont réorganisées sur le serveur.
     */
    grades: [
        { id: '1502329914224017710', nom: 'Fondation' },
        { id: '1502321921113460827', nom: 'Administrateur interne' },
        { id: '1502321894462980257', nom: 'Manager de communauté' },
        { id: '1502321920652345484', nom: 'Directeur' },
        { id: '1502321913169707089', nom: "Général d'armée" },
        { id: '1502321912314073251', nom: "Général de corps d'armée" },
        { id: '1502321911433138387', nom: 'Général de division' },
        { id: '1502321910665580745', nom: 'Général de brigade' },
        { id: '1502321909596033156', nom: 'Colonel' },
        { id: '1502321908966887424', nom: 'Lieutenant-colonel' },
        { id: '1502321908182552647', nom: 'Commandant' },
        { id: '1502321907431637132', nom: 'Capitaine' },
        { id: '1502321906353701025', nom: 'Lieutenant' },
        { id: '1569021434125357056', nom: 'Sous-lieutenant' },
        { id: '1502321905212985475', nom: 'Aspirant' },
        { id: '1502321904026124438', nom: 'Major' },
        { id: '1502321903333806225', nom: 'Adjudant-chef' },
        { id: '1502321902020984842', nom: 'Adjudant' },
        { id: '1502321900779737200', nom: 'Sergent-chef' },
        { id: '1502321899751866550', nom: 'Sergent' },
        { id: '1569022303034146886', nom: 'Caporal-chef de première classe' },
        { id: '1502321898350972980', nom: 'Caporal-chef' },
        { id: '1502321897147203654', nom: 'Caporal' },
        { id: '1569022882288378017', nom: 'Soldat de première classe' },
        { id: '1502321896212009001', nom: 'Soldat' },
        { id: '1502472415127666780', nom: 'Engagé volontaire initial' }
    ],

    // Spécialités certifiables : intitulé affiché et rôle attribué.
    specialites: {
        'Saut en parachute': '1503141271496032296',
        'Combat en zone close (CQB)': '1503141433295765625',
        'Arme de petite distance': '1503141769490206761',
        'Arme de moyenne distance': '1503141911156887613',
        'Arme de longue distance': '1503142034876272842',
        'Conducteur': '1503142187892871351',
        'Pilote hélicoptère': '1503142294650486855',
        'Pilote avion': '1503142608988409956',
        'Médecin': '1503142853507813589',
        'Tir de précision': '1503142974933041293',
        'Breacher': '1503143197218570290',
        'Explosif': '1503143300306309251',
        'Radio': '1503143421890793573',
        'Navigateur': '1503143524009246930',
        'Reconnaissance': '1503143690724708382',
        'Survie': '1503143785939599501',
        'Gestion de prise d otage': '1503143881108357255',
        'Instructeur': '1503144132628185251',
        'Forces spéciales': '1503144232918188233',
        'Opérations nocturnes': '1503144389894213765',
        'Combat urbain': '1503144543015669850',
        'Rappel': '1503144640264802454',
        'Amphibie': '1503144729083117631',
        'Drone': '1503144951024849027',
        'Sniper': '1503145270441935038',
        'Marksman': '1503145376276938823',
        'Assaut': '1503145484578197504',
        'Mitrailleur': '1503145570884255774',
        'Anti-char': '1503145819757351043',
        'Antiaérien': '1503145916247314573',
        'Escorte': '1503146012624027678',
        'Commando': '1503146185752576081',
        'Raid': '1503146281739223341',
        'Sécurité rapprochée': '1503146439713226923',
        'Infiltration': '1503146539932188773',
        'Exfiltration': '1503146646156873748'
    }
};
