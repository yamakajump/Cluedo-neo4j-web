const express = require('express');
const router = express.Router();
const driver = require('../../../initializeNeo4j'); // Connexion à Neo4j

// Endpoint pour récupérer les joueurs dans une partie
router.get('/:gameCode', async (req, res) => {
    const session = driver.session();
    const { gameCode } = req.params;

    try {
        // Récupérer la liste des joueurs de la partie
        const result = await session.run(
            `MATCH (j:Joueur)-[:JOUE_DANS]->(p:Partie {code: $gameCode})
             RETURN j.name AS playerName`,
            { gameCode }
        );

        const players = result.records.map(record => record.get('playerName'));

        // Retourner la liste des joueurs
        res.json({ players });
    } catch (error) {
        console.error('Erreur lors de la récupération des joueurs:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des joueurs.' });
    } finally {
        await session.close();
    }
});

module.exports = router;
