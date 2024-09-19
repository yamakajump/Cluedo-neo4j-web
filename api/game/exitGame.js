const express = require('express');
const router = express.Router();
const driver = require('../../initializeNeo4j'); // Connexion à Neo4j

// Supprimer la partie par le créateur
router.delete('/delete/:gameCode', async (req, res) => {
    const { gameCode } = req.params;
    const { playerId } = req.body; // Utiliser req.query pour récupérer playerId depuis la requête

    const session = driver.session();

    try {
        if (!playerId) {
            return res.status(400).json({ message: 'playerId manquant.' });
        }

        // Vérifier si le joueur est le propriétaire de la partie
        const result = await session.run(
            `MATCH (j:Joueur {id: $playerId})-[:JOUE_DANS]->(p:Partie {code: $gameCode})
             RETURN j.owner AS isOwner`,
            { playerId, gameCode }
        );

        if (result.records.length === 0 || !result.records[0].get('isOwner')) {
            return res.status(403).json({ message: 'Vous n\'êtes pas le propriétaire de la partie.' });
        }

        // Supprimer la partie
        await session.run(
            `MATCH (p:Partie {code: $gameCode}) DETACH DELETE p`,
            { gameCode }
        );

        res.status(200).json({ message: 'Partie supprimée avec succès.' });
    } catch (error) {
        console.error('Erreur lors de la suppression de la partie :', error);
        res.status(500).json({ message: 'Erreur lors de la suppression de la partie.' });
    } finally {
        await session.close();
    }
});

// Route pour quitter la partie
router.post('/leave/:gameCode', async (req, res) => {
    const { gameCode } = req.params;
    const { playerId } = req.body;  // Récupérer l'ID du joueur à partir du corps de la requête

    const session = driver.session();

    try {
        if (!playerId) {
            return res.status(400).json({ message: 'playerId manquant.' });
        }

        // Vérifier si le joueur est bien dans la partie
        const playerInGameResult = await session.run(
            `MATCH (j:Joueur {id: $playerId})-[:JOUE_DANS]->(p:Partie {code: $gameCode})
             RETURN j`,
            { playerId, gameCode }
        );

        if (playerInGameResult.records.length === 0) {
            return res.status(404).json({ message: 'Joueur non trouvé dans cette partie.' });
        }

        // Supprimer la relation entre le joueur et la partie
        await session.run(
            `MATCH (j:Joueur {id: $playerId})-[r:JOUE_DANS]->(p:Partie {code: $gameCode})
             DELETE r`,
            { playerId, gameCode }
        );

        res.status(200).json({ message: 'Vous avez quitté la partie.' });
    } catch (error) {
        console.error('Erreur lors de la sortie de la partie :', error);
        res.status(500).json({ message: 'Erreur lors de la sortie de la partie.' });
    } finally {
        await session.close();
    }
});

module.exports = router;
