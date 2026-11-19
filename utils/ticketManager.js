const { ChannelType, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../config/guildConfig');

const DATA_FILE = path.join(__dirname, '..', 'data', 'tickets.json');

// Garantir que le dossier data existe
function ensureDataDir() {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE)) {
        fs.writeFileSync(DATA_FILE, JSON.stringify({ counter: 0, active: {} }, null, 2));
    }
}

function loadData() {
    ensureDataDir();
    try {
        return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    } catch (e) {
        return { counter: 0, active: {} };
    }
}

function saveData(data) {
    ensureDataDir();
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function nextTicketNumber() {
    const data = loadData();
    data.counter += 1;
    saveData(data);
    return String(data.counter).padStart(3, '0');
}

/**
 * Genere l'embed de presentation pour un ticket (RDV ou Support)
 */
function generatePresentationEmbed(type) {
    const isRdv = type === 'rdv';
    const title = isRdv ? '[RENDEZ-VOUS] Demande d\'entrevue' : '[SUPPORT] Assistance technique';
    const description = isRdv
        ? 'Vous souhaitez planifier un rendez-vous avec un membre de l\'administration ou du commandement ?\n\nCliquez sur le bouton ci-dessous pour initier votre demande. Un salon prive sera cree automatiquement pour traiter votre requete en toute confidentialite.'
        : 'Vous avez besoin d\'aide ou souhaitez signaler un probleme ?\n\nCliquez sur le bouton ci-dessous pour ouvrir un ticket. Un membre du staff ou du commandement vous repondra dans les plus brefs delais dans un salon prive.';
    const color = isRdv ? 0x3498DB : 0xE67E22;

    return new EmbedBuilder()
        .setTitle(title)
        .setColor(color)
        .setDescription(description)
        .addFields(
            { name: '[PROCEDURE]', value: '1. Cliquez sur le bouton "Ouvrir un ticket"\n2. Selectionnez la categorie concernee\n3. Decrivez votre demande dans le formulaire\n4. Un salon prive sera cree automatiquement', inline: false },
            { name: '[DELAI]', value: 'Les demandes sont traitees dans un delai de 24 a 48 heures ouvrables.', inline: false }
        )
        .setFooter({ text: 'Division Vanguard - Systeme de ticket officiel' })
        .setTimestamp();
}

/**
 * Genere la ligne de bouton pour lancer le processus
 */
function generateOpenButton(type) {
    return new ActionRowBuilder().addComponents(
        new (require('discord.js').ButtonBuilder)()
            .setCustomId(`ticket_open_${type}`)
            .setLabel('Ouvrir un ticket')
            .setStyle(type === 'rdv' ? require('discord.js').ButtonStyle.Primary : require('discord.js').ButtonStyle.Secondary)
    );
}

/**
 * Genere le menu de selection de categorie (Staff ou Armee)
 */
function generateCategorySelect(type) {
    return new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId(`ticket_category_${type}`)
            .setPlaceholder('Selectionnez la categorie de votre demande')
            .addOptions([
                {
                    label: 'Membre du Staff',
                    value: 'staff',
                    description: 'Administration, moderation, gestion du serveur'
                },
                {
                    label: 'Membre de l\'Armee',
                    value: 'armee',
                    description: 'Commandement, operations, hierarchie militaire'
                }
            ])
    );
}

/**
 * Genere le modal de saisie de la raison
 */
