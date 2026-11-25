'use strict';

const { PermissionFlagsBits } = require('discord.js');
const bdd = require('./database');
const { envoyerLog } = require('./logger');

const historiqueMessages = new Map();
const LIENS_REGEX = /https?:\/\/[^\s]+/gi;
const MENTIONS_REGEX = /<@!?\d+>/g;

function estExempte(membre) {
    const config = bdd.getAutomod();
    if (!config.exemptions) return false;
    return membre.roles.cache.some(role => config.exemptions.includes(role.id));
}

async function verifierSpam(message) {
    const config = bdd.getAutomod();
    if (!config.spam.actif) return false;

    const cle = `${message.author.id}-${message.channel.id}`;
    const maintenant = Date.now();

    if (!historiqueMessages.has(cle)) {
        historiqueMessages.set(cle, []);
    }

    const historique = historiqueMessages.get(cle);
    historique.push(maintenant);

    const messagesRecents = historique.filter(temps => maintenant - temps < config.spam.periode);
    historiqueMessages.set(cle, messagesRecents);

    if (messagesRecents.length > config.spam.maxMessages) {
        try {
            await message.delete();
            
            if (config.spam.action === 'mute') {
                await message.member.timeout(config.spam.dureeMute * 1000, 'Spam détecté par l\'AutoMod');
                bdd.incrementerStatistique('membresMutes');
            } else if (config.spam.action === 'kick') {
                await message.member.kick('Spam détecté par l\'AutoMod');
                bdd.incrementerStatistique('membresKicks');
            } else if (config.spam.action === 'ban') {
                await message.member.ban({ reason: 'Spam détecté par l\'AutoMod', days: 0 });
                bdd.incrementerStatistique('membresBannis');
            }

            bdd.ajouterSanction({
                type: 'spam',
                membre: message.author.id,
                membreNom: message.author.username,
                action: config.spam.action,
                salon: message.channel.id,
                modérateur: 'AutoMod'
            });

            bdd.incrementerStatistique('messagesSupprimes');

            await envoyerLog(message.client, {
                titre: 'SPAM DÉTECTÉ',
                description: `Spam détecté et sanctionné automatiquement.`,
                couleur: 0xE67E22,
                champs: [
                    { name: 'Membre', value: `${message.author} (${message.author.id})`, inline: true },
                    { name: 'Salon', value: `${message.channel}`, inline: true },
                    { name: 'Action', value: config.spam.action.toUpperCase(), inline: true }
                ]
            });

            return true;
        } catch (erreur) {
            console.error('[AUTOMOD] Erreur spam :', erreur.message);
        }
    }

    return false;
}

async function verifierLiens(message) {
    const config = bdd.getAutomod();
    if (!config.liens.actif) return false;

    const liens = message.content.match(LIENS_REGEX);
    if (!liens) return false;

    const liensAutorises = config.liens.whitelist || [];
    const liensInterdits = liens.filter(lien => 
        !liensAutorises.some(autorise => lien.includes(autorise))
    );

    if (liensInterdits.length > 0) {
        try {
            await message.delete();
            bdd.incrementerStatistique('messagesSupprimes');

            await envoyerLog(message.client, {
                titre: 'LIEN INTERDIT',
                description: `Lien non autorisé supprimé.`,
                couleur: 0xE67E22,
                champs: [
                    { name: 'Membre', value: `${message.author} (${message.author.id})`, inline: true },
                    { name: 'Salon', value: `${message.channel}`, inline: true },
                    { name: 'Lien', value: liensInterdits[0].substring(0, 100), inline: false }
                ]
            });

            return true;
        } catch (erreur) {
            console.error('[AUTOMOD] Erreur liens :', erreur.message);
        }
    }

    return false;
}

