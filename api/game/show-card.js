const express = require('express');
const router = express.Router();
const driver = require('../../initializeNeo4j');

// Route pour montrer une carte en réponse à une hypothèse
router.post('/', async (req, res) => {
    const { playerId, gameCode, card } = req.body; // Récupérer les paramètres de la requête
    const session = driver.session();

    try {
        console.log(`Tentative de révélation d'une carte pour la partie ${gameCode} par le joueur ${playerId}. Carte : ${card}`);

        // Vérifier que la personne est bien celle à qui on pose l'hypothèse
        const interrogatedPlayerResult = await session.run(
            `MATCH (h:Hypothese {gameCode: $gameCode})-[:INTERROGE]->(j:Joueur {id: $playerId})
             RETURN j`,
            { gameCode, playerId }
        );

        if (interrogatedPlayerResult.records.length === 0) {
            console.log('Le joueur ne correspond pas à la personne interrogée.');
            return res.status(403).json({ message: 'Vous n\'êtes pas la personne interrogée.' });
        }

        console.log('Le joueur est bien la personne interrogée.');

        // Mettre à jour l'hypothèse pour stocker la carte montrée
        const updateHypothesisResult = await session.run(
            `MATCH (h:Hypothese {gameCode: $gameCode})
             SET h.showCard = $cardType
             RETURN h`,
            { gameCode, cardType: card }
        );

        if (updateHypothesisResult.records.length === 0) {
            console.log('Erreur lors de la mise à jour de l\'hypothèse.');
            return res.status(500).json({ message: 'Erreur lors de la mise à jour de l\'hypothèse.' });
        }

        console.log(`Carte montrée mise à jour avec succès : ${card}`);

        // Retourner une réponse de succès
        res.status(200).json({ message: 'Carte montrée avec succès.' });

    } catch (error) {
        console.error('Erreur lors de la révélation de la carte :', error);
        res.status(500).json({ message: 'Erreur lors de la révélation de la carte.' });
    } finally {
        await session.close();
        console.log('Fermeture de la session Neo4j');
    }
});

module.exports = router;
