require('dotenv').config(); // Charger les variables d'environnement depuis le fichier .env
const express = require('express');
const router = express.Router();
const axios = require('axios');

// Récupérer les variables d'environnement pour l'IP du serveur et le port
const SERVER_IP = process.env.SERVER_IP || 'localhost';
const EXPRESS_PORT = process.env.EXPRESS_PORT || 3000;

/* GET join game page */
router.get('/', function(req, res) {
    const { gameCode, playerName } = req.session;  // Récupérer les informations depuis la session

    if (!gameCode || !playerName) {
        // Si le gameCode ou playerName n'est pas défini, rediriger vers la page principale
        return res.redirect('/');
    }

    // Rendre la vue `join_game` avec les informations du jeu
    res.render('game_launcher/join_game', { gameCode, playerName });
});

/* POST request to join game */
router.post('/', async function(req, res, next) {
    const playerName = req.body.joinPseudo;  // Récupérer le pseudo du formulaire
    const gameCode = req.body.gameCode;      // Récupérer le code de la partie
    const playerId = req.session.playerId;   // Récupérer l'ID du joueur s'il existe déjà dans la session

    try {
        // Appel à l'API pour rejoindre une partie
        const response = await axios.post(`http://${SERVER_IP}:${EXPRESS_PORT}/api/game/joinGame`, {
            playerName,
            gameCode,
            playerId
        });

        // Récupérer les informations de la réponse
        const { playerId: newPlayerId, newGameCode, isOwner } = response.data;

        // Stocker les informations dans la session
        req.session.gameCode = newGameCode;
        req.session.playerName = playerName;
        req.session.playerId = newPlayerId;

        // Envoyer une mise à jour via WebSocket à tous les clients
        const broadcast = req.app.get('broadcast');
        broadcast(JSON.stringify({
            type: `playerJoined`,
            gameCode: newGameCode
        }));

        // Sauvegarder la session avant de rediriger
        req.session.save(() => {
            if (isOwner) {
                // Si le joueur est propriétaire, rediriger vers la page de gestion de la partie
                res.redirect(`/create_game`);
            } else {
                // Sinon, rediriger vers la page pour rejoindre la partie
                res.redirect(`/join_game`);
            }
        });
    } catch (error) {
        // Vérifier si l'erreur est due à la non-existence de la partie
        if (error.response && error.response.status === 404) {
            return res.status(404).render('error', { message: 'Partie introuvable.' });
        }

        // Autres erreurs non spécifiques
        if (!res.headersSent) {
            console.error('Erreur lors de la jonction à la partie :', error);
            res.status(500).render('error', { message: 'Erreur lors de la jonction à la partie.' });
        }
    }
});

module.exports = router;
