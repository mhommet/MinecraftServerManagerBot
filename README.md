# Discord Minecraft Manager

Bot Discord permettant de gérer des serveurs Minecraft via Docker Compose.

***

## Fonctionnalités principales

| Commande            | Description                            |
|---------------------|------------------------------------ |
| `/mc start <serveur>`   | Démarrer un serveur Minecraft       |
| `/mc stop <serveur>`    | Arrêter un serveur Minecraft        |
| `/mc list`              | Afficher la liste des serveurs      |

***

## Prérequis

- Serveurs Minecraft sous forme de dossiers avec un fichier `docker-compose.yml` présent, par exemple dans un dossier `/services/minecraftServers/`
- Docker et Docker Compose installés sur l’hôte
- Token d’un bot Discord avec les permissions nécessaires

***

## Installation

### 1. Cloner le dépôt

```bash
git clone https://github.com/votre-utilisateur/discord-minecraft-manager.git
cd discord-minecraft-manager
```

### 2. Configurer les chemins

- Modifier la variable `SERVERS_PATH` dans le fichier `bot.js` pour pointer vers le chemin monté dans le conteneur Docker, par exemple :

```js
const SERVERS_PATH = '/services/minecraftServers';
```

- S’assurer que les dossiers des serveurs existent à cet emplacement sur l’hôte, par exemple `/home/utilisateur/services/minecraftServers/minecraftvanilla`

### 3. Créer et remplir le fichier `.env`

```bash
cp .env.example .env
```

Modifier `.env` pour y insérer le token Discord :

```env
DISCORD_TOKEN=votre_token_discord
SERVERS_PATH=/services/minecraftServers
```

### 4. Lancer le bot avec Docker Compose

```bash
npm install
docker compose up -d
docker compose logs -f bot
```

***

## Personnalisation

- Pour modifier la liste des serveurs pris en charge, éditer le tableau `SERVERS` dans `bot.js`.
- Pour changer le chemin racine des serveurs, modifier la variable `SERVERS_PATH` dans `bot.js` et adapter le volume Docker dans `docker-compose.yml`.

***

## Auto-arrêt des serveurs inactifs (optionnel)

Un script bash peut être configuré pour lancer automatiquement l’arrêt des serveurs sans activité depuis plus de 48 heures.

- Installer le script `minecraft-autostop.sh` (fourni dans le dépôt) dans `/usr/local/bin/`
- Ajouter une tâche cron pour lancer ce script toutes les 48 heures par exemple :

```bash
sudo crontab -e
```

Puis ajouter :

```
0 3 */2 * * /usr/local/bin/minecraft-autostop.sh
```

***

## Dépannage

| Problème                             | Solution possible                              |
|------------------------------------|-----------------------------------------------|
| `docker: not found`                 | Monter le socket Docker dans le conteneur     |
| Erreur de chemin lors du `cd`      | Vérifier que le volume contenant les serveurs est bien monté et que les chemins sont corrects |
| Commandes slash indisponibles       | Attendre jusqu’à 15 minutes ou redémarrer le bot |
| Permissions npm                    | Reconstruire l’image Docker en nettoyant le cache |

***

## Structure attendue

```
/home/utilisateur/services/minecraftServers/
├── minecraftrpg/docker-compose.yml
├── minecraftvanilla/docker-compose.yml
└── ...
```

***

## Obtenir un token Discord

1. Aller sur https://discord.com/developers/applications
2. Créer une nouvelle application et ajouter un bot
3. Copier le token dans le fichier `.env`
4. Inviter le bot dans un serveur Discord avec les permissions adéquates

***

## Surveillance et logs

- Suivre les logs du bot :

```bash
docker compose logs -f bot
```

- Suivre les logs du script d’arrêt automatique :

```bash
tail -f /var/log/minecraft-autostop.log
```

***
