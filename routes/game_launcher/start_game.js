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
    const { playerName } = req.session;  // Récupérer les informations depuis la session

    if (!gameCode || !playerName) {
        // Si le gameCode ou playerName n'est pas défini, rediriger vers la page principale
        return res.redirect('/');
    }

    // Requête vers l'API pour obtenir la liste des joueurs
    const playersResponse = await axios.get(`http://${SERVER_IP}:${EXPRESS_PORT}/api/game/getPlayers/${gameCode}`);
    const players = playersResponse.data.players;

    try {
        const response = await axios.post(`http://${SERVER_IP}:${EXPRESS_PORT}/api/game/startGame`, {
            gameCode,
            playerId
        });
        const gameStatus = response.data;

        if (gameStatus.started) {
            // Si la partie a démarré, rediriger vers la vue de la partie
            res.redirect('game');
            // Envoyer une mise à jour via WebSocket à tous les clients
            const broadcast = req.app.get('broadcast');
            broadcast(JSON.stringify({
                type: `gameStarted`,
                gameCode: gameCode
            }));
        } else {
            // Si la partie n'a pas démarré, afficher le message dans une vue avec le message d'erreur
            res.render('game_launcher/create_game', { gameCode, playerName, players, errorMessage: gameStatus.message });
        }
    } catch (error) {
        console.error('Erreur lors de la récupération du statut de la partie :', error);
        res.render('game_launcher/create_game', { gameCode, playerName, players, errorMessage: 'Erreur lors de la récupération du statut de la partie.' });
    }
});

module.exports = router;
