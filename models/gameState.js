const Sequelize = require('sequelize');
const sequelize = require('../db/database');

const GameState = sequelize.define('gameState', {
  roomId: {
    type: Sequelize.UUID,
    primaryKey: true,
    defaultValue: Sequelize.UUIDV4,
  },
  roomName: {
    type: Sequelize.TEXT,
  },
  playerA: {
    type: Sequelize.TEXT,
  },
  playerB: {
    type: Sequelize.TEXT,
  },
  playerAPaddlePosition: {
    type: Sequelize.INTEGER,
  },
  playerBPaddlePosition: {
    type: Sequelize.INTEGER,
  },
  playerAScore: {
    type: Sequelize.INTEGER,
  },
  playerBScore: {
    type: Sequelize.INTEGER,
  },
  ballPositionX: {
    type: Sequelize.INTEGER,
  },
  ballPositionY: {
    type: Sequelize.INTEGER,
  },
  ballVelocityX: {
    type: Sequelize.INTEGER,
  },
  ballVelocityY: {
    type: Sequelize.INTEGER,
  },
  gameStarted: {
    type: Sequelize.BOOLEAN,
  },
  gameOver: {
    type: Sequelize.BOOLEAN,
  },
});

module.exports = GameState;
