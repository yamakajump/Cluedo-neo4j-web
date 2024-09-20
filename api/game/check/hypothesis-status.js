const express = require('express');
const router = express.Router();
const driver = require('../../../initializeNeo4j');

// Vérifier l'état de l'hypothèse
router.get('/', async (req, res) => {
    const { playerId, gameCode } = req.query;
    const session = driver.session();

    try {
        const hypothesisResult = await session.run(
            `MATCH (j:Joueur {id: $playerId})-[:FAIT_HYPOTHESE]->(h:Hypothese)-[:SUR]->(s:Suspect), 
                    (h)-[:DANS]->(r:Pièce), (h)-[:AVEC]->(a:Arme)
             RETURN s.name AS suspect, r.name AS room, a.name AS weapon`,
            { playerId }
        );

        if (hypothesisResult.records.length > 0) {
            const suspect = hypothesisResult.records[0].get('suspect');
            const room = hypothesisResult.records[0].get('room');
            const weapon = hypothesisResult.records[0].get('weapon');
            return res.json({ suspect, room, weapon });
        }

        return res.json({ suspect: null, room: null, weapon: null });

    } catch (error) {
        console.error('Erreur lors de la vérification de l\'hypothèse :', error);
        return res.json({ message: 'Erreur lors de la vérification de l\'hypothèse.' });
    } finally {
        await session.close();
    }
});

module.exports = router;
