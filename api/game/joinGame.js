const express = require('express');
const router = express.Router();
const driver = require('../../initializeNeo4j');
const { generatePlayerId } = require('./utils');  // Utiliser UUID pour les joueurs

router.post('/', async (req, res) => {
    const session = driver.session();
    const { gameCode, playerName } = req.body;
    let playerId = req.body.playerId || generatePlayerId();  // Utiliser l'ID du joueur s'il existe déjà ou en générer un nouveau

    try {
        // 1. Vérifier si le joueur est déjà dans une partie
        const playerInGameResult = await session.run(
            `MATCH (j:Joueur {id: $playerId})-[:JOUE_DANS]->(p:Partie)
             RETURN p.code AS existingGameCode, j.owner AS isOwner`,
            { playerId }
        );

        if (playerInGameResult.records.length > 0) {
            // Le joueur est déjà dans une partie, retourner les informations existantes
            const existingGameCode = playerInGameResult.records[0].get('existingGameCode');
            const isOwner = playerInGameResult.records[0].get('isOwner');

            return res.status(200).json({
                message: 'Vous êtes déjà dans une partie.',
                newGameCode: existingGameCode,
                playerId,
                isOwner
            });
        }

        // 2. Si le joueur n'est pas dans une partie, vérifier si la partie spécifiée existe
        const gameResult = await session.run(
            `MATCH (p:Partie {code: $gameCode})
             RETURN p`,
            { gameCode }
        );

        if (gameResult.records.length === 0) {
            return res.status(404).json({ message: 'Partie introuvable.', gameCode });
        }

        // 3. Ajouter le joueur à la partie
        await session.run(
            `MERGE (j:Joueur {id: $playerId, name: $playerName})
             SET j.owner = false
             MERGE (p:Partie {code: $gameCode})
             MERGE (j)-[:JOUE_DANS]->(p)`,
            { playerId, playerName, gameCode }
        );

        // 4. Retourner les informations du joueur et de la partie
        res.status(200).json({
            message: 'Joueur ajouté avec succès.',
            newGameCode: gameCode,
            playerId,
            isOwner: false
        });
    } catch (error) {
        console.error('Erreur lors de la jonction à la partie :', error);
        res.status(500).json({ message: 'Erreur lors de la jonction à la partie.', gameCode });
    } finally {
        await session.close();
    }
});

module.exports = router;
