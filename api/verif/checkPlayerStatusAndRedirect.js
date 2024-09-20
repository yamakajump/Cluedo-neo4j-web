const express = require('express');
const router = express.Router();
const driver = require('../../initializeNeo4j'); // Connexion à Neo4j

// Méthode pour vérifier l'état d'un joueur, son existence et rediriger en conséquence
router.post('/', async (req, res) => {
    const session = driver.session();
    const playerId = req.body.playerId;  // Utiliser l'ID du joueur depuis la session

    if (!playerId) {
        // Si l'ID du joueur n'est pas défini, retourner qu'il n'y a pas de redirection à faire
        return res.status(200).json({
            message: 'Aucun joueur trouvé.',
            redirection: false,
            gameCode: null,
            playerId: null,
            isOwner: null
        });
    }

    try {
        // 1. Vérifier si le joueur est dans une partie
        const playerInGameResult = await session.run(
            `MATCH (j:Joueur {id: $playerId})-[:JOUE_DANS]->(p:Partie)
             RETURN p.code AS gameCode, j.owner AS isOwner`,
            { playerId }
        );

        if (playerInGameResult.records.length > 0) {
            // Le joueur est déjà dans une partie, retourner les informations existantes
            const gameCode = playerInGameResult.records[0].get('gameCode');
            const isOwner = playerInGameResult.records[0].get('isOwner');

            return res.status(200).json({
                message: 'Joueur trouvé et redirection nécessaire.',
                redirection: true,
                gameCode,
                playerId,
                isOwner
            });
        }

        // Si le joueur n'est dans aucune partie, retourner qu'il n'a pas de partie en cours
        return res.status(200).json({
            message: 'Joueur trouvé, mais aucune partie en cours.',
            redirection: false,
            gameCode: null,
            playerId,
            isOwner: null
        });

    } catch (error) {
        console.error('Erreur lors de la vérification du statut du joueur :', error);
        return res.status(500).json({
            message: 'Erreur lors de la vérification du statut du joueur.',
            redirection: false,
            gameCode: null,
            playerId,
            isOwner: null
        });
    } finally {
        await session.close();
    }
});

module.exports = router;