async function verifierMentions(message) {
    const config = bdd.getAutomod();
    if (!config.mentions.actif) return false;

    const mentions = message.content.match(MENTIONS_REGEX);
    if (!mentions || mentions.length <= config.mentions.maxMentions) return false;

    try {
        await message.delete();

        if (config.mentions.action === 'mute') {
            await message.member.timeout(config.mentions.dureeMute * 1000, 'Mentions excessives détectées par l\'AutoMod');
            bdd.incrementerStatistique('membresMutes');
        }

        bdd.ajouterSanction({
            type: 'mentions',
            membre: message.author.id,
            membreNom: message.author.username,
            action: config.mentions.action,
            salon: message.channel.id,
            modérateur: 'AutoMod'
        });

        bdd.incrementerStatistique('messagesSupprimes');

        await envoyerLog(message.client, {
            titre: 'MENTIONS EXCESSIVES',
            description: `Trop de mentions détectées.`,
            couleur: 0xE67E22,
            champs: [
                { name: 'Membre', value: `${message.author} (${message.author.id})`, inline: true },
                { name: 'Salon', value: `${message.channel}`, inline: true },
                { name: 'Nombre de mentions', value: mentions.length.toString(), inline: true }
            ]
        });

        return true;
    } catch (erreur) {
        console.error('[AUTOMOD] Erreur mentions :', erreur.message);
    }

    return false;
}

async function verifierMotsInterdits(message) {
    const config = bdd.getAutomod();
    if (!config.motsInterdits.actif || !config.motsInterdits.mots.length) return false;

    const contenu = message.content.toLowerCase();
    const motTrouve = config.motsInterdits.mots.find(mot => contenu.includes(mot.toLowerCase()));

    if (motTrouve) {
        try {
            await message.delete();
            bdd.incrementerStatistique('messagesSupprimes');

            await envoyerLog(message.client, {
                titre: 'MOT INTERDIT',
                description: `Message contenant un mot interdit supprimé.`,
                couleur: 0xE67E22,
                champs: [
                    { name: 'Membre', value: `${message.author} (${message.author.id})`, inline: true },
                    { name: 'Salon', value: `${message.channel}`, inline: true },
                    { name: 'Mot trouvé', value: motTrouve, inline: true }
                ]
            });

            return true;
        } catch (erreur) {
            console.error('[AUTOMOD] Erreur mots interdits :', erreur.message);
        }
    }

    return false;
}

async function verifierCaps(message) {
    const config = bdd.getAutomod();
    if (!config.caps.actif) return false;

    const contenu = message.content.replace(/[^a-zA-Z]/g, '');
    if (contenu.length < config.caps.longueurMin) return false;

    const majuscules = contenu.replace(/[^A-Z]/g, '').length;
    const pourcentage = (majuscules / contenu.length) * 100;

    if (pourcentage > config.caps.pourcentageMax) {
        try {
            await message.delete();
            bdd.incrementerStatistique('messagesSupprimes');

            await envoyerLog(message.client, {
                titre: 'CAPS EXCESSIFS',
                description: `Message avec trop de majuscules supprimé.`,
                couleur: 0xE67E22,
                champs: [
                    { name: 'Membre', value: `${message.author} (${message.author.id})`, inline: true },
                    { name: 'Salon', value: `${message.channel}`, inline: true },
                    { name: 'Pourcentage', value: `${pourcentage.toFixed(1)}%`, inline: true }
                ]
            });

            return true;
        } catch (erreur) {
            console.error('[AUTOMOD] Erreur caps :', erreur.message);
        }
    }

    return false;
}

async function analyserMessage(message) {
    if (message.author.bot) return;
    if (!message.guild) return;
    if (message.member.permissions.has(PermissionFlagsBits.Administrator)) return;
    if (estExempte(message.member)) return;

    const config = bdd.getAutomod();
    if (!config.actif) return;

    await verifierSpam(message);
    await verifierLiens(message);
    await verifierMentions(message);
    await verifierMotsInterdits(message);
    await verifierCaps(message);
}

module.exports = { analyserMessage };
