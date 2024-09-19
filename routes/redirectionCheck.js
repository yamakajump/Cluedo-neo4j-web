const axios = require('axios');

// Méthode pour vérifier l'état d'un joueur et rediriger en conséquence
async function checkPlayerStatusAndRedirect(req, res) {
    const playerId = req.session.playerId;  // Utiliser l'ID du joueur depuis la session

    if (!playerId) {
        // Si l'ID du joueur n'est pas défini, rediriger vers la page principale
        return false;
    }

    try {
        // Appel à l'API pour vérifier le statut du joueur
        const response = await axios.post('http://localhost:3000/api/verif/checkPlayerStatusAndRedirect', {
            playerId
        });

        const { redirection, gameCode, isOwner } = response.data;

        req.session.gameCode = gameCode;

        if (redirection) {
            if (isOwner) {
                // Si le joueur est propriétaire, rediriger vers la page de gestion de la partie
                res.redirect(`/create_game`)
                return true;
            } else {
                // Sinon, rediriger vers la page pour rejoindre la partie
                res.redirect(`/join_game`)
                return true;
            }
        } else {
            // Si aucune partie n'est trouvée, rediriger vers la page principale
            return false;
        }
    } catch (error) {
        return false;
    }
}

module.exports = { checkPlayerStatusAndRedirect };
