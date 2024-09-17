const express = require('express');
const router = express.Router();
const axios = require('axios');
const { checkPlayerStatusAndRedirect } = require('./redirectionCheck'); 

/* GET create game page */
router.get('/', function(req, res) {
    const { gameCode, playerName } = req.session;  // Récupérer les informations depuis la session

    if (!gameCode || !playerName) {
        // Si le gameCode ou playerName n'est pas défini, rediriger vers la page principale
        return res.redirect('/');
    }

    // Rendre la vue `create_game` avec les informations du jeu
    res.render('create_game', { gameCode, playerName });
});


/* POST request to create game */
router.post('/', async function(req, res, next) {
    const playerName = req.body.createPseudo; // Récupérer le pseudo du formulaire
    const playerId = req.session.playerId;    // Récupérer l'ID du joueur existant dans la session

    try {
        // Appel à l'API pour créer une partie, en passant playerName et playerId (si existant)
        const response = await axios.post('http://localhost:3000/api/game/create', {
            playerName,
            playerId // Passer l'ID du joueur à l'API
        });

        const { gameCode, playerId: newPlayerId } = response.data;

        // Stocker les informations dans la session (si le joueur est nouveau, on récupère son ID généré)
        req.session.gameCode = gameCode;
        req.session.playerName = playerName;
        req.session.playerId = newPlayerId;

        // Sauvegarder la session avant de rediriger
        req.session.save(() => {
            // Assure-toi que `res.render` est appelé une seule fois
            if (!res.headersSent) {
                // Rediriger vers la page de gestion de la partie
                res.render('create_game', { gameCode, playerName });
            }
        });
    } catch (error) {
        // Vérifier si l'erreur est due à une partie déjà existante
        if (error.response && error.response.status === 400 && error.response.data.gameCode) {
            const existingGameCode = error.response.data.gameCode;

            // Rediriger l'utilisateur vers la partie existante
            req.session.gameCode = existingGameCode;
            req.session.playerName = playerName;

            return req.session.save(() => {
                // Rediriger vers la page de la partie en cours
                res.redirect(`/create_game`);
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
