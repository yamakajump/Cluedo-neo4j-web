const express = require('express');
const router = express.Router();
const driver = require('../../initializeNeo4j');
const { generatePlayerId } = require('../utils');  // Utiliser UUID pour les joueurs

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

            return res.json({
                message: 'Vous êtes déjà dans une partie.',
                successJoin: true,
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
            return res.json({
                message: 'Partie introuvable.',
                successJoin: false,
                gameCode
            });
        }

        // 3. Vérifier combien de joueurs sont déjà dans la partie
        const playerCountResult = await session.run(
            `MATCH (p:Partie {code: $gameCode})<-[:JOUE_DANS]-(j:Joueur)
             RETURN COUNT(j) AS playerCount`,
            { gameCode }
        );

        const playerCount = playerCountResult.records[0].get('playerCount').low;  // Obtenir le nombre de joueurs (Neo4j retourne un entier Long)

        if (playerCount >= 8) {
            return res.json({
                message: 'La partie est déjà pleine (8 joueurs).',
                successJoin: false,
                gameCode
            });
        }

        // 4. Vérifier si un autre joueur avec le même nom existe déjà dans la partie
        const playerNameExists = await session.run(
            `MATCH (p:Partie {code: $gameCode})<-[:JOUE_DANS]-(j:Joueur {name: $playerName})
             RETURN j`,
            { gameCode, playerName }
        );

        if (playerNameExists.records.length > 0) {
            // Si un joueur avec le même nom existe déjà dans la partie, renvoyer un message d'erreur
            return res.json({
                message: 'Ce nom est déjà utilisé par un autre joueur dans cette partie.',
                successJoin: false,
                gameCode
            });
        }

        // 5. Vérifier si l'ID du joueur existe déjà, mais avec un nom différent
        const playerExists = await session.run(
            `MATCH (j:Joueur {id: $playerId})
             RETURN j.name AS existingName`,
            { playerId }
        );

        if (playerExists.records.length > 0) {
            const existingName = playerExists.records[0].get('existingName');
            if (existingName !== playerName) {
                // Mettre à jour le nom du joueur s'il est différent
                await session.run(
                    `MATCH (j:Joueur {id: $playerId})
                     SET j.name = $playerName`,
                    { playerId, playerName }
                );
            }
        }

        // 6. Ajouter le joueur à la partie
        await session.run(
            `MERGE (j:Joueur {id: $playerId, name: $playerName})
             SET j.owner = false
             MERGE (p:Partie {code: $gameCode})
             MERGE (j)-[:JOUE_DANS]->(p)`,
            { playerId, playerName, gameCode }
        );

        // 7. Retourner les informations du joueur et de la partie
        return res.json({
            message: 'Joueur ajouté avec succès.',
            successJoin: true,
            newGameCode: gameCode,
            playerId,
            isOwner: false
        });
    } catch (error) {
        console.error('Erreur lors de la jonction à la partie :', error);
        return res.json({
            message: 'Erreur lors de la jonction à la partie.',
            successJoin: false,
            gameCode
        });
    } finally {
        await session.close();
    }
});

module.exports = router;
