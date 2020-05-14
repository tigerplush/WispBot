const {databasePath, giveawayDatabase, enteredUsersDatabase} = require('../config.json');

const Database = require('./Database.js');

const giveawayDb = new Database(databasePath, giveawayDatabase);
const enteredUsersDb = new Database(databasePath, enteredUsersDatabase);

module.exports.giveawayDb = giveawayDb;
module.exports.enteredUsersDb = enteredUsersDb;