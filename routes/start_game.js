const express = require('express');
const router = express.Router();
const axios = require('axios');

/* GET start game page */
router.get('/:gameCode', async (req, res) => {
    const { gameCode } = req.params;
    const playerId = req.session.playerId;

    try {
        const response = await axios.get(`http://localhost:3000/api/game/startGame/${gameCode}`, {
            gameCode,
            playerId
        });
        const gameStatus = response.data;

        if (gameStatus.started) {
            res.render('game', { gameCode, playerId });
        } else {
            res.status(400).send('La partie n\'a pas encore démarré.');
        }
    } catch (error) {
        console.error('Erreur lors de la récupération du statut de la partie :', error);
        res.status(500).send('Erreur lors de la récupération du statut de la partie.');
    }
});


module.exports = router;
