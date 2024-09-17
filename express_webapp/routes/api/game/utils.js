const { v4: uuidv4 } = require('uuid'); // Importer la fonction pour générer des UUID

// Fonction pour générer un code unique pour une partie
function generateGameCode() {
    return Math.random().toString(36).substr(2, 6).toUpperCase();  // Ex: "A1B2C3"
}

// Fonction pour générer un identifiant unique pour chaque joueur
function generatePlayerId() {
    return uuidv4(); // Générer un UUID pour chaque joueur
}

module.exports = { generateGameCode, generatePlayerId };
