// Configuration specifique au serveur Division Vanguard
module.exports = {
    guildId: '1501671610879312036',

    // Salons
    channels: {
        logsBot: '1502321982082125995',
        carteIdentite: '1568436661635911760',
        resultatsFormation: '1502321965938118686',
        registresPromotions: '1502321973076820163',
        rapportsMission: '1502321948582219816',
        debriefMission: '1502321949542453360',
        sanctionsInternes: '1502321980387496097',
        sanctionsDiscipl: '1502321975350263838',
        botCommandes: '1502321945826295927'
    },

    // Roles d'administration (peuvent utiliser TOUTES les commandes)
    adminRoles: [
        '1502329914224017710', // Fondation
        '1502321922590113892', // Administration
        '1502321921113460827', // Admin Interne
        '1502321894462980257', // Admin Externe
        '1502321920652345484'  // Directeur
    ],

    // Roles qui peuvent former des membres (officiers generaux et superieurs)
    formationRoles: [
        '1502329914224017710', // Fondation
        '1502321922590113892', // Administration
        '1502321921113460827', // Admin Interne
        '1502321894462980257', // Admin Externe
        '1502321920652345484', // Directeur
        '1502321913169707089', // General Armee
        '1502321912314073251', // General de Corps Armee
        '1502321911433138387', // General de Division
        '1502321910665580745', // General de Brigade
        '1502321909596033156', // Colonel
        '1502321908966887424', // Lieutenant-Colonel
        '1502321908182552647'  // Commandant
    ],

    // Roles qui peuvent sanctionner (officiers + sous-officiers)
    sanctionRoles: [
        '1502329914224017710', // Fondation
        '1502321922590113892', // Administration
        '1502321921113460827', // Admin Interne
        '1502321894462980257', // Admin Externe
        '1502321920652345484', // Directeur
        '1502321913169707089', // General Armee
        '1502321912314073251', // General de Corps Armee
        '1502321911433138387', // General de Division
        '1502321910665580745', // General de Brigade
        '1502321909596033156', // Colonel
        '1502321908966887424', // Lieutenant-Colonel
        '1502321908182552647', // Commandant
        '1502321907431637132', // Capitaine
        '1502321906353701025', // Lieutenant
        '1569021434125357056', // Sous-lieutenant
        '1502321905212985475', // Aspirant
        '1502321904026124438', // Major
        '1502321903333806225', // Adjudant-Chef
        '1502321902020984842'  // Adjudant
    ],

    // Roles qui peuvent faire des rapports de mission (tous les officiers et sous-officiers)
    rapportRoles: [
        '1502329914224017710', // Fondation
        '1502321922590113892', // Administration
        '1502321921113460827', // Admin Interne
        '1502321894462980257', // Admin Externe
        '1502321920652345484', // Directeur
        '1502321913169707089', '1502321912314073251', '1502321911433138387',
        '1502321910665580745', '1502321909596033156', '1502321908966887424',
        '1502321908182552647', '1502321907431637132', '1502321906353701025',
        '1569021434125357056', '1502321905212985475', '1502321904026124438',
        '1502321903333806225', '1502321902020984842', '1502321900779737200',
        '1502321899751866550'  // Sergent
    ],

    // Liste complete des specialites de formation (nom affiche => ID du role)
    specialites: {
        'Saut en Parachute': '1503141271496032296',
        'CQB': '1503141433295765625',
        'Arme Petite Distance': '1503141769490206761',
        'Arme Moyenne Distance': '1503141911156887613',
        'Arme Longue Distance': '1503142034876272842',
        'Conducteur': '1503142187892871351',
        'Pilote Helicoptere': '1503142294650486855',
        'Pilote Avion': '1503142608988409956',
        'Medic': '1503142853507813589',
        'Tir de Precision': '1503142974933041293',
        'Breacher': '1503143197218570290',
        'Explosif': '1503143300306309251',
        'Radio': '1503143421890793573',
        'Navigateur': '1503143524009246930',
        'Reconnaissance': '1503143690724708382',
        'Survie': '1503143785939599501',
        'Otage': '1503143881108357255',
        'Instructeur': '1503144132628185251',
        'Force Speciale': '1503144232918188233',
        'Night Ops': '1503144389894213765',
        'Urban Warfare': '1503144543015669850',
        'Rappel': '1503144640264802454',
        'Amphibie': '1503144729083117631',
        'Drone': '1503144951024849027',
        'Sniper': '1503145270441935038',
        'Marksman': '1503145376276938823',
        'Assault': '1503145484578197504',
        'Mitrailleur': '1503145570884255774',
        'Anti-Tank': '1503145819757351043',
        'Anti-Air': '1503145916247314573',
        'Escorte': '1503146012624027678',
        'Commando': '1503146185752576081',
        'Raid': '1503146281739223341',
        'Securite Rapprochee': '1503146439713226923',
        'Infiltration': '1503146539932188773',
        'Exfiltration': '1503146646156873748'
    },

    // Grades par position (pour determiner le grade le plus haut d'un membre)
    gradesParPosition: {
        91: 'CIRFA',
        88: 'Fondation',
        86: 'Admin Interne',
        85: 'Admin Externe',
        84: 'Division Vanguard Management',
        82: 'General Armee',
        81: 'General de Corps Armee',
        80: 'General de Division',
        79: 'General de Brigade',
        77: 'Colonel',
        76: 'Lieutenant-Colonel',
        75: 'Commandant',
        73: 'Capitaine',
        72: 'Lieutenant',
        71: 'Sous-lieutenant',
        70: 'Aspirant',
        68: 'Major',
        67: 'Adjudant-Chef',
        66: 'Adjudant',
        65: 'Sergent-Chef',
        64: 'Sergent',
        62: 'Caporal-chef de 1re classe',
        61: 'Caporal-chef',
        60: 'Caporal',
        59: 'Soldat de 1re classe',
        58: 'Soldat',
        57: 'Engage Volontaire Initial'
    }
};
