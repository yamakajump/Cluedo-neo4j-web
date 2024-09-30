const express = require('express');
const router = express.Router();
const driver = require('../../../initializeNeo4j');
const { getRooms } = require('../../utils'); // Utilisation des rooms du fichier utils

// API pour récupérer les salles accessibles depuis la salle actuelle du joueur
router.get('/:gameCode/:playerId', async (req, res) => {
    const { gameCode, playerId } = req.params;
    const session = driver.session();

    try {
        // 1. Récupérer la salle actuelle du joueur
        const currentRoomResult = await session.run(
            `MATCH (j:Joueur {id: $playerId})-[:EST_DANS]->(currentRoom:Pièce {gameCode: $gameCode})
             RETURN currentRoom.name AS roomName`,
            { playerId, gameCode }
        );

        if (currentRoomResult.records.length === 0) {
            return res.status(404).json({ message: "Salle actuelle non trouvée pour le joueur." });
        }

        const currentRoomName = currentRoomResult.records[0].get('roomName');

        // 2. Récupérer les salles accessibles depuis la salle actuelle
        const accessibleRoomsResult = await session.run(
            `MATCH (currentRoom:Pièce {name: $currentRoomName, gameCode: $gameCode})-[:A_ACCES]->(accessibleRoom:Pièce {gameCode: $gameCode})
             RETURN accessibleRoom.name AS roomName`,
            { currentRoomName, gameCode }
        );

        // 3. Filtrer les salles accessibles et récupérer leurs images
        const allRooms = getRooms();
        const accessibleRooms = accessibleRoomsResult.records.map(record => {
            const roomName = record.get('roomName');
            const room = allRooms.find(r => r.name === roomName);
            return room ? { name: room.name, image: room.image } : null;
        }).filter(Boolean);  // Filtrer les rooms null

        res.json({ accessibleRooms });
    } catch (error) {
        console.error('Erreur lors de la récupération des salles accessibles :', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des salles accessibles.' });
    } finally {
        await session.close();
    }
});

module.exports = router;
