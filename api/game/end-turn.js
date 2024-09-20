const express = require('express');
const router = express.Router();
const driver = require('../../initializeNeo4j');

// Terminer le tour du joueur
router.post('/', async (req, res) => {
    const { playerId, gameCode } = req.body;
    const session = driver.session();

    try {
        // Supprimer la relation A_TOUR pour ce joueur
        await session.run(
            `MATCH (j:Joueur {id: $playerId})-[r:A_TOUR]->(p:Partie {code: $gameCode})
             DELETE r`,
            { playerId, gameCode }
        );

        // Assigner le tour au joueur suivant
        const nextPlayerResult = await session.run(
            `MATCH (p:Partie {code: $gameCode})<-[:JOUE_DANS]-(j:Joueur)
             WITH j ORDER BY j.id ASC LIMIT 1
             CREATE (j)-[:A_TOUR]->(p)`,
            { gameCode }
        );

        return res.json({ message: 'Tour terminé. Joueur suivant.' });

    } catch (error) {
        console.error('Erreur lors de la fin du tour :', error);
        return res.json({ message: 'Erreur lors de la fin du tour.' });
    } finally {
        await session.close();
    }
});

module.exports = router;
