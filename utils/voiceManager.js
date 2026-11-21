'use strict';

const {
    joinVoiceChannel,
    entersState,
    VoiceConnectionStatus,
    getVoiceConnection
} = require('@discordjs/voice');

const config = require('../config/guildConfig');

const SALON_VOCAL_GENERAL = '1502321987056566412';
const DELAI_RECONNEXION_BASE = 15000;
const DELAI_RECONNEXION_MAX = 120000;

let connection = null;
let tentativeReconnexion = 0;
let surveillanceActive = false;
let enCoursDeConnexion = false;
let connexionReussie = false;

async function connecterAuVocal(guild) {
    if (enCoursDeConnexion) {
        console.log('[VOCAL] Connexion déjà en cours, skip.');
        return false;
    }

    enCoursDeConnexion = true;

    try {
        const salonVocal = guild.channels.cache.get(SALON_VOCAL_GENERAL);
        
        if (!salonVocal) {
            console.error('[VOCAL] Le salon vocal général est introuvable.');
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
            connexionReussie = true;
            enCoursDeConnexion = false;
            return true;
        }

        console.log('[VOCAL] Tentative de connexion au salon vocal général...');

        connection = joinVoiceChannel({
            channelId: SALON_VOCAL_GENERAL,
            guildId: guild.id,
            adapterCreator: guild.voiceAdapterCreator,
            selfDeaf: true,
            selfMute: true
        });

        await entersState(connection, VoiceConnectionStatus.Ready, 60000);
        
        console.log('[VOCAL] Connecté avec succès au salon vocal général.');
        tentativeReconnexion = 0;
        connexionReussie = true;
        
        configurerGestionnaires(guild);
        
        enCoursDeConnexion = false;
        return true;

    } catch (erreur) {
        console.error('[VOCAL] Erreur lors de la connexion vocale :', erreur.message);
        
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
        console.log('[VOCAL] Déconnecté du salon vocal. Tentative de reconnexion...');
        connexionReussie = false;
        
        try {
            await Promise.race([
                entersState(connection, VoiceConnectionStatus.Signalling, 5000),
                entersState(connection, VoiceConnectionStatus.Connecting, 5000)
            ]);
            console.log('[VOCAL] Reconnexion en cours...');
        } catch (erreur) {
            console.log('[VOCAL] Reconnexion impossible, destruction de la connexion.');
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
        console.log('[VOCAL] Connexion vocale détruite.');
        connection = null;
        connexionReussie = false;
        planifierReconnexion(guild);
    });

    connection.on(VoiceConnectionStatus.Connecting, () => {
        console.log('[VOCAL] Connexion en cours...');
    });

    connection.on(VoiceConnectionStatus.Ready, () => {
        console.log('[VOCAL] Connexion vocale active.');
        tentativeReconnexion = 0;
        connexionReussie = true;
    });

    connection.on('error', (erreur) => {
        console.error('[VOCAL] Erreur de connexion vocale :', erreur.message);
    });
}

function planifierReconnexion(guild) {
    const delai = Math.min(
        DELAI_RECONNEXION_BASE * Math.pow(1.5, tentativeReconnexion),
        DELAI_RECONNEXION_MAX
    );
    
    tentativeReconnexion++;
    console.log(`[VOCAL] Tentative de reconnexion ${tentativeReconnexion} dans ${Math.round(delai / 1000)} secondes...`);

    setTimeout(async () => {
        await connecterAuVocal(guild);
    }, delai);
}

function demarrerSurveillance(client) {
    if (surveillanceActive) return;
    
    surveillanceActive = true;
    console.log('[VOCAL] Démarrage de la surveillance de la connexion vocale.');

    setInterval(async () => {
        const guild = client.guilds.cache.get(config.guildId);
        if (!guild) return;

        const connexionActuelle = getVoiceConnection(guild.id);
        
        if (!connexionActuelle || connexionActuelle.state.status === VoiceConnectionStatus.Destroyed) {
            if (connexionReussie) {
                console.log('[VOCAL] Connexion vocale perdue, reconnexion automatique...');
                connexionReussie = false;
            }
            await connecterAuVocal(guild);
        } else if (!connexionReussie && connexionActuelle.state.status === VoiceConnectionStatus.Ready) {
            console.log('[VOCAL] Connexion vocale rétablie.');
            connexionReussie = true;
            tentativeReconnexion = 0;
        }
    }, 30000);
}

function deconnecter() {
    if (connection) {
        try {
            connection.destroy();
            connection = null;
            console.log('[VOCAL] Déconnecté du salon vocal.');
        } catch (erreur) {
            console.error('[VOCAL] Erreur lors de la déconnexion :', erreur.message);
        }
    }
}

module.exports = {
    connecterAuVocal,
    deconnecter,
    demarrerSurveillance
};
