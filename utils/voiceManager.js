'use strict';

const { joinVoiceChannel, VoiceConnectionStatus } = require('@discordjs/voice');

const SALON_VOCAL_ID = '1502321987056566412';
const GUILD_ID = '1501671610879312036';

let connection = null;

function connecterVocal(guild) {
    // Si déjà connecté, on ne fait rien
    if (connection && connection.state.status !== VoiceConnectionStatus.Destroyed) {
        console.log('[VOCAL] Déjà connecté ou en cours de connexion.');
        return;
    }

    const salon = guild.channels.cache.get(SALON_VOCAL_ID);
    if (!salon) {
        console.error(`[VOCAL] ERREUR : Le salon vocal ${SALON_VOCAL_ID} est introuvable.`);
        return;
    }

    console.log(`[VOCAL] Tentative de connexion au salon : "${salon.name}"`);

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
        });

        connection.on(VoiceConnectionStatus.Disconnected, () => {
            console.log('[VOCAL] ⚠️ Déconnecté. Tentative de reconnexion automatique...');
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
        });

    } catch (error) {
        console.error('[VOCAL] ❌ Erreur fatale lors de la tentative de connexion :', error.message);
    }
}

module.exports = { connecterVocal };
