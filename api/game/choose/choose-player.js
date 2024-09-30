const express = require('express');
const router = express.Router();
const driver = require('../../../initializeNeo4j');

// Route pour choisir le joueur à interroger
router.post('/', async (req, res) => {
    const { playerId, gameCode, playerChoosedId } = req.body;
    const session = driver.session();

    console.log('Requête reçue pour choisir un joueur à interroger');
    console.log(`playerId: ${playerId}, gameCode: ${gameCode}, playerChoosedId: ${playerChoosedId}`);

    try {
        // Vérifier que la partie existe
        console.log('Vérification de l\'existence de la partie...');
        const gameResult = await session.run(
            `MATCH (p:Partie {code: $gameCode})
             RETURN p`,
            { gameCode }
        );

        if (gameResult.records.length === 0) {
            console.log(`Partie non trouvée pour le code: ${gameCode}`);
            return res.status(404).json({ message: 'Partie non trouvée.' });
        }
        console.log('Partie trouvée.');

        // Vérifier que l'hypothèse liée à la partie existe
        console.log('Vérification de l\'existence de l\'hypothèse...');
        const hypothesisResult = await session.run(
            `MATCH (h:Hypothese {gameCode: $gameCode})
             RETURN h`,
            { gameCode }
        );

        if (hypothesisResult.records.length === 0) {
            console.log(`Hypothèse non trouvée pour la partie: ${gameCode}`);
            return res.status(404).json({ message: 'Hypothèse non trouvée pour cette partie.' });
        }
        console.log('Hypothèse trouvée.');

        // Vérifier que le joueur existe dans cette partie
        console.log('Vérification de l\'existence du joueur à interroger...');
        const playerResult = await session.run(
            `MATCH (j:Joueur {id: $playerChoosedId})-[:JOUE_DANS]->(p:Partie {code: $gameCode})
             RETURN j`,
            { playerChoosedId, gameCode }
        );

        if (playerResult.records.length === 0) {
            console.log(`Joueur non trouvé pour l\'ID: ${playerChoosedId} dans la partie: ${gameCode}`);
            return res.status(404).json({ message: 'Joueur non trouvé dans cette partie.' });
        }
        console.log('Joueur trouvé.');

        // Logique pour lier l'hypothèse au joueur interrogé
        console.log('Création du lien entre l\'hypothèse et le joueur suspect...');
        await session.run(
            `MATCH (h:Hypothese {gameCode: $gameCode}), (j:Joueur {id: $playerChoosedId})
             MERGE (h)-[:INTERROGE]->(j)
             RETURN j`,
            { gameCode, playerChoosedId }
        );

        console.log(`Joueur suspect (${playerChoosedId}) lié à l'hypothèse de la partie (${gameCode}) avec succès.`);
        
        res.status(200).json({ message: 'Joueur sélectionné avec succès.' });

    } catch (error) {
        console.error('Erreur lors du choix du joueur à interroger :', error);
        res.status(500).json({ message: 'Erreur lors du choix du joueur.' });
    } finally {
        console.log('Fermeture de la session Neo4j');
        await session.close();
    }
});

module.exports = router;
