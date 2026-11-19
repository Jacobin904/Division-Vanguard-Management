'use strict';

const { EmbedBuilder } = require('discord.js');

const COULEURS = {
    institution: 0x2B3A55,
    information: 0x34568B,
    succes: 0x2E7D32,
    attention: 0xB26A00,
    critique: 0x8B1A1A,
    neutre: 0x4B5563
};

const INSTITUTION = 'Division Vanguard';

function tronquer(texte, maximum = 1024) {
    const valeur = String(texte ?? '').trim();
    if (valeur.length === 0) return 'Non renseigné';
    if (valeur.length <= maximum) return valeur;
    return `${valeur.slice(0, maximum - 1)}…`;
}

function code(valeur) {
    return `\`${String(valeur ?? 'inconnu').replace(/`/g, "'")}\``;
}

function horodatageComplet(date) {
    return `<t:${Math.floor(date.getTime() / 1000)}:F>`;
}

function horodatageRelatif(date) {
    return `<t:${Math.floor(date.getTime() / 1000)}:R>`;
}

function ligne(label, valeur) {
    return `**${label} :** ${valeur}`;
}

function bloc(titre, lignes) {
    return {
        name: titre.toUpperCase(),
        value: tronquer(lignes.filter(Boolean).join('\n')),
        inline: false
    };
}

function construireEmbed(guild, options = {}) {
    const {
        titre,
        description,
        couleur = COULEURS.institution,
        service = INSTITUTION,
        mentions = null,
        vignette = null,
        image = null,
        champs = [],
        pied = null,
        date = new Date()
    } = options;

    const embed = new EmbedBuilder()
        .setColor(couleur)
        .setAuthor({
            name: service,
            iconURL: guild?.iconURL({ size: 128 }) || undefined
        })
        .setTimestamp(date);

    if (titre) embed.setTitle(tronquer(titre, 256));
    if (description) embed.setDescription(tronquer(description, 4096));
    if (vignette) embed.setThumbnail(vignette);
    if (image) embed.setImage(image);
    if (champs.length > 0) embed.addFields(champs.slice(0, 25));

    embed.setFooter({
        text: tronquer(pied || `${INSTITUTION} — Document administratif`, 2048),
        iconURL: mentions || undefined
    });

    return embed;
}

module.exports = {
    COULEURS,
    INSTITUTION,
    tronquer,
    code,
    ligne,
    bloc,
    horodatageComplet,
    horodatageRelatif,
    construireEmbed
};
