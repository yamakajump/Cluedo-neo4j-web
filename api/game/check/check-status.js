const express = require('express');
const router = express.Router();
const driver = require('../../../initializeNeo4j');

// Vérifier si tous les joueurs ont choisi un personnage (lien INCARNE)
router.get('/', async (req, res) => {
    const { gameCode } = req.query;
    const session = driver.session();

    try {
        // Vérifier si la partie a commencé (choix des personnages) et si les joueurs sont dans la partie
        const gameResult = await session.run(
            `MATCH (p:Partie {code: $gameCode})
             RETURN p.started AS started`,
            { gameCode }
        );

        if (gameResult.records.length === 0) {
            return res.status(404).json({ message: 'Partie non trouvée.' });
        }

        const started = gameResult.records[0].get('started');

        // Si la partie a commencé (choix des personnages), vérifier si tous les joueurs ont choisi un personnage
        if (started) {
            const playersResult = await session.run(
                `MATCH (p:Partie {code: $gameCode})<-[:JOUE_DANS]-(j:Joueur)
                 OPTIONAL MATCH (j)-[:INCARNE]->(c:Personnage)
                 RETURN COUNT(j) AS totalPlayers, COUNT(c) AS playersWithCharacter`,
                { gameCode }
            );

            const totalPlayers = playersResult.records[0].get('totalPlayers').low;
            const playersWithCharacter = playersResult.records[0].get('playersWithCharacter').low;

            const allPlayersHaveCharacter = totalPlayers === playersWithCharacter;

            return res.json({
                started: true,
                allPlayersHaveCharacter
            });
        } else {
            // La partie n'a pas encore commencé
            return res.json({ started: false });
        }

    } catch (error) {
        console.error('Erreur lors de la vérification du statut des joueurs :', error);
        return res.status(500).json({ message: 'Erreur lors de la vérification du statut des joueurs.' });
    } finally {
        await session.close();
    }
});

module.exports = router;
