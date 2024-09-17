const express = require('express');
const router = express.Router();
const axios = require('axios');

// Route pour supprimer la partie (seulement si le joueur est propriétaire)
router.delete('/delete/:gameCode', async (req, res) => {
    const { gameCode } = req.params;
    const playerId = req.session.playerId; // Récupérer l'ID du joueur depuis la session

    try {
        const response = await axios.delete(`http://localhost:3000/api/game/exitGame/delete/${gameCode}`, {
            data: { playerId } // Passer l'ID du joueur dans la requête
        });
        res.status(200).json({ message: response.data.message });
    } catch (error) {
        console.error('Erreur lors de la suppression de la partie :', error);
        res.status(500).json({ message: 'Erreur lors de la suppression de la partie.' });
    }
});

// Route pour quitter la partie
router.post('/leave/:gameCode', async (req, res) => {
    const { gameCode } = req.params;
    const playerId = req.session.playerId; // Récupérer l'ID du joueur depuis la session

    console.log('playerId:', playerId);

    try {
        const response = await axios.post(`http://localhost:3000/api/game/exitGame/leave/${gameCode}`, { playerId });
        res.status(200).json({ message: response.data.message });
    } catch (error) {
        console.error('Erreur lors de la sortie de la partie :', error);
        res.status(500).json({ message: 'Erreur lors de la sortie de la partie.' });
    }
});

module.exports = router;
