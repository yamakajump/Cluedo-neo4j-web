const express = require('express');
const router = express.Router();

/* GET home page. */
router.get('/', async function(req, res, next) {
    res.render('game/actions/hypothese_propose');
});

router.post('/', async function(req, res, next) {

});

module.exports = router;
