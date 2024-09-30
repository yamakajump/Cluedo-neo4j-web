const express = require('express');
const router = express.Router();
const driver = require('../../../initializeNeo4j');

// Sélectionner un suspect pour l'hypothèse
router.post('/', async (req, res) => {
    const { playerId, gameCode, suspectName } = req.body;
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

        // Vérifier que le suspect existe pour cette partie
        const suspectResult = await session.run(
            `MATCH (s:Personnage {name: $suspectName, gameCode: $gameCode}) RETURN s`,
            { suspectName, gameCode }
        );

        if (suspectResult.records.length === 0) {
            return res.status(404).json({ message: 'Suspect non trouvé.' });
        }

        // Créer le lien entre l'hypothèse et le suspect
        await session.run(
            `MATCH (h:Hypothese {gameCode: $gameCode}), (s:Personnage {name: $suspectName, gameCode: $gameCode})
             CREATE (h)-[:SUR]->(s)`,
            { gameCode, suspectName }
        );

        res.json({ message: 'Suspect sélectionné avec succès.' });

    } catch (error) {
        console.error('Erreur lors de la sélection du suspect :', error);
        res.status(500).json({ message: 'Erreur lors de la sélection du suspect.' });
    } finally {
        await session.close();
    }
});

module.exports = router;
