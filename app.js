require('dotenv').config();

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var session = require('express-session');
var logger = require('morgan');
var axios = require('axios');
var http = require('http');  // Utiliser http pour créer le serveur
var WebSocket = require('ws'); // Importer WebSocket

// Charger les variables d'environnement
const SERVER_IP = process.env.SERVER_IP || 'localhost';
const EXPRESS_PORT = process.env.EXPRESS_PORT || 3000;
const WEBSOCKET_PORT = process.env.WEBSOCKET_PORT || 3001;
const DB_ADMIN_TOKEN = process.env.DB_ADMIN_TOKEN || 'default_token';

// Créer l'application Express
var app = express();

// Configurer le serveur HTTP et WebSocket
var server = http.createServer(app);
var wss = new WebSocket.Server({ server });

// Gérer les connexions WebSocket
wss.on('connection', (ws) => {
    console.log('Un client WebSocket est connecté');

    // Gérer les messages entrants des clients WebSocket
    ws.on('message', (message) => {
        console.log('Message reçu:', message);
        // Traitement du message reçu
    });

    // Envoyer un message lorsque la connexion est établie
    ws.send('Bienvenue sur le serveur WebSocket!');
});

// Fonction pour diffuser des messages à tous les clients WebSocket
function broadcast(message) {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

// Stocker la fonction broadcast dans app pour l'utiliser dans d'autres parties du code
app.set('broadcast', broadcast);

// Appel API pour nettoyer la base de données lors du démarrage
async function clearDatabaseAtStartup() {
    try {
        const response = await axios.delete(`http://${SERVER_IP}:${EXPRESS_PORT}/api/admin/clear`, {
            headers: {
                'Authorization': 'mdpsecu'  // Remplacer par ton token si nécessaire
            }
        });
        console.log(response.data.message);  // Afficher le message de succès
    } catch (error) {
        console.error('Erreur lors du nettoyage de la base de données via l\'API :', error.message);
    }
}

// Nettoyer la base de données au démarrage du serveur
clearDatabaseAtStartup();

// Configuration de la session
app.set('trust proxy', 1);  // Nécessaire si tu utilises un proxy
app.use(session({
    secret: 'secret_key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// Configuration du moteur de templates (EJS) et du chemin des vues
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Middleware pour le logging, parsing JSON et les fichiers statiques
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// Importer les routes front-end
app.use('/', require('./routes/index'));
app.use('/choose', require('./routes/game_launcher/choose'));
app.use('/create_game', require('./routes/game_launcher/create_game'));
app.use('/join_game', require('./routes/game_launcher/join_game'));
app.use('/exit_game', require('./routes/game_launcher/exit_game'));
app.use('/start_game', require('./routes/game_launcher/start_game'));

app.use('/game', require('./routes/game/game'));

// Importer les routes de l'API
app.use('/api/admin', require('./api/admin'));

app.use('/api/verif/checkPlayerStatusAndRedirect', require('./api/verif/checkPlayerStatusAndRedirect'));

// API pour la gestion des parties
app.use('/api/game_launcher/createGame', require('./api/game_launcher/createGame'));
app.use('/api/game_launcher/exitGame', require('./api/game_launcher/exitGame'));
app.use('/api/game_launcher/getPlayers', require('./api/game_launcher/getPlayers'));
app.use('/api/game_launcher/joinGame', require('./api/game_launcher/joinGame'));
app.use('/api/game_launcher/startGame', require('./api/game_launcher/startGame'));

// API pour la gestion du jeu
app.use('/api/game/check/check-status', require('./api/game/check/check-status'));
app.use('/api/game/check/check-turn', require('./api/game/check/check-turn'));
app.use('/api/game/check/hypothesis-status', require('./api/game/check/hypothesis-status'));

app.use('/api/game/initialize/choose-character', require('./api/game/initialize/choose-character'));
app.use('/api/game/initialize/select-character', require('./api/game/initialize/select-character'));

app.use('/api/game/initialize/end-turn', require('./api/game/end-turn'));
app.use('/api/game/initialize/make-hypothesis', require('./api/game/make-hypothesis'));

// Gestion des erreurs 404 et des autres erreurs
app.use(function(req, res, next) {
    next(createError(404));
});

app.use(function(err, req, res, next) {
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    res.status(err.status || 500);
    res.render('error', { user: req.session.user });
});

// Démarrer le serveur WebSocket
server.listen(WEBSOCKET_PORT, function() {
    console.log(`Serveur WebSocket en cours d\'exécution sur le port ${WEBSOCKET_PORT}`);
});

module.exports = app;
