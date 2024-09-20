const { v4: uuidv4 } = require('uuid'); // Importer la fonction pour générer des UUID
const path = require('path'); // Importer path pour manipuler les chemins de fichiers

// Fonction pour générer un code unique pour une partie
function generateGameCode() {
    return Math.random().toString(36).substr(2, 6).toUpperCase();  // Ex: "A1B2C3"
}

// Fonction pour générer un identifiant unique pour chaque joueur
function generatePlayerId() {
    return uuidv4(); // Générer un UUID pour chaque joueur
}

// Fonction utilitaire pour mélanger les éléments
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// Fonction pour sélectionner un élément aléatoire dans une liste
function chooseRandom(array) {
    const index = Math.floor(Math.random() * array.length);
    return array[index];
}

// Fonction pour retirer un élément d'une liste
function removeElement(array, element) {
    const index = array.indexOf(element);
    if (index > -1) {
        array.splice(index, 1);
    }
}

// Fonction pour récupérer les armes du jeu avec leurs images
function getWeapons() {
    const weapons = [
        { name: "A boule", image: path.join(__dirname, '../public/images/armes/carte_a_boule.png') },
        { name: "Babyfoot", image: path.join(__dirname, '../public/images/armes/carte_babyfoot.png') },
        { name: "DDOS", image: path.join(__dirname, '../public/images/armes/carte_ddos.png') },
        { name: "Pain au chocolat", image: path.join(__dirname, '../public/images/armes/carte_pain_au_chocolat.png') },
        { name: "PC Gamer", image: path.join(__dirname, '../public/images/armes/carte_pc_gamer.png') },
        { name: "Plat sans viande", image: path.join(__dirname, '../public/images/armes/carte_plat_sans_viande.png') },
        { name: "Poly de maths", image: path.join(__dirname, '../public/images/armes/carte_poly_de_maths.png') },
        { name: "Velleda", image: path.join(__dirname, '../public/images/armes/carte_velleda.png') }
    ];
    return weapons;
}

// Fonction pour récupérer les personnages (profs) avec leurs images
function getProfs() {
    const profs = [
        { name: "Adam", image: path.join(__dirname, '../public/images/profs/carte_adam.png') },
        { name: "Baudont", image: path.join(__dirname, '../public/images/profs/carte_baudont.png') },
        { name: "Borne", image: path.join(__dirname, '../public/images/profs/carte_borne.png') },
        { name: "Godin", image: path.join(__dirname, '../public/images/profs/carte_godin.png') },
        { name: "Kamp", image: path.join(__dirname, '../public/images/profs/carte_kamp.png') },
        { name: "Kerbellec", image: path.join(__dirname, '../public/images/profs/carte_kerbellec.png') },
        { name: "Pham", image: path.join(__dirname, '../public/images/profs/carte_pham.png') },
        { name: "Raut", image: path.join(__dirname, '../public/images/profs/carte_raut.png') }
    ];
    return profs;
}

// Fonction pour récupérer les salles avec leurs images
function getRooms() {
    const rooms = [
        { name: "Amphi A", image: path.join(__dirname, '../public/images/salles/carte_amphi_A.png') },
        { name: "Amphi B", image: path.join(__dirname, '../public/images/salles/carte_amphi_B.png') },
        { name: "Amphi C", image: path.join(__dirname, '../public/images/salles/carte_amphi_C.png') },
        { name: "BU", image: path.join(__dirname, '../public/images/salles/carte_BU.png') },
        { name: "Cafétéria", image: path.join(__dirname, '../public/images/salles/carte_caféteria.png') },
        { name: "Imprimerie", image: path.join(__dirname, '../public/images/salles/carte_imprimerie.png') },
        { name: "RU", image: path.join(__dirname, '../public/images/salles/carte_RU.png') },
        { name: "Salle des profs", image: path.join(__dirname, '../public/images/salles/carte_salle_des_profs.png') },
        { name: "Secrétariat", image: path.join(__dirname, '../public/images/salles/carte_secrétariat.png') }
    ];
    return rooms;
}

module.exports = { generateGameCode, generatePlayerId, getWeapons, getProfs, getRooms, shuffleArray, chooseRandom, removeElement };
