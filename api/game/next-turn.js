const express = require('express');
const router = express.Router();
const driver = require('../../initializeNeo4j');

// Route pour passer au tour suivant
router.post('/', async (req, res) => {
    const { playerId, gameCode } = req.body;
    const session = driver.session();

    try {
        console.log(`Passage au tour suivant pour la partie ${gameCode} par le joueur ${playerId}`);

        // Étape 1: Vérifier que le joueur qui fait la requête est bien le joueur actuel
        const currentPlayerResult = await session.run(
            `MATCH (p:Partie {code: $gameCode})<-[:JOUE_DANS]-(j:Joueur {id: $playerId})
             RETURN p.tour AS currentTurnId, ID(j) AS requestingPlayerId`,
            { gameCode, playerId }
        );

        if (currentPlayerResult.records.length === 0) {
            console.log('Joueur non trouvé ou joueur ne participe pas à cette partie.');
            return res.status(404).json({ message: 'Joueur non trouvé ou joueur ne participe pas à cette partie.' });
        }

        const currentTurnId = currentPlayerResult.records[0].get('currentTurnId');
        const requestingPlayerId = currentPlayerResult.records[0].get('requestingPlayerId').low;

        console.log(`ID du joueur ayant le tour actuel : ${currentTurnId}`);
        console.log(`ID du joueur qui demande à passer au tour suivant : ${requestingPlayerId}`);

        if (currentTurnId !== requestingPlayerId) {
            console.log('Ce joueur ne peut pas passer au tour suivant car ce n\'est pas son tour.');
            return res.status(403).json({ message: 'Ce n\'est pas votre tour, vous ne pouvez pas passer au tour suivant.' });
        }

        console.log('Le joueur est bien celui qui a le tour, le passage au tour suivant peut continuer.');

        // Étape 2: Enlever tous les liens que possède l'hypothèse de la partie
        await session.run(
            `MATCH (h:Hypothese {gameCode: $gameCode})-[r]->()
             DELETE r`,
            { gameCode }
        );
        console.log('Tous les liens de l\'hypothèse ont été supprimés.');

        // Étape 3: Remettre la variable showCard à null dans l'hypothèse
        await session.run(
            `MATCH (h:Hypothese {gameCode: $gameCode})
             SET h.showCard = null`,
            { gameCode }
        );
        console.log('La variable showCard a été remise à null.');

        // Étape 4: Changer le tour sur la partie en sélectionnant le prochain joueur
        // 1. Récupérer tous les joueurs dans la partie, triés par ID
        const playersResult = await session.run(
            `MATCH (j:Joueur)-[:JOUE_DANS]->(p:Partie {code: $gameCode})
             RETURN ID(j) AS playerId
             ORDER BY playerId ASC`,
            { gameCode }
        );

        const playerIds = playersResult.records.map(record => record.get('playerId').low); // Conversion des IDs Neo4j en entier
        console.log(`IDs des joueurs dans la partie : ${playerIds}`);

        // 2. Trouver l'ID du prochain joueur
        const currentIndex = playerIds.indexOf(currentTurnId);
        let nextTurnId;

        if (currentIndex === playerIds.length - 1) {
            // Si le joueur actuel est le dernier, prendre le premier joueur
            nextTurnId = playerIds[0];
        } else {
            // Sinon, prendre le joueur suivant
            nextTurnId = playerIds[currentIndex + 1];
        }

        console.log(`Le prochain joueur ID: ${nextTurnId}`);

        // 3. Mettre à jour le tour dans la partie
        await session.run(
            `MATCH (p:Partie {code: $gameCode})
             SET p.tour = $nextTurnId`,
            { gameCode, nextTurnId }
        );
        console.log('Le tour a été mis à jour.');

        // Répondre avec succès
        res.status(200).json({ message: 'Tour suivant activé avec succès.' });

    } catch (error) {
        console.error('Erreur lors du passage au tour suivant :', error);
        res.status(500).json({ message: 'Erreur lors du passage au tour suivant.' });
    } finally {
        await session.close();
    }
});

module.exports = router;
