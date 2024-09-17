const express = require('express');
const router = express.Router();
const driver = require('../../../initializeNeo4j');  // Connexion à Neo4j
const { generatePlayerId } = require('./utils');  // Utiliser UUID pour les joueurs

// Rejoindre une partie existante pour un autre joueur
router.post('/', async (req, res) => {
    const session = driver.session();
    const { gameCode, playerName } = req.body;
    const playerId = generatePlayerId();  // Générer un identifiant unique pour le joueur

    try {
        // Vérifier si la partie existe
        const result = await session.run(
            `MATCH (p:Partie {code: $gameCode})
             RETURN p`,
            { gameCode }
        );

        if (result.records.length === 0) {
            return res.status(404).json({ message: 'Partie introuvable.' });
        }

        // Ajouter le joueur à la partie avec un identifiant unique
        await session.run(
            `MERGE (j:Joueur {id: $playerId, name: $playerName})
             SET j.owner = false
             MERGE (p:Partie {code: $gameCode})
             MERGE (j)-[:JOUE_DANS]->(p)`,
            { playerId, playerName, gameCode }
        );

        // Retourner les données au lieu de rediriger
        res.json({ message: 'Joueur ajouté avec succès.', gameCode, playerName });
    } catch (error) {
        console.error('Erreur lors de la jonction à la partie:', error);
        res.status(500).json({ message: 'Erreur lors de la jonction à la partie.' });
    } finally {
        await session.close();
    }
});

module.exports = router;
