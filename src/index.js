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
  const newGameState = { ...req.body };
  await GameState.create(newGameState);

  res.json(req.body);
});

app.delete('/gameStates/:roomId', async (req, res) => {
  const target = await GameState.findOne({ where: { roomId: req.params.roomId }, raw: false });

  if (target) {
    await target.destroy();
    return;
  }

  res.send('Room for deletion not found');
});

app.get('/gameStates/:roomId', async (req, res) => {
  const target = await GameState.findOne({ where: { roomId: req.params.roomId }, raw: false });
  res.json(target);
});

app.get('/gameStates', async (req, res) => {
  const fetchGameStates = await GameState.findAll();

  res.json(fetchGameStates);
});

app.put('/gameStates/:roomId', async (req, res) => {
  const target = await GameState.findOne({ where: { roomId: req.params.roomId }, raw: false });

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

app.post('/joinRoom', async (req, res) => {
  const target = await GameState.findOne({ where: { roomId: req.body.roomId }, raw: false });

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
  const target = await GameState.findOne({ where: { roomId: req.body.roomId }, raw: false });

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

  res.send('Room is already empty');
});

app.post('/startGame', async (req, res) => {
  const target = await GameState.findOne({ where: { roomId: req.body.roomId }, raw: false });

  if (!target) {
    res.status(404).send('Room not found');
    return;
  }

  target.gameStarted = true;
  target.gameOver = false;

  target.ballVelocityX = 10;
  target.ballVelocityY = 10;

  const updatedTarget = await target.save();

  setInterval(() => updateTick(req.body.roomId), 200);

  res.json(updatedTarget);
});

app.post('/endGame', async (req, res) => {
  const target = await GameState.findOne({ where: { roomId: req.body.roomId }, raw: false });

  if (!target) {
    res.status(404).send('Room not found');
    return;
  }

  clearInterval(updateTick);

  target.gameStarted = false;
  target.gameOver = true;

  const updatedTarget = await target.save();

  // How to end previous interval?

  res.json(updatedTarget);
});

const updateTick = async (roomId) => {
  const target = await GameState.findOne({ where: { roomId }, raw: false });

  if (!target.gameStarted) {
    clearInterval(updateTick);
    return;
  }

  // If ball hits roof or floor of arena
  if (target.ballPositionY <= 0 || target.ballPositionY >= 100) {
    target.ballVelocityY *= -1;
  }

  if (playerAWon(target)) {
    target.playerAScore += 1;
  }

  if (playerBWon(target)) {
    target.playerBScore += 1;
  }

  // if (ballHitPaddleA(target)) {
  //   target.ballVelocityX *= -1;
  //   target.ballPositionX += target.ballVelocityX;
  //   target.ballPositionY += target.ballVelocityY;
  // }

  // if (ballHitPaddleB(target)) {
  //   target.ballVelocityY *= -1;
  //   target.ballPositionX += target.ballVelocityX;
  //   target.ballPositionY += target.ballVelocityY;
  // }

  target.ballPositionX += target.ballVelocityX;
  target.ballPositionY += target.ballVelocityY;

  await target.save();
};

// Ball went out of bounds on the left
const playerAWon = (gamestate) => gamestate.ballPositionX <= 0;

// Ball went out of bounds on the right
const playerBWon = (gamestate) => gamestate.ballPositionX >= 180;

app.listen(port, () => {
  console.log(`Pong app listening on port ${port}`);
});
