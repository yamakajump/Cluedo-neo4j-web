const express = require('express');
const router = express.Router();
const driver = require('../../initializeNeo4j');  // Connexion à Neo4j

// Route pour mettre à jour le tour du joueur dans une partie
router.post('/', async (req, res) => {
    const session = driver.session();
    const { gameCode } = req.body;

    try {
        // Vérifier si la partie existe
        const gameResult = await session.run(
            `MATCH (p:Partie {code: $gameCode})
             RETURN p.tour AS currentTour`,
            { gameCode }
        );

        if (gameResult.records.length === 0) {
            return res.status(404).json({ message: 'Partie non trouvée.' });
        }

        const currentTour = gameResult.records[0].get('currentTour').low;

        // Récupérer tous les joueurs de la partie, triés par ID interne
        const playersResult = await session.run(
            `MATCH (j:Joueur)-[:JOUE_DANS]->(p:Partie {code: $gameCode})
             RETURN id(j) AS playerId
             ORDER BY id(j) ASC`,
            { gameCode }
        );

        const players = playersResult.records.map(record => record.get('playerId').toInt());

        if (players.length === 0) {
            return res.status(404).json({ message: 'Aucun joueur trouvé dans cette partie.' });
        }

        let nextPlayerId;

        if (currentTour === -1) {
            // Si c'est le premier tour, sélectionner le joueur avec le plus petit ID interne
            nextPlayerId = players[0];
        } else {
            const currentPlayerIndex = players.indexOf(currentTour);
            if (currentPlayerIndex === -1) {
                return res.status(500).json({ message: 'Le joueur actuel est introuvable.' });
            }

            // Passer au joueur suivant ou retourner au premier joueur
            if (currentPlayerIndex === players.length - 1) {
                nextPlayerId = players[0];
            } else {
                nextPlayerId = players[currentPlayerIndex + 1];
            }
        }

        // Mettre à jour le tour dans la partie avec l'ID interne du prochain joueur
        await session.run(
            `MATCH (p:Partie {code: $gameCode})
             SET p.tour = $nextPlayerId`,
            { gameCode, nextPlayerId }
        );

        res.json({ message: 'Tour du joueur mis à jour avec succès.', nextPlayerId });
    } catch (error) {
        console.error('Erreur lors de la mise à jour du tour :', error);
        res.status(500).json({ message: 'Erreur lors de la mise à jour du tour.' });
    } finally {
        await session.close();
    }
});

module.exports = router;
