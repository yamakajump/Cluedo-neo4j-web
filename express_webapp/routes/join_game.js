var express = require('express');
var router = express.Router();
const driver = require('../initializeNeo4j');  // Connexion à Neo4j

router.get('/:code', async function(req, res, next) {
    const gameCode = req.params.code;
    const pseudo = req.query.pseudo;  // Récupérer le pseudo dans l'URL

    const session = driver.session();
    try {
        // Vérifier si la partie existe
        const result = await session.run(
            `MATCH (p:Partie {code: $gameCode})
             RETURN p`,
            { gameCode }
        );

        if (result.records.length === 0) {
            return res.status(404).send('Partie introuvable');
        }

        // Ajouter le joueur à la partie
        await session.run(
            `MERGE (j:Joueur {name: $pseudo})
             MERGE (p:Partie {code: $gameCode})
             MERGE (j)-[:JOUE_DANS]->(p)`,
            { pseudo, gameCode }
        );

        res.render('join_game', { gameCode: gameCode, pseudo: pseudo });
    } catch (error) {
        console.error('Erreur lors de la jonction à la partie:', error);
        res.status(500).send('Erreur lors de la jonction à la partie.');
    } finally {
        await session.close();
    }
});

module.exports = router;
