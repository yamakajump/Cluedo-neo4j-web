const express = require('express');
const router = express.Router();
const driver = require('../../initializeNeo4j');

// Faire une hypothèse
router.post('/', async (req, res) => {
    const { playerId, gameCode, suspect, room, weapon } = req.body;
    const session = driver.session();

    try {
        // Créer l'hypothèse du joueur
        await session.run(
            `MATCH (j:Joueur {id: $playerId}), (s:Suspect {name: $suspect}), (r:Pièce {name: $room}), (a:Arme {name: $weapon})
             CREATE (j)-[:FAIT_HYPOTHESE]->(h:Hypothese)-[:SUR]->(s),
                    (h)-[:DANS]->(r),
                    (h)-[:AVEC]->(a)`,
            { playerId, suspect, room, weapon }
        );

        return res.json({ message: 'Hypothèse faite avec succès.' });

    } catch (error) {
        console.error('Erreur lors de la création de l\'hypothèse :', error);
        return res.json({ message: 'Erreur lors de la création de l\'hypothèse.' });
    } finally {
        await session.close();
    }
});

module.exports = router;
