const { Events } = require('discord.js');
const { handleRapportModal } = require('../commands/rapport');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        // Gestion des commandes slash
        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);
            if (!command) return;

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(error);
                const reply = { content: '[ERREUR] Une erreur est survenue lors de l\'execution de cette commande.', ephemeral: true };
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp(reply);
                } else {
                    await interaction.reply(reply);
                }
            }
            return;
        }

        // Gestion de l'autocomplete
        if (interaction.isAutocomplete()) {
            const command = interaction.client.commands.get(interaction.commandName);
            if (!command || !command.autocomplete) return;
            try {
                await command.autocomplete(interaction);
            } catch (error) {
                console.error(error);
            }
            return;
        }

        // Gestion des modals (rapport de mission)
        if (interaction.isModalSubmit()) {
            if (interaction.customId === 'rapport_mission_modal') {
                try {
                    await handleRapportModal(interaction);
                } catch (error) {
                    console.error(error);
                    const reply = { content: '[ERREUR] Une erreur est survenue lors de la soumission du rapport.', ephemeral: true };
                    if (interaction.replied || interaction.deferred) {
                        await interaction.followUp(reply);
                    } else {
                        await interaction.reply(reply);
                    }
                }
            }
            return;
        }
    }
};
