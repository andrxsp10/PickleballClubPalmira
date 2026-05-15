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
// JUEGO INTERACTIVO
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
  const ctx = gameCanvas.getContext("2d");

  let gameRunning = false;
  let playerScore = 0;
  let robotScore = 0;

  let player = {
    position: 0.5,
    size: 0.2
  };

  let robot = {
    position: 0.5,
    size: 0.22
  };

  let ball = {
    x: 0.5,
    y: 0.5,
    vx: 0.006,
    vy: 0.003,
    radius: 0.018,
    lastHit: "player",
    validLanding: false
  };

  const difficulties = {
    easy: {
      speed: 0.005,
      robotStep: 0.006,
      error: 0.13
    },
    medium: {
      speed: 0.0068,
      robotStep: 0.01,
      error: 0.07
    },
    hard: {
      speed: 0.0084,
      robotStep: 0.015,
      error: 0.025
    }
  };

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function getDifficulty() {
    return difficulties[difficultySelect.value] || difficulties.medium;
  }

  function resizeCanvas() {
    const rect = gameCanvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    gameCanvas.width = rect.width * dpr;
    gameCanvas.height = rect.height * dpr;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function isPortrait() {
    const rect = gameCanvas.getBoundingClientRect();
    return rect.height > rect.width;
  }

  function roundedRect(x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);

    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();
  }

  function drawCourt(width, height, portrait) {
    const grassGradient = ctx.createLinearGradient(0, 0, width, height);
    grassGradient.addColorStop(0, "#7daa42");
    grassGradient.addColorStop(0.45, "#5d8f34");
    grassGradient.addColorStop(1, "#345a17");

    ctx.fillStyle = grassGradient;
    ctx.fillRect(0, 0, width, height);

    let court;

    if (portrait) {
      court = {
        x: width * 0.12,
        y: height * 0.055,
        width: width * 0.76,
        height: height * 0.89
      };
    } else {
      court = {
        x: width * 0.055,
        y: height * 0.14,
        width: width * 0.89,
        height: height * 0.72
      };
    }

    ctx.fillStyle = "rgba(0, 0, 0, 0.18)";
    roundedRect(court.x + 8, court.y + 10, court.width, court.height, 18);

    const courtGradient = ctx.createLinearGradient(
      court.x,
      court.y,
      court.x + court.width,
      court.y + court.height
    );

    courtGradient.addColorStop(0, "#1f6da4");
    courtGradient.addColorStop(0.5, "#145184");
    courtGradient.addColorStop(1, "#0d365d");

    ctx.fillStyle = courtGradient;
    roundedRect(court.x, court.y, court.width, court.height, 18);

    ctx.strokeStyle = "rgba(255, 255, 255, 0.95)";
    ctx.lineWidth = Math.max(3, width * 0.004);
    ctx.strokeRect(court.x, court.y, court.width, court.height);

    ctx.strokeStyle = "rgba(255, 255, 255, 0.95)";
    ctx.lineWidth = 4;

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

  function drawPaddle(x, y, width, height, color, horizontal = true) {
    ctx.save();

    ctx.shadowColor = "rgba(0, 0, 0, 0.35)";
    ctx.shadowBlur = 16;
    ctx.shadowOffsetY = 8;

    ctx.fillStyle = color;

    if (horizontal) {
      const headWidth = width * 0.72;
      const handleWidth = width * 0.28;
      const handleHeight = height * 0.45;

      roundedRect(x, y, headWidth, height, height / 2);

      ctx.fillStyle = "rgba(255, 255, 255, 0.16)";
      roundedRect(x + headWidth * 0.14, y + height * 0.18, headWidth * 0.18, height * 0.64, 10);

      ctx.fillStyle = "#1d2414";
      roundedRect(
        x + headWidth - 2,
        y + height / 2 - handleHeight / 2,
        handleWidth,
        handleHeight,
        8
      );
    } else {
      const headHeight = height * 0.72;
      const handleHeight = height * 0.28;
      const handleWidth = width * 0.45;

      roundedRect(x, y, width, headHeight, width / 2);

      ctx.fillStyle = "rgba(255, 255, 255, 0.16)";
      roundedRect(x + width * 0.18, y + headHeight * 0.14, width * 0.64, headHeight * 0.18, 10);

      ctx.fillStyle = "#1d2414";
      roundedRect(
        x + width / 2 - handleWidth / 2,
        y + headHeight - 2,
        handleWidth,
        handleHeight,
        8
      );
    }

    ctx.restore();
  }

  function drawBall(x, y, radius) {
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

  function resetBall(direction = 1) {
    const portrait = isPortrait();
    const difficulty = getDifficulty();

    ball.x = 0.5;
    ball.y = 0.5;
    ball.validLanding = false;

    const sideVariation = (Math.random() * 0.0036) - 0.0018;

    if (portrait) {
      ball.vx = sideVariation;
      ball.vy = difficulty.speed * direction;
      ball.lastHit = direction > 0 ? "robot" : "player";
    } else {
      ball.vx = difficulty.speed * direction;
      ball.vy = sideVariation;
      ball.lastHit = direction > 0 ? "player" : "robot";
    }
  }

  function addPoint(winner) {
    gameRunning = false;

    if (winner === "player") {
      playerScore++;
      playerScoreText.textContent = playerScore;
    } else {
      robotScore++;
      robotScoreText.textContent = robotScore;
    }

    setTimeout(() => {
      resetBall(winner === "player" ? -1 : 1);
      gameRunning = true;
    }, 600);
  }

  function checkValidLanding(portrait) {
    if (ball.validLanding) return;

    if (portrait) {
      if (ball.lastHit === "player" && ball.y <= 0.33) {
        ball.validLanding = true;
      }

      if (ball.lastHit === "robot" && ball.y >= 0.67) {
        ball.validLanding = true;
      }
    } else {
      if (ball.lastHit === "player" && ball.x >= 0.67) {
        ball.validLanding = true;
      }

      if (ball.lastHit === "robot" && ball.x <= 0.33) {
        ball.validLanding = true;
      }
    }
  }

  function winnerWhenOut() {
    if (ball.validLanding) {
      return ball.lastHit;
    }

    return ball.lastHit === "player" ? "robot" : "player";
  }

  function updateRobot(portrait) {
    const difficulty = getDifficulty();
    const target = portrait ? ball.x : ball.y;
    const error = (Math.random() - 0.5) * difficulty.error;
    const desired = clamp(target + error, 0.1, 0.9);
    const difference = desired - robot.position;
    const step = clamp(difference, -difficulty.robotStep, difficulty.robotStep);

    robot.position = clamp(robot.position + step, 0.1, 0.9);
  }

  function updateGame(portrait) {
    updateRobot(portrait);

    ball.x += ball.vx;
    ball.y += ball.vy;

    checkValidLanding(portrait);

    if (
      ball.x + ball.radius < 0 ||
      ball.x - ball.radius > 1 ||
      ball.y + ball.radius < 0 ||
      ball.y - ball.radius > 1
    ) {
      addPoint(winnerWhenOut());
      return;
    }

    if (portrait) {
      const robotLine = 0.065;
      const playerLine = 0.935;

      if (ball.vy < 0 && ball.y - ball.radius <= robotLine) {
        const hit = Math.abs(ball.x - robot.position) <= robot.size / 2;

        if (hit) {
          ball.y = robotLine + ball.radius;
          ball.vy = Math.abs(ball.vy);
          ball.vx += (ball.x - robot.position) * 0.012;
          ball.lastHit = "robot";
          ball.validLanding = false;
        }
      }

      if (ball.vy > 0 && ball.y + ball.radius >= playerLine) {
        const hit = Math.abs(ball.x - player.position) <= player.size / 2;

        if (hit) {
          ball.y = playerLine - ball.radius;
          ball.vy = -Math.abs(ball.vy);
          ball.vx += (ball.x - player.position) * 0.014;
          ball.lastHit = "player";
          ball.validLanding = false;
        }
      }
    } else {
      const playerLine = 0.065;
      const robotLine = 0.935;

      if (ball.vx < 0 && ball.x - ball.radius <= playerLine) {
        const hit = Math.abs(ball.y - player.position) <= player.size / 2;

        if (hit) {
          ball.x = playerLine + ball.radius;
          ball.vx = Math.abs(ball.vx);
          ball.vy += (ball.y - player.position) * 0.014;
          ball.lastHit = "player";
          ball.validLanding = false;
        }
      }

      if (ball.vx > 0 && ball.x + ball.radius >= robotLine) {
        const hit = Math.abs(ball.y - robot.position) <= robot.size / 2;

        if (hit) {
          ball.x = robotLine - ball.radius;
          ball.vx = -Math.abs(ball.vx);
          ball.vy += (ball.y - robot.position) * 0.012;
          ball.lastHit = "robot";
          ball.validLanding = false;
        }
      }
    }

    ball.vx = clamp(ball.vx, -0.014, 0.014);
    ball.vy = clamp(ball.vy, -0.014, 0.014);
  }

  function drawGame() {
    const rect = gameCanvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const portrait = isPortrait();

    ctx.clearRect(0, 0, width, height);

    const court = drawCourt(width, height, portrait);

    if (gameRunning) {
      updateGame(portrait);
    }

    const ballX = court.x + court.width * ball.x;
    const ballY = court.y + court.height * ball.y;
    const ballRadius = Math.min(court.width, court.height) * ball.radius;

    if (portrait) {
      const paddleWidth = court.width * player.size;
      const paddleHeight = 30;

      drawPaddle(
        court.x + court.width * robot.position - paddleWidth / 2,
        court.y + 12,
        paddleWidth,
        paddleHeight,
        "#071127",
        true
      );

      drawPaddle(
        court.x + court.width * player.position - paddleWidth / 2,
        court.y + court.height - 42,
        paddleWidth,
        paddleHeight,
        "#78ad35",
        true
      );
    } else {
      const paddleWidth = 32;
      const paddleHeight = court.height * player.size;

      drawPaddle(
        court.x + 12,
        court.y + court.height * player.position - paddleHeight / 2,
        paddleWidth,
        paddleHeight,
        "#78ad35",
        false
      );

      drawPaddle(
        court.x + court.width - 44,
        court.y + court.height * robot.position - paddleHeight / 2,
        paddleWidth,
        paddleHeight,
        "#071127",
        false
      );
    }

    drawBall(ballX, ballY, ballRadius);

    requestAnimationFrame(drawGame);
  }

  function movePlayerFromEvent(event) {
    const rect = gameCanvas.getBoundingClientRect();
    const portrait = isPortrait();

    let clientX;
    let clientY;

    if (event.touches && event.touches.length > 0) {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else {
      clientX = event.clientX;
      clientY = event.clientY;
    }

    if (portrait) {
      player.position = clamp((clientX - rect.left) / rect.width, 0.1, 0.9);
    } else {
      player.position = clamp((clientY - rect.top) / rect.height, 0.1, 0.9);
    }
  }

  startGameBtn.addEventListener("click", () => {
    gameRunning = true;
    gameStart.classList.add("hidden");
    resetBall(isPortrait() ? 1 : -1);
  });

  restartGameBtn.addEventListener("click", () => {
    playerScore = 0;
    robotScore = 0;

    playerScoreText.textContent = playerScore;
    robotScoreText.textContent = robotScore;

    player.position = 0.5;
    robot.position = 0.5;

    gameRunning = true;
    gameStart.classList.add("hidden");

    resetBall(isPortrait() ? 1 : -1);
  });

  difficultySelect.addEventListener("change", () => {
    resetBall(isPortrait() ? 1 : -1);
  });

  gameCanvas.addEventListener("mousemove", movePlayerFromEvent);

  gameCanvas.addEventListener("touchmove", (event) => {
    event.preventDefault();
    movePlayerFromEvent(event);
  }, { passive: false });

  window.addEventListener("resize", () => {
    resizeCanvas();
    resetBall(isPortrait() ? 1 : -1);
  });

  resizeCanvas();
  resetBall(isPortrait() ? 1 : -1);
  drawGame();
}