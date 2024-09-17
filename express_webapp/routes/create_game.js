const express = require('express');
const router = express.Router();
const axios = require('axios');

/* GET request to check if player is owner and redirect accordingly */
router.get('/', async function(req, res, next) {
    const playerId = req.session.playerId; // Récupérer l'ID du joueur existant dans la session

    try {
        // Si aucun playerId dans la session, rediriger vers la page principale
        if (!playerId) {
            return res.redirect('/choose');
        }

        // Appel à l'API pour vérifier si le joueur est propriétaire ou dans une partie
        const response = await axios.get('http://localhost:3000/api/playerIsOwner', {
            params: {
                playerId
            }
        });

        const { isOwner, gameCode } = response.data;

        if (isOwner) {
            // Si le joueur est propriétaire, le rediriger vers la page de création de la partie
            return res.redirect(`/create_game?gameCode=${gameCode}`);
        } else if (gameCode) {
            // Si le joueur n'est pas propriétaire mais dans une partie, le rediriger vers la page de jonction
            return res.redirect(`/join_game?gameCode=${gameCode}`);
        } else {
            // Si le joueur n'est dans aucune partie, rediriger vers le choix
            return res.redirect('/choose');
        }
    } catch (error) {
        if (error.response && error.response.status === 404) {
            // Si l'API renvoie 404, cela signifie que le joueur n'a pas été trouvé
            return res.redirect('/choose');  // Rediriger vers la page principale
        } else {
            console.error('Erreur lors de la vérification du statut du joueur :', error);
            return res.status(500).render('error', { message: 'Erreur lors de la redirection du joueur.' });
        }
    }
});

/* POST request to create game */
router.post('/', async function(req, res, next) {
    const playerName = req.body.createPseudo; // Récupérer le pseudo du formulaire
    const playerId = req.session.playerId; // Récupérer l'ID du joueur existant dans la session

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
        // S'assurer que les erreurs sont gérées et envoyées une seule fois
        if (!res.headersSent) {
            console.error('Erreur lors de la création de la partie:', error);
            res.status(500).render('error', { message: 'Erreur lors de la création de la partie.' });
        }
    }
});

module.exports = router;
