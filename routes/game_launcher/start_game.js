require('dotenv').config();  // Charger les variables d'environnement depuis le fichier .env
const express = require('express');
const router = express.Router();
const axios = require('axios');

// Récupérer les variables d'environnement pour l'IP du serveur et le port
const SERVER_IP = process.env.SERVER_IP || 'localhost';
const EXPRESS_PORT = process.env.EXPRESS_PORT || 3000;

/* GET start game page */
router.get('/:gameCode', async (req, res) => {
    const { gameCode } = req.params;
    const playerId = req.session.playerId;

    try {
        // Utilisation des variables d'environnement pour l'URL de l'API
        const response = await axios.post(`http://${SERVER_IP}:${EXPRESS_PORT}/api/game/startGame`, {
            gameCode,
            playerId
        });
        const gameStatus = response.data;

        if (gameStatus.started) {
            //TODO 
            // res.render('game/game', { gameCode, playerId });
        } else {
            res.status(400).send('La partie n\'a pas encore démarré.');
        }
    } catch (error) {
        console.error('Erreur lors de la récupération du statut de la partie :', error);
        res.status(500).send('Erreur lors de la récupération du statut de la partie.');
    }
});

module.exports = router;
