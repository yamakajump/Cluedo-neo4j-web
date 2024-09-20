require('dotenv').config();  // Charger les variables d'environnement depuis le fichier .env

const express = require('express');
const router = express.Router();
const axios = require('axios');

// Récupérer les variables d'environnement pour l'IP du serveur et le port
const SERVER_IP = process.env.SERVER_IP || 'localhost';
const EXPRESS_PORT = process.env.EXPRESS_PORT || 3000;

/* GET create game page */
router.get('/', async function(req, res) {
    const { gameCode, playerName } = req.session;  // Récupérer les informations depuis la session

    if (!gameCode || !playerName) {
        // Si le gameCode ou playerName n'est pas défini, rediriger vers la page principale
        return res.redirect('/');
    }

    try {
        // Requête vers l'API pour obtenir la liste des joueurs
        const response = await axios.get(`http://${SERVER_IP}:${EXPRESS_PORT}/api/game_launcher/getPlayers/${gameCode}`);
        const players = response.data.players;

        // Rendre la vue `create_game` avec la liste des joueurs en plus des autres informations
        res.render('game_launcher/create_game', { gameCode, playerName, players });
    } catch (error) {
        console.error('Erreur lors de la récupération des joueurs:', error);
        res.status(500).render('error', { message: 'Erreur lors de la récupération des joueurs.' });
    }
});

/* POST request to create game */
router.post('/', async function(req, res, next) {
    const playerName = req.body.createPseudo; // Récupérer le pseudo du formulaire
    const playerId = req.session.playerId;    // Récupérer l'ID du joueur existant dans la session

    try {
        // Appel à l'API pour créer une partie, en passant playerName et playerId (si existant)
        const response = await axios.post(`http://${SERVER_IP}:${EXPRESS_PORT}/api/game_launcher/createGame`, {
            playerName,
            playerId // Passer l'ID du joueur à l'API
        });

        const { gameCode, playerId: newPlayerId } = response.data;

        // Stocker les informations dans la session (si le joueur est nouveau, on récupère son ID généré)
        req.session.gameCode = gameCode;
        req.session.playerName = playerName;
        req.session.playerId = newPlayerId;

        // Requête vers l'API pour obtenir la liste des joueurs après la création de la partie
        const playersResponse = await axios.get(`http://${SERVER_IP}:${EXPRESS_PORT}/api/game_launcher/getPlayers/${gameCode}`);
        const players = playersResponse.data.players;

        // Sauvegarder la session avant de rediriger
        req.session.save(() => {
            // Assure-toi que `res.render` est appelé une seule fois
            if (!res.headersSent) {
                // Rediriger vers la page de gestion de la partie avec la liste des joueurs
                res.render('game_launcher/create_game', { gameCode, playerName, players });
            }
        });
    } catch (error) {
        // Vérifier si l'erreur est due à une partie déjà existante
        if (error.response && error.response.status === 400 && error.response.data.gameCode) {
            const existingGameCode = error.response.data.gameCode;

            // Rediriger l'utilisateur vers la partie existante
            req.session.gameCode = existingGameCode;
            req.session.playerName = playerName;

            // Requête vers l'API pour obtenir la liste des joueurs
            const playersResponse = await axios.get(`http://${SERVER_IP}:${EXPRESS_PORT}/api/game_launcher/getPlayers/${existingGameCode}`);
            const players = playersResponse.data.players;

            return req.session.save(() => {
                // Rediriger vers la page de la partie en cours avec la liste des joueurs
                res.render('game_launcher/create_game', { gameCode: existingGameCode, playerName, players });
            });
        }

        // Autres erreurs non spécifiques (erreurs serveur ou autres)
        if (!res.headersSent) {
            console.error('Erreur lors de la création de la partie:', error);
            res.status(500).render('error', { message: 'Erreur lors de la création de la partie.' });
        }
    }
});

module.exports = router;
