// =============================
// MENÚ RESPONSIVE
// =============================

const menuBtn = document.getElementById("menuBtn");
const nav = document.getElementById("nav");

if (menuBtn && nav) {
  menuBtn.addEventListener("click", () => {
    nav.classList.toggle("active");
  });

  const navLinks = document.querySelectorAll(".nav a");

  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("active");
    });
  });
}

// =============================
// VIDEOS
// =============================

const videoCards = document.querySelectorAll(".video-card[data-video-url]");

videoCards.forEach((card) => {
  card.addEventListener("click", () => {
    const videoURL = card.dataset.videoUrl;

    if (videoURL) {
      window.open(videoURL, "_blank");
    } else {
      alert("Aquí irá el enlace del video cuando lo tengas listo.");
    }
  });
});

// =============================
// BOTÓN EASYCANCHA
// =============================

const easyCanchaBtn = document.getElementById("easyCanchaBtn");

// Aquí irá el enlace oficial de EasyCancha cuando el cliente lo entregue.
const EASYCANCHA_URL = "";

if (easyCanchaBtn) {
  easyCanchaBtn.addEventListener("click", () => {
    if (EASYCANCHA_URL) {
      window.open(EASYCANCHA_URL, "_blank");
      return;
    }

    alert("Próximamente podrás reservar desde EasyCancha. Estamos preparando el enlace oficial.");
  });
}

// =============================
// JUEGO INTERACTIVO PICKLEBALL
// MODO REALISTA: DEBE TOCAR CUADRO RIVAL
// =============================

const gameCanvas = document.getElementById("pickleballGame");
const gameStart = document.getElementById("gameStart");
const startGameBtn = document.getElementById("startGameBtn");
const playerScoreText = document.getElementById("playerScore");
const robotScoreText = document.getElementById("robotScore");
const difficultySelect = document.getElementById("difficultySelect");
const restartGameBtn = document.getElementById("restartGameBtn");

