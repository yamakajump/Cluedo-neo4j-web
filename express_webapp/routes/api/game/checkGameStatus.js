const express = require('express');
const router = express.Router();
const driver = require('../../../initializeNeo4j'); // Connexion à Neo4j

// Vérifier si le joueur est déjà dans une partie
router.get('/', async (req, res) => {
    const playerId = req.cookies.playerId;  // Récupérer le playerId depuis le cookie

    if (!playerId) {
        return res.status(400).json({ message: 'Aucun identifiant joueur trouvé.' });
    }

    const session = driver.session();

    try {
        // Rechercher si le joueur est déjà associé à une partie
        const result = await session.run(
            `MATCH (j:Joueur {id: $playerId})-[:JOUE_DANS]->(p:Partie)
             RETURN p.code AS gameCode, p.started AS started`,
            { playerId }
        );

        if (result.records.length > 0) {
            // Si le joueur est déjà dans une partie, on renvoie les informations de cette partie
            const gameCode = result.records[0].get('gameCode');
            const started = result.records[0].get('started');

            return res.json({
                message: 'Vous êtes déjà dans une partie.',
                gameCode: gameCode,
                started: started
            });
        } else {
            // Si aucune partie n'est trouvée
            return res.json({ message: 'Aucune partie en cours pour ce joueur.' });
        }
    } catch (error) {
        console.error('Erreur lors de la vérification de la partie en cours :', error);
        res.status(500).json({ message: 'Erreur lors de la vérification de la partie en cours.' });
    } finally {
        await session.close();
    }
});

module.exports = router;
