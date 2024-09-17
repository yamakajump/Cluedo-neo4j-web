var express = require('express');
var router = express.Router();
const axios = require('axios');

/* POST request to create game */
router.post('/', async function(req, res, next) {
    const playerName = req.body.createPseudo; // Récupérer le pseudo du formulaire

    try {
        // Appel à l'API pour créer une partie
        const response = await axios.post('http://localhost:3000/api/game/create', { playerName });

        const { gameCode, playerId } = response.data;

        // Stocker les informations dans la session
        req.session.gameCode = gameCode;
        req.session.playerName = playerName;
        req.session.playerId = playerId;  // Stocker l'ID du joueur dans la session

        // Rediriger vers la page de gestion de la partie
        res.redirect(`/create_game?gameCode=${gameCode}&playerName=${encodeURIComponent(playerName)}`);
    } catch (error) {
        console.error('Erreur lors de la création de la partie:', error);
        res.status(500).render('error', { message: 'Erreur lors de la création de la partie.' });
    }
});

module.exports = router;
