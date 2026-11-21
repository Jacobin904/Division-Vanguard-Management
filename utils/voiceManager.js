'use strict';

const {
    joinVoiceChannel,
    entersState,
    VoiceConnectionStatus,
    getVoiceConnection
} = require('@discordjs/voice');

const config = require('../config/guildConfig');

const SALON_VOCAL_GENERAL = '1502321987056566412';
const MAX_TENTATIVES = 3;

let connection = null;
let tentativeReconnexion = 0;
let surveillanceActive = false;
let enCoursDeConnexion = false;
let arretTentatives = false;

async function connecterAuVocal(guild) {
    if (arretTentatives) {
        console.log('[VOCAL] Tentatives arrêtées après échecs multiples. Le vocal ne sera pas activé.');
        return false;
    }

    if (enCoursDeConnexion) {
        console.log('[VOCAL] Connexion déjà en cours, skip.');
        return false;
    }

    enCoursDeConnexion = true;

    try {
        const salonVocal = guild.channels.cache.get(SALON_VOCAL_GENERAL);
        
        if (!salonVocal) {
            console.error('[VOCAL] Salon vocal introuvable.');
            enCoursDeConnexion = false;
            return false;
        }

        if (salonVocal.type !== 2) {
            console.error('[VOCAL] Le salon spécifié n\'est pas un salon vocal.');
            enCoursDeConnexion = false;
            return false;
        }

        const connexionExistante = getVoiceConnection(guild.id);
        if (connexionExistante && connexionExistante.state.status !== VoiceConnectionStatus.Destroyed) {
            console.log('[VOCAL] Déjà connecté au salon vocal.');
            connection = connexionExistante;
            enCoursDeConnexion = false;
            tentativeReconnexion = 0;
            return true;
        }

        console.log('[VOCAL] Tentative de connexion au salon vocal...');

        connection = joinVoiceChannel({
            channelId: SALON_VOCAL_GENERAL,
            guildId: guild.id,
            adapterCreator: guild.voiceAdapterCreator,
            selfDeaf: true,
            selfMute: true
        });

        await entersState(connection, VoiceConnectionStatus.Ready, 30000);
        
        console.log('[VOCAL] Connecté avec succès au salon vocal.');
        tentativeReconnexion = 0;
        enCoursDeConnexion = false;
        
        configurerGestionnaires(guild);
        
        return true;

    } catch (erreur) {
        console.error('[VOCAL] Erreur lors de la connexion vocale :', erreur.message);
        
        if (connection) {
            try {
                connection.destroy();
            } catch (e) {}
            connection = null;
        }
        
        enCoursDeConnexion = false;
        tentativeReconnexion++;
        
        if (tentativeReconnexion >= MAX_TENTATIVES) {
            console.error(`[VOCAL] ${MAX_TENTATIVES} tentatives échouées. Arrêt des tentatives automatiques.`);
            arretTentatives = true;
        }
        
        return false;
    }
}

function configurerGestionnaires(guild) {
    if (!connection) return;

    connection.on(VoiceConnectionStatus.Disconnected, async () => {
        console.log('[VOCAL] Déconnecté du salon vocal.');
        
        if (arretTentatives) {
            console.log('[VOCAL] Pas de reconnexion automatique (tentatives arrêtées).');
            return;
        }

        try {
            await Promise.race([
                entersState(connection, VoiceConnectionStatus.Signalling, 5000),
                entersState(connection, VoiceConnectionStatus.Connecting, 5000)
            ]);
            console.log('[VOCAL] Reconnexion en cours...');
        } catch (erreur) {
            console.log('[VOCAL] Reconnexion impossible.');
            try {
                connection.destroy();
            } catch (e) {}
            connection = null;
            
            tentativeReconnexion++;
            if (tentativeReconnexion >= MAX_TENTATIVES) {
                arretTentatives = true;
                console.error('[VOCAL] Arrêt des tentatives après reconnexion échouée.');
            }
        }
    });

    connection.on(VoiceConnectionStatus.Destroyed, () => {
        console.log('[VOCAL] Connexion vocale détruite.');
        connection = null;
    });

    connection.on(VoiceConnectionStatus.Ready, () => {
        console.log('[VOCAL] Connexion vocale active.');
        tentativeReconnexion = 0;
    });

    connection.on('error', (erreur) => {
        console.error('[VOCAL] Erreur :', erreur.message);
    });
}

function demarrerSurveillance(client) {
    if (surveillanceActive) return;
    
    surveillanceActive = true;
    console.log('[VOCAL] Surveillance activée (vérification toutes les 10 minutes).');

    setInterval(async () => {
        if (arretTentatives) {
            return;
        }

        const guild = client.guilds.cache.get(config.guildId);
        if (!guild) return;

        const connexionActuelle = getVoiceConnection(guild.id);
        
        if (!connexionActuelle || connexionActuelle.state.status === VoiceConnectionStatus.Destroyed) {
            console.log('[VOCAL] Connexion inactive, tentative de reconnexion...');
            await connecterAuVocal(guild);
        }
    }, 600000);
}

function deconnecter() {
    if (connection) {
        try {
            connection.destroy();
            connection = null;
            console.log('[VOCAL] Déconnecté.');
        } catch (erreur) {
            console.error('[VOCAL] Erreur déconnexion :', erreur.message);
        }
    }
}

module.exports = {
    connecterAuVocal,
    deconnecter,
    demarrerSurveillance
};
