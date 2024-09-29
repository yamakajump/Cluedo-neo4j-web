const express = require('express');
const router = express.Router();
const driver = require('../../initializeNeo4j'); // Connexion à Neo4j
const { generateGameCode, generatePlayerId } = require('../utils');  // Importer les fonctions

// Créer une nouvelle partie avec un joueur comme propriétaire
router.post('/', async (req, res) => {
    const session = driver.session();
    const gameCode = generateGameCode();  // Générer un code unique pour la partie
    const playerId = req.body.playerId || generatePlayerId();  // Utiliser l'ID du joueur existant ou en générer un nouveau
    const { playerName } = req.body;      // Récupérer le pseudo du joueur
    const createdAt = new Date().toISOString();

    try {
        // Vérifier si le joueur est déjà associé à une partie
        const playerGameResult = await session.run(
            `MATCH (j:Joueur {id: $playerId})-[:JOUE_DANS]->(p:Partie)
             RETURN p.code AS gameCode`,
            { playerId }
        );

        if (playerGameResult.records.length > 0) {
            // Le joueur a déjà une partie en cours, renvoyer une erreur avec le code de la partie
            const existingGameCode = playerGameResult.records[0].get('gameCode');
            return res.status(400).json({
                message: 'Vous avez déjà une partie en cours.',
                gameCode: existingGameCode
            });
        }

        // Vérifier si l'ID du joueur existe déjà, mais avec un nom différent
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

        // Créer la partie et associer le joueur avec un identifiant unique
        await session.run(
            `CREATE (p:Partie {code: $gameCode, started: false, createdAt: $createdAt, tour: -1, playerWin: -1})
             MERGE (j:Joueur {id: $playerId, name: $playerName, loose: false})
             SET j.owner = true
             MERGE (j)-[:JOUE_DANS]->(p)`,
            { gameCode, playerId, playerName, createdAt }
        );
        
        // Répondre avec les informations du jeu et du joueur (y compris l'ID du joueur)
        res.json({ gameCode, playerId });
    } catch (error) {
        console.error('Erreur lors de la création de la partie:', error);
        res.status(500).json({ message: 'Erreur lors de la création de la partie.' });
    } finally {
        await session.close();
    }
});

module.exports = router;
