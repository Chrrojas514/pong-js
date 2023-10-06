const app = require('express')();
const bodyParser = require('body-parser');

const port = 3000;

const gameStates = [{
  roomName: 'generating',
  playerA: '',
  playerB: '',
  playerAPaddlePosX: 5,
  playerAPaddlePosY: 5,
  playerAPaddleSize: 5,
  playerBPaddlePosX: 115,
  playerBPaddlePosY: 5,
  playerBPaddleSize: 5,
  playerAScore: 0,
  playerBScore: 0,
  ballPositionX: 20,
  ballPositionY: 20,
  ballVelocityX: 2,
  ballVelocityY: 2,
  gameStarted: false,
  gameOver: false,
  roomId: '5670b0ab39b64',
}];

app.use(bodyParser.json()); // for parsing application/json

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.post('/createRoom', (req, res) => {
  res.json(req.body);
  const newGameState = { ...req.body, roomId: Math.random().toString(16).slice(2) };

  gameStates.push(newGameState);

  console.log(gameStates);
});

app.get('/gameStates/:id', (req, res) => {
  const target = gameStates.find((gamestate) => gamestate.roomId === req.params.id);
  res.json(target);
});

app.get('/gameStates', (req, res) => {
  res.json(gameStates);
});

app.put('/paddlePositionUpdate', (req, res) => {
  const target = gameStates.find((gamestate) => gamestate.roomId === req.params.id);

  if (!target) {
    res.status(404).send('Room not found');
    return;
  }

  if (req.body.playerName === target.playerA) {
    target.playerAPaddlePos = req.body.paddlePosition;

    res.json(target);
    return;
  }

  if (req.body.playerName === target.playerB) {
    target.playerBPaddlePos = req.body.paddlePosition;

    res.json(target);
    return;
  }

  res.send('Player with given name not found');
  // Do I need this return?
});

app.post('/joinRoom', (req, res) => {
  const target = gameStates.find((gamestate) => gamestate.roomId === req.body.id);

  if (!target) {
    res.status(404).send('Room not found');
    return;
  }

  // Checks for null, not a number, empty string, etc
  if (!target.playerA) {
    target.playerA = req.body.playerName;

    res.json(target);
    return;
  }

  target.playerB = req.params.playerName;
  res.json(target);
});

app.post('leaveRoom', (req, res) => {
  const target = gameStates.find((gamestate) => gamestate.roomId === req.body.id);

  if (!target) {
    res.status(404).send('Room not found');
    return;
  }

  if (req.body.playerName === target.playerA) {
    target.playerA = '';

    res.json(target);
    return;
  }

  if (req.body.playerName === target.playerB) {
    target.playerB = '';

    res.json(target);
    return;
  }

  res.send('Room is already empty!');
});

app.post('/startGame/:id', (req, res) => {
  const target = gameStates.find((gamestate) => gamestate.roomId === req.params.id);

  if (!target) {
    res.status(404).send('Room not found');
    return;
  }

  target.gameStarted = true;
  target.gameOver = false;

  setInterval(() => updateTick(target), 1000);

  res.json(target);
});

app.post('/endGame/:roomId', (req, res) => {
  const target = gameStates.find((gamestate) => gamestate.roomId === req.params.id);

  if (!target) {
    res.status(404).send('Room not found');
    return;
  }

  target.gameStarted = false;
  target.gameOver = true;

  // How to end previous interval?

  res.json(target);
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
