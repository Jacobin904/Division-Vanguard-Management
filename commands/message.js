'use strict';

const { 
    SlashCommandBuilder, 
    PermissionFlagsBits, 
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');

const SALONS = {
    REGLEMENTS: '1502110662065651872',
    ANNONCES: '1502322193655271566',
    FAQ: '1502321929984409739',
    PRESENTATION: '1502321927509770422',
    LIENS_UTILES: '1502321931410739312',
    PARTENARIAT: '1510805310812717229',
    SUPPORT: '1566930356098310307'
};

// ============================================================================
// EMBED PRINCIPAL DES RÈGLEMENTS
// ============================================================================

function creerEmbedReglementsPrincipal() {
    return new EmbedBuilder()
        .setColor(0x2B3A55)
        .setTitle('RÈGLEMENT OFFICIEL DE LA DIVISION VANGUARD')
        .setDescription('Bienvenue dans la Division Vanguard. Veuillez lire attentivement l\'intégralité du règlement avant de poursuivre votre expérience sur notre serveur. Le non-respect de ces directives entraînera des sanctions appropriées.\n\n**Utilisez les boutons ci-dessous pour consulter chaque chapitre en détail.**')
        .addFields(
            {
                name: 'CHAPITRE 1 — DISPOSITIONS GÉNÉRALES',
                value: 'Principes fondamentaux régissant la conduite des membres, le respect mutuel et la confidentialité au sein de l\'unité.',
                inline: false
            },
            {
                name: 'CHAPITRE 2 — HIÉRARCHIE ET DISCIPLINE',
                value: 'Structure hiérarchique militaire, obéissance aux ordres et port de l\'uniforme réglementaire.',
                inline: false
            },
            {
                name: 'CHAPITRE 3 — COMMUNICATION',
                value: 'Règles d\'utilisation des salons, modération des messages et procédure de signalement.',
                inline: false
            },
            {
                name: 'CHAPITRE 4 — OPÉRATIONS ET FORMATION',
                value: 'Participation aux opérations, formation initiale et équipement réglementaire.',
                inline: false
            },
            {
                name: 'CHAPITRE 5 — SANCTIONS',
                value: 'Échelle des sanctions, droit de recours et circonstances aggravantes.',
                inline: false
            }
        )
        .setFooter({ text: 'Division Vanguard — Document officiel — En vigueur à compter de sa publication' })
        .setTimestamp();
}

// ============================================================================
// EMBEDS DÉTAILLÉS PAR CHAPITRE
// ============================================================================

function creerEmbedChapitre1() {
    return new EmbedBuilder()
        .setColor(0x2B3A55)
        .setTitle('CHAPITRE 1 — DISPOSITIONS GÉNÉRALES')
        .setDescription('Principes fondamentaux régissant la conduite des membres au sein de la Division Vanguard.')
        .addFields(
            {
                name: 'ARTICLE 1.1 — RESPECT MUTUEL',
                value: 'Tout membre se doit de respecter l\'ensemble des autres membres, quel que soit leur grade ou leur ancienneté. Les insultes, le harcèlement et les comportements toxiques sont strictement prohibés.',
                inline: false
            },
            {
                name: 'ARTICLE 1.2 — LANGUE OFFICIELLE',
                value: 'La langue officielle du serveur est le français. Toute communication doit se faire en français correct et respectueux.',
                inline: false
            },
            {
                name: 'ARTICLE 1.3 — CONFIDENTIALITÉ',
                value: 'Les informations partagées dans les salons privés ou restreints ne doivent en aucun cas être divulguées à l\'extérieur du serveur.',
                inline: false
            },
            {
                name: 'ARTICLE 1.4 — ACCÈS AU SERVEUR',
                value: 'L\'accès complet au serveur est conditionné à l\'acceptation explicite du règlement, généralement matérialisée par une réaction sur un message désigné dans <#1502110662065651872>.',
                inline: false
            }
        )
        .setFooter({ text: 'Division Vanguard — Chapitre 1 sur 5' })
        .setTimestamp();
}

function creerEmbedChapitre2() {
    return new EmbedBuilder()
        .setColor(0x2B3A55)
        .setTitle('CHAPITRE 2 — HIÉRARCHIE ET DISCIPLINE')
        .setDescription('Structure hiérarchique militaire et obligations disciplinaires.')
        .addFields(
            {
                name: 'ARTICLE 2.1 — RESPECT DE LA HIÉRARCHIE',
                value: 'La structure hiérarchique militaire doit être respectée en tout temps. Les ordres donnés par les officiers et sous-officiers sont exécutoires.',
                inline: false
            },
            {
                name: 'ARTICLE 2.2 — OBÉISSANCE AUX ORDRES',
                value: 'Tout membre doit obéir aux ordres légitimes de ses supérieurs. Le refus d\'obéissance constitue une faute grave passible de sanctions.',
                inline: false
            },
            {
                name: 'ARTICLE 2.3 — PORT DE L\'UNIFORME',
                value: 'Lors des opérations et cérémonies, le port de l\'uniforme réglementaire est obligatoire selon les directives en vigueur.',
                inline: false
            },
            {
                name: 'ARTICLE 2.4 — AVANCEMENT',
                value: 'Les promotions sont attribuées selon les critères définis dans <#1502321973076820163> par l\'État-Major.',
                inline: false
            }
        )
        .setFooter({ text: 'Division Vanguard — Chapitre 2 sur 5' })
        .setTimestamp();
}

function creerEmbedChapitre3() {
    return new EmbedBuilder()
        .setColor(0x2B3A55)
        .setTitle('CHAPITRE 3 — COMMUNICATION')
        .setDescription('Règles d\'utilisation des salons et de communication entre membres.')
        .addFields(
            {
                name: 'ARTICLE 3.1 — SALONS APPROPRIÉS',
                value: 'Chaque salon a une fonction précise. Les messages doivent être postés dans le salon adéquat. Le hors-sujet est proscrit dans les salons thématiques.',
                inline: false
            },
            {
                name: 'ARTICLE 3.2 — MODÉRATION DES MESSAGES',
                value: 'Le spam, la publicité non autorisée et les messages répétitifs sont interdits. Les administrateurs se réservent le droit de supprimer tout contenu inapproprié.',
                inline: false
            },
            {
                name: 'ARTICLE 3.3 — SIGNALEMENT',
                value: 'Tout manquement au règlement doit être signalé immédiatement à un membre du staff via <#1566930356098310307> ou par ticket privé.',
                inline: false
            },
            {
                name: 'ARTICLE 3.4 — SALONS D\'INFORMATION',
                value: 'Les salons <#1502110662065651872>, <#1502321929984409739> et <#1502321931410739312> sont en lecture seule pour les membres.',
                inline: false
            }
        )
        .setFooter({ text: 'Division Vanguard — Chapitre 3 sur 5' })
        .setTimestamp();
}

function creerEmbedChapitre4() {
    return new EmbedBuilder()
        .setColor(0x2B3A55)
        .setTitle('CHAPITRE 4 — OPÉRATIONS ET FORMATION')
        .setDescription('Participation aux opérations militaires et parcours de formation.')
        .addFields(
            {
                name: 'ARTICLE 4.1 — PARTICIPATION AUX OPÉRATIONS',
                value: 'Les opérations militaires sont obligatoires pour tous les membres actifs. Les absences doivent être justifiées au préalable via <#1502321952654626857>.',
                inline: false
            },
            {
                name: 'ARTICLE 4.2 — FORMATION INITIALE',
                value: 'Tout nouveau membre doit compléter le parcours de formation dans <#1502321962771546194> avant de participer aux opérations régulières.',
                inline: false
            },
            {
                name: 'ARTICLE 4.3 — ÉQUIPEMENT RÉGLEMENTAIRE',
                value: 'L\'utilisation d\'équipements non autorisés ou de cheats lors des opérations entraîne une exclusion immédiate.',
                inline: false
            },
            {
                name: 'ARTICLE 4.4 — RAPPORTS DE MISSION',
                value: 'Après chaque opération, un rapport doit être soumis dans <#1502321948582219816> selon le protocole établi.',
                inline: false
            }
        )
        .setFooter({ text: 'Division Vanguard — Chapitre 4 sur 5' })
        .setTimestamp();
}

function creerEmbedChapitre5() {
    return new EmbedBuilder()
        .setColor(0x2B3A55)
        .setTitle('CHAPITRE 5 — SANCTIONS')
        .setDescription('Échelle des sanctions et procédure disciplinaire.')
        .addFields(
            {
                name: 'ARTICLE 5.1 — ÉCHELLE DES SANCTIONS',
                value: 'Les sanctions sont appliquées selon la gravité de l\'infraction :\n- Avertissement verbal\n- Avertissement écrit\n- Mise à l\'écart temporaire\n- Exclusion définitive',
                inline: false
            },
            {
                name: 'ARTICLE 5.2 — DROIT DE RECOURS',
                value: 'Tout membre sanctionné peut faire appel de la décision auprès de l\'État-Major dans un délai de 72 heures via <#1566930356098310307>.',
                inline: false
            },
            {
                name: 'ARTICLE 5.3 — CIRCONSTANCES AGGRAVANTES',
                value: 'La récidive, la mauvaise foi et le manque de respect envers les sanctionneurs constituent des circonstances aggravantes.',
                inline: false
            },
            {
                name: 'ARTICLE 5.4 — REGISTRE DES SANCTIONS',
                value: 'Toutes les sanctions sont consignées dans <#1502321975350263838> et <#1502321980387496097>.',
                inline: false
            }
        )
        .setFooter({ text: 'Division Vanguard — Chapitre 5 sur 5' })
        .setTimestamp();
}

// ============================================================================
// BOUTONS DE NAVIGATION
// ============================================================================

function creerBoutonsReglements() {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('reglement_chapitre_1')
            .setLabel('Chapitre 1')
            .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId('reglement_chapitre_2')
            .setLabel('Chapitre 2')
            .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId('reglement_chapitre_3')
            .setLabel('Chapitre 3')
            .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId('reglement_chapitre_4')
            .setLabel('Chapitre 4')
            .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId('reglement_chapitre_5')
            .setLabel('Chapitre 5')
            .setStyle(ButtonStyle.Primary)
    );
}

