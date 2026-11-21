'use strict';

const {
    joinVoiceChannel,
    entersState,
    VoiceConnectionStatus,
    getVoiceConnection
} = require('@discordjs/voice');

const config = require('../config/guildConfig');

const SALON_VOCAL_GENERAL = '1502321987056566412';
const DELAI_RECONNEXION = 300000; // 5 minutes entre les tentatives
const MAX_TENTATIVES_CONSECUTIVES = 3;

let connection = null;
let tentativeReconnexion = 0;
let surveillanceActive = false;
let enCoursDeConnexion = false;
let derniereTentativeEchec = 0;

async function connecterAuVocal(guild) {
    const maintenant = Date.now();
    
    // Éviter les tentatives trop rapprochées
    if (maintenant - derniereTentativeEchec < DELAI_RECONNEXION) {
        console.log('[VOCAL] Trop tôt pour une nouvelle tentative. Attente de 5 minutes.');
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
            console.error('[VOCAL] Le salon vocal général est introuvable.');
            enCoursDeConnexion = false;
            derniereTentativeEchec = maintenant;
            return false;
        }

        if (salonVocal.type !== 2) {
            console.error('[VOCAL] Le salon spécifié n\'est pas un salon vocal.');
            enCoursDeConnexion = false;
            derniereTentativeEchec = maintenant;
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
        enCoursDeConnexion = false;
        
        configurerGestionnaires(guild);
        
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
        derniereTentativeEchec = maintenant;
        tentativeReconnexion++;
        
        if (tentativeReconnexion >= MAX_TENTATIVES_CONSECUTIVES) {
            console.error(`[VOCAL] ${MAX_TENTATIVES_CONSECUTIVES} tentatives échouées consécutivement. Arrêt des tentatives automatiques.`);
            console.error('[VOCAL] Le bot restera hors du salon vocal. Redémarrez le bot pour réessayer.');
        } else {
            console.log(`[VOCAL] Tentative ${tentativeReconnexion}/${MAX_TENTATIVES_CONSECUTIVES}. Prochaine tentative dans 5 minutes.`);
        }
        
        return false;
    }
}

function configurerGestionnaires(guild) {
    if (!connection) return;

    connection.on(VoiceConnectionStatus.Disconnected, async () => {
        console.log('[VOCAL] Déconnecté du salon vocal.');
        
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
            
            // Planifier une reconnexion après 5 minutes
            setTimeout(async () => {
                await connecterAuVocal(guild);
            }, DELAI_RECONNEXION);
        }
    });

    connection.on(VoiceConnectionStatus.Destroyed, () => {
        console.log('[VOCAL] Connexion vocale détruite.');
        connection = null;
        
        setTimeout(async () => {
            await connecterAuVocal(guild);
        }, DELAI_RECONNEXION);
    });

    connection.on(VoiceConnectionStatus.Connecting, () => {
        console.log('[VOCAL] Connexion en cours...');
    });

    connection.on(VoiceConnectionStatus.Ready, () => {
        console.log('[VOCAL] Connexion vocale active.');
        tentativeReconnexion = 0;
    });

    connection.on('error', (erreur) => {
        console.error('[VOCAL] Erreur de connexion vocale :', erreur.message);
    });
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
            console.log('[VOCAL] Connexion vocale inactive, tentative de reconnexion...');
            await connecterAuVocal(guild);
        }
    }, 300000); // Vérification toutes les 5 minutes
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
