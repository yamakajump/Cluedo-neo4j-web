const express = require('express');
const router = express.Router();
const driver = require('../../../initializeNeo4j');
const { getWeapons, getProfs, getRooms } = require('../../utils'); // Importer les utils pour les images

// API pour vérifier si une carte a été montrée dans une hypothèse et retourner l'image de la carte
router.get('/:gameCode/:playerId', async (req, res) => {
    const { gameCode, playerId } = req.params; // Récupérer gameCode et playerId depuis l'URL
    const session = driver.session();

    try {
        console.log(`Vérification de la carte montrée pour la partie ${gameCode} par le joueur ${playerId}`);

        // Vérifier si une carte a été montrée dans l'hypothèse
        const hypothesisResult = await session.run(
            `MATCH (h:Hypothese {gameCode: $gameCode})
             RETURN h.showCard AS shownCard`,  // Récupérer la carte montrée (weapon, room, suspect)
            { gameCode }
        );

        const shownCardType = hypothesisResult.records[0].get('shownCard');
        
        // Gérer le cas où aucune carte n'a encore été montrée
        if (!shownCardType) {
            console.log('La carte n\'a pas encore été choisie.');
            return res.status(200).json({ message: 'La carte n\'a pas encore été choisie.' });
        }

        console.log(`Carte montrée : ${shownCardType}`);

        // Déterminer l'image à renvoyer en fonction de la carte montrée
        let cardImage = null;

        if (shownCardType === 'weapon') {
            const weaponResult = await session.run(
                `MATCH (h:Hypothese {gameCode: $gameCode})-[:AVEC]->(a:Arme)
                 RETURN a.name AS weaponName`,
                { gameCode }
            );
            if (weaponResult.records.length > 0) {
                const weaponName = weaponResult.records[0].get('weaponName');
                const weaponData = getWeapons().find(weapon => weapon.name === weaponName);
                cardImage = weaponData ? weaponData.image : null;
            }
        } else if (shownCardType === 'room') {
            const roomResult = await session.run(
                `MATCH (h:Hypothese {gameCode: $gameCode})-[:DANS]->(r:Pièce)
                 RETURN r.name AS roomName`,
                { gameCode }
            );
            if (roomResult.records.length > 0) {
                const roomName = roomResult.records[0].get('roomName');
                const roomData = getRooms().find(room => room.name === roomName);
                cardImage = roomData ? roomData.image : null;
            }
        } else if (shownCardType === 'suspect') {
            const suspectResult = await session.run(
                `MATCH (h:Hypothese {gameCode: $gameCode})-[:SUR]->(p:Personnage)
                 RETURN p.name AS suspectName`,
                { gameCode }
            );
            if (suspectResult.records.length > 0) {
                const suspectName = suspectResult.records[0].get('suspectName');
                const suspectData = getProfs().find(prof => prof.name === suspectName);
                cardImage = suspectData ? suspectData.image : null;
            }
        }

        // Si une image a été trouvée, renvoyer l'information
        if (cardImage) {
            console.log(`Carte montrée avec image : ${cardImage}`);
            res.status(200).json({ message: 'Carte montrée', card: shownCardType, cardImage });
        } else {
            console.log('Aucune image trouvée pour la carte montrée.');
            res.status(200).json({ message: 'Le joueur n\'a pas de carte à montrer.' });
        }

    } catch (error) {
        console.error('Erreur lors de la vérification de la carte montrée :', error);
        res.status(500).json({ message: 'Erreur lors de la vérification de la carte montrée.' });
    } finally {
        console.log('Fermeture de la session Neo4j');
        await session.close();
    }
});

module.exports = router;
