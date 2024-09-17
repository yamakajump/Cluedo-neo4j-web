const express = require('express');
const router = express.Router();
const { checkPlayerStatusAndRedirect } = require('./redirectionCheck');  // Importer la méthode

/* GET home page. */
router.get('/', async function(req, res, next) {
  // Appeler la fonction de redirection pour vérifier le statut du joueur
  const wasRedirected = await checkPlayerStatusAndRedirect(req, res);

  // Si une redirection ou un rendu a eu lieu, ne rien faire d'autre
  if (wasRedirected) return;

  // Sinon, rendre la page index
  res.render('index');
});

module.exports = router;
