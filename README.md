# Cluedo WebApp - Backend avec Express et Neo4j

## Description

Cette application est un backend pour un jeu de **Cluedo** en ligne, développé en utilisant **Node.js** avec **Express** comme framework de serveur et **Neo4j** comme base de données graph. Le projet inclut des fonctionnalités telles que la création et la gestion de parties, la jonction de joueurs, la suppression de parties, et bien plus encore. Il est également possible d'exposer le serveur local via **ngrok** pour accéder à l'application depuis une URL publique.

## Prérequis

Avant de commencer, assurez-vous d'avoir les éléments suivants installés sur votre machine :

- **Node.js** (v12.x ou plus récent)
- **npm** (gestionnaire de paquets Node.js)
- **Neo4j** (version 4.x ou plus récent)
- **ngrok** (facultatif, pour l'exposer en ligne)

## Installation

### 1. Cloner le projet

```bash
git clone https://github.com/mon-repo/cluedo-webapp.git
cd cluedo-webapp
```

### 2. Installer les dépendances

Dans le répertoire du projet, installez toutes les dépendances nécessaires avec la commande suivante :

```bash
npm install
```

### 3. Configurer Neo4j

- Assurez-vous d'avoir un serveur **Neo4j** fonctionnel en arrière-plan.
- Modifiez le fichier `initializeNeo4j.js` pour qu'il contienne les informations de connexion appropriées à votre instance **Neo4j** (nom d'utilisateur, mot de passe, etc.).

Exemple dans `initializeNeo4j.js` :

```js
const neo4j = require('neo4j-driver');

const driver = neo4j.driver('bolt://localhost', neo4j.auth.basic('neo4j', 'motdepasse'));

module.exports = driver;
```

### 4. Lancer le serveur

Une fois les dépendances installées et la configuration effectuée, lancez le serveur avec la commande suivante :

```bash
npm start
```

Votre serveur sera maintenant accessible localement à l'adresse suivante : `http://localhost:3000`.

## Exposer l'application avec ngrok

Si vous souhaitez rendre votre serveur accessible à d'autres personnes en ligne, vous pouvez utiliser **ngrok** pour exposer votre serveur local.

### 1. Installer ngrok

Si vous n'avez pas déjà **ngrok** installé, vous pouvez l'installer avec cette commande :

```bash
npm install -g ngrok
```

### 2. Lancer ngrok

Utilisez **ngrok** pour créer un tunnel HTTP vers votre serveur local en exécutant la commande suivante :

```bash
ngrok http 3000
```

**ngrok** vous fournira une URL publique comme `https://abc123.ngrok.io` que vous pourrez partager pour accéder à votre serveur local.

## Commandes Utiles

- **Démarrer le serveur** : `npm start`
- **Exposer l'application avec ngrok** : `ngrok http 3000`
- **Installer les dépendances** : `npm install`