// ============================================================================
// AUTRES EMBEDS
// ============================================================================

function creerEmbedAnnonces() {
    return new EmbedBuilder()
        .setColor(0xE67E22)
        .setTitle('CANAL D\'ANNONCES OFFICIELLES')
        .setDescription('Ce salon est réservé aux annonces officielles de la Division Vanguard. Seuls les membres autorisés du staff peuvent y publier du contenu.')
        .addFields(
            {
                name: 'FONCTIONNEMENT DU SALON',
                value: '• Les annonces sont publiées exclusivement par l\'administration\n• Les réactions sont autorisées pour marquer votre accord ou votre prise de connaissance\n• Aucun message utilisateur n\'est autorisé dans ce canal\n• Pour toute question relative à une annonce, utilisez <#1566930356098310307>',
                inline: false
            },
            {
                name: 'TYPES D\'ANNONCES',
                value: '• Annonces générales : informations importantes pour l\'ensemble des membres\n• Annonces opérationnelles : planification des missions et exercices\n• Annonces administratives : changements de réglementation, nominations\n• Alertes urgentes : situations critiques nécessitant une action immédiate',
                inline: false
            }
        )
        .setFooter({ text: 'Division Vanguard — Canal officiel d\'information' })
        .setTimestamp();
}

function creerEmbedFAQ() {
    return new EmbedBuilder()
        .setColor(0x3498DB)
        .setTitle('FOIRE AUX QUESTIONS — DIVISION VANGUARD')
        .setDescription('Retrouvez ici les réponses aux questions les plus fréquemment posées par les nouveaux membres et les recrues.')
        .addFields(
            {
                name: 'COMMENT REJOINDRE LA DIVISION VANGUARD ?',
                value: 'Pour rejoindre notre unité, vous devez :\n1. Posséder un compte Discord actif\n2. Être âgé d\'au moins 16 ans\n3. Disposer d\'un microphone fonctionnel\n4. Accepter l\'intégralité du règlement dans <#1502110662065651872>\n5. Compléter le processus de recrutement via <#1503487120332034089>',
                inline: false
            },
            {
                name: 'QUELLES SONT LES CONDITIONS POUR PARTICIPER AUX OPÉRATIONS ?',
                value: 'Pour participer aux opérations militaires, vous devez :\n• Avoir complété la formation initiale dans <#1502321962771546194>\n• Posséder le grade de Soldat ou supérieur\n• Disposer d\'un équipement conforme aux standards\n• Être disponible aux horaires annoncés dans <#1502321950540693665>',
                inline: false
            },
            {
                name: 'COMMENT PROGRESSER DANS LA HIÉRARCHIE ?',
                value: 'La progression hiérarchique s\'effectue selon les critères suivants :\n• Ancienneté au sein de l\'unité\n• Participation régulière aux opérations\n• Comportement exemplaire\n• Réussite aux examens de promotion dans <#1502321964872892437>\n• Recommandation de vos supérieurs',
                inline: false
            },
            {
                name: 'QUE FAIRE EN CAS DE PROBLÈME TECHNIQUE ?',
                value: 'En cas de problème technique :\n1. Consultez d\'abord ce document\n2. Si votre question n\'y figure pas, ouvrez un ticket dans <#1566930356098310307>\n3. Décrivez précisément votre problème\n4. Un membre du staff vous assistera dans les meilleurs délais',
                inline: false
            },
            {
                name: 'COMMENT CONTACTER L\'ÉTAT-MAJOR ?',
                value: 'Pour contacter l\'État-Major :\n• Utilisez le système de tickets pour les demandes confidentielles\n• Postez dans <#1566930356098310307> pour les questions générales\n• Mentionnez un officier en cas d\'urgence\n• Respectez toujours la chaîne de commandement',
                inline: false
            }
        )
        .setFooter({ text: 'Division Vanguard — Document d\'information — Mis à jour régulièrement' })
        .setTimestamp();
}

