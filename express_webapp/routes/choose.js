const express = require('express');
const router = express.Router();
const { checkPlayerStatusAndRedirect } = require('./redirectionCheck');  // Importer la méthode

router.get('/', async function(req, res, next) {
    // Appeler la fonction de redirection pour vérifier le statut du joueur
    await checkPlayerStatusAndRedirect(req, res);
    res.render('choose');
});

module.exports = router;
