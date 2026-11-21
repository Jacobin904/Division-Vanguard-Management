'use strict';

const {
    joinVoiceChannel,
    entersState,
    VoiceConnectionStatus,
    getVoiceConnection
} = require('@discordjs/voice');

const config = require('../config/guildConfig');

const SALON_VOCAL_GENERAL = '1502321987056566412';
const DELAI_RECONNEXION_BASE = 10000;
const DELAI_RECONNEXION_MAX = 60000;

let connection = null;
let tentativeReconnexion = 0;
let surveillanceActive = false;
let enCoursDeConnexion = false;

async function connecterAuVocal(guild) {
    if (enCoursDeConnexion) {
        console.log('[VOICE] Connexion déjà en cours, skip.');
        return false;
    }

    enCoursDeConnexion = true;

    try {
        const salonVocal = guild.channels.cache.get(SALON_VOCAL_GENERAL);
        
        if (!salonVocal) {
            console.error('[VOICE] Le salon vocal général est introuvable.');
            enCoursDeConnexion = false;
            return false;
        }

        if (salonVocal.type !== 2) {
            console.error('[VOICE] Le salon spécifié n\'est pas un salon vocal.');
            enCoursDeConnexion = false;
            return false;
        }

        const connexionExistante = getVoiceConnection(guild.id);
        if (connexionExistante && connexionExistante.state.status !== VoiceConnectionStatus.Destroyed) {
            console.log('[VOICE] Déjà connecté au salon vocal.');
            connection = connexionExistante;
            enCoursDeConnexion = false;
            return true;
        }

        console.log('[VOICE] Connexion au salon vocal général en cours...');

        connection = joinVoiceChannel({
            channelId: SALON_VOCAL_GENERAL,
            guildId: guild.id,
            adapterCreator: guild.voiceAdapterCreator,
            selfDeaf: true,
            selfMute: true
        });

        await entersState(connection, VoiceConnectionStatus.Ready, 30000);
        
        console.log('[VOICE] Connecté avec succès au salon vocal général.');
        tentativeReconnexion = 0;
        
        configurerGestionnaires(guild);
        
        enCoursDeConnexion = false;
        return true;

    } catch (erreur) {
        console.error('[VOICE] Erreur lors de la connexion vocale :', erreur.message);
        
        if (connection) {
            try {
                connection.destroy();
            } catch (e) {
                // Ignorer
            }
            connection = null;
        }
        
        enCoursDeConnexion = false;
        return false;
    }
}

function configurerGestionnaires(guild) {
    if (!connection) return;

    connection.on(VoiceConnectionStatus.Disconnected, async () => {
        console.log('[VOICE] Déconnecté du salon vocal.');
        
        try {
            await Promise.race([
                entersState(connection, VoiceConnectionStatus.Signalling, 5000),
                entersState(connection, VoiceConnectionStatus.Connecting, 5000)
            ]);
            console.log('[VOICE] Reconnexion en cours...');
        } catch (erreur) {
            console.log('[VOICE] Reconnexion impossible, destruction de la connexion.');
            try {
                connection.destroy();
            } catch (e) {
                // Ignorer
            }
            connection = null;
            
            planifierReconnexion(guild);
        }
    });

    connection.on(VoiceConnectionStatus.Destroyed, () => {
        console.log('[VOICE] Connexion vocale détruite.');
        connection = null;
        planifierReconnexion(guild);
    });

    connection.on(VoiceConnectionStatus.Connecting, () => {
        console.log('[VOICE] Connexion en cours...');
        tentativeReconnexion = 0;
    });

    connection.on(VoiceConnectionStatus.Ready, () => {
        console.log('[VOICE] Connexion vocale active.');
        tentativeReconnexion = 0;
    });

    connection.on('error', (erreur) => {
        console.error('[VOICE] Erreur de connexion vocale :', erreur.message);
    });
}

function planifierReconnexion(guild) {
    const delai = Math.min(
        DELAI_RECONNEXION_BASE * Math.pow(2, tentativeReconnexion),
        DELAI_RECONNEXION_MAX
    );
    
    tentativeReconnexion++;
    console.log(`[VOICE] Tentative de reconnexion ${tentativeReconnexion} dans ${delai / 1000} secondes...`);

    setTimeout(async () => {
        await connecterAuVocal(guild);
    }, delai);
}

function demarrerSurveillance(client) {
    if (surveillanceActive) return;
    
    surveillanceActive = true;
    console.log('[VOICE] Démarrage de la surveillance de la connexion vocale.');

    setInterval(async () => {
        const guild = client.guilds.cache.get(config.guildId);
        if (!guild) return;

        const connexionActuelle = getVoiceConnection(guild.id);
        
        if (!connexionActuelle || connexionActuelle.state.status === VoiceConnectionStatus.Destroyed) {
            console.log('[VOICE] Connexion vocale inactive, reconnexion automatique...');
            await connecterAuVocal(guild);
        }
    }, 60000);
}

function deconnecter() {
    if (connection) {
        try {
            connection.destroy();
            connection = null;
            console.log('[VOICE] Déconnecté du salon vocal.');
        } catch (erreur) {
            console.error('[VOICE] Erreur lors de la déconnexion :', erreur.message);
        }
    }
}

module.exports = {
    connecterAuVocal,
    deconnecter,
    demarrerSurveillance
};
