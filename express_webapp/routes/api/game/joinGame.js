const express = require('express');
const router = express.Router();
const driver = require('../../../initializeNeo4j');
const { generatePlayerId } = require('./utils');  // Utiliser UUID pour les joueurs

// Rejoindre une partie existante pour un joueur
router.post('/', async (req, res) => {
    const session = driver.session();
    const { gameCode, playerName } = req.body;
    let playerId = req.body.playerId || generatePlayerId();  // Utiliser l'ID du joueur s'il existe déjà

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

        // Vérifier si le joueur est déjà dans une partie
        const playerResult = await session.run(
            `MATCH (j:Joueur {name: $playerName})-[:JOUE_DANS]->(p:Partie {code: $gameCode})
             RETURN j.id AS playerId`,
            { playerName, gameCode }
        );

        if (playerResult.records.length > 0) {
            // Le joueur est déjà dans la partie, renvoyer ses informations
            playerId = playerResult.records[0].get('playerId');
            return res.status(200).json({ message: 'Vous êtes déjà dans la partie.', gameCode, playerName, playerId });
        }

        // Sinon, ajouter le joueur à la partie avec un identifiant unique
        await session.run(
            `MERGE (j:Joueur {id: $playerId, name: $playerName})
             SET j.owner = false
             MERGE (p:Partie {code: $gameCode})
             MERGE (j)-[:JOUE_DANS]->(p)`,
            { playerId, playerName, gameCode }
        );

        res.json({ message: 'Joueur ajouté avec succès.', gameCode, playerName, playerId });
    } catch (error) {
        console.error('Erreur lors de la jonction à la partie :', error);
        res.status(500).json({ message: 'Erreur lors de la jonction à la partie.' });
    } finally {
        await session.close();
    }
});

module.exports = router;