function creerEmbedPresentation() {
    return new EmbedBuilder()
        .setColor(0x2E7D32)
        .setTitle('PRÉSENTATION DE LA DIVISION VANGUARD')
        .setDescription('La Division Vanguard est une unité militaire d\'élite francophone opérant sur les plateformes de simulation tactique. Notre mission est de rassembler des passionnés de stratégie militaire autour de valeurs communes : discipline, cohésion et excellence.')
        .addFields(
            {
                name: 'NOTRE VISION',
                value: 'Nous aspirons à créer une communauté soudée où chaque membre peut s\'épanouir tout en contribuant à la réussite collective. Notre approche combine rigueur militaire et esprit de camaraderie, dans le respect des traditions et de l\'innovation tactique.',
                inline: false
            },
            {
                name: 'NOS VALEURS',
                value: '• **Discipline** : Le respect des règles et de la hiérarchie\n• **Cohésion** : La solidarité entre tous les membres\n• **Excellence** : La recherche constante de la perfection\n• **Honneur** : L\'intégrité dans toutes nos actions\n• **Service** : Le dévouement à la communauté',
                inline: false
            },
            {
                name: 'NOS ACTIVITÉS',
                value: '• Opérations militaires tactiques\n• Exercices de formation réguliers dans <#1502321962771546194>\n• Simulations de scénarios complexes\n• Événements spéciaux et cérémonies\n• Sessions de recrutement et d\'intégration',
                inline: false
            },
            {
                name: 'REJOINDRE NOS RANGS',
                value: 'Si vous souhaitez intégrer la Division Vanguard :\n1. Lisez attentivement le règlement dans <#1502110662065651872>\n2. Présentez-vous dans <#1502321927509770422>\n3. Complétez le processus de recrutement via <#1503487120332034089>\n4. Suivez la formation initiale\n5. Participez à votre première opération',
                inline: false
            }
        )
        .setFooter({ text: 'Division Vanguard — Unité d\'élite francophone' })
        .setTimestamp();
}

