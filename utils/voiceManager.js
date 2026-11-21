'use strict';

const {
    joinVoiceChannel,
    entersState,
    getVoiceConnection,
    VoiceConnectionStatus,
    generateDependencyReport
} = require('@discordjs/voice');

const { ChannelType, PermissionFlagsBits } = require('discord.js');

const SALON_VOCAL_ID = '1502321987056566412';
const GUILD_ID = '1501671610879312036';

const DELAI_BASE = 5000;
const DELAI_PLAFOND = 60000;
const INTERVALLE_SURVEILLANCE = 45000;

let clientDiscord = null;
let connexion = null;
let connexionEnCours = false;
let arretDemande = false;
let tentatives = 0;
let minuteurReconnexion = null;
let minuteurSurveillance = null;
let gestionnairesInstalles = false;

function journal(message) {
    console.log(`[VOCAL] ${message}`);
}

function nettoyerConnexion() {
    if (!connexion) return;

    try {
        connexion.removeAllListeners();
        if (connexion.state.status !== VoiceConnectionStatus.Destroyed) {
            connexion.destroy();
        }
    } catch (erreur) {
        journal(`Nettoyage : ${erreur.message}`);
    }

    connexion = null;
    gestionnairesInstalles = false;
}

function programmerReconnexion() {
    if (arretDemande || minuteurReconnexion) return;

    const delai = Math.min(DELAI_BASE * Math.pow(2, tentatives), DELAI_PLAFOND);
    tentatives += 1;

    journal(`Nouvelle tentative dans ${Math.round(delai / 1000)} secondes (essai ${tentatives}).`);

    minuteurReconnexion = setTimeout(() => {
        minuteurReconnexion = null;
        connecter();
    }, delai);
}

function installerGestionnaires() {
    if (!connexion || gestionnairesInstalles) return;
    gestionnairesInstalles = true;

    connexion.on('stateChange', (ancien, nouveau) => {
        journal(`État : ${ancien.status} vers ${nouveau.status}.`);

        if (nouveau.status === VoiceConnectionStatus.Ready) {
            tentatives = 0;
            journal('Connexion vocale établie et stable.');
        }
    });

    connexion.on(VoiceConnectionStatus.Disconnected, async (ancien, nouveau) => {
        journal(`Déconnexion. Raison : ${nouveau?.reason ?? 'non précisée'}. Code : ${nouveau?.closeCode ?? 'aucun'}.`);

        if (arretDemande) return;

        try {
            await Promise.race([
                entersState(connexion, VoiceConnectionStatus.Signalling, 5000),
                entersState(connexion, VoiceConnectionStatus.Connecting, 5000)
            ]);
            journal('Reprise de la session vocale en cours.');
        } catch {
            journal('Reprise impossible. Reconstruction de la connexion.');
            nettoyerConnexion();
            programmerReconnexion();
        }
    });

    connexion.on(VoiceConnectionStatus.Destroyed, () => {
        journal('Connexion détruite.');
        connexion = null;
        gestionnairesInstalles = false;
        programmerReconnexion();
    });

    connexion.on('error', (erreur) => {
        journal(`Erreur : ${erreur.message}`);
    });
}

async function connecter() {
    if (arretDemande || connexionEnCours) return false;

    connexionEnCours = true;

    try {
        const guild = clientDiscord?.guilds.cache.get(GUILD_ID)
            || await clientDiscord?.guilds.fetch(GUILD_ID).catch(() => null);

        if (!guild) {
            journal('Serveur introuvable.');
            return false;
        }

        const salon = guild.channels.cache.get(SALON_VOCAL_ID)
            || await guild.channels.fetch(SALON_VOCAL_ID).catch(() => null);

        if (!salon) {
            journal(`Le salon ${SALON_VOCAL_ID} est introuvable.`);
            return false;
        }

        if (salon.type !== ChannelType.GuildVoice && salon.type !== ChannelType.GuildStageVoice) {
            journal(`Le salon « ${salon.name} » n'est pas un salon vocal.`);
            return false;
        }

        const droits = salon.permissionsFor(guild.members.me);

        if (!droits?.has([PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect])) {
            journal(`Permissions insuffisantes dans « ${salon.name} » : Voir le salon et Se connecter sont requises.`);
            return false;
        }

        const existante = getVoiceConnection(guild.id);

        if (existante && existante.state.status !== VoiceConnectionStatus.Destroyed) {
            connexion = existante;
            installerGestionnaires();

            if (existante.joinConfig.channelId !== SALON_VOCAL_ID) {
                journal('Mauvais salon détecté. Déplacement vers le salon général.');
                existante.rejoin({ channelId: SALON_VOCAL_ID, selfDeaf: true, selfMute: true });
            }

            if (existante.state.status === VoiceConnectionStatus.Ready) {
                tentatives = 0;
                return true;
            }
        } else {
            journal(`Connexion au salon « ${salon.name} ».`);

            connexion = joinVoiceChannel({
                channelId: SALON_VOCAL_ID,
                guildId: guild.id,
                adapterCreator: guild.voiceAdapterCreator,
                selfDeaf: true,
                selfMute: true,
                debug: process.env.VOCAL_DEBUG === 'true'
            });

            installerGestionnaires();
        }

        await entersState(connexion, VoiceConnectionStatus.Ready, 30000);
        tentatives = 0;
        return true;

    } catch (erreur) {
        journal(`Échec de la poignée de main vocale : ${erreur.message}`);
        nettoyerConnexion();
        programmerReconnexion();
        return false;

    } finally {
        connexionEnCours = false;
    }
}

function initialiser(client) {
    clientDiscord = client;
    arretDemande = false;

    console.log('========== RAPPORT DE DÉPENDANCES VOCALES ==========');
    console.log(generateDependencyReport());
    console.log('====================================================');

    connecter();

    if (minuteurSurveillance) clearInterval(minuteurSurveillance);

    minuteurSurveillance = setInterval(() => {
        if (arretDemande || connexionEnCours) return;

        const actuelle = getVoiceConnection(GUILD_ID);

        if (!actuelle || actuelle.state.status === VoiceConnectionStatus.Destroyed) {
            journal('Surveillance : aucune connexion active. Reconnexion.');
            nettoyerConnexion();
            connecter();
            return;
        }

        if (actuelle.state.status === VoiceConnectionStatus.Ready
            && actuelle.joinConfig.channelId !== SALON_VOCAL_ID) {
            journal('Surveillance : mauvais salon. Correction.');
            actuelle.rejoin({ channelId: SALON_VOCAL_ID, selfDeaf: true, selfMute: true });
        }
    }, INTERVALLE_SURVEILLANCE);

    journal('Surveillance vocale activée.');
}

function arreter() {
    arretDemande = true;

    if (minuteurReconnexion) {
        clearTimeout(minuteurReconnexion);
        minuteurReconnexion = null;
    }

    if (minuteurSurveillance) {
        clearInterval(minuteurSurveillance);
        minuteurSurveillance = null;
    }

    nettoyerConnexion();
    journal('Service vocal arrêté proprement.');
}

module.exports = { initialiser, connecter, arreter };
