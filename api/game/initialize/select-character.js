const express = require('express');
const router = express.Router();
const driver = require('../../../initializeNeo4j');

// Choisir un personnage
router.post('/', async (req, res) => {
    const { playerId, gameCode, characterName } = req.body;
    const session = driver.session();

    try {
        // Vérifier si le joueur a déjà pris un personnage dans cette partie
        const playerHasCharacterResult = await session.run(
            `MATCH (j:Joueur {id: $playerId})-[:INCARNE_PAR]->(p:Personnage {gameCode: $gameCode})
             RETURN p`,
            { playerId, gameCode }
        );

        if (playerHasCharacterResult.records.length > 0) {
            return res.status(400).json({ message: 'Vous avez déjà sélectionné un personnage.' });
        }

        // Vérifier si le personnage est déjà pris dans cette partie spécifique
        const characterAlreadyTakenResult = await session.run(
            `MATCH (p:Personnage {name: $characterName})<-[:INCARNE_PAR]-(j:Joueur)-[:JOUE_DANS]->(partie:Partie {code: $gameCode})
             RETURN p`,
            { characterName, gameCode }
        );

        if (characterAlreadyTakenResult.records.length > 0) {
            return res.status(400).json({ message: 'Ce personnage est déjà pris par un autre joueur.' });
        }

        // Relier le joueur au personnage pour la partie spécifique
        await session.run(
            `MATCH (j:Joueur {id: $playerId}), (p:Personnage {name: $characterName})
             MATCH (partie:Partie {code: $gameCode})
             CREATE (j)-[:INCARNE_PAR]->(p)`,
            { playerId, characterName, gameCode }
        );

        return res.json({ message: 'Personnage sélectionné avec succès.' });

    } catch (error) {
        console.error('Erreur lors du choix du personnage :', error);
        return res.status(500).json({ message: 'Erreur lors du choix du personnage.' });
    } finally {
        await session.close();
    }
});

module.exports = router;