if (
  gameCanvas &&
  gameStart &&
  startGameBtn &&
  playerScoreText &&
  robotScoreText &&
  difficultySelect &&
  restartGameBtn
) {
  const gameCtx = gameCanvas.getContext("2d");

  let gameRunning = false;
  let pointPaused = false;

  let playerScore = 0;
  let robotScore = 0;

  let currentDifficulty = "medium";
  let lastHitter = null;

  /*
    NUEVA REGLA:
    Después de cada golpe, la pelota debe "tocar" uno de los dos cuadros pequeños
    del área rival. Es decir, debe llegar al fondo del lado rival, por fuera de la cocina.

    Si sale por un costado ANTES de tocar ese cuadro, el punto es para el rival.
    Si toca el cuadro rival y luego sale, el punto es para quien golpeó.
  */
  let shotState = {
    hitter: null,
    landedInValidBox: false,
    landingFlash: 0,
    landingX: 0.5,
    landingY: 0.5
  };

  const difficulties = {
    easy: {
      ballSpeed: 0.0047,
      robotMaxStep: 0.0048,
      robotError: 0.2,
      anticipation: 0.08,
      adaptiveness: 0.15,
      attackAim: 0.12,
      robotSize: 0.18
    },
    medium: {
      ballSpeed: 0.0064,
      robotMaxStep: 0.0085,
      robotError: 0.085,
      anticipation: 0.35,
      adaptiveness: 0.45,
      attackAim: 0.42,
      robotSize: 0.2
    },
    hard: {
      ballSpeed: 0.008,
      robotMaxStep: 0.014,
      robotError: 0.03,
      anticipation: 0.72,
      adaptiveness: 0.82,
      attackAim: 0.78,
      robotSize: 0.22
    }
  };

  let player = {
    position: 0.5,
    size: 0.2
  };

  let robot = {
    position: 0.5,
    target: 0.5,
    size: 0.2
  };

  let ball = {
    x: 0.5,
    y: 0.5,
    vx: 0.0064,
    vy: 0.003,
    radius: 0.018
  };

  const playerStats = {
    lastPosition: 0.5,
    averagePosition: 0.5,
    averageSpeed: 0,
    hitBias: 0,
    totalHits: 0
  };

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function getDifficultyConfig() {
    return difficulties[currentDifficulty] || difficulties.medium;
  }

  function resetPlayerStats() {
    playerStats.hitBias = 0;
    playerStats.averageSpeed = 0;
    playerStats.averagePosition = 0.5;
    playerStats.lastPosition = 0.5;
    playerStats.totalHits = 0;
  }

  function resizeGameCanvas() {
    const rect = gameCanvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    gameCanvas.width = rect.width * dpr;
    gameCanvas.height = rect.height * dpr;

    gameCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function isGamePortrait() {
    const rect = gameCanvas.getBoundingClientRect();
    return rect.height > rect.width;
  }

  function fillRoundedRect(ctx, x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);

    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
  }

  function drawPickleballCourt(w, h, portrait) {
    const ctx = gameCtx;

    const grassGradient = ctx.createLinearGradient(0, 0, w, h);
    grassGradient.addColorStop(0, "#7daa42");
    grassGradient.addColorStop(0.45, "#5d8f34");
    grassGradient.addColorStop(1, "#345a17");

    ctx.fillStyle = grassGradient;
    ctx.fillRect(0, 0, w, h);

    ctx.globalAlpha = 0.07;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1;

    for (let i = 0; i < w; i += 14) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i - 60, h);
      ctx.stroke();
    }

    ctx.globalAlpha = 1;

    let court;

    if (portrait) {
      court = {
        x: w * 0.12,
        y: h * 0.055,
        width: w * 0.76,
        height: h * 0.89
      };
    } else {
      court = {
        x: w * 0.055,
        y: h * 0.14,
        width: w * 0.89,
        height: h * 0.72
      };
    }

    ctx.fillStyle = "rgba(0, 0, 0, 0.18)";
    fillRoundedRect(ctx, court.x + 8, court.y + 10, court.width, court.height, 18);

    const blueGradient = ctx.createLinearGradient(
      court.x,
      court.y,
      court.x + court.width,
      court.y + court.height
    );

    blueGradient.addColorStop(0, "#1f6da4");
    blueGradient.addColorStop(0.5, "#145184");
    blueGradient.addColorStop(1, "#0d365d");

    ctx.fillStyle = blueGradient;
    fillRoundedRect(ctx, court.x, court.y, court.width, court.height, 18);

    ctx.strokeStyle = "rgba(255, 255, 255, 0.95)";
    ctx.lineWidth = Math.max(3, w * 0.004);
    ctx.lineCap = "round";
    ctx.strokeRect(court.x, court.y, court.width, court.height);

    if (portrait) {
      const netY = court.y + court.height / 2;
      const kitchenTop = netY - court.height * 0.17;
      const kitchenBottom = netY + court.height * 0.17;
      const centerX = court.x + court.width / 2;

      ctx.strokeStyle = "rgba(5, 10, 20, 0.9)";
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(court.x - 10, netY);
      ctx.lineTo(court.x + court.width + 10, netY);
      ctx.stroke();

      ctx.strokeStyle = "rgba(0, 0, 0, 0.22)";
      ctx.lineWidth = 18;
      ctx.beginPath();
      ctx.moveTo(court.x - 10, netY + 7);
      ctx.lineTo(court.x + court.width + 10, netY + 7);
      ctx.stroke();

      ctx.strokeStyle = "rgba(255, 255, 255, 0.95)";
      ctx.lineWidth = 4;

      ctx.beginPath();
      ctx.moveTo(court.x, kitchenTop);
      ctx.lineTo(court.x + court.width, kitchenTop);
      ctx.moveTo(court.x, kitchenBottom);
      ctx.lineTo(court.x + court.width, kitchenBottom);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(centerX, court.y);
      ctx.lineTo(centerX, kitchenTop);
      ctx.moveTo(centerX, kitchenBottom);
      ctx.lineTo(centerX, court.y + court.height);
      ctx.stroke();

    } else {
      const netX = court.x + court.width / 2;
      const kitchenLeft = netX - court.width * 0.17;
      const kitchenRight = netX + court.width * 0.17;
      const centerY = court.y + court.height / 2;

      ctx.strokeStyle = "rgba(5, 10, 20, 0.9)";
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(netX, court.y - 10);
      ctx.lineTo(netX, court.y + court.height + 10);
      ctx.stroke();

      ctx.strokeStyle = "rgba(0, 0, 0, 0.24)";
      ctx.lineWidth = 18;
      ctx.beginPath();
      ctx.moveTo(netX + 7, court.y - 10);
      ctx.lineTo(netX + 7, court.y + court.height + 10);
      ctx.stroke();

      ctx.strokeStyle = "rgba(255, 255, 255, 0.95)";
      ctx.lineWidth = 4;

      ctx.beginPath();
      ctx.moveTo(kitchenLeft, court.y);
      ctx.lineTo(kitchenLeft, court.y + court.height);
      ctx.moveTo(kitchenRight, court.y);
      ctx.lineTo(kitchenRight, court.y + court.height);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(court.x, centerY);
      ctx.lineTo(kitchenLeft, centerY);
      ctx.moveTo(kitchenRight, centerY);
      ctx.lineTo(court.x + court.width, centerY);
      ctx.stroke();
    }

    return court;
  }

  function drawPickleballPaddle(x, y, width, height, color, orientation) {
    const ctx = gameCtx;

    ctx.save();

    ctx.shadowColor = "rgba(0, 0, 0, 0.35)";
    ctx.shadowBlur = 16;
    ctx.shadowOffsetY = 8;

    ctx.fillStyle = color;

    if (orientation === "vertical") {
      const headHeight = height * 0.72;
      const handleHeight = height * 0.28;
      const handleWidth = width * 0.45;

      fillRoundedRect(ctx, x, y, width, headHeight, width / 2);

      ctx.fillStyle = "rgba(255, 255, 255, 0.16)";
      fillRoundedRect(ctx, x + width * 0.18, y + headHeight * 0.14, width * 0.64, headHeight * 0.18, 10);

      ctx.fillStyle = "#1d2414";
      fillRoundedRect(
        ctx,
        x + width / 2 - handleWidth / 2,
        y + headHeight - 2,
        handleWidth,
        handleHeight,
        8
      );
    } else {
      const headWidth = width * 0.72;
      const handleWidth = width * 0.28;
      const handleHeight = height * 0.45;

      fillRoundedRect(ctx, x, y, headWidth, height, height / 2);

      ctx.fillStyle = "rgba(255, 255, 255, 0.16)";
      fillRoundedRect(ctx, x + headWidth * 0.14, y + height * 0.18, headWidth * 0.18, height * 0.64, 10);

      ctx.fillStyle = "#1d2414";
      fillRoundedRect(
        ctx,
        x + headWidth - 2,
        y + height / 2 - handleHeight / 2,
        handleWidth,
        handleHeight,
        8
      );
    }

    ctx.restore();
  }

  function drawBall(x, y, radius) {
    const ctx = gameCtx;

    const gradient = ctx.createRadialGradient(
      x - radius * 0.4,
      y - radius * 0.4,
      radius * 0.1,
      x,
      y,
      radius
    );

    gradient.addColorStop(0, "#dfff6a");
    gradient.addColorStop(1, "#8fbd28");

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(7, 17, 39, 0.35)";

    for (let i = 0; i < 6; i++) {
      const angle = i * Math.PI / 3;

      ctx.beginPath();
      ctx.arc(
        x + Math.cos(angle) * radius * 0.48,
        y + Math.sin(angle) * radius * 0.48,
        radius * 0.12,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
  }

  function drawLandingFlash(court) {
    if (shotState.landingFlash <= 0) return;

    const ctx = gameCtx;

    const flashX = court.x + court.width * shotState.landingX;
    const flashY = court.y + court.height * shotState.landingY;
    const alpha = shotState.landingFlash / 20;

    ctx.save();
    ctx.globalAlpha = alpha;

    ctx.strokeStyle = "#dfff6a";
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.arc(flashX, flashY, 18 + (20 - shotState.landingFlash), 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();

    shotState.landingFlash--;
  }

  function updatePlayerLearning(newPosition) {
    const movement = Math.abs(newPosition - playerStats.lastPosition);

    playerStats.averageSpeed =
      playerStats.averageSpeed * 0.88 + movement * 0.12;

    playerStats.averagePosition =
      playerStats.averagePosition * 0.94 + newPosition * 0.06;

    playerStats.lastPosition = newPosition;
  }

  function recordPlayerHit(offset) {
    playerStats.totalHits++;

    playerStats.hitBias =
      playerStats.hitBias * 0.82 + offset * 0.18;
  }

  function setBallSpeed(direction = 1) {
    const config = getDifficultyConfig();
    const portrait = isGamePortrait();

    const sideVariation = (Math.random() * 0.0036) - 0.0018;

    if (portrait) {
      ball.vx = sideVariation;
      ball.vy = config.ballSpeed * direction;
    } else {
      ball.vx = config.ballSpeed * direction;
      ball.vy = sideVariation;
    }
  }

  function startNewShot(hitter) {
    shotState.hitter = hitter;
    shotState.landedInValidBox = false;
    shotState.landingFlash = 0;
  }

  function resetBall(direction = 1) {
    const portrait = isGamePortrait();

    ball.x = 0.5;
    ball.y = 0.5;

    if (portrait) {
      lastHitter = direction > 0 ? "robot" : "player";
    } else {
      lastHitter = direction > 0 ? "player" : "robot";
    }

    startNewShot(lastHitter);
    setBallSpeed(direction);
  }

  function scorePoint(winner) {
    if (pointPaused) return;

    pointPaused = true;
    gameRunning = false;

    if (winner === "player") {
      playerScore++;
      playerScoreText.textContent = playerScore;
    }

    if (winner === "robot") {
      robotScore++;
      robotScoreText.textContent = robotScore;
    }

    setTimeout(() => {
      resetBall(winner === "player" ? -1 : 1);
      pointPaused = false;
      gameRunning = true;
    }, 650);
  }

  function getRivalOf(hitter) {
    return hitter === "player" ? "robot" : "player";
  }

  function getWinnerWhenBallLeavesCourt() {
    if (!shotState.hitter) return "robot";

    if (shotState.landedInValidBox) {
      return shotState.hitter;
    }

    return getRivalOf(shotState.hitter);
  }

  function restartGame() {
    playerScore = 0;
    robotScore = 0;

    playerScoreText.textContent = playerScore;
    robotScoreText.textContent = robotScore;

    player.position = 0.5;
    robot.position = 0.5;
    robot.target = 0.5;

    pointPaused = false;
    gameRunning = true;

    resetPlayerStats();
    resetBall(isGamePortrait() ? 1 : -1);

    gameStart.classList.add("hidden");
  }

  function getAdaptiveRobotTarget(portrait) {
    const config = getDifficultyConfig();

    const ballAxis = portrait ? ball.x : ball.y;

    const learnedHitDirection = playerStats.hitBias * config.anticipation;
    const movementPrediction =
      (playerStats.averagePosition - 0.5) * config.adaptiveness * 0.35;

    const randomError =
      Math.sin(Date.now() / 360) * config.robotError * 0.5;

    const target = ballAxis + learnedHitDirection + movementPrediction + randomError;

    return clamp(target, 0.08, 0.92);
  }

  function updateRobot(portrait) {
    const config = getDifficultyConfig();

    robot.size = config.robotSize;

    const ballGoingToRobot = portrait ? ball.vy < 0 : ball.vx > 0;

    if (ballGoingToRobot) {
      robot.target = getAdaptiveRobotTarget(portrait);
    } else {
      const neutralPosition = 0.5;
      const playerWeakSide = playerStats.averagePosition < 0.5 ? 0.68 : 0.32;

      robot.target =
        neutralPosition * (1 - config.anticipation) +
        playerWeakSide * config.anticipation;
    }

    const adaptiveBoost = clamp(playerStats.averageSpeed * 0.6, 0, 0.008);
    const maxStep = config.robotMaxStep + adaptiveBoost * config.adaptiveness;

    const difference = robot.target - robot.position;
    const movement = clamp(difference, -maxStep, maxStep);

    robot.position += movement;
    robot.position = clamp(robot.position, 0.1, 0.9);
  }

  function applyRobotAdaptiveShot(portrait) {
    const config = getDifficultyConfig();

    const playerCurrentSide = player.position < 0.5 ? "left" : "right";
    const targetWeakZone = playerCurrentSide === "left" ? 0.78 : 0.22;

    const adaptiveTarget =
      0.5 * (1 - config.attackAim) +
      targetWeakZone * config.attackAim;

    if (portrait) {
      const direction = adaptiveTarget - ball.x;
      ball.vx += direction * 0.012;
    } else {
      const direction = adaptiveTarget - ball.y;
      ball.vy += direction * 0.012;
    }
  }

  function markValidLandingIfNeeded(portrait) {
    if (shotState.landedInValidBox || !shotState.hitter) return;

    /*
      Coordenadas normalizadas de la cancha:
      0.0 a 1.0 en ancho y alto.

      En modo horizontal:
      - jugador a la izquierda
      - robot a la derecha
      - cocina cerca del centro
      - cuadros válidos del robot: x >= 0.67
      - cuadros válidos del jugador: x <= 0.33

      En modo vertical:
      - robot arriba
      - jugador abajo
      - cocina cerca del centro
      - cuadros válidos del robot: y <= 0.33
      - cuadros válidos del jugador: y >= 0.67
    */

    if (portrait) {
      if (shotState.hitter === "player" && ball.y <= 0.33 && ball.x >= 0 && ball.x <= 1) {
        shotState.landedInValidBox = true;
      }

      if (shotState.hitter === "robot" && ball.y >= 0.67 && ball.x >= 0 && ball.x <= 1) {
        shotState.landedInValidBox = true;
      }
    } else {
      if (shotState.hitter === "player" && ball.x >= 0.67 && ball.y >= 0 && ball.y <= 1) {
        shotState.landedInValidBox = true;
      }

      if (shotState.hitter === "robot" && ball.x <= 0.33 && ball.y >= 0 && ball.y <= 1) {
        shotState.landedInValidBox = true;
      }
    }

    if (shotState.landedInValidBox) {
      shotState.landingX = ball.x;
      shotState.landingY = ball.y;
      shotState.landingFlash = 20;
    }
  }

  function checkOutOfCourt(portrait) {
    const radius = ball.radius;

    if (portrait) {
      if (
        ball.x + radius < 0 ||
        ball.x - radius > 1 ||
        ball.y + radius < 0 ||
        ball.y - radius > 1
      ) {
        scorePoint(getWinnerWhenBallLeavesCourt());
        return true;
      }
    } else {
      if (
        ball.x + radius < 0 ||
        ball.x - radius > 1 ||
        ball.y + radius < 0 ||
        ball.y - radius > 1
      ) {
        scorePoint(getWinnerWhenBallLeavesCourt());
        return true;
      }
    }

    return false;
  }

  function updateGame(portrait) {
    if (pointPaused) return;

    updateRobot(portrait);

    ball.x += ball.vx;
    ball.y += ball.vy;

    markValidLandingIfNeeded(portrait);

    if (checkOutOfCourt(portrait)) {
      return;
    }

    const radius = ball.radius;

    if (portrait) {
      const robotPaddleLine = 0.065;
      const playerPaddleLine = 0.935;

      if (ball.vy < 0 && ball.y - radius <= robotPaddleLine) {
        const hit = Math.abs(ball.x - robot.position) <= robot.size / 2;

        if (hit) {
          ball.y = robotPaddleLine + radius;
          ball.vy = Math.abs(ball.vy);
          lastHitter = "robot";
          startNewShot("robot");
          applyRobotAdaptiveShot(portrait);
        }
      }

      if (ball.vy > 0 && ball.y + radius >= playerPaddleLine) {
        const hit = Math.abs(ball.x - player.position) <= player.size / 2;

        if (hit) {
          const offset = ball.x - player.position;

          recordPlayerHit(offset);

          ball.y = playerPaddleLine - radius;
          ball.vy = -Math.abs(ball.vy);
          ball.vx += offset * 0.013;
          lastHitter = "player";
          startNewShot("player");
        }
      }

    } else {
      const playerPaddleLine = 0.065;
      const robotPaddleLine = 0.935;

      if (ball.vx < 0 && ball.x - radius <= playerPaddleLine) {
        const hit = Math.abs(ball.y - player.position) <= player.size / 2;

        if (hit) {
          const offset = ball.y - player.position;

          recordPlayerHit(offset);

          ball.x = playerPaddleLine + radius;
          ball.vx = Math.abs(ball.vx);
          ball.vy += offset * 0.013;
          lastHitter = "player";
          startNewShot("player");
        }
      }

      if (ball.vx > 0 && ball.x + radius >= robotPaddleLine) {
        const hit = Math.abs(ball.y - robot.position) <= robot.size / 2;

        if (hit) {
          ball.x = robotPaddleLine - radius;
          ball.vx = -Math.abs(ball.vx);
          lastHitter = "robot";
          startNewShot("robot");
          applyRobotAdaptiveShot(portrait);
        }
      }
    }

    ball.vx = clamp(ball.vx, -0.014, 0.014);
    ball.vy = clamp(ball.vy, -0.014, 0.014);
  }

  function drawGame() {
    const rect = gameCanvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    const portrait = isGamePortrait();

    gameCtx.clearRect(0, 0, w, h);

    const court = drawPickleballCourt(w, h, portrait);

    if (gameRunning) {
      updateGame(portrait);
    }

    drawLandingFlash(court);

    const ballX = court.x + court.width * ball.x;
    const ballY = court.y + court.height * ball.y;
    const ballRadius = Math.min(court.width, court.height) * ball.radius;

    if (portrait) {
      const paddleWidth = court.width * player.size;
      const paddleHeight = 30;

      const playerX = court.x + court.width * player.position - paddleWidth / 2;
      const playerY = court.y + court.height - 42;

      const robotX = court.x + court.width * robot.position - paddleWidth / 2;
      const robotY = court.y + 12;

      drawPickleballPaddle(robotX, robotY, paddleWidth, paddleHeight, "#071127", "horizontal");
      drawPickleballPaddle(playerX, playerY, paddleWidth, paddleHeight, "#8fbd28", "horizontal");

    } else {
      const paddleWidth = 30;
      const paddleHeight = court.height * player.size;

      const playerX = court.x + 12;
      const playerY = court.y + court.height * player.position - paddleHeight / 2;

      const robotX = court.x + court.width - 42;
      const robotY = court.y + court.height * robot.position - paddleHeight / 2;

      drawPickleballPaddle(playerX, playerY, paddleWidth, paddleHeight, "#8fbd28", "vertical");
      drawPickleballPaddle(robotX, robotY, paddleWidth, paddleHeight, "#071127", "vertical");
    }

    drawBall(ballX, ballY, ballRadius);

    requestAnimationFrame(drawGame);
  }

  function movePlayerFromPointer(event) {
    const rect = gameCanvas.getBoundingClientRect();

    const clientX = event.touches ? event.touches[0].clientX : event.clientX;
    const clientY = event.touches ? event.touches[0].clientY : event.clientY;

    if (isGamePortrait()) {
      player.position = (clientX - rect.left) / rect.width;
    } else {
      player.position = (clientY - rect.top) / rect.height;
    }

    player.position = clamp(player.position, 0.1, 0.9);

    updatePlayerLearning(player.position);
  }

  difficultySelect.addEventListener("change", () => {
    currentDifficulty = difficultySelect.value;
    restartGame();
  });

  restartGameBtn.addEventListener("click", () => {
    restartGame();
  });

  gameCanvas.addEventListener("mousemove", movePlayerFromPointer);

  gameCanvas.addEventListener("touchmove", function(event) {
    event.preventDefault();
    movePlayerFromPointer(event);
  }, { passive: false });

  startGameBtn.addEventListener("click", function() {
    restartGame();
  });

  window.addEventListener("resize", function() {
    resizeGameCanvas();
    resetBall(isGamePortrait() ? 1 : -1);
  });

  resizeGameCanvas();
  resetBall(isGamePortrait() ? 1 : -1);
  drawGame();
}