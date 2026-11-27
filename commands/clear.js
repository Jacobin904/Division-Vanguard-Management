// Remplace la section de suppression en masse (ligne ~80) par ceci :

// Suppression en masse avec gestion d'erreurs
if (messagesRecents.size === 1) {
    try {
        await messagesRecents.first().delete();
    } catch (erreur) {
        if (erreur.code === 10008) {
            // Message déjà supprimé, on continue
            messagesRecents.delete(messagesRecents.first().id);
        } else {
            throw erreur;
        }
    }
} else {
    // Filtrer les messages qui existent encore
    const messagesExistants = [];
    for (const [id, message] of messagesRecents) {
        try {
            await salonCible.messages.fetch(id);
            messagesExistants.push(message);
        } catch (erreur) {
            if (erreur.code !== 10008) {
                console.error(`[CLEAR] Erreur fetch message ${id} :`, erreur.message);
            }
        }
    }
    
    if (messagesExistants.length > 0) {
        await salonCible.bulkDelete(messagesExistants, true);
    }
}
