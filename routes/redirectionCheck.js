const axios = require('axios');

// Méthode pour vérifier l'état d'un joueur et rediriger en conséquence
async function checkPlayerStatusAndRedirect(req, res) {
    const playerId = req.session.playerId;  // Utiliser l'ID du joueur depuis la session

    if (!playerId) {
        // Si l'ID du joueur n'est pas défini, rediriger vers la page principale
        return false;
    }

    console.log('Vérification du joueur avec l\'ID :', playerId);

    try {
        // Appel à l'API pour vérifier le statut du joueur
        const response = await axios.post('http://localhost:3000/api/verif/checkPlayerStatusAndRedirect', {
            playerId
        });

        console.log('Réponse de l\'API de vérification du joueur :', response.data);
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
        console.error('Erreur lors de l\'appel à l\'API de vérification du joueur :', error);
        // Rediriger vers la page principale en cas d'erreur
        return false;
    }
}

module.exports = { checkPlayerStatusAndRedirect };
