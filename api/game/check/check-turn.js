const express = require('express');
const router = express.Router();
const driver = require('../../../initializeNeo4j');

// Vérifier si c'est le tour du joueur
router.get('/', async (req, res) => {
    const { playerId, gameCode } = req.query;
    const session = driver.session();

    try {
        // Récupérer le tour actuel de la partie
        const turnResult = await session.run(
            `MATCH (p:Partie {code: $gameCode})
             RETURN p.tour AS currentTurn`, // On récupère le tour actuel
            { gameCode }
        );

        if (turnResult.records.length === 0) {
            return res.status(404).json({ message: 'Partie non trouvée.' });
        }

        // Récupérer la valeur du tour actuel
        const currentTurn = turnResult.records[0].get('currentTurn');

        // Récupérer l'ID interne du joueur (node <id>)
        const playerResult = await session.run(
            `MATCH (j:Joueur {id: $playerId})-[:JOUE_DANS]->(p:Partie {code: $gameCode})
             RETURN id(j) AS neo4jPlayerId`,  // On récupère l'ID interne Neo4j du joueur
            { playerId, gameCode }
        );

        if (playerResult.records.length === 0) {
            return res.status(404).json({ message: 'Joueur non trouvé dans cette partie.' });
        }

        const neo4jPlayerId = playerResult.records[0].get('neo4jPlayerId').toInt();

        // Comparer l'ID interne du joueur avec le tour actuel
        if (neo4jPlayerId === currentTurn) {
            return res.json({ isTurn: true });
        } else {
            return res.json({ isTurn: false });
        }

    } catch (error) {
        return res.status(500).json({ message: 'Erreur lors de la vérification du tour.' });
    } finally {
        await session.close();
    }
});

module.exports = router;
