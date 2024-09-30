const express = require('express');
const router = express.Router();
const driver = require('../../../initializeNeo4j');

// Vérifier l'état de l'hypothèse
router.get('/', async (req, res) => {
    const { gameCode } = req.query; // On n'a besoin que du gameCode ici
    const session = driver.session();

    try {
        // Rechercher l'hypothèse dans la partie en cours, y compris le joueur interrogé
        const hypothesisResult = await session.run(
            `MATCH (h:Hypothese)-[:CONCERNE_PARTIE]->(p:Partie {code: $gameCode})
             OPTIONAL MATCH (h)-[:DANS]->(r:Pièce)
             OPTIONAL MATCH (h)-[:AVEC]->(a:Arme)
             OPTIONAL MATCH (h)-[:SUR]->(s:Personnage)
             OPTIONAL MATCH (h)-[:INTERROGE]->(j:Joueur)
             RETURN r.name AS room, a.name AS weapon, s.name AS suspect, j.id AS interrogatedPlayerId, j.name AS interrogatedPlayerName`,
            { gameCode }
        );

        // Initialiser les valeurs à null si aucune relation n'est trouvée
        let room = null;
        let weapon = null;
        let suspect = null;
        let interrogatedPlayerId = null;
        let interrogatedPlayerName = null;

        // Si une hypothèse existe, récupérer les valeurs
        if (hypothesisResult.records.length > 0) {
            const record = hypothesisResult.records[0];
            room = record.get('room') || null;
            weapon = record.get('weapon') || null;
            suspect = record.get('suspect') || null;
            interrogatedPlayerId = record.get('interrogatedPlayerId') || null;
            interrogatedPlayerName = record.get('interrogatedPlayerName') || null;
        }

        // Retourner l'état complet de l'hypothèse avec le joueur interrogé
        return res.json({ suspect, room, weapon, interrogatedPlayerId, interrogatedPlayerName });

    } catch (error) {
        console.error('Erreur lors de la vérification de l\'hypothèse :', error);
        return res.status(500).json({ message: 'Erreur lors de la vérification de l\'hypothèse.' });
    } finally {
        await session.close();
    }
});

module.exports = router;
