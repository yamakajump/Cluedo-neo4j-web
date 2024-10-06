document.addEventListener("DOMContentLoaded", function() {
    // Récupère les armes, salles, et professeurs
    const weapons = getWeapons();
    const profs = getProfs();
    const rooms = getRooms();

    // Diviser les salles en deux moitiés
    const halfLength = Math.ceil(rooms.length / 2);
    const leftRooms = rooms.slice(0, halfLength);
    const rightRooms = rooms.slice(halfLength);

    // Sélectionne les éléments du DOM
    const weaponsRoomsLeftTable = document.getElementById("weapons-rooms-left-table");
    const roomsProfsRightTable = document.getElementById("rooms-profs-right-table");

    // Fonction pour créer une ligne de tableau pour les armes et salles (moitié) sur la page de gauche
    weapons.forEach(weapon => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${weapon.name}</td>
            <td><button class="state-btn" data-state="none"></button></td>
            <td><button class="state-btn" data-state="none"></button></td>
        `;
        weaponsRoomsLeftTable.appendChild(row);
    });

    leftRooms.forEach(room => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${room.name}</td>
            <td><button class="state-btn" data-state="none"></button></td>
            <td><button class="state-btn" data-state="none"></button></td>
        `;
        weaponsRoomsLeftTable.appendChild(row);
    });

    // Fonction pour créer une ligne de tableau pour les salles (moitié) et professeurs sur la page de droite
    rightRooms.forEach(room => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${room.name}</td>
            <td><button class="state-btn" data-state="none"></button></td>
            <td><button class="state-btn" data-state="none"></button></td>
        `;
        roomsProfsRightTable.appendChild(row);
    });

    profs.forEach(prof => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${prof.name}</td>
            <td><button class="state-btn" data-state="none"></button></td>
            <td><button class="state-btn" data-state="none"></button></td>
        `;
        roomsProfsRightTable.appendChild(row);
    });

    // Gère le changement d'état des boutons (comme déjà défini précédemment)
    const buttons = document.querySelectorAll('.state-btn');
    buttons.forEach(button => {
        button.addEventListener('click', function() {
            let currentState = button.getAttribute('data-state');
            if (currentState === 'none') {
                button.setAttribute('data-state', 'cross');
                button.textContent = '✘';
            } else if (currentState === 'cross') {
                button.setAttribute('data-state', 'check');
                button.textContent = '✔';
            } else if (currentState === 'check') {
                button.setAttribute('data-state', 'none');
                button.textContent = '';
            }
        });
    });
});

// Fonction pour récupérer les armes du jeu avec leurs images
function getWeapons() {
    return [
        { name: "A boule", image: '/images/carte/armes/carte_a_boule.png' },
        { name: "Babyfoot", image: '/images/carte/armes/carte_babyfoot.png' },
        { name: "DDOS", image: '/images/carte/armes/carte_ddos.png' },
        { name: "Pain au chocolat", image: '/images/carte/armes/carte_pain_au_chocolat.png' },
        { name: "PC Gamer", image: '/images/carte/armes/carte_pc_gamer.png' },
        { name: "Plat sans viande", image: '/images/carte/armes/carte_plat_sans_viande.png' },
        { name: "Poly de maths", image: '/images/carte/armes/carte_poly_de_maths.png' },
        { name: "Velleda", image: '/images/carte/armes/carte_velleda.png' }
    ];
}

// Fonction pour récupérer les personnages (profs) avec leurs images
function getProfs() {
    return [
        { name: "Adam", image: '/images/carte/profs/carte_adam.png' },
        { name: "Baudont", image: '/images/carte/profs/carte_baudont.png' },
        { name: "Borne", image: '/images/carte/profs/carte_borne.png' },
        { name: "Godin", image: '/images/carte/profs/carte_godin.png' },
        { name: "Kamp", image: '/images/carte/profs/carte_kamp.png' },
        { name: "Kerbellec", image: '/images/carte/profs/carte_kerbellec.png' },
        { name: "Pham", image: '/images/carte/profs/carte_pham.png' },
        { name: "Raut", image: '/images/carte/profs/carte_raut.png' }
    ];
}

// Fonction pour récupérer les salles avec leurs images
function getRooms() {
    return [
        { name: "Amphi A", image: '/images/carte/salles/carte_amphi_A.png' },
        { name: "Amphi B", image: '/images/carte/salles/carte_amphi_B.png' },
        { name: "Amphi C", image: '/images/carte/salles/carte_amphi_C.png' },
        { name: "BU", image: '/images/carte/salles/carte_BU.png' },
        { name: "Cafétéria", image: '/images/carte/salles/carte_caféteria.png' },
        { name: "Imprimerie", image: '/images/carte/salles/carte_imprimerie.png' },
        { name: "RU", image: '/images/carte/salles/carte_RU.png' },
        { name: "Salle des profs", image: '/images/carte/salles/carte_salle_des_profs.png' },
        { name: "Secrétariat", image: '/images/carte/salles/carte_secrétariat.png' }
    ];
}
