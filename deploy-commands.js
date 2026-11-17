const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('./config');

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));
    if ('data' in command) {
        commands.push(command.data.toJSON());
    }
}

const rest = new REST().setToken(config.token);

(async () => {
    try {
        console.log(`🔄 Déploiement de ${commands.length} commande(s)...`);

        // Déploiement GLOBAL (puisque ton bot est vérifié)
        const data = await rest.put(
            Routes.applicationCommands(config.clientId),
            { body: commands }
        );

        console.log(`✅ ${data.length} commande(s) déployée(s) avec succès !`);
    } catch (error) {
        console.error('❌ Erreur lors du déploiement :', error);
    }
})();
