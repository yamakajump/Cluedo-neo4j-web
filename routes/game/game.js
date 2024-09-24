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

/* POST game actions */
router.post('/', async function(req, res, next) {
    const { gameCode, playerId, playerName } = req.session;

    if (!gameCode || !playerId || !playerName) {
        return res.redirect('/');
    }

    // Récupérer les informations du corps de la requête
    const { type, characterName } = req.body;

    try {
        if (type === 'select-character') {
            // Appel à l'API pour choisir le personnage
            const response = await axios.post(`http://${SERVER_IP}:${EXPRESS_PORT}/api/game/initialize/select-character`, {
                playerId,
                gameCode,
                characterName
            });

            const result = response.data;

            if (response.status === 200 && result.message === 'Personnage sélectionné avec succès.') {
                res.json({ success: true, message: result.message });
            } else {
                res.json({ success: false, message: result.message });
            }
        } else {
            // Autres actions de jeu (ex: hypothèses, tours, etc.)
            res.json({ success: false, message: 'Action non reconnue.' });
        }
    } catch (error) {
        console.error('Erreur lors de l\'action du jeu :', error);
        res.status(500).json({ success: false, message: 'Erreur lors de l\'action du jeu.' });
    }
});

module.exports = router;

module.exports = router;
