const express = require('express');
const router = express.Router();
const driver = require('../../initializeNeo4j');  // Connexion à Neo4j

// Démarrer la partie (uniquement pour le propriétaire)
router.post('/', async (req, res) => {
    const session = driver.session();
    const { gameCode, playerId } = req.body;

    try {
        // Vérifier si la partie existe
        const gameResult = await session.run(
            `MATCH (p:Partie {code: $gameCode})
             RETURN p`,
            { gameCode }
        );

        if (gameResult.records.length === 0) {
            return res.status(404).json({ message: 'Partie non trouvée.' });
        }

        // Vérifier si le joueur est dans la partie et s'il est le propriétaire
        const playerResult = await session.run(
            `MATCH (j:Joueur {id: $playerId})-[:JOUE_DANS]->(p:Partie {code: $gameCode})
             RETURN j.owner AS owner`,
            { playerId, gameCode }
        );

        if (playerResult.records.length === 0) {
            return res.status(404).json({ message: 'Joueur non trouvé dans cette partie.' });
        }

        const isOwner = playerResult.records[0].get('owner');
        if (!isOwner) {
            return res.status(403).json({ message: 'Seul le propriétaire peut démarrer la partie.' });
        }

        // Démarrer la partie en modifiant l'état de la partie
        await session.run(
            `MATCH (p:Partie {code: $gameCode})
             SET p.started = true`,
            { gameCode }
        );

        // Assure-toi de renvoyer le statut de la partie après l'avoir démarrée
        res.json({ message: 'La partie a démarré avec succès.', started: true });
    } catch (error) {
        console.error('Erreur lors du démarrage de la partie :', error);
        res.status(500).json({ message: 'Erreur lors du démarrage de la partie.' });
    } finally {
        await session.close();
    }
});

module.exports = router;
