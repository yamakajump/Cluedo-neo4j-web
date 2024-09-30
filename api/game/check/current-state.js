const express = require('express');
const router = express.Router();
const driver = require('../../../initializeNeo4j');
const { getWeapons, getProfs, getRooms } = require('../../utils'); // Importer les utils pour les images

// API pour récupérer l'état actuel du jeu, incluant l'hypothèse et le joueur actif
router.get('/:gameCode', async (req, res) => {
    const { gameCode } = req.params;
    const session = driver.session();

    try {
        console.log(`Requête reçue pour la partie avec le code: ${gameCode}`);

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
        console.log(`ID du joueur actif: ${activePlayerId}`);

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

        let hypothesis = { room: null, weapon: null, suspect: null };

        if (hypothesisResult.records.length > 0) {
            const roomName = hypothesisResult.records[0].get('room');
            const weaponName = hypothesisResult.records[0].get('weapon');
            const suspectName = hypothesisResult.records[0].get('suspect');

            console.log(`Hypothèse en cours - Salle: ${roomName}, Arme: ${weaponName}, Suspect: ${suspectName}`);

            // Utiliser les utils pour obtenir les chemins des images de la salle, arme et suspect
            const roomData = getRooms().find(room => room.name === roomName);
            const weaponData = getWeapons().find(weapon => weapon.name === weaponName);
            const suspectData = getProfs().find(prof => prof.name === suspectName);

            hypothesis = {
                room: roomData ? roomData.image : null,
                weapon: weaponData ? weaponData.image : null,
                suspect: suspectData ? suspectData.image : null
            };

            console.log(`Images récupérées - Salle: ${hypothesis.room}, Arme: ${hypothesis.weapon}, Suspect: ${hypothesis.suspect}`);
        } else {
            console.log('Aucune hypothèse en cours.');
        }

        // Envoyer la réponse avec les détails du joueur actif et de l'hypothèse
        res.json({
            activePlayerName,
            hypothesis
        });

    } catch (error) {
        console.error('Erreur lors de la récupération de l\'état du jeu :', error);
        res.status(500).json({ message: 'Erreur lors de la récupération de l\'état du jeu.' });
    } finally {
        await session.close();
    }
});

module.exports = router;
