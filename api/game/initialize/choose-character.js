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
        const allProfs = getProfs();  // Format : { name, image }
        const allProfsNames = allProfs.map(prof => prof.name);

        // Récupérer les personnages déjà sélectionnés dans la partie en tenant compte du gameCode
        const selectedProfsResult = await session.run(
            `MATCH (j:Joueur)-[:INCARNE_PAR]->(p:Personnage), (j)-[:JOUE_DANS]->(partie:Partie {code: $gameCode})
             RETURN p.name AS selectedProfName, j.name AS playerName;`,
            { gameCode }
        );

        // Créer un tableau de personnages déjà sélectionnés avec leur image
        const selectedProfs = selectedProfsResult.records.map(record => {
            const prof = allProfs.find(p => p.name === record.get('selectedProfName'));
            return {
                name: prof.name,
                image: prof.image,
                playerName: record.get('playerName')  // Récupérer le nom du joueur lié à ce personnage
            };
        });

        // Filtrer les personnages disponibles
        const availableProfs = allProfs.filter(prof => {
            return !selectedProfs.some(selected => selected.name === prof.name);
        });

        // Retourner les personnages sélectionnés et disponibles avec les mêmes attributs (name, image)
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
