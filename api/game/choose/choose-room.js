const express = require('express');
const router = express.Router();
const driver = require('../../../initializeNeo4j');

// Sélectionner une salle pour l'hypothèse
router.post('/', async (req, res) => {
    const { playerId, gameCode, roomName } = req.body;
    const session = driver.session();

    try {
        // Vérifier que l'hypothèse existe pour cette partie
        const hypothesisResult = await session.run(
            `MATCH (h:Hypothese {gameCode: $gameCode}) RETURN h`,
            { gameCode }
        );

        if (hypothesisResult.records.length === 0) {
            return res.status(404).json({ message: 'Hypothèse non trouvée pour cette partie.' });
        }

        // Vérifier que la salle existe pour cette partie
        const roomResult = await session.run(
            `MATCH (r:Pièce {name: $roomName, gameCode: $gameCode}) RETURN r`,
            { roomName, gameCode }
        );

        if (roomResult.records.length === 0) {
            return res.status(404).json({ message: 'Salle non trouvée.' });
        }

        // Créer le lien entre l'hypothèse et la salle
        await session.run(
            `MATCH (h:Hypothese {gameCode: $gameCode}), (r:Pièce {name: $roomName, gameCode: $gameCode})
             CREATE (h)-[:DANS]->(r)`,
            { gameCode, roomName }
        );

        res.json({ message: 'Salle sélectionnée avec succès.' });

    } catch (error) {
        console.error('Erreur lors de la sélection de la salle :', error);
        res.status(500).json({ message: 'Erreur lors de la sélection de la salle.' });
    } finally {
        await session.close();
    }
});

module.exports = router;
