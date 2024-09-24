const express = require('express');
const router = express.Router();
const driver = require('../../../initializeNeo4j');
const { getProfs } = require('../../utils'); // Importer la méthode getProfs

// API pour récupérer les personnages disponibles et ceux déjà sélectionnés
router.get('/:gameCode', async (req, res) => {
    const { gameCode } = req.params;
    const session = driver.session();

    try {
        // Récupérer tous les personnages disponibles (profs)
        const allProfs = getProfs();
        const allProfsNames = allProfs.map(prof => prof.name);

        // Récupérer les personnages déjà sélectionnés dans la partie
        const selectedProfsResult = await session.run(
            `MATCH (j:Joueur)-[:INCARNE]->(p:Personnage)-[:JOUE_DANS]->(partie:Partie {code: $gameCode})
             RETURN p.name AS selectedProfName, j.id AS playerId`,
            { gameCode }
        );

        // Créer un tableau de personnages déjà sélectionnés
        const selectedProfs = selectedProfsResult.records.map(record => ({
            name: record.get('selectedProfName'),
            playerId: record.get('playerId')
        }));

        // Filtrer les personnages disponibles
        const availableProfs = allProfs.filter(prof => {
            return !selectedProfs.some(selected => selected.name === prof.name);
        });

        // Retourner les personnages sélectionnés et disponibles
        res.json({
            selectedProfs,
            availableProfs
        });

    } catch (error) {
        console.error('Erreur lors de la récupération des personnages :', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des personnages.' });
    } finally {
        await session.close();
    }
});

module.exports = router;
