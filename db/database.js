const Sequelize = require('sequelize');

const sequelize = new Sequelize('database', 'user', 'password', {
  dialect: 'sqlite',
  host: 'localhost',
  storage: 'gameStates.sqlite',
  logging: false, // DEPRECIATED
});

module.exports = sequelize;
