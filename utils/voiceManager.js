'use strict';

const { joinVoiceChannel, VoiceConnectionStatus } = require('@discordjs/voice');

const SALON_VOCAL_ID = '1502321987056566412';
const GUILD_ID = '1501671610879312036';
const MAX_TENTATIVES = 5;

let connection = null;
let tentatives = 0;
let arretDefinitif = false;

function connecterVocal(guild) {
    if (arretDefinitif) {
        console.log('[VOCAL] Arrêt définitif après échecs répétés. Le bot restera hors du salon vocal.');
        return;
    }

    if (connection && connection.state.status !== VoiceConnectionStatus.Destroyed) {
        console.log('[VOCAL] Déjà connecté ou en cours de connexion.');
        return;
    }

    const salon = guild.channels.cache.get(SALON_VOCAL_ID);
    if (!salon) {
        console.error(`[VOCAL] ERREUR : Le salon vocal ${SALON_VOCAL_ID} est introuvable.`);
        return;
    }

    console.log(`[VOCAL] Tentative de connexion au salon : "${salon.name}" (essai ${tentatives + 1}/${MAX_TENTATIVES})`);

    try {
        connection = joinVoiceChannel({
            channelId: salon.id,
            guildId: guild.id,
            adapterCreator: guild.voiceAdapterCreator,
            selfDeaf: true,
            selfMute: true
        });

        connection.on(VoiceConnectionStatus.Ready, () => {
            console.log('[VOCAL] ✅ Connecté avec succès et prêt.');
            tentatives = 0;
        });

        connection.on(VoiceConnectionStatus.Disconnected, () => {
            console.log('[VOCAL] ⚠️ Déconnecté.');
            tentatives++;
            
            if (tentatives >= MAX_TENTATIVES) {
                console.error(`[VOCAL] ${MAX_TENTATIVES} tentatives échouées. Arrêt définitif.`);
                arretDefinitif = true;
                try { connection.destroy(); } catch (e) {}
                connection = null;
                return;
            }
            
            console.log(`[VOCAL] Tentative de reconnexion automatique...`);
            try {
                connection.rejoin();
            } catch (e) {
                console.error('[VOCAL] Échec de la reconnexion :', e.message);
            }
        });

        connection.on(VoiceConnectionStatus.Destroyed, () => {
            console.log('[VOCAL] ❌ Connexion détruite.');
            connection = null;
        });

        connection.on('error', (error) => {
            console.error('[VOCAL] ❌ Erreur de connexion :', error.message);
            tentatives++;
            
            if (tentatives >= MAX_TENTATIVES) {
                console.error(`[VOCAL] ${MAX_TENTATIVES} tentatives échouées. Arrêt définitif.`);
                arretDefinitif = true;
            }
        });

    } catch (error) {
        console.error('[VOCAL] ❌ Erreur fatale lors de la tentative de connexion :', error.message);
        tentatives++;
        
        if (tentatives >= MAX_TENTATIVES) {
            console.error(`[VOCAL] ${MAX_TENTATIVES} tentatives échouées. Arrêt définitif.`);
            arretDefinitif = true;
        }
    }
}

module.exports = { connecterVocal };
