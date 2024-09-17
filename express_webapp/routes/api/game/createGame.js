const express = require('express');
const router = express.Router();
const driver = require('../../../initializeNeo4j'); // Connexion à Neo4j
const { generateGameCode, generatePlayerId } = require('./utils');  // Importer les fonctions

// Créer une nouvelle partie avec un joueur comme propriétaire
router.post('/', async (req, res) => {
    const session = driver.session();
    const gameCode = generateGameCode();  // Générer un code unique pour la partie
    const playerId = generatePlayerId();  // Générer un identifiant unique pour le joueur
    const { playerName } = req.body;      // Récupérer le pseudo du joueur
    const createdAt = new Date().toISOString();

    try {
        // Créer la partie et associer le joueur avec un identifiant unique
        await session.run(
            `CREATE (p:Partie {code: $gameCode, createdAt: $createdAt})
             MERGE (j:Joueur {id: $playerId, name: $playerName})
             SET j.owner = true
             MERGE (j)-[:JOUE_DANS]->(p)`,
            { gameCode, createdAt, playerId, playerName }
        );

        // Stocker le code de la partie et les informations du joueur dans la session
        req.session.gameCode = gameCode;
        req.session.playerName = playerName;
        req.session.playerId = playerId;
        
        res.json({ gameCode, playerId });
    } catch (error) {
        console.error('Erreur lors de la création de la partie:', error);
        res.status(500).render('error', { message: 'Erreur lors de la création de la partie.' });
    } finally {
        await session.close();
    }
});

module.exports = router;
