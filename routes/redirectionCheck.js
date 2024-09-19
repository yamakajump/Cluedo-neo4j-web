require('dotenv').config(); // Charger les variables d'environnement depuis le fichier .env
const axios = require('axios');

// Récupérer les variables d'environnement pour l'IP du serveur et le port
const SERVER_IP = process.env.SERVER_IP || 'localhost';
const EXPRESS_PORT = process.env.EXPRESS_PORT || 3000;

// Méthode pour vérifier l'état d'un joueur et rediriger en conséquence
async function checkPlayerStatusAndRedirect(req, res) {
    const playerId = req.session.playerId;  // Utiliser l'ID du joueur depuis la session

    if (!playerId) {
        // Si l'ID du joueur n'est pas défini, rediriger vers la page principale
        return false;
    }

    try {
        // Appel à l'API pour vérifier le statut du joueur
        const response = await axios.post(`http://${SERVER_IP}:${EXPRESS_PORT}/api/verif/checkPlayerStatusAndRedirect`, {
            playerId
        });

        const { redirection, gameCode, isOwner } = response.data;

        req.session.gameCode = gameCode;

        if (redirection) {
            if (isOwner) {
                // Si le joueur est propriétaire, rediriger vers la page de gestion de la partie
                res.redirect(`/create_game`);
                return true;
            } else {
                // Sinon, rediriger vers la page pour rejoindre la partie
                res.redirect(`/join_game`);
                return true;
            }
        } else {
            // Si aucune partie n'est trouvée, rediriger vers la page principale
            return false;
        }
    } catch (error) {
        console.error('Erreur lors de la vérification du statut du joueur :', error);
        return false;
    }
}

module.exports = { checkPlayerStatusAndRedirect };
