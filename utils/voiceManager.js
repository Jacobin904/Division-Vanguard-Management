'use strict';

const {
    joinVoiceChannel,
    entersState,
    VoiceConnectionStatus,
    getVoiceConnection
} = require('@discordjs/voice');

const config = require('../config/guildConfig');

const SALON_VOCAL_GENERAL = '1502321987056566412';
const DELAI_RECONNEXION = 5000; // 5 secondes

let connection = null;
let tentativeReconnexion = 0;
const MAX_TENTATIVES = 10;
let surveillanceActive = false;

/**
 * Connecte le bot au salon vocal général
 */
async function connecterAuVocal(guild) {
    try {
        const salonVocal = guild.channels.cache.get(SALON_VOCAL_GENERAL);
        
        if (!salonVocal) {
            console.error('[VOICE] Le salon vocal général est introuvable.');
            return false;
        }

        if (salonVocal.type !== 2) {
            console.error('[VOICE] Le salon spécifié n\'est pas un salon vocal.');
            return false;
        }

        // Vérifier si déjà connecté
        const connexionExistante = getVoiceConnection(guild.id);
        if (connexionExistante && connexionExistante.state.status !== VoiceConnectionStatus.Destroyed) {
            console.log('[VOICE] Déjà connecté au salon vocal.');
            connection = connexionExistante;
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

        // Attendre que la connexion soit prête
        await entersState(connection, VoiceConnectionStatus.Ready, 20000);
        
        console.log('[VOICE] Connecté avec succès au salon vocal général.');
        tentativeReconnexion = 0;
        
        // Configurer les gestionnaires d'événements
        configurerGestionnaires(guild);
        
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
        
        return false;
    }
}

/**
 * Configure les gestionnaires d'événements pour la connexion vocale
 */
function configurerGestionnaires(guild) {
    if (!connection) return;

    connection.on(VoiceConnectionStatus.Disconnected, async () => {
        console.log('[VOICE] Déconnecté du salon vocal.');
        
        try {
            // Tenter de se reconnecter
            await Promise.race([
                entersState(connection, VoiceConnectionStatus.Signalling, 5000),
                entersState(connection, VoiceConnectionStatus.Connecting, 5000)
            ]);
            console.log('[VOICE] Reconnexion en cours...');
        } catch (erreur) {
            console.log('[VOICE] Reconnexion impossible, destruction de la connexion.');
            connection.destroy();
            connection = null;
            
            // Planifier une reconnexion complète
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

/**
 * Planifie une tentative de reconnexion
 */
function planifierReconnexion(guild) {
    if (tentativeReconnexion >= MAX_TENTATIVES) {
        console.error('[VOICE] Nombre maximum de tentatives de reconnexion atteint.');
        return;
    }

    tentativeReconnexion++;
    console.log(`[VOICE] Tentative de reconnexion ${tentativeReconnexion}/${MAX_TENTATIVES} dans ${DELAI_RECONNEXION / 1000} secondes...`);

    setTimeout(async () => {
        await connecterAuVocal(guild);
    }, DELAI_RECONNEXION);
}

/**
 * Vérifie périodiquement que le bot est bien connecté
 */
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
    }, 60000); // Vérification toutes les minutes
}

/**
 * Déconnecte le bot du salon vocal
 */
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
