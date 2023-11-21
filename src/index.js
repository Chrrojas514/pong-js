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
  const target = await GameState.findOne({
    where: { roomId: req.params.roomId },
    raw: false,
  });

  if (target) {
    clearInterval(updateTick);
    await target.destroy();
    res.send('successfully deleted');
    return;
  }

  res.send('Room for deletion not found');
});

app.get('/gameStates/:roomId', async (req, res) => {
  const target = await GameState.findOne({
    where: { roomId: req.params.roomId },
    raw: false,
  });
  res.json(target);
});

app.get('/gameStates', async (req, res) => {
  const fetchGameStates = await GameState.findAll();

  res.json(fetchGameStates);
});

app.put('/gameStates/:roomId', async (req, res) => {
  const target = await GameState.findOne({
    where: { roomId: req.params.roomId },
    raw: false,
  });

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
  const target = await GameState.findOne({
    where: { roomId: req.body.roomId },
    raw: false,
  });

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
  const target = await GameState.findOne({
    where: { roomId: req.body.roomId },
    raw: false,
  });

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
  const target = await GameState.findOne({
    where: { roomId: req.body.roomId },
    raw: false,
  });

  if (!target) {
    res.status(404).send('Room not found');
    return;
  }

  target.gameStarted = true;
  target.gameOver = false;

  target.ballVelocityX = Math.floor(Math.random() * 2) ? 2 : -2;
  target.ballVelocityY = 0;

  const updatedTarget = await target.save();

  setInterval(() => updateTick(req.body.roomId), 200);

  res.json(updatedTarget);
});

app.post('/endGame', async (req, res) => {
  const target = await GameState.findOne({
    where: { roomId: req.body.roomId },
    raw: false,
  });

  if (!target) {
    res.status(404).send('Room not found');
    return;
  }

  clearInterval(updateTick(req.body.roomId));

  target.gameStarted = false;
  target.gameOver = true;

  target.ballPositionX = 50;
  target.ballPositionY = 50;

  const updatedTarget = await target.save();

  // How to end previous interval?

  res.json(updatedTarget);
});

const updateTick = async (roomId) => {
  const target = await GameState.findOne({ where: { roomId }, raw: false });

  if (!target) {
    console.log('ERROR : GameState with ID not found!');
    return;
  }

  // Sending the percent of where the pixel is, so 50 50 is center,
  // 0 50 is left center and 100 100 is bottom right
  const paddleABound = {
    top: target.playerAPaddlePosition,
    bottom: target.playerAPaddlePosition + 24,
  };
  const paddleBBound = {
    top: target.playerBPaddlePosition,
    bottom: target.playerBPaddlePosition + 24,
  };

  const ballHitPaddle = (gamestate) => {
    const isWithinPaddleX = () => {
      if (gamestate.ballPositionX <= 10 || gamestate.ballPositionX >= 90) {
        return true;
      }

      return false;
    };

    const isWithinPaddleY = () => {
      if ((gamestate.ballPositionY >= paddleABound.top
        && gamestate.ballPositionY <= paddleABound.bottom)
      || (gamestate.ballPositionY >= paddleBBound.top
        && gamestate.ballPositionY <= paddleBBound.bottom)) {
        return true;
      }

      return false;
    };

    // if (
    //   ((gamestate.ballPositionX <= 10 || gamestate.ballPositionX >= 90)
    //     && ((gamestate.ballPositionY >= paddleABound.top
    //       && gamestate.ballPositionY <= paddleABound.bottom)))
    //     || ((gamestate.ballPositionY >= paddleBBound.top
    //       && gamestate.ballPositionY <= paddleBBound.bottom))
    // ) {
    //   return true;
    // }
    // return false;

    if (isWithinPaddleX() && isWithinPaddleY()) {
      return true;
    }

    return false;
  };

  const logBallPos = {
    ballPositionX: target.ballPositionX,
    ballPositionY: target.ballPositionY,
  };

  console.log(paddleABound);
  console.log(logBallPos);
  console.log(ballHitPaddle(target));

  if (!target.gameStarted) {
    clearInterval(updateTick);
    return;
  }

  // If ball hits roof or floor of arena
  if (target.ballPositionY <= 0 || target.ballPositionY >= 100) {
    target.ballVelocityY *= -1;
  }

  if (target.ballPositionX <= 0 || target.ballPositionX >= 100) {
    target.ballVelocityX *= -1;
    target.ballVelocityY = Math.floor(Math.random() * 2) ? 2 : -2;
  }

  if (ballHitPaddle(target)) {
    target.ballVelocityX *= -1;
    target.ballVelocityY = Math.floor(Math.random() * 2) ? 2 : -2;
  }

  if (playerAWon(target)) {
    target.playerAScore += 1;
  }

  if (playerBWon(target)) {
    target.playerBScore += 1;
  }

  target.ballPositionX += target.ballVelocityX;
  target.ballPositionY += target.ballVelocityY;

  await target.save();
};

// Ball went out of bounds on the left
const playerAWon = (gamestate) => gamestate.ballPositionX <= 0;

// Ball went out of bounds on the right
const playerBWon = (gamestate) => gamestate.ballPositionX >= 100;

app.listen(port, () => {
  console.log(`Pong app listening on port ${port}`);
});
