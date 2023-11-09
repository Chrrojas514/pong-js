const GameState = require('../models/gameState');

GameState.sync({ force: true }); // WARNING - CLEARS EVERYTHING CURRENTLY IN DB
