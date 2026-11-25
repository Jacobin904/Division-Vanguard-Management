'use strict';

const { Events } = require('discord.js');
const { analyserMessage } = require('../utils/automod');

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        try {
            await analyserMessage(message);
        } catch (erreur) {
            console.error('[MESSAGE] Erreur AutoMod :', erreur.message);
        }
    }
};
