# Division Vanguard Management Bot

Bot de gestion militaire pour le serveur Discord **Division Vanguard**.

## Commandes disponibles

### `/serverinfo` (Admin uniquement)
Recupere toutes les informations du serveur et les envoie en DM sous forme de fichier texte.

### `/former` (Officiers superieurs+)
Certifie un membre dans une specialite militaire.
- Envoie un message automatique dans `resultats-formation`
- Log dans `logs-bot`

### `/fiche` (Tous les membres)
Genere la fiche matricule complete d'un membre avec son grade, ses certifications et ses roles.

### `/rapport` (Sous-officiers+)
Ouvre un formulaire pour rediger un rapport de mission officiel (AAR).
- Message automatique dans `rapports-mission`
- Copie dans `debrief-apres-mission` pour l'Etat-Major
- Log dans `logs-bot`

### `/sanction` (Sous-officiers+)
Inflige une sanction disciplinaire (avertissement, mute, exclusion).
- Message automatique dans `sanctions-discipl`
- Log detaille dans `sanctions-internes`
- Log dans `logs-bot`

## Architecture
