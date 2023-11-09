const app = require('express')();
const cors = require('cors');
const bodyParser = require('body-parser');
const GameState = require('../models/gameState');

const port = 5000;

app.use(cors());
app.use(bodyParser.json()); // for parsing application/json

app.get('/', (req, res) => {
  res.send('Pong game!');
});

app.post('/createRoom', async (req, res) => {
  res.json(req.body);
  const newGameState = { ...req.body };

  console.log(newGameState);
  await GameState.create(newGameState);
});

app.get('/gameStates/:roomId', async (req, res) => {
  const target = await GameState.findByPk(req.params.roomId);
  res.json(target);
});

app.get('/gameStates', async (req, res) => {
  const fetchGameStates = await GameState.findAll();

  res.json(fetchGameStates);
});

// app.get('/gameStates/:roomId/:playerName', (req, res) => {
//   const target = gameStates.find((gamestate) => gamestate.roomId === req.body.roomId);

//   if (!target) {
//     res.status(404).send('Room not found');
//     return;
//   }

//   if (target.playerA === req.body.playerName) {
//     target.playerAPaddlePos = req.body.paddlePosition;

//     const response = {
//       roomId: target.roomId,
//       playerName: target.playerA,
//     };

//     res.json(response);
//     return;
//   }

//   if (target.playerB === req.body.playerName) {
//     target.playerBPaddlePos = req.body.paddlePosition;

//     const response = {
//       roomId: target.roomId,
//       playerName: target.playerB,
//     };

//     res.json(response);
//     return;
//   }

//   res.status(404).send('Player not found');
// });

app.put('/gameStates/:roomId', async (req, res) => {
  const target = await GameState.findByPk(req.params.roomId);

  if (!target) {
    res.status(404).send('Room not found');
    return;
  }

  if (req.body.playerName === target.playerA) {
    target.playerAPaddlePosition = req.body.paddlePosition;
    const updatedTarget = await target.save();

    res.json(updatedTarget);
    return;
  }

  if (req.body.playerName === target.playerB) {
    target.playerBPaddlePosition = req.body.paddlePosition;
    const updatedTarget = await target.save();

    res.json(updatedTarget);
    return;
  }

  res.send('Player with given name not found');
});

// app.put('/gameStates/:roomId/:playerName', (req, res) => {
//   const target = gameStates.find((gamestate) => gamestate.roomId === req.params.roomId);

//   if (!target) {
//     res.status(404).send('Room not found');
//     return;
//   }

//   if (target.playerA === req.params.playerName) {
//     target.playerAPaddlePos = req.body.paddlePosition;

//     res.json(target);
//     return;
//   }

//   if (target.playerB === req.params.playerName) {
//     target.playerBPaddlePos = req.body.playerBPaddlePos;

//     res.json(target);
//     return;
//   }

//   res.status(404).send('Player not found');
// });

app.post('/joinRoom', async (req, res) => {
  const target = await GameState.findByPk(req.body.roomId);

  if (!target) {
    res.status(404).send('Room not found');
    return;
  }

  // Checks for null, not a number, empty string, etc
  if (!target.playerA) {
    target.playerA = req.body.playerName;
    const updatedTarget = await target.save();

    res.json(updatedTarget);
    return;
  }

  if (!target.playerB) {
    target.playerB = req.body.playerName;
    const updatedTarget = await target.save();

    res.json(updatedTarget);
    return;
  }

  res.status(400).send('Room is full!');
});

app.post('/leaveRoom', async (req, res) => {
  const target = GameState.findByPk(req.body.roomId);

  if (!target) {
    res.status(404).send('Room not found');
    return;
  }

  if (req.body.playerName === target.playerA) {
    target.playerA = '';
    const updatedTarget = await target.save();

    res.json(updatedTarget);
    return;
  }

  if (req.body.playerName === target.playerB) {
    target.playerB = '';
    const updatedTarget = await target.save();

    res.json(updatedTarget);
    return;
  }

  res.send('Room is already empty!');
});

app.post('/startGame', async (req, res) => {
  const target = GameState.findByPk(req.body.roomId);

  if (!target) {
    res.status(404).send('Room not found');
    return;
  }

  target.gameStarted = true;
  target.gameOver = false;
  const updatedTarget = target.save();

  setInterval(() => updateTick(target), 1000);

  res.json(updatedTarget);
});

app.post('/endGame/:roomId', (req, res) => {
  const target = GameState.findByPk(req.params.roomId);

  if (!target) {
    res.status(404).send('Room not found');
    return;
  }

  target.gameStarted = false;
  target.gameOver = true;
  const updatedTarget = target.save();

  // How to end previous interval?

  res.json(updatedTarget);
});

const updateTick = (gamestate) => {
  const newGamestate = { ...gamestate };
  // If ball hits roof or floor of arena
  if (newGamestate.ballPositionY <= 0 || newGamestate.ballPositionY >= 100) {
    newGamestate.ballVelocityY *= -1;
  }

  if (playerAWon(newGamestate)) {
    newGamestate.playerAScore += 1;
  }

  if (playerBWon(newGamestate)) {
    newGamestate.playerBScore += 1;
  }

  if (ballHitPaddleA(newGamestate)) {
    newGamestate.ballVelocityX *= -1;
    newGamestate.ballPositionX += newGamestate.ballVelocityX;
    newGamestate.ballPositionY += newGamestate.ballVelocityY;
  }

  if (ballHitPaddleB(newGamestate)) {
    newGamestate.ballVelocityY *= -1;
    newGamestate.ballPositionX += newGamestate.ballVelocityX;
    newGamestate.ballPositionY += newGamestate.ballVelocityY;
  }
};

// Ball went out of bounds on the left
const playerAWon = (gamestate) => gamestate.ballPositionX <= 0;

// Ball went out of bounds on the right
const playerBWon = (gamestate) => gamestate.ballPositionX >= 180;

const ballHitPaddleA = (gamestate) => gamestate.ballPositionX === gamestate.playerAPaddlePosX
      && (gamestate.ballPositionY >= gamestate.playerAPaddlePosY
        && gamestate.ballPositionY <= gamestate.playerAPaddlePosY + gamestate.playerAPaddleSize);

const ballHitPaddleB = (gamestate) => gamestate.ballPositionX === gamestate.playerBPaddlePosX
        && (gamestate.ballPositionY >= gamestate.playerBPaddlePosY
          && gamestate.ballPositionY <= gamestate.playerBPaddlePosY + gamestate.playerBPaddleSize);

app.listen(port, () => {
  console.log(`Pong app listening on port ${port}`);
});
