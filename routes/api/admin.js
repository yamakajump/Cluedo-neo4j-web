const express = require('express');
const router = express.Router();
const driver = require('../../initializeNeo4j');  // Connexion à Neo4j

const ADMIN_TOKEN = 'mdpsecu';

// Middleware pour protéger l'accès à la route
function authMiddleware(req, res, next) {
    const token = req.headers['authorization'];

    if (token === ADMIN_TOKEN) {
        next();
    } else {
        res.status(403).json({ message: 'Accès interdit.' });
    }
}

router.delete('/clear', authMiddleware, async (req, res) => {
    const session = driver.session();
    try {
        await session.run('MATCH (n) DETACH DELETE n');  // Supprimer tous les noeuds et relations
        console.log('Base de données nettoyée.');
        res.status(200).json({ message: 'Base de données nettoyée avec succès.' });
    } catch (error) {
        console.error('Erreur lors du nettoyage de la base de données :', error);
        res.status(500).json({ message: 'Erreur lors du nettoyage de la base de données.' });
    } finally {
        await session.close();
    }
});

module.exports = router;