function generateReasonModal(type, category) {
    const isRdv = type === 'rdv';
    const modal = new ModalBuilder()
        .setCustomId(`ticket_reason_${type}_${category}`)
        .setTitle(isRdv ? '[RDV] Details du rendez-vous' : '[SUPPORT] Details de la demande');

    const subjectInput = new TextInputBuilder()
        .setCustomId('subject')
        .setLabel('Sujet de la demande')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Ex : Demande de promotion, Signalement d\'un bug...')
        .setMaxLength(100)
        .setRequired(true);

    const detailsInput = new TextInputBuilder()
        .setCustomId('details')
        .setLabel('Description detaillee')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('Decrivez votre demande de la maniere la plus precise possible...')
        .setMaxLength(1500)
        .setRequired(true);

    const urgencyInput = new TextInputBuilder()
        .setCustomId('urgency')
        .setLabel('Niveau d\'urgence (FAIBLE / MOYEN / ELEVE)')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('MOYEN')
        .setMaxLength(20)
        .setRequired(false);

    modal.addComponents(
        new ActionRowBuilder().addComponents(subjectInput),
        new ActionRowBuilder().addComponents(detailsInput),
        new ActionRowBuilder().addComponents(urgencyInput)
    );

    return modal;
}

/**
 * Cree le salon prive pour le ticket
 */
async function createTicketChannel(guild, member, type, category, subject, details, urgency, client) {
    const number = nextTicketNumber();
    const isRdv = type === 'rdv';
    const channelName = `ticket-${number}-${isRdv ? 'rdv' : 'support'}-${member.user.username}`.toLowerCase().replace(/[^a-z0-9-]/g, '');

    // Permissions: @everyone ne voit rien, le membre voit, le bot voit, les roles autorises voient
    const permissionOverwrites = [
        {
            id: guild.id,
            deny: [PermissionFlagsBits.ViewChannel]
        },
        {
            id: member.id,
            allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.ReadMessageHistory,
                PermissionFlagsBits.AttachFiles
            ]
        },
        {
            id: client.user.id,
            allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.ManageChannels,
                PermissionFlagsBits.ReadMessageHistory
            ]
        }
    ];

    // Ajouter les roles selon la categorie
    if (category === 'staff') {
        for (const roleId of config.adminRoles) {
            permissionOverwrites.push({
                id: roleId,
                allow: [
                    PermissionFlagsBits.ViewChannel,
                    PermissionFlagsBits.SendMessages,
                    PermissionFlagsBits.ReadMessageHistory
                ]
            });
        }
    } else if (category === 'armee') {
        for (const roleId of config.formationRoles) {
            permissionOverwrites.push({
                id: roleId,
                allow: [
                    PermissionFlagsBits.ViewChannel,
                    PermissionFlagsBits.SendMessages,
                    PermissionFlagsBits.ReadMessageHistory
                ]
            });
        }
    }

    // Creer le salon dans la categorie appropriee
    const categoryId = isRdv ? config.channels.rdvCategory : config.channels.supportCategory;
    const channel = await guild.channels.create({
        name: channelName,
        type: ChannelType.GuildText,
        topic: `[TICKET ${number}] ${isRdv ? 'Rendez-vous' : 'Support'} | Categorie: ${category.toUpperCase()} | Auteur: ${member.user.username} (${member.id})`,
        parent: categoryId || null,
        permissionOverwrites,
        reason: `Creation d'un ticket ${isRdv ? 'de rendez-vous' : 'de support'} pour ${member.user.username}`
    });

    // Sauvegarder le ticket
    const data = loadData();
    data.active[channel.id] = {
        number,
        type,
        category,
        subject,
        details,
        urgency: urgency || 'Non precise',
        authorId: member.id,
        authorTag: member.user.username,
        createdAt: new Date().toISOString(),
        channelId: channel.id,
        status: 'open'
    };
    saveData(data);

    // Envoyer le message d'accueil dans le salon
    const welcomeEmbed = new EmbedBuilder()
        .setTitle(`[TICKET ${number}] ${isRdv ? 'Rendez-vous' : 'Support'} - ${category === 'staff' ? 'Staff' : 'Armee'}`)
        .setColor(category === 'staff' ? 0x3498DB : 0xE67E22)
        .setTimestamp()
        .addFields(
            { name: '[AUTEUR]', value: `${member.user.username}\nID: \`${member.id}\``, inline: true },
            { name: '[CATEGORIE]', value: category === 'staff' ? 'Membre du Staff' : 'Membre de l\'Armee', inline: true },
            { name: '[URGENCCE]', value: urgency || 'Non precisee', inline: true },
            { name: '[SUJET]', value: subject, inline: false },
            { name: '[DESCRIPTION]', value: details.length > 1024 ? details.substring(0, 1020) + '...' : details, inline: false }
        )
        .setFooter({ text: `Division Vanguard - Ticket ${number}` });

    const closeRow = new ActionRowBuilder().addComponents(
        new (require('discord.js').ButtonBuilder)()
            .setCustomId(`ticket_close_${channel.id}`)
            .setLabel('Fermer le ticket')
            .setStyle(require('discord.js').ButtonStyle.Danger)
    );

    await channel.send({
        content: `${member.toString()} ${category === 'staff' ? '<@&' + config.adminRoles[0] + '>' : '<@&' + config.formationRoles[0] + '>'} - Votre ticket a ete ouvert avec succes. Un membre concerne vous repondra sous peu.`,
        embeds: [welcomeEmbed],
        components: [closeRow]
    });

    // Log dans le salon logs-bot
    const logEmbed = new EmbedBuilder()
        .setTitle('[JOURNAL] Nouveau ticket cree')
        .setColor(0x5865F2)
        .setTimestamp()
        .addFields(
            { name: 'Numero', value: `#${number}`, inline: true },
            { name: 'Type', value: isRdv ? 'Rendez-vous' : 'Support', inline: true },
            { name: 'Categorie', value: category === 'staff' ? 'Staff' : 'Armee', inline: true },
            { name: 'Auteur', value: `${member.user.username}\nID: \`${member.id}\``, inline: true },
            { name: 'Salon', value: `<#${channel.id}>`, inline: true },
            { name: 'Sujet', value: subject, inline: false }
        );

    const logsChannel = guild.channels.cache.get(config.channels.logsBot);
    if (logsChannel) {
        await logsChannel.send({ embeds: [logEmbed] }).catch(() => {});
    }

    return channel;
}

