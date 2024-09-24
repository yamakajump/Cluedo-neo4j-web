require('dotenv').config(); // Charger les variables d'environnement depuis le fichier .env

const express = require('express');
const router = express.Router();
const axios = require('axios');

// Récupérer les variables d'environnement pour l'IP du serveur et le port
const SERVER_IP = process.env.SERVER_IP || 'localhost';
const EXPRESS_PORT = process.env.EXPRESS_PORT || 3000;

/* GET game page. */
router.get('/', async function(req, res, next) {
    const { gameCode, playerId, playerName } = req.session;

    if (!gameCode || !playerId || !playerName) {
        return res.redirect('/');
    }

    try {
        // 1. Vérifier si la partie a commencé
        const gameStatusResponse = await axios.get(`http://${SERVER_IP}:${EXPRESS_PORT}/api/game/check/check-status`, {
            params: { playerId, gameCode }
        });

        const gameStatus = gameStatusResponse.data;

        if (gameStatus.started && !gameStatus.allPlayersHaveCharacter) {
            return res.render('game/initialize/choose_character', { gameCode, playerName, playerId });  // Redirige vers la sélection de personnage
        }

        // 2. Vérifier si c'est le tour du joueur
        const turnResponse = await axios.get(`http://${SERVER_IP}:${EXPRESS_PORT}/api/game/check/check-turn`, {
            params: { playerId, gameCode }
        });

        const isTurn = turnResponse.data.isTurn;

        if (isTurn) {
            // 3. Vérifier si une hypothèse est en cours
            const hypothesisResponse = await axios.get(`http://${SERVER_IP}:${EXPRESS_PORT}/api/game/check/hypothesis-status`, {
                params: { playerId, gameCode }
            });

            const hypothesis = hypothesisResponse.data;

            if (!hypothesis.suspect) {
                return res.render('game/choose/choose_criminal');  // Choisir un criminel
            } else if (!hypothesis.room) {
                return res.render('game/choose/choose_room');  // Choisir une pièce
            } else if (!hypothesis.weapon) {
                return res.render('game/choose/choose_weapon');  // Choisir une arme
            }
        } else {
            return res.render('game/waiting_for_turn');  // Attente du tour du joueur
        }

    } catch (error) {
        console.error('Erreur lors de la récupération des informations du jeu :', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des informations du jeu.' });
    }
});

/* POST game actions (ex: making a hypothesis) */
router.post('/', async function(req, res, next) {
    const { gameCode, playerId } = req.session;
    const { action, suspect, room, weapon } = req.body;  // Action envoyée depuis le front-end

    try {
        if (action === 'make-hypothesis') {
            const response = await axios.post(`http://${SERVER_IP}:${EXPRESS_PORT}/api/game/make-hypothesis`, {
                playerId,
                gameCode,
                suspect,
                room,
                weapon
            });

            res.json(response.data);
        } else if (action === 'end-turn') {
            const response = await axios.post(`http://${SERVER_IP}:${EXPRESS_PORT}/api/game/end-turn`, {
                playerId,
                gameCode
            });

            res.json(response.data);
        }

    } catch (error) {
        console.error('Erreur lors de l\'action dans la partie :', error);
        res.status(500).json({ message: 'Erreur lors de l\'action dans la partie.' });
    }
});

module.exports = router;
