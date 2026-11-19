const config = require('../config/guildConfig');

function hasRoleInList(member, roleIds) {
    return member.roles.cache.some(role => roleIds.includes(role.id));
}

function isAdmin(member) {
    return hasRoleInList(member, config.adminRoles);
}

function canForm(member) {
    return hasRoleInList(member, config.formationRoles);
}

function canSanction(member) {
    return hasRoleInList(member, config.sanctionRoles);
}

function canRapport(member) {
    return hasRoleInList(member, config.rapportRoles);
}

function getHighestGrade(member) {
    let highestPosition = -1;
    let highestGrade = "Aucun grade";

    for (const role of member.roles.cache.values()) {
        const position = role.position;
        if (config.gradesParPosition[position] && position > highestPosition) {
            highestPosition = position;
            highestGrade = config.gradesParPosition[position];
        }
    }

    return highestGrade;
}

function getSpecialites(member) {
    const specialites = [];
    const roleIdToName = {};
    
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
