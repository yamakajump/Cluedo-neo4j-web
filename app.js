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
app.use('/choose', require('./routes/choose'));
app.use('/create_game', require('./routes/create_game'));
app.use('/join_game', require('./routes/join_game'));
app.use('/exit_game', require('./routes/exit_game'));
app.use('/start_game', require('./routes/start_game'));

// Importer les routes de l'API
app.use('/api/admin', require('./api/admin'));
app.use('/api/game/checkGameStatus', require('./api/game/checkGameStatus'));
app.use('/api/game/createGame', require('./api/game/createGame'));
app.use('/api/game/exitGame', require('./api/game/exitGame'));
app.use('/api/game/getPlayers', require('./api/game/getPlayers'));
app.use('/api/game/joinGame', require('./api/game/joinGame'));
app.use('/api/game/startGame', require('./api/game/startGame'));
app.use('/api/verif/checkPlayerStatusAndRedirect', require('./api/verif/checkPlayerStatusAndRedirect'));

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
