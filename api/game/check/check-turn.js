const express = require('express');
const router = express.Router();
const driver = require('../../../initializeNeo4j');

// Vérifier si c'est le tour du joueur
router.get('/', async (req, res) => {
    const { playerId, gameCode } = req.query;
    const session = driver.session();

    try {
        const turnResult = await session.run(
            `MATCH (p:Partie {code: $gameCode})<-[:A_TOUR]-(j:Joueur {id: $playerId})
             RETURN j`,
            { playerId, gameCode }
        );

        if (turnResult.records.length > 0) {
            return res.json({ isTurn: true });
        }

        return res.json({ isTurn: false });

    } catch (error) {
        console.error('Erreur lors de la vérification du tour :', error);
        return res.json({ message: 'Erreur lors de la vérification du tour.' });
    } finally {
        await session.close();
    }
});

module.exports = router;
