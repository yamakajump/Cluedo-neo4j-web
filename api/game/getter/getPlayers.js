const express = require('express');
const router = express.Router();
const driver = require('../../../initializeNeo4j');
const { getProfs } = require('../../utils');  // Importer la fonction getProfs

// Récupérer les joueurs d'une partie avec l'image du personnage associé
router.get('/:gameCode', async (req, res) => {
    const { gameCode } = req.params;
    const session = driver.session();

    try {
        // Requête pour récupérer les joueurs et les personnages associés à la partie
        const playersResult = await session.run(
            `MATCH (j:Joueur)-[:JOUE_DANS]->(p:Partie {code: $gameCode})
             OPTIONAL MATCH (j)-[:INCARNE_PAR]->(c:Personnage)
             RETURN j.id AS playerId, j.name AS playerName, c.name AS characterName`,
            { gameCode }
        );

        // Récupérer les images des profs à partir du fichier utils
        const profs = getProfs();

        const players = playersResult.records.map(record => {
            const characterName = record.get('characterName');
            
            // Trouver l'image correspondante dans les profs
            const profData = profs.find(prof => prof.name === characterName);
            const characterImage = profData ? profData.image : null;

            return {
                id: record.get('playerId'),
                name: record.get('playerName'),
                characterName: characterName,
                characterImage: characterImage
            };
        });

        res.json({ players });

    } catch (error) {
        console.error('Erreur lors de la récupération des joueurs :', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des joueurs.' });
    } finally {
        await session.close();
    }
});

module.exports = router;
