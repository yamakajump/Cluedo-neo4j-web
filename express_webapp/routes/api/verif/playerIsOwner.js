const driver = require('../../../initializeNeo4j'); // Connexion à Neo4j

// Fonction pour vérifier si un joueur est propriétaire d'une partie
async function playerIsOwner(req, res) {
    const playerId = req.query.playerId; // Récupérer l'ID du joueur depuis la requête

    if (!playerId) {
        return res.status(400).json({ message: 'ID de joueur non fourni.' });
    }

    const session = driver.session();

    try {
        // Vérifier si le joueur existe dans la base de données
        const playerExistResult = await session.run(
            `MATCH (j:Joueur {id: $playerId})
             RETURN j`,
            { playerId }
        );

        if (playerExistResult.records.length === 0) {
            // Si le joueur n'existe pas, retourner une réponse 404
            return res.status(404).json({ message: 'Joueur non trouvé.' });
        }

        // Vérifier si le joueur est propriétaire ou dans une partie
        const result = await session.run(
            `MATCH (j:Joueur {id: $playerId})-[:JOUE_DANS]->(p:Partie)
             RETURN p.code AS gameCode, j.owner AS isOwner`,
            { playerId }
        );

        if (result.records.length === 0) {
            // Si le joueur n'est dans aucune partie
            return res.status(200).json({
                isOwner: false,
                gameCode: null
            });
        }

        const gameCode = result.records[0].get('gameCode');
        const isOwner = result.records[0].get('isOwner');

        return res.status(200).json({
            isOwner,
            gameCode
        });

    } catch (error) {
        console.error('Erreur lors de la vérification du propriétaire de la partie :', error);
        return res.status(500).json({ message: 'Erreur lors de la vérification du joueur.' });
    } finally {
        await session.close();
    }
}

module.exports = playerIsOwner;
