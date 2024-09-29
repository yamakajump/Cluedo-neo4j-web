const express = require('express');
const router = express.Router();
const driver = require('../../initializeNeo4j');  // Connexion à Neo4j
const { getWeapons, getProfs, getRooms, shuffleArray, chooseRandom, removeElement } = require('../utils');

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
            return res.json({ message: 'Partie non trouvée.', started: false });
        }

        // Vérifier si le joueur est dans la partie et s'il est le propriétaire
        const playerResult = await session.run(
            `MATCH (j:Joueur {id: $playerId})-[:JOUE_DANS]->(p:Partie {code: $gameCode})
             RETURN j.owner AS owner`,
            { playerId, gameCode }
        );

        if (playerResult.records.length === 0) {
            return res.json({ message: 'Joueur non trouvé dans cette partie.', started: false });
        }

        const isOwner = playerResult.records[0].get('owner');
        if (!isOwner) {
            return res.json({ message: 'Seul le propriétaire peut démarrer la partie.', started: false });
        }

        // Vérifier le nombre de joueurs dans la partie
        const playersCountResult = await session.run(
            `MATCH (p:Partie {code: $gameCode})<-[:JOUE_DANS]-(j:Joueur)
             RETURN COUNT(j) AS playerCount`,
            { gameCode }
        );

        const playerCount = playersCountResult.records[0].get('playerCount').low;

        if (playerCount < 2 || playerCount > 8) {
            return res.json({ message: 'La partie ne peut être lancée qu\'avec un minimum de 2 joueurs et un maximum de 8 joueurs.', started: false });
        }

        // Récupérer les armes, profs (personnages) et salles
        const weapons = getWeapons().map(w => w.name);
        const profs = getProfs().map(p => p.name);
        const rooms = getRooms().map(r => r.name);

        // Étape 1 : Initialiser les nœuds des armes, profs et salles dans la base de données en incluant le gameCode
        const transaction = session.beginTransaction();
        try {
            for (let weapon of weapons) {
                await transaction.run(
                    `CREATE (:Arme {name: $weapon, gameCode: $gameCode})`,
                    { weapon, gameCode }
                );
            }

            for (let room of rooms) {
                await transaction.run(
                    `CREATE (:Pièce {name: $room, gameCode: $gameCode})`,
                    { room, gameCode }
                );
            }

            for (let prof of profs) {
                await transaction.run(
                    `CREATE (:Personnage {name: $prof, gameCode: $gameCode})`,
                    { prof, gameCode }
                );
            }

            // Création du nœud Hypothese et liaison avec la partie
            await transaction.run(
                `MATCH (p:Partie {code: $gameCode})
                 CREATE (h:Hypothese {gameCode: $gameCode})-[:CONCERNE_PARTIE]->(p)`,
                { gameCode }
            );

            await transaction.commit();
        } catch (err) {
            console.error('Erreur lors de l\'initialisation des éléments :', err);
            await transaction.rollback();
            return res.json({ message: 'Erreur lors de l\'initialisation des éléments.', started: false });
        }

        // Étape 2 : Créer les relations entre les salles (pas de changement nécessaire ici)
        const roomRelations = [
            { from: 'RU', to: ['Cafétéria', 'Amphi B'] },
            { from: 'BU', to: ['Cafétéria', 'Amphi C'] },
            { from: 'Cafétéria', to: ['Secrétariat', 'Amphi A', 'RU', 'BU', 'Imprimerie'] },
            { from: 'Amphi A', to: ['Cafétéria', 'Secrétariat', 'Salle des profs'] },
            { from: 'Amphi B', to: ['RU', 'Cafétéria', 'BU', 'Amphi C'] },
            { from: 'Amphi C', to: ['Amphi B', 'BU'] },
            { from: 'Secrétariat', to: ['Salle des profs', 'Amphi A', 'Cafétéria'] },
            { from: 'Salle des profs', to: ['Amphi A', 'Secrétariat'] },
            { from: 'Imprimerie', to: ['Cafétéria'] }
        ];

        const relationTransaction = session.beginTransaction();
        try {
            for (let relation of roomRelations) {
                for (let target of relation.to) {
                    await relationTransaction.run(
                        `MATCH (r1:Pièce {name: $from, gameCode: $gameCode}), (r2:Pièce {name: $to, gameCode: $gameCode})
                         CREATE (r1)-[:A_ACCES]->(r2)`,
                        { from: relation.from, to: target, gameCode }
                    );
                }
            }
            await relationTransaction.commit();
        } catch (err) {
            console.error('Erreur lors de la création des relations entre salles :', err);
            await relationTransaction.rollback();
            return res.json({ message: 'Erreur lors de la création des relations entre salles.', started: false });
        }

        // Étape 3 : Sélectionner une solution de crime
        const murderer = chooseRandom(profs);
        const weapon = chooseRandom(weapons);
        const room = chooseRandom(rooms);

        const solutionTransaction = session.beginTransaction();
        try {
            await solutionTransaction.run(
                `MATCH (p:Personnage {name: $murderer, gameCode: $gameCode}), (a:Arme {name: $weapon, gameCode: $gameCode}), (r:Pièce {name: $room, gameCode: $gameCode})
                 CREATE (p)-[:A_TUE_DANS]->(r),
                        (p)-[:A_UTILISE]->(a)`,
                { murderer, weapon, room, gameCode }
            );
            await solutionTransaction.commit();
        } catch (err) {
            console.error('Erreur lors de la création de la solution de crime :', err);
            await solutionTransaction.rollback();
            return res.json({ message: 'Erreur lors de la création de la solution de crime.', started: false });
        }

        // Étape 4 : Distribuer les cartes aux joueurs
        const playersResult = await session.run(
            `MATCH (j:Joueur)-[:JOUE_DANS]->(p:Partie {code: $gameCode})
             RETURN j.id AS playerId`,
            { gameCode }
        );

        const players = playersResult.records.map(record => record.get('playerId'));
        let allElements = [...profs, ...weapons, ...rooms];
        removeElement(allElements, murderer);
        removeElement(allElements, weapon);
        removeElement(allElements, room);
        shuffleArray(allElements);

        const cardTransaction = session.beginTransaction();
        try {
            let currentPlayerIndex = 0;
            for (let element of allElements) {
                const playerId = players[currentPlayerIndex];
                await cardTransaction.run(
                    `MATCH (j:Joueur {id: $playerId}), (e {name: $element, gameCode: $gameCode})
                     CREATE (j)-[:POSSEDE]->(e)`,
                    { playerId, element, gameCode }
                );
                currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
            }
            await cardTransaction.commit();
        } catch (err) {
            console.error('Erreur lors de la distribution des cartes :', err);
            await cardTransaction.rollback();
            return res.json({ message: 'Erreur lors de la distribution des cartes.', started: false });
        }

        // Étape 5 : mettre tous les joueurs dans la salle de départ (Cafétéria)
        const startRoom = 'Cafétéria';
        const startRoomTransaction = session.beginTransaction();
        try {
            for (let player of players) {
                await startRoomTransaction.run(
                    `MATCH (j:Joueur {id: $playerId}), (r:Pièce {name: $room, gameCode: $gameCode})
                     CREATE (j)-[:EST_DANS]->(r)`,
                    { playerId: player, room: startRoom, gameCode }
                );
            }
            await startRoomTransaction.commit();
        } catch (err) {
            console.error('Erreur lors de la mise en place des joueurs dans la salle de départ :', err);
            await startRoomTransaction.rollback();
            return res.json({ message: 'Erreur lors de la mise en place des joueurs dans la salle de départ.', started: false });
        }

        // Étape 6 : Marquer la partie comme démarrée
        await session.run(
            `MATCH (p:Partie {code: $gameCode})
             SET p.started = true`,
            { gameCode }
        );

        res.json({ message: 'La partie a démarré avec succès.', started: true });
    } catch (error) {
        console.error('Erreur lors du démarrage de la partie :', error);
        res.json({ message: 'Erreur lors du démarrage de la partie.', started: false });
    } finally {
        await session.close();
    }
});

module.exports = router;
