'use strict';

const { Events } = require('discord.js');
const { analyserNouveauMembre } = require('../utils/antiraid');

module.exports = {
    name: Events.GuildMemberAdd,
    async execute(member) {
        try {
            await analyserNouveauMembre(member);
        } catch (erreur) {
            console.error('[MEMBER] Erreur Anti-Raid :', erreur.message);
        }
    }
};
