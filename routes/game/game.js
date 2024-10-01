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
        
                return res.render('game/choose/choose_weapon', { gameCode, playerId, playerName, availableWeapons });
            
            // Vérifier si l'hypothèse du personnage a été faite
            } else if (!hypothesis.suspect) {
                // Appel à la nouvelle API pour récupérer les personnages disponibles
                const availableProfsResponse = await axios.get(`http://${SERVER_IP}:${EXPRESS_PORT}/api/game/getter/getAvailableProfs`);
                const { availableSuspects } = availableProfsResponse.data;
                return res.render('game/choose/choose_criminal', { gameCode, playerId, playerName, availableSuspects });
            
            // Si tout est choisi, rediriger vers la sélection du joueur à interroger
            } else if (!hypothesis.interrogatedPlayerId) {
                // Appel à l'API pour récupérer les joueurs disponibles
                const playersResponse = await axios.get(`http://${SERVER_IP}:${EXPRESS_PORT}/api/game/getter/getPlayers/${gameCode}`);
                const { players } = playersResponse.data;
        
                // Enlever le joueur actuel de la liste des joueurs disponibles
                const availablePlayers = players.filter(player => player.id !== playerId);
        
                return res.render('game/choose/choose_player', { gameCode, playerId, playerName, availablePlayers });
                
            // si tout est choisi, on attend la réponse du joueur interrogé
        } else {
            // Appel à l'API pour vérifier si une carte a été montrée
            const showCardResponse = await axios.get(`http://${SERVER_IP}:${EXPRESS_PORT}/api/game/check/check-show-card/${gameCode}/${playerId}`);

            console.log(showCardResponse.data)
        
            // Si une carte a été montrée, afficher la page avec l'image de la carte
            if (showCardResponse.status === 200 && showCardResponse.data.cardImage) {
                return res.render('game/choose/see_card', {
                    gameCode,
                    playerId,
                    playerName,
                    cardType: showCardResponse.data.card,  // Le type de carte montré (weapon, room, suspect)
                    cardImage: showCardResponse.data.cardImage  // L'image de la carte
                });
            } else if (showCardResponse.status === 200 && !showCardResponse.data.cardImage) {
                // Si aucune carte n'a été montrée mais l'attente est en cours
                return res.render('game/choose/see_card', {
                    gameCode,
                    playerId,
                    playerName,
                    message: showCardResponse.data.message || 'En attente de la réponse du joueur.'  // Message d'attente
                });
            } else {
                // Si une erreur s'est produite ou aucune carte n'a été trouvée
                return res.render('game/choose/see_card', {
                    gameCode,
                    playerId,
                    playerName,
                    message: 'Erreur lors de la récupération des informations.'
                });
            }
        }

        } else {
            const currentGameStateResponse = await axios.get(`http://${SERVER_IP}:${EXPRESS_PORT}/api/game/check/current-state/${gameCode}/${playerId}`);
            const currentState = currentGameStateResponse.data;
                    
            console.log(currentState)

            // Vérifier si le joueur actuel est celui qui est interrogé
            if (currentState.interrogatedPlayer && currentState.interrogatedPlayer.id === playerId) {
                // Rediriger vers la page `show_card` si le joueur est interrogé
                return res.render('game/show_card', {
                    gameCode,
                    playerId,
                    playerName,
                    hypothesis: currentState.hypothesis, // On passe l'hypothèse
                    possessedCards: currentState.possessedCards // On passe les cartes que le joueur possède
                });
            } else {
                // Sinon, afficher la page d'attente classique `waiting_for_turn`
                return res.render('game/waiting_for_turn', {
                    gameCode,
                    activePlayerName: currentState.activePlayerName,
                    hypothesis: currentState.hypothesis
                });
            }
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
    const { type, characterName, roomName, weaponName, suspectName, playerChoosedId, card } = req.body;

    console.log("type : " + type)

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

        } else if (type === 'show-card') {

            const response = await axios.post(`http://${SERVER_IP}:${EXPRESS_PORT}/api/game/show-card`, {
                gameCode,
                playerId,
                card
            });

            if (response.status === 200) {

                // Envoyer une mise à jour via WebSocket à tous les clients
                const broadcast = req.app.get('broadcast');
                broadcast(JSON.stringify({
                    type: `showCard`,
                    gameCode: gameCode
                }));

                return res.redirect('/game');
            } else {
                return res.status(400).render('game/show_card', { errorMessage: 'Erreur lors de la révélation de la carte.' });
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

                    // Envoyer une mise à jour via WebSocket à tous les clients
                    const broadcast = req.app.get('broadcast');
                    broadcast(JSON.stringify({
                        type: `hypotheseChoose`,
                        gameCode: gameCode
                    }));

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

                    // Envoyer une mise à jour via WebSocket à tous les clients
                    const broadcast = req.app.get('broadcast');
                    broadcast(JSON.stringify({
                        type: `hypotheseChoose`,
                        gameCode: gameCode
                    }));
                    
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

                    // Envoyer une mise à jour via WebSocket à tous les clients
                    const broadcast = req.app.get('broadcast');
                    broadcast(JSON.stringify({
                        type: `hypotheseChoose`,
                        gameCode: gameCode
                    }));
                    
                    return res.redirect('/game');
                } else {
                    return res.status(400).render('game/choose/choose_criminal', { errorMessage: 'Erreur lors de la sélection du suspect.' });
                }

            } else if (type === 'select-player') {
                // Appel à l'API pour choisir le joueur à interroger
                const response = await axios.post(`http://${SERVER_IP}:${EXPRESS_PORT}/api/game/choose/choose-player`, {
                    playerId,
                    gameCode,
                    playerChoosedId
                });

                if (response.status === 200) {

                    // Envoyer une mise à jour via WebSocket à tous les clients
                    const broadcast = req.app.get('broadcast');
                    broadcast(JSON.stringify({
                        type: `hypotheseChoose`,
                        gameCode: gameCode
                    }));
                    
                    return res.redirect('/game');
                } else {
                    return res.status(400).render('game/choose/choose_player', { errorMessage: 'Erreur lors de la sélection du joueur.' });
                }
            } else if (type === 'next-turn') {
                // Appel à l'API pour passer au tour suivant
                const response = await axios.post(`http://${SERVER_IP}:${EXPRESS_PORT}/api/game/next-turn`, {
                    playerId,
                    gameCode
                });

                if (response.status === 200) {

                    // Envoyer une mise à jour via WebSocket à tous les clients
                    const broadcast = req.app.get('broadcast');
                    broadcast(JSON.stringify({
                        type: `nextTurn`,
                        gameCode: gameCode
                    }));
                    
                    return res.redirect('/game');
                } else {
                    return res.status(400).render('game/waiting_for_turn', { errorMessage: 'Erreur lors du passage au tour suivant.' });
                }
            }
            
            else {
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
