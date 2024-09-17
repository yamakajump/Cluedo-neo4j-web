const express = require('express');
const router = express.Router();
const driver = require('../../../initializeNeo4j');  // Connexion à Neo4j

// Démarrer la partie (uniquement pour le propriétaire)
router.post('/', async (req, res) => {
    const session = driver.session();
    const { gameCode, playerName } = req.body;

    try {
        // Vérifier si le joueur est le propriétaire de la partie
        const result = await session.run(
            `MATCH (j:Joueur {name: $playerName})-[:JOUE_DANS]->(p:Partie {code: $gameCode})
             RETURN j.owner AS owner`,
            { playerName, gameCode }
        );

        if (result.records.length === 0 || !result.records[0].get('owner')) {
            return res.status(403).json({ message: 'Seul le propriétaire peut démarrer la partie' });
        }

        // Démarrer la partie (ajouter un état par exemple)
        await session.run(
            `MATCH (p:Partie {code: $gameCode})
             SET p.started = true`,
            { gameCode }
        );

        res.json({ message: 'La partie a démarré avec succès' });
    } catch (error) {
        console.error('Erreur lors du démarrage de la partie:', error);
        res.status(500).json({ message: 'Erreur lors du démarrage de la partie' });
    } finally {
        await session.close();
    }
});

module.exports = router;