/**
 * Ferme un ticket (supprime le salon)
 */
async function closeTicket(channel, closedBy) {
    const data = loadData();
    const ticket = data.active[channel.id];

    if (ticket) {
        // Envoyer un transcript avant suppression
        const transcriptEmbed = new EmbedBuilder()
            .setTitle(`[TICKET ${ticket.number}] Ferme`)
            .setColor(0x95A5A6)
            .setTimestamp()
            .addFields(
                { name: 'Type', value: ticket.type === 'rdv' ? 'Rendez-vous' : 'Support', inline: true },
                { name: 'Categorie', value: ticket.category === 'staff' ? 'Staff' : 'Armee', inline: true },
                { name: 'Auteur', value: ticket.authorTag, inline: true },
                { name: 'Ferme par', value: closedBy.user.username, inline: true },
                { name: 'Sujet', value: ticket.subject, inline: false },
                { name: 'Description', value: ticket.details.length > 1024 ? ticket.details.substring(0, 1020) + '...' : ticket.details, inline: false }
            );

        // Log dans logs-bot
        const logsChannel = channel.guild.channels.cache.get(config.channels.logsBot);
        if (logsChannel) {
            await logsChannel.send({ embeds: [transcriptEmbed] }).catch(() => {});
        }

        delete data.active[channel.id];
        saveData(data);
    }

    await channel.send({ content: '[INFO] Ce ticket va etre ferme et le salon supprime dans 5 secondes.' }).catch(() => {});

    setTimeout(async () => {
        try {
            await channel.delete('Ticket ferme');
        } catch (e) {
            console.error('[TICKET] Erreur suppression salon:', e);
        }
    }, 5000);
}

module.exports = {
    generatePresentationEmbed,
    generateOpenButton,
    generateCategorySelect,
    generateReasonModal,
    createTicketChannel,
    closeTicket,
    loadData,
    saveData
};
