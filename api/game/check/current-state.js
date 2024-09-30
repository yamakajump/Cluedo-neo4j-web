const express = require('express');
const router = express.Router();
const driver = require('../../../initializeNeo4j');
const { getWeapons, getProfs, getRooms } = require('../../utils'); // Importer les utils pour les images

// API pour récupérer l'état actuel du jeu, incluant l'hypothèse, le joueur actif, le joueur interrogé, et si le joueur possède les cartes de l'hypothèse
router.get('/:gameCode/:playerId', async (req, res) => {
    const { gameCode, playerId } = req.params; // Récupérer gameCode et playerId depuis l'URL
    const session = driver.session();

    try {
        console.log(`Récupération de l'état du jeu pour la partie ${gameCode} et le joueur ${playerId}`);

        // Obtenir le joueur actif dans la partie (via le tour)
        const turnResult = await session.run(
            `MATCH (p:Partie {code: $gameCode})
             RETURN p.tour AS activePlayerId`,  // Récupérer l'ID du joueur actuel
            { gameCode }
        );

        if (turnResult.records.length === 0 || !turnResult.records[0].get('activePlayerId')) {
            console.log('Aucun joueur actif trouvé.');
            return res.status(404).json({ message: 'Aucun joueur actif trouvé.' });
        }

        const activePlayerId = turnResult.records[0].get('activePlayerId');
        console.log(`Joueur actif ID: ${activePlayerId}`);

        // Récupérer le nom du joueur actif
        const playerResult = await session.run(
            `MATCH (j:Joueur) WHERE ID(j) = $activePlayerId
             RETURN j.name AS activePlayerName`,
            { activePlayerId: parseInt(activePlayerId) }  // Utiliser l'ID interne Neo4j
        );

        if (playerResult.records.length === 0 || !playerResult.records[0].get('activePlayerName')) {
            console.log('Nom du joueur actif introuvable.');
            return res.status(404).json({ message: 'Nom du joueur actif introuvable.' });
        }

        const activePlayerName = playerResult.records[0].get('activePlayerName');
        console.log(`Nom du joueur actif: ${activePlayerName}`);

        // Récupérer l'hypothèse actuelle basée uniquement sur le gameCode
        const hypothesisResult = await session.run(
            `MATCH (h:Hypothese {gameCode: $gameCode})
             OPTIONAL MATCH (h)-[:DANS]->(r:Pièce)
             OPTIONAL MATCH (h)-[:AVEC]->(a:Arme)
             OPTIONAL MATCH (h)-[:SUR]->(s:Personnage)
             RETURN r.name AS room, a.name AS weapon, s.name AS suspect`,
            { gameCode }
        );

        if (hypothesisResult.records.length === 0) {
            console.log('Aucune hypothèse trouvée pour la partie.');
            return res.status(404).json({ message: 'Aucune hypothèse trouvée.' });
        }

        const roomName = hypothesisResult.records[0].get('room');
        const weaponName = hypothesisResult.records[0].get('weapon');
        const suspectName = hypothesisResult.records[0].get('suspect');

        console.log(`Hypothèse - Salle: ${roomName}, Arme: ${weaponName}, Suspect: ${suspectName}`);

        // Utiliser les utils pour obtenir les chemins des images de la salle, arme et suspect
        const roomData = getRooms().find(room => room.name === roomName);
        const weaponData = getWeapons().find(weapon => weapon.name === weaponName);
        const suspectData = getProfs().find(prof => prof.name === suspectName);

        const hypothesis = {
            room: roomData ? roomData.image : null,
            weapon: weaponData ? weaponData.image : null,
            suspect: suspectData ? suspectData.image : null
        };

        // Récupérer le joueur qui est interrogé dans cette hypothèse
        const interrogatedPlayerResult = await session.run(
            `MATCH (h:Hypothese {gameCode: $gameCode})-[:INTERROGE]->(j:Joueur)
             RETURN j.name AS interrogatedPlayerName, j.id AS interrogatedPlayerId`,
            { gameCode }
        );

        let interrogatedPlayer = { name: null, id: null };

        if (interrogatedPlayerResult.records.length > 0) {
            interrogatedPlayer = {
                name: interrogatedPlayerResult.records[0].get('interrogatedPlayerName'),
                id: interrogatedPlayerResult.records[0].get('interrogatedPlayerId')
            };
            console.log(`Joueur interrogé: ${interrogatedPlayer.name} (ID: ${interrogatedPlayer.id})`);
        }

        // Vérifier si le joueur interrogé possède une ou plusieurs cartes de l'hypothèse
        console.log('Vérification des cartes possédées par le joueur interrogé...');

        // Requêtes séparées pour chaque type de carte
        const roomPossessionResult = await session.run(
            `MATCH (j:Joueur {id: $playerId})-[:POSSEDE]->(r:Pièce {name: $room})
             RETURN 'room' AS cardType, r.name AS cardName`,
            { playerId, room: roomName }
        );

        const weaponPossessionResult = await session.run(
            `MATCH (j:Joueur {id: $playerId})-[:POSSEDE]->(a:Arme {name: $weapon})
             RETURN 'weapon' AS cardType, a.name AS cardName`,
            { playerId, weapon: weaponName }
        );

        const suspectPossessionResult = await session.run(
            `MATCH (j:Joueur {id: $playerId})-[:POSSEDE]->(p:Personnage {name: $suspect})
             RETURN 'suspect' AS cardType, p.name AS cardName`,
            { playerId, suspect: suspectName }
        );

        const possessedCards = [
            ...roomPossessionResult.records.map(record => ({ type: 'room', name: record.get('cardName') })),
            ...weaponPossessionResult.records.map(record => ({ type: 'weapon', name: record.get('cardName') })),
            ...suspectPossessionResult.records.map(record => ({ type: 'suspect', name: record.get('cardName') }))
        ];

        console.log(`Cartes possédées par le joueur interrogé: ${possessedCards.map(card => card.name).join(', ')}`);

        // Envoyer la réponse avec les détails du joueur actif, de l'hypothèse, du joueur interrogé, et des cartes possédées
        res.json({
            activePlayerName,
            hypothesis,
            interrogatedPlayer,
            possessedCards // Liste des cartes que le joueur interrogé possède, avec leur type
        });

    } catch (error) {
        console.error('Erreur lors de la récupération de l\'état du jeu :', error);
        res.status(500).json({ message: 'Erreur lors de la récupération de l\'état du jeu.' });
    } finally {
        console.log('Fermeture de la session Neo4j');
        await session.close();
    }
});

module.exports = router;
