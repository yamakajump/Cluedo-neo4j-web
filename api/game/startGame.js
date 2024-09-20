const express = require('express');
const router = express.Router();
const driver = require('../../initializeNeo4j');  // Connexion à Neo4j
const { getWeapons, getProfs, getRooms, shuffleArray, chooseRandom, removeElement } = require('./utils');

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

        // Récupérer les armes, profs (personnages) et salles
        const weapons = getWeapons().map(w => w.name);
        const profs = getProfs().map(p => p.name);
        const rooms = getRooms().map(r => r.name);

        // Étape 1 : Initialiser les nœuds des armes, profs et salles dans la base de données
        const transaction = session.beginTransaction();
        try {
            for (let weapon of weapons) {
                await transaction.run(
                    `CREATE (:Arme {name: $weapon})`,
                    { weapon }
                );
            }

            for (let room of rooms) {
                await transaction.run(
                    `CREATE (:Pièce {name: $room})`,
                    { room }
                );
            }

            for (let prof of profs) {
                await transaction.run(
                    `CREATE (:Personnage {name: $prof})`,
                    { prof }
                );
            }

            await transaction.commit();
        } catch (err) {
            console.error('Erreur lors de l\'initialisation des éléments :', err);
            await transaction.rollback();
            return res.status(500).json({ message: 'Erreur lors de l\'initialisation des éléments.' });
        }

        // Étape 2 : Créer les relations entre les salles
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
                        `MATCH (r1:Pièce {name: $from}), (r2:Pièce {name: $to})
                         CREATE (r1)-[:A_ACCES]->(r2)`,
                        { from: relation.from, to: target }
                    );
                }
            }
            await relationTransaction.commit();
        } catch (err) {
            console.error('Erreur lors de la création des relations entre salles :', err);
            await relationTransaction.rollback();
            return res.status(500).json({ message: 'Erreur lors de la création des relations entre salles.' });
        }

        // Étape 3 : Sélectionner une solution de crime
        const murderer = chooseRandom(profs);
        const weapon = chooseRandom(weapons);
        const room = chooseRandom(rooms);

        const solutionTransaction = session.beginTransaction();
        try {
            await solutionTransaction.run(
                `MATCH (p:Personnage {name: $murderer}), (a:Arme {name: $weapon}), (r:Pièce {name: $room})
                 CREATE (p)-[:A_TUE_DANS]->(r),
                        (p)-[:A_UTILISE]->(a)`,
                { murderer, weapon, room }
            );
            await solutionTransaction.commit();
        } catch (err) {
            console.error('Erreur lors de la création de la solution de crime :', err);
            await solutionTransaction.rollback();
            return res.status(500).json({ message: 'Erreur lors de la création de la solution de crime.' });
        }

        // Étape 4 : Distribuer les cartes aux joueurs
        const playersResult = await session.run(
            `MATCH (j:Joueur)-[:JOUE_DANS]->(p:Partie {code: $gameCode})
             RETURN j.name AS playerName`,
            { gameCode }
        );

        const players = playersResult.records.map(record => record.get('playerName'));
        let allElements = [...profs, ...weapons, ...rooms];
        removeElement(allElements, murderer);
        removeElement(allElements, weapon);
        removeElement(allElements, room);
        shuffleArray(allElements);

        const cardTransaction = session.beginTransaction();
        try {
            let currentPlayerIndex = 0;
            for (let element of allElements) {
                const player = players[currentPlayerIndex];
                await cardTransaction.run(
                    `MATCH (j:Joueur {name: $playerName}), (e {name: $element})
                     CREATE (j)-[:POSSEDE]->(e)`,
                    { playerName: player, element }
                );
                currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
            }
            await cardTransaction.commit();
        } catch (err) {
            console.error('Erreur lors de la distribution des cartes :', err);
            await cardTransaction.rollback();
            return res.status(500).json({ message: 'Erreur lors de la distribution des cartes.' });
        }

        // Démarrer la partie
        await session.run(
            `MATCH (p:Partie {code: $gameCode})
             SET p.started = true`,
            { gameCode }
        );

        res.json({ message: 'La partie a démarré avec succès.', started: true });
    } catch (error) {
        console.error('Erreur lors du démarrage de la partie :', error);
        res.status(500).json({ message: 'Erreur lors du démarrage de la partie.' });
    } finally {
        await session.close();
    }
});

module.exports = router;