function creerEmbedLiensUtiles() {
    return new EmbedBuilder()
        .setColor(0x9B59B6)
        .setTitle('LIENS UTILES — DIVISION VANGUARD')
        .setDescription('Retrouvez ici l\'ensemble des ressources et liens officiels de la Division Vanguard.')
        .addFields(
            {
                name: 'RESSOURCES OFFICIELLES',
                value: '• Site web officiel : [En développement]\n• Serveur Discord : discord.gg/division-vanguard\n• Page YouTube : [À venir]\n• Compte Twitter : [À venir]',
                inline: false
            },
            {
                name: 'DOCUMENTS INTERNES',
                value: '• Règlement complet : <#1502110662065651872>\n• Guide du recrue : <#1502321962771546194>\n• Procédures opérationnelles : <#1502321946543521960>\n• Tableau d\'avancement : <#1502321973076820163>',
                inline: false
            },
            {
                name: 'PARTENAIRES',
                value: '• Liste des unités partenaires : <#1510805310812717229>\n• Procédure de partenariat : Contactez l\'administration\n• Échanges inter-unités : Via les officiers désignés',
                inline: false
            },
            {
                name: 'SUPPORT ET CONTACT',
                value: '• Salon de support : <#1566930356098310307>\n• Système de tickets : Pour les demandes confidentielles\n• Contact direct : Mentionnez un membre du staff\n• Urgences : Contactez immédiatement un officier',
                inline: false
            }
        )
        .setFooter({ text: 'Division Vanguard — Ressources officielles' })
        .setTimestamp();
}

