const neo4j = require('neo4j-driver');

const uri = 'bolt://127.0.0.1:7687';  // URL de Neo4j (remplacez par l'URI de votre instance Neo4j)
const user = 'neo4j';  // Nom d'utilisateur
const password = 'cluedoneo4j';  // Mot de passe Neo4j

const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));

module.exports = driver;
