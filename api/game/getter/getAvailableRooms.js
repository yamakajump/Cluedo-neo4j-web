const express = require('express');
const router = express.Router();
const { getRooms } = require('../../utils');

// API pour récupérer tous les personnages disponibles
router.get('/', async (req, res) => {
    try {
        const availableSuspects = getRooms();  // Récupérer les personnages via l'utilitaire
        res.json({ availableSuspects });
    } catch (error) {
        console.error('Erreur lors de la récupération des personnages :', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des personnages.' });
    }
});

module.exports = router;
