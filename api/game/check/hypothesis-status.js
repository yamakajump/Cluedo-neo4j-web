const express = require('express');
const router = express.Router();
const driver = require('../../../initializeNeo4j');

// Vérifier l'état de l'hypothèse
router.get('/', async (req, res) => {
    const { gameCode } = req.query; // Pas besoin de playerId, juste gameCode
    const session = driver.session();

    try {
        // Rechercher l'hypothèse dans la partie en cours
        const hypothesisResult = await session.run(
            `MATCH (h:Hypothese)-[:CONCERNE_PARTIE]->(p:Partie {code: $gameCode})
             OPTIONAL MATCH (h)-[:DANS]->(r:Pièce)
             OPTIONAL MATCH (h)-[:AVEC]->(a:Arme)
             OPTIONAL MATCH (h)-[:SUR]->(s:Personnage)
             RETURN r.name AS room, a.name AS weapon, s.name AS suspect`,
            { gameCode }
        );

        // Initialiser les valeurs à null si aucune relation n'est trouvée
        let room = null;
        let weapon = null;
        let suspect = null;

        // Si une hypothèse existe, récupérer les valeurs
        if (hypothesisResult.records.length > 0) {
            const record = hypothesisResult.records[0];
            room = record.get('room') || null;
            weapon = record.get('weapon') || null;
            suspect = record.get('suspect') || null;
        }

        // Retourner l'état complet de l'hypothèse
        return res.json({ suspect, room, weapon });

    } catch (error) {
        console.error('Erreur lors de la vérification de l\'hypothèse :', error);
        return res.status(500).json({ message: 'Erreur lors de la vérification de l\'hypothèse.' });
    } finally {
        await session.close();
    }
});

module.exports = router;
