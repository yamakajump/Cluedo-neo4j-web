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
        // Vérifier si la partie a commencé
        const gameStatusResponse = await axios.get(`http://${SERVER_IP}:${EXPRESS_PORT}/api/game/check/check-status`, {
            params: { gameCode }
        });

        const gameStatus = gameStatusResponse.data;

        if (gameStatus.started && !gameStatus.allPlayersHaveCharacter) {
            // Récupérer les personnages disponibles et sélectionnés
            const charactersResponse = await axios.get(`http://${SERVER_IP}:${EXPRESS_PORT}/api/game/initialize/choose-character/${gameCode}`);
            const { availableProfs, selectedProfs } = charactersResponse.data;

            return res.render('game/initialize/choose_character', { gameCode, playerName, playerId, availableProfs, selectedProfs });  // Redirige vers la sélection de personnage
        }

        // Vérifier si c'est le tour du joueur
        const turnResponse = await axios.get(`http://${SERVER_IP}:${EXPRESS_PORT}/api/game/check/check-turn`, {
            params: { playerId, gameCode }
        });

        const isTurn = turnResponse.data.isTurn;

        if (isTurn) {
            // Vérifier si une hypothèse est en cours
            const hypothesisResponse = await axios.get(`http://${SERVER_IP}:${EXPRESS_PORT}/api/game/check/hypothesis-status`, { 
                params: { playerId, gameCode }
            });
        
            const hypothesis = hypothesisResponse.data;
        
            // Vérifier si l'hypothèse de la salle a été faite
            if (!hypothesis.room) {
                // Appel à la nouvelle API pour récupérer les salles accessibles
                const accessibleRoomsResponse = await axios.get(`http://${SERVER_IP}:${EXPRESS_PORT}/api/game/getter/getAccessibleRooms/${gameCode}/${playerId}`);
                const { accessibleRooms } = accessibleRoomsResponse.data;
        
                return res.render('game/choose/choose_room', { gameCode, playerId, playerName, availableRooms: accessibleRooms });
            
            // Vérifier si l'hypothèse de l'arme a été faite
            } else if (!hypothesis.weapon) {
                // Appel à la nouvelle API pour récupérer les armes disponibles
                const availableWeaponsResponse = await axios.get(`http://${SERVER_IP}:${EXPRESS_PORT}/api/game/getter/getAvailableWeapons`);
                const { availableWeapons } = availableWeaponsResponse.data;

                console.log(availableWeapons);
        
                return res.render('game/choose/choose_weapon', { gameCode, playerId, playerName, availableWeapons });
            
            // Vérifier si l'hypothèse du personnage a été faite
            } else if (!hypothesis.suspect) {
                // Appel à la nouvelle API pour récupérer les personnages disponibles
                const availableProfsResponse = await axios.get(`http://${SERVER_IP}:${EXPRESS_PORT}/api/game/getter/getAvailableProfs`);
                const { availableSuspects } = availableProfsResponse.data;
        
                return res.render('game/choose/choose_criminal', { gameCode, playerId, playerName, availableSuspects });
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
    const { type, characterName, roomName, weaponName, suspectName } = req.body;

    try {
        if (type === 'select-character') {
            // Appel à l'API pour choisir le personnage, sans vérifier le tour
            const response = await axios.post(`http://${SERVER_IP}:${EXPRESS_PORT}/api/game/initialize/select-character`, {
                playerId,
                gameCode,
                characterName
            });

            const result = response.data;

            if (response.status === 200 && result.message === 'Personnage sélectionné avec succès.') {
                // Envoyer une mise à jour via WebSocket à tous les clients
                const broadcast = req.app.get('broadcast');
                broadcast(JSON.stringify({
                    type: `playerChoose`,
                    gameCode: gameCode
                }));
                return res.redirect('/game'); // Rafraîchir la page de jeu
            } else {
                const charactersResponse = await axios.get(`http://${SERVER_IP}:${EXPRESS_PORT}/api/game/initialize/choose-character/${gameCode}`);
                const { availableProfs, selectedProfs } = charactersResponse.data;

                // Retourner la vue avec un message d'erreur
                return res.render('game/initialize/choose_character', {
                    gameCode,
                    playerName,
                    playerId,
                    availableProfs,
                    selectedProfs,
                    errorMessage: result.message // Passer le message d'erreur à la vue
                });
            }

        } else {
            // Vérifier si c'est bien le tour du joueur avant de lui permettre de faire une action
            const turnResponse = await axios.get(`http://${SERVER_IP}:${EXPRESS_PORT}/api/game/check/check-turn`, {
                params: { playerId, gameCode }
            });

            const isTurn = turnResponse.data.isTurn;

            if (!isTurn) {
                // Si ce n'est pas le tour du joueur, rediriger vers la page d'attente
                return res.render('game/waiting_for_turn', { message: 'Ce n\'est pas votre tour.' });
            }

            // Si c'est le tour du joueur, gérer les différentes actions
            if (type === 'select-room') {
                // Appel à l'API pour choisir la salle
                const response = await axios.post(`http://${SERVER_IP}:${EXPRESS_PORT}/api/game/choose/choose-room`, {
                    playerId,
                    gameCode,
                    roomName
                });

                if (response.status === 200) {
                    return res.redirect('/game');  // Rediriger vers la page de jeu
                } else {
                    return res.status(400).render('game/choose/choose_room', { errorMessage: 'Erreur lors de la sélection de la salle.' });
                }

            } else if (type === 'select-weapon') {
                // Appel à l'API pour choisir l'arme
                const response = await axios.post(`http://${SERVER_IP}:${EXPRESS_PORT}/api/game/choose/choose-weapon`, {
                    playerId,
                    gameCode,
                    weaponName
                });

                if (response.status === 200) {
                    return res.redirect('/game');
                } else {
                    return res.status(400).render('game/choose/choose_weapon', { errorMessage: 'Erreur lors de la sélection de l\'arme.' });
                }

            } else if (type === 'select-suspect') {
                // Appel à l'API pour choisir le suspect
                const response = await axios.post(`http://${SERVER_IP}:${EXPRESS_PORT}/api/game/choose/choose-suspect`, {
                    playerId,
                    gameCode,
                    suspectName
                });

                if (response.status === 200) {
                    return res.redirect('/game');
                } else {
                    return res.status(400).render('game/choose/choose_criminal', { errorMessage: 'Erreur lors de la sélection du suspect.' });
                }

            } else {
                // Si l'action n'est pas reconnue
                res.status(400).json({ success: false, message: 'Action non reconnue.' });
            }
        }
    } catch (error) {
        console.error('Erreur lors de l\'action du jeu :', error);
        return res.status(500).render('game/error', { errorMessage: 'Erreur lors de l\'action du jeu.' });
    }
});

module.exports = router;
