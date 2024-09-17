const driver = require('../initializeNeo4j'); // Connexion à Neo4j

// Méthode pour vérifier l'état d'un joueur, son existence et rediriger en conséquence
async function checkPlayerStatusAndRedirect(req, res) {
    const playerId = req.session.playerId;  // Utiliser l'ID du joueur depuis la session
    const playerName = req.session.playerName; // Utiliser le nom du joueur depuis la session

    if (!playerId) {
        return false;  // Pas de redirection ni de rendu
    }

    const session = driver.session();

    try {
        // Vérifier si le joueur existe dans la base de données
        const playerExistResult = await session.run(
            `MATCH (j:Joueur {id: $playerId})
             RETURN j`,
            { playerId }
        );

        if (playerExistResult.records.length === 0) {
            // Si le joueur n'existe pas, rediriger vers la page principale
            res.redirect('/choose');
            return true;  // Redirection a eu lieu
        }

        // Requête pour vérifier si le joueur est dans une partie
        const result = await session.run(
            `MATCH (j:Joueur {id: $playerId})-[:JOUE_DANS]->(p:Partie)
             RETURN p.code AS gameCode, j.owner AS isOwner, p.started AS started`,
            { playerId }
        );

        if (result.records.length === 0) {
            // Si le joueur n'est pas dans une partie, rediriger vers la page principale
            res.redirect('/choose');
            return true;  // Redirection a eu lieu
        }

        const gameCode = result.records[0].get('gameCode');
        const isOwner = result.records[0].get('isOwner');
        const started = result.records[0].get('started');

        // Si la partie a déjà commencé, rediriger vers une future page de partie lancée
        if (started) {
            // TODO: Rediriger vers la future page de la partie commencée
            res.redirect('/game_started');  // Page à créer
            return true;  // Redirection a eu lieu
        }

        // Si le joueur est propriétaire, rediriger vers la page de création
        if (isOwner) {
            res.render('create_game', { gameCode, playerName }); // Rendre la vue create_game
            return true;  // Vue rendue ou redirection
        } 
        // Sinon, rediriger vers la page pour rejoindre la partie
        else {
            res.render('join_game', { gameCode });  // Rendre la vue join_game
            return true;  // Vue rendue ou redirection
        }

    } catch (error) {
        console.error('Erreur lors de la vérification du statut du joueur :', error);
        res.status(500).render('error', { message: 'Erreur lors de la vérification de la partie.' });
        return true;  // Une réponse a été envoyée
    } finally {
        await session.close();
    }

    return false;  // Pas de redirection ni de rendu
}

module.exports = { checkPlayerStatusAndRedirect };
