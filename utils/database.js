'use strict';

const fs = require('fs');
const path = require('path');

const DOSSIER_DONNEES = path.join(__dirname, '..', 'data');
const FICHIER_BDD = path.join(DOSSIER_DONNEES, 'database.json');

function structureInitiale() {
    return {
        automod: {
            actif: true,
            spam: {
                actif: true,
                maxMessages: 5,
                periode: 5000,
                action: 'mute',
                dureeMute: 60
            },
            liens: {
                actif: true,
                whitelist: ['discord.gg/division-vanguard'],
                action: 'delete'
            },
            mentions: {
                actif: true,
                maxMentions: 5,
                action: 'mute',
                dureeMute: 60
            },
            motsInterdits: {
                actif: true,
                mots: [],
                action: 'delete'
            },
            caps: {
                actif: true,
                pourcentageMax: 70,
                longueurMin: 10,
                action: 'delete'
            },
            exemptions: []
        },
        antiraid: {
            actif: true,
            detection: {
                maxJoins: 10,
                periode: 30000,
                action: 'lockdown'
            },
            comptesRecents: {
                actif: true,
                ageMin: 86400000,
                action: 'kick'
            },
            lockdown: {
                actif: false,
                salonsVerrouilles: []
            },
            alertes: true
        },
        sanctions: [],
        statistiques: {
            messagesSupprimes: 0,
            membresMutes: 0,
            membresKicks: 0,
            membresBannis: 0,
            raidsDetectes: 0
        }
    };
}

function charger() {
    try {
        if (!fs.existsSync(DOSSIER_DONNEES)) {
            fs.mkdirSync(DOSSIER_DONNEES, { recursive: true });
        }
        if (!fs.existsSync(FICHIER_BDD)) {
            fs.writeFileSync(FICHIER_BDD, JSON.stringify(structureInitiale(), null, 2), 'utf8');
            return structureInitiale();
        }
        const brut = JSON.parse(fs.readFileSync(FICHIER_BDD, 'utf8'));
        return { ...structureInitiale(), ...brut };
    } catch (erreur) {
        console.error('[BDD] Erreur de lecture :', erreur.message);
        return structureInitiale();
    }
}

function sauvegarder(donnees) {
    try {
        if (!fs.existsSync(DOSSIER_DONNEES)) {
            fs.mkdirSync(DOSSIER_DONNEES, { recursive: true });
        }
        const temporaire = `${FICHIER_BDD}.tmp`;
        fs.writeFileSync(temporaire, JSON.stringify(donnees, null, 2), 'utf8');
        fs.renameSync(temporaire, FICHIER_BDD);
    } catch (erreur) {
        console.error('[BDD] Erreur d\'écriture :', erreur.message);
    }
}

function getAutomod() {
    const donnees = charger();
    return donnees.automod;
}

function setAutomod(config) {
    const donnees = charger();
    donnees.automod = { ...donnees.automod, ...config };
    sauvegarder(donnees);
}

function getAntiraid() {
    const donnees = charger();
    return donnees.antiraid;
}

function setAntiraid(config) {
    const donnees = charger();
    donnees.antiraid = { ...donnees.antiraid, ...config };
    sauvegarder(donnees);
}

function ajouterSanction(sanction) {
    const donnees = charger();
    donnees.sanctions.unshift({
        ...sanction,
        id: Date.now(),
        date: new Date().toISOString()
    });
    donnees.sanctions = donnees.sanctions.slice(0, 1000);
    sauvegarder(donnees);
}

function incrementerStatistique(cle) {
    const donnees = charger();
    if (donnees.statistiques[cle] !== undefined) {
        donnees.statistiques[cle]++;
        sauvegarder(donnees);
    }
}

function getStatistiques() {
    const donnees = charger();
    return donnees.statistiques;
}

module.exports = {
    charger,
    sauvegarder,
    getAutomod,
    setAutomod,
    getAntiraid,
    setAntiraid,
    ajouterSanction,
    incrementerStatistique,
    getStatistiques
};
