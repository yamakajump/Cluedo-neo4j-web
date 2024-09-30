const express = require('express');
const router = express.Router();
const driver = require('../../../initializeNeo4j');

// Sélectionner une arme pour l'hypothèse
router.post('/', async (req, res) => {
    const { playerId, gameCode, weaponName } = req.body;
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

        // Vérifier que l'arme existe pour cette partie
        const weaponResult = await session.run(
            `MATCH (a:Arme {name: $weaponName, gameCode: $gameCode}) RETURN a`,
            { weaponName, gameCode }
        );

        if (weaponResult.records.length === 0) {
            return res.status(404).json({ message: 'Arme non trouvée.' });
        }

        // Créer le lien entre l'hypothèse et l'arme
        await session.run(
            `MATCH (h:Hypothese {gameCode: $gameCode}), (a:Arme {name: $weaponName, gameCode: $gameCode})
             CREATE (h)-[:AVEC]->(a)`,
            { gameCode, weaponName }
        );

        res.json({ message: 'Arme sélectionnée avec succès.' });

    } catch (error) {
        console.error('Erreur lors de la sélection de l\'arme :', error);
        res.status(500).json({ message: 'Erreur lors de la sélection de l\'arme.' });
    } finally {
        await session.close();
    }
});

module.exports = router;
