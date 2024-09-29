const express = require('express');
const router = express.Router();
const driver = require('../../../initializeNeo4j');

// Vérifier l'état de l'hypothèse
router.get('/', async (req, res) => {
    const { playerId, gameCode } = req.query;
    const session = driver.session();

    try {
        // Vérifier d'abord si le joueur a fait une hypothèse sur la salle
        const roomResult = await session.run(
            `MATCH (j:Joueur {id: $playerId})-[:FAIT_HYPOTHESE]->(h:Hypothese)-[:DANS]->(r:Pièce)
             RETURN r.name AS room`,
            { playerId }
        );

        let room = null;
        if (roomResult.records.length > 0) {
            room = roomResult.records[0].get('room');
        }

        // Si la salle a été sélectionnée, vérifier si l'arme a été choisie
        if (room) {
            const weaponResult = await session.run(
                `MATCH (j:Joueur {id: $playerId})-[:FAIT_HYPOTHESE]->(h:Hypothese)-[:AVEC]->(a:Arme)
                 RETURN a.name AS weapon`,
                { playerId }
            );

            let weapon = null;
            if (weaponResult.records.length > 0) {
                weapon = weaponResult.records[0].get('weapon');
            }

            // Si l'arme a été sélectionnée, vérifier le suspect
            if (weapon) {
                const suspectResult = await session.run(
                    `MATCH (j:Joueur {id: $playerId})-[:FAIT_HYPOTHESE]->(h:Hypothese)-[:SUR]->(s:Suspect)
                     RETURN s.name AS suspect`,
                    { playerId }
                );

                let suspect = null;
                if (suspectResult.records.length > 0) {
                    suspect = suspectResult.records[0].get('suspect');
                }

                // Retourner l'état complet de l'hypothèse
                return res.json({ suspect, room, weapon });
            }

            // Retourner l'état de l'hypothèse avec salle et arme, mais sans suspect
            return res.json({ suspect: null, room, weapon });
        }

        // Si aucune salle n'a été sélectionnée, l'hypothèse n'a pas encore commencé
        return res.json({ suspect: null, room: null, weapon: null });

    } catch (error) {
        console.error('Erreur lors de la vérification de l\'hypothèse :', error);
        return res.status(500).json({ message: 'Erreur lors de la vérification de l\'hypothèse.' });
    } finally {
        await session.close();
    }
});

module.exports = router;
