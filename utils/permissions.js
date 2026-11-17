const config = require('../config/guildConfig');

/**
 * Verifie si un membre possede au moins un role d'une liste donnee
 */
function hasRoleInList(member, roleIds) {
    return member.roles.cache.some(role => roleIds.includes(role.id));
}

/**
 * Verifie les permissions admin
 */
function isAdmin(member) {
    return hasRoleInList(member, config.adminRoles);
}

/**
 * Verifie les permissions de formation
 */
function canForm(member) {
    return hasRoleInList(member, config.formationRoles);
}

/**
 * Verifie les permissions de sanction
 */
function canSanction(member) {
    return hasRoleInList(member, config.sanctionRoles);
}

/**
 * Verifie les permissions de rapport de mission
 */
function canRapport(member) {
    return hasRoleInList(member, config.rapportRoles);
}

/**
 * Recupere le grade le plus eleve d'un membre
 */
function getHighestGrade(member) {
    let highestPosition = -1;
    let highestGrade = 'Aucun grade';

    for (const role of member.roles.cache.values()) {
        const position = role.position;
        if (config.gradesParPosition[position] && position > highestPosition) {
            highestPosition = position;
            highestGrade = config.gradesParPosition[position];
        }
    }

    return highestGrade;
}

/**
 * Recupere toutes les specialites formees d'un membre
 */
function getSpecialites(member) {
    const specialites = [];
    const roleIdToName = {};
    
    // Inverser la map
    for (const [name, id] of Object.entries(config.specialites)) {
        roleIdToName[id] = name;
    }

    for (const role of member.roles.cache.values()) {
        if (roleIdToName[role.id]) {
            specialites.push(roleIdToName[role.id]);
        }
    }

    return specialites;
}

module.exports = {
    isAdmin,
    canForm,
    canSanction,
    canRapport,
    getHighestGrade,
    getSpecialites,
    hasRoleInList
};
