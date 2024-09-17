const driver = require('../initializeNeo4j'); // Connexion à Neo4j

// Méthode pour vérifier l'état d'un joueur, son existence et rediriger en conséquence
async function checkPlayerStatusAndRedirect(req, res) {
    const playerId = req.session.playerId;  // Utiliser l'ID du joueur depuis la session

    if (!playerId) {
        // Si aucun playerId dans la session, rediriger vers la page principale
        return;
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
            return res.redirect('/choose');
        }

        // Requête pour vérifier si le joueur est dans une partie
        const result = await session.run(
            `MATCH (j:Joueur {id: $playerId})-[:JOUE_DANS]->(p:Partie)
             RETURN p.code AS gameCode, j.owner AS isOwner, p.started AS started`,
            { playerId }
        );

        if (result.records.length === 0) {
            // Si le joueur n'est pas dans une partie, rediriger vers la page principale
            return res.redirect('/choose');
        }

        const gameCode = result.records[0].get('gameCode');
        const isOwner = result.records[0].get('isOwner');
        const started = result.records[0].get('started');

        // Si la partie a déjà commencé, rediriger vers une future page de partie lancée
        if (started) {
            // TODO: Rediriger vers la future page de la partie commencée
            return res.redirect('/game_started');  // Page à créer
        }

        // Si le joueur est propriétaire, rediriger vers la page de création
        if (isOwner) {
            return res.redirect(`/create_game?gameCode=${gameCode}`);
        } 
        // Sinon, rediriger vers la page pour rejoindre la partie
        else {
            return res.redirect(`/join_game?gameCode=${gameCode}`);
        }

    } catch (error) {
        console.error('Erreur lors de la vérification du statut du joueur :', error);
        res.status(500).render('error', { message: 'Erreur lors de la vérification de la partie.' });
    } finally {
        await session.close();
    }
}

module.exports = { checkPlayerStatusAndRedirect };
