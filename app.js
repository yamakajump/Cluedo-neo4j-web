var createError = require('http-errors');
var express = require('express');
var path = require('path');
var session = require('express-session');
var logger = require('morgan');
var axios = require('axios'); // Importer axios pour faire des requêtes HTTP


axios.defaults.withCredentials = true;


// Routes
var indexRouter = require('./routes/index');
var create_gameRouter = require('./routes/create_game');
var join_gameRouter = require('./routes/join_game');
var chooseRouter = require('./routes/choose');  
var exitGameRouter = require('./routes/exit_game');
var startGameRouter = require('./routes/start_game');

// Import des routes de l'API
var adminApiRouter = require('./routes/api/admin'); 

var checkGameStatusApi = require('./routes/api/game/checkGameStatus');
var createGameApi = require('./routes/api/game/createGame');
var exitGameApi = require('./routes/api/game/exitGame');
var getPlayersApi = require('./routes/api/game/getPlayers');
var joinGameApi = require('./routes/api/game/joinGame');
var startGameApi = require('./routes/api/game/startGame');

var checkPlayerStatusAndRedirectApi = require('./routes/api/verif/checkPlayerStatusAndRedirect');

var app = express();

// Appel API pour nettoyer la base de données lors du démarrage
async function clearDatabaseAtStartup() {
  try {
    const response = await axios.delete('http://localhost:3000/api/admin/clear', {
      headers: {
        'Authorization': 'mdpsecu'  // Remplacer 'monsecretadmin' par votre vrai token si nécessaire
      }
    });
    console.log(response.data.message);  // Afficher le message de succès ou d'erreur
  } catch (error) {
    console.error('Erreur lors du nettoyage de la base de données via l\'API :', error.message);
  }
}

// Nettoyer la base de données au démarrage du serveur
clearDatabaseAtStartup();

// Session
app.set('trust proxy', 1);
app.use(session({
  secret: 'secret_key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// Routes pour les pages front
app.use('/', indexRouter);
app.use('/choose', chooseRouter);  
app.use('/create_game', create_gameRouter);
app.use('/join_game', join_gameRouter);
app.use('/exit_game', exitGameRouter);
app.use('/start_game', startGameRouter);

// Routes pour l'API
app.use('/api/admin', adminApiRouter); 

app.use('/api/game/checkGameStatus', checkGameStatusApi);
app.use('/api/game/createGame', createGameApi);
app.use('/api/game/exitGame', exitGameApi);
app.use('/api/game/getPlayers', getPlayersApi);
app.use('/api/game/joinGame', joinGameApi);
app.use('/api/game/startGame', startGameApi);

app.use('/api/verif/checkPlayerStatusAndRedirect', checkPlayerStatusAndRedirectApi);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error', { user: req.session.user });
});

module.exports = app;
