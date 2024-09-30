const express = require('express');
const router = express.Router();
const { getWeapons } = require('../../utils');

// API pour récupérer toutes les armes disponibles
router.get('/', async (req, res) => {
    try {
        const availableWeapons = getWeapons();  // Récupérer les armes via l'utilitaire
        res.json({ availableWeapons });
    } catch (error) {
        console.error('Erreur lors de la récupération des armes :', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des armes.' });
    }
});

module.exports = router;
