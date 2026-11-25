'use strict';

const { PermissionFlagsBits, ChannelType } = require('discord.js');
const bdd = require('./database');
const { envoyerLog } = require('./logger');

const historiqueJoins = [];
let lockdownActif = false;

async function detecterRaid(member) {
    const config = bdd.getAntiraid();
    if (!config.actif) return false;

    const maintenant = Date.now();
    historiqueJoins.push(maintenant);

    const joinsRecents = historiqueJoins.filter(temps => maintenant - temps < config.detection.periode);
    
    if (joinsRecents.length > config.detection.maxJoins) {
        await declencherLockdown(member.guild, config);
        return true;
    }

    return false;
}

async function verifierCompteRecent(member) {
    const config = bdd.getAntiraid();
    if (!config.comptesRecents.actif) return false;

    const ageCompte = Date.now() - member.user.createdAt.getTime();
    
    if (ageCompte < config.comptesRecents.ageMin) {
        try {
            if (config.comptesRecents.action === 'kick') {
                await member.kick('Compte trop récent - Protection Anti-Raid');
                bdd.incrementerStatistique('membresKicks');
            } else if (config.comptesRecents.action === 'ban') {
                await member.ban({ reason: 'Compte trop récent - Protection Anti-Raid', days: 0 });
                bdd.incrementerStatistique('membresBannis');
            }

            await envoyerLog(member.client, {
                titre: 'COMPTE RÉCENT BLOQUÉ',
                description: `Un compte récent a été bloqué par l'Anti-Raid.`,
                couleur: 0xE74C3C,
                champs: [
                    { name: 'Membre', value: `${member.user.username} (${member.id})`, inline: true },
                    { name: 'Âge du compte', value: `${Math.floor(ageCompte / 3600000)} heures`, inline: true },
                    { name: 'Action', value: config.comptesRecents.action.toUpperCase(), inline: true }
                ]
            });

            return true;
        } catch (erreur) {
            console.error('[ANTIRAID] Erreur compte récent :', erreur.message);
        }
    }

    return false;
}

async function declencherLockdown(guild, config) {
    if (lockdownActif) return;
    lockdownActif = true;

    bdd.incrementerStatistique('raidsDetectes');

    try {
        const salonsVerrouilles = [];
        
        for (const [id, salon] of guild.channels.cache) {
            if (salon.type === ChannelType.GuildText || salon.type === ChannelType.GuildVoice) {
                try {
                    await salon.permissionOverwrites.edit(guild.id, {
                        [PermissionFlagsBits.SendMessages]: false,
                        [PermissionFlagsBits.AddReactions]: false,
                        [PermissionFlagsBits.CreatePublicThreads]: false,
                        [PermissionFlagsBits.Connect]: false
                    });
                    salonsVerrouilles.push(id);
                } catch (erreur) {
                    console.error(`[ANTIRAID] Erreur verrouillage ${salon.name} :`, erreur.message);
                }
            }
        }

        const donnees = bdd.getAntiraid();
        donnees.lockdown.actif = true;
        donnees.lockdown.salonsVerrouilles = salonsVerrouilles;
        bdd.setAntiraid(donnees);

        await envoyerLog(guild.client, {
            titre: 'LOCKDOWN ACTIVÉ',
            description: `Un raid a été détecté. Le serveur est maintenant en mode lockdown.`,
            couleur: 0xE74C3C,
            champs: [
                { name: 'Serveur', value: guild.name, inline: true },
                { name: 'Salons verrouillés', value: salonsVerrouilles.length.toString(), inline: true },
                { name: 'Déclenché par', value: 'Anti-Raid automatique', inline: true }
            ]
        });

        setTimeout(async () => {
            await desactiverLockdown(guild);
        }, 300000);

    } catch (erreur) {
        console.error('[ANTIRAID] Erreur lockdown :', erreur.message);
    }
}

async function desactiverLockdown(guild) {
    if (!lockdownActif) return;

    try {
        const donnees = bdd.getAntiraid();
        const salonsVerrouilles = donnees.lockdown.salonsVerrouilles || [];

        for (const id of salonsVerrouilles) {
            const salon = guild.channels.cache.get(id);
            if (salon) {
                try {
                    await salon.permissionOverwrites.edit(guild.id, {
                        [PermissionFlagsBits.SendMessages]: null,
                        [PermissionFlagsBits.AddReactions]: null,
                        [PermissionFlagsBits.CreatePublicThreads]: null,
                        [PermissionFlagsBits.Connect]: null
                    });
                } catch (erreur) {
                    console.error(`[ANTIRAID] Erreur déverrouillage ${salon.name} :`, erreur.message);
                }
            }
        }

        donnees.lockdown.actif = false;
        donnees.lockdown.salonsVerrouilles = [];
        bdd.setAntiraid(donnees);

        lockdownActif = false;

        await envoyerLog(guild.client, {
            titre: 'LOCKDOWN DÉSACTIVÉ',
            description: `Le mode lockdown a été automatiquement désactivé après 5 minutes.`,
            couleur: 0x2E7D32,
            champs: [
                { name: 'Serveur', value: guild.name, inline: true },
                { name: 'Salons déverrouillés', value: salonsVerrouilles.length.toString(), inline: true }
            ]
        });

    } catch (erreur) {
        console.error('[ANTIRAID] Erreur désactivation lockdown :', erreur.message);
    }
}

async function analyserNouveauMembre(member) {
    if (member.user.bot) return;

    const config = bdd.getAntiraid();
    if (!config.actif) return;

    await verifierCompteRecent(member);
    await detecterRaid(member);
}

module.exports = { analyserNouveauMembre, declencherLockdown, desactiverLockdown };
