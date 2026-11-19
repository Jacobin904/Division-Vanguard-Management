'use strict';

const { PermissionFlagsBits } = require('discord.js');
const config = require('../config/guildConfig');

function possedeUnRole(membre, identifiants) {
    if (!membre?.roles?.cache) return false;
    return membre.roles.cache.some((role) => identifiants.includes(role.id));
}

function estAdministrateur(membre) {
    if (!membre) return false;
    if (membre.permissions?.has?.(PermissionFlagsBits.Administrator)) return true;
    return possedeUnRole(membre, config.adminRoles);
}

function peutFormer(membre) {
    return estAdministrateur(membre) || possedeUnRole(membre, config.formationRoles);
}

function peutSanctionner(membre) {
    return estAdministrateur(membre) || possedeUnRole(membre, config.sanctionRoles);
}

function peutRapporter(membre) {
    return estAdministrateur(membre) || possedeUnRole(membre, config.rapportRoles);
}

/**
 * Détermine le grade le plus élevé à partir des identifiants de rôle.
 * Cette méthode reste exacte même après une réorganisation des positions.
 */
function gradeLePlusEleve(membre) {
    if (!membre?.roles?.cache) return 'Grade non renseigné';
    for (const grade of config.grades) {
        if (membre.roles.cache.has(grade.id)) return grade.nom;
    }
    return 'Militaire du rang';
}

function specialitesObtenues(membre) {
    if (!membre?.roles?.cache) return [];
    const obtenues = [];
    for (const [intitule, identifiant] of Object.entries(config.specialites)) {
        if (membre.roles.cache.has(identifiant)) obtenues.push(intitule);
    }
    return obtenues.sort((a, b) => a.localeCompare(b, 'fr'));
}

/**
 * Vérifie qu'un membre appartient à l'encadrement habilité pour un ticket.
 */
function peutGererTicket(membre, type, categorie) {
    if (estAdministrateur(membre)) return true;
    const liste =
        type === 'rdv'
            ? config.tickets.encadrement.rdv
            : categorie === 'armee'
                ? config.tickets.encadrement.supportArmee
                : config.tickets.encadrement.supportStaff;
    return possedeUnRole(membre, liste);
}

// Alias conservés pour la compatibilité avec les commandes existantes.
module.exports = {
    isAdmin: estAdministrateur,
    canForm: peutFormer,
    canSanction: peutSanctionner,
    canRapport: peutRapporter,
    getHighestGrade: gradeLePlusEleve,
    getSpecialites: specialitesObtenues,
    hasRoleInList: possedeUnRole,
    estAdministrateur,
    peutGererTicket
};