function creerEmbedPartenariat() {
    return new EmbedBuilder()
        .setColor(0x7900FF)
        .setTitle('PROGRAMME DE PARTENARIAT — DIVISION VANGUARD')
        .setDescription('La Division Vanguard est ouverte aux partenariats avec d\'autres unités militaires et communautés francophones partageant nos valeurs.')
        .addFields(
            {
                name: 'CONDITIONS DE PARTENARIAT',
                value: 'Pour établir un partenariat avec notre unité, votre communauté doit :\n• Être active depuis au moins 3 mois\n• Compter minimum 50 membres\n• Posséder un règlement clair et structuré\n• Respecter les valeurs de respect et de discipline\n• Ne pas être impliquée dans des activités illicites',
                inline: false
            },
            {
                name: 'AVANTAGES DU PARTENARIAT',
                value: '• Visibilité réciproque sur nos serveurs respectifs\n• Organisation d\'opérations conjointes\n• Échanges de membres et d\'expériences\n• Accès prioritaire aux événements spéciaux\n• Soutien mutuel en cas de besoin',
                inline: false
            },
            {
                name: 'PROCÉDURE DE DEMANDE',
                value: 'Pour soumettre une demande de partenariat :\n1. Rédigez une présentation de votre unité\n2. Contactez notre administration via <#1566930356098310307>\n3. Un officier désigné étudiera votre demande\n4. Une réponse vous sera apportée sous 7 jours\n5. En cas d\'accord, un protocole sera établi',
                inline: false
            },
            {
                name: 'UNITÉS PARTENAIRES ACTUELLES',
                value: '• [Liste à compléter selon les partenariats établis]\n• Pour devenir partenaire : contactez l\'administration\n• Les partenariats actifs sont mis en avant régulièrement dans <#1510805310812717229>',
                inline: false
            }
        )
        .setFooter({ text: 'Division Vanguard — Programme de partenariat officiel' })
        .setTimestamp();
}

// ============================================================================
// COMMANDE PRINCIPALE
// ============================================================================

module.exports = {
    data: new SlashCommandBuilder()
        .setName('message')
        .setDescription('Publier un message officiel dans un salon spécifique (Admin uniquement)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .setDMPermission(false)
        .addStringOption(option =>
            option.setName('option')
                .setDescription('Type de message à publier')
                .setRequired(true)
                .addChoices(
                    { name: 'Règlements', value: 'reglements' },
                    { name: 'Annonces', value: 'annonces' },
                    { name: 'FAQ', value: 'faq' },
                    { name: 'Présentation', value: 'presentation' },
                    { name: 'Liens utiles', value: 'liens-utiles' },
                    { name: 'Partenariat', value: 'partenariat' }
                )
        ),

    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({
                content: '[ERREUR] Vous devez posséder la permission Administrateur pour utiliser cette commande.'
            });
        }

        const option = interaction.options.getString('option');
        let embed;
        let salonId;
        let nomSalon;
        let components = [];

        switch (option) {
            case 'reglements':
                embed = creerEmbedReglementsPrincipal();
                salonId = SALONS.REGLEMENTS;
                nomSalon = 'règlements';
                components = [creerBoutonsReglements()];
                break;
            case 'annonces':
                embed = creerEmbedAnnonces();
                salonId = SALONS.ANNONCES;
                nomSalon = 'annonces';
                break;
            case 'faq':
                embed = creerEmbedFAQ();
                salonId = SALONS.FAQ;
                nomSalon = 'FAQ';
                break;
            case 'presentation':
                embed = creerEmbedPresentation();
                salonId = SALONS.PRESENTATION;
                nomSalon = 'présentation';
                break;
            case 'liens-utiles':
                embed = creerEmbedLiensUtiles();
                salonId = SALONS.LIENS_UTILES;
                nomSalon = 'liens utiles';
                break;
            case 'partenariat':
                embed = creerEmbedPartenariat();
                salonId = SALONS.PARTENARIAT;
                nomSalon = 'partenariat';
                break;
            default:
                return interaction.reply({
                    content: '[ERREUR] Option non reconnue.'
                });
        }

        const salon = interaction.guild.channels.cache.get(salonId);

        if (!salon) {
            return interaction.reply({
                content: `[ERREUR] Le salon ${nomSalon} est introuvable. Vérifiez la configuration.`
            });
        }

        try {
            await salon.send({ 
                embeds: [embed],
                components: components
            });
            
            await interaction.reply({
                content: `[SUCCÈS] Le message officiel a été publié avec succès dans <#${salonId}>.`
            });
        } catch (erreur) {
            console.error(`[MESSAGE] Erreur lors de l'envoi dans ${nomSalon} :`, erreur.message);
            await interaction.reply({
                content: `[ERREUR] Impossible de publier le message dans <#${salonId}>. Vérifiez les permissions du bot.`
            });
        }
    }
};
