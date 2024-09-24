const express = require('express');
const router = express.Router();
const driver = require('../../../initializeNeo4j');

// Choisir un personnage
router.post('/', async (req, res) => {
    const { playerId, gameCode, characterId } = req.body;
    const session = driver.session();

    try {
        // Vérifier si le personnage est déjà pris
        const characterResult = await session.run(
            `MATCH (c:Personnage {id: $characterId})-[:INCARNE_PAR]->(j:Joueur)
             RETURN c`,
            { characterId }
        );

        if (characterResult.records.length > 0) {
            return res.status(400).json({ message: 'Personnage déjà pris.' });
        }

        // Relier le joueur au personnage
        await session.run(
            `MATCH (j:Joueur {id: $playerId}), (c:Personnage {id: $characterId})
             CREATE (j)-[:INCARNE]->(c)`,
            { playerId, characterId }
        );

        return res.json({ message: 'Personnage sélectionné avec succès.' });

    } catch (error) {
        console.error('Erreur lors du choix du personnage :', error);
        return res.json({ message: 'Erreur lors du choix du personnage.' });
    } finally {
        await session.close();
    }
});

module.exports = router;
