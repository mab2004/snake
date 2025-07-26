// --- Retro Snake Game ---
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const highScoreEl = document.getElementById('high-score');
const recentScoresEl = document.getElementById('recent-scores');
const borderWrapEl = document.getElementById('border-wrap');
const speedSlider = document.getElementById('speed-slider');
const gameOverBox = document.getElementById('game-over');
const finalScoreEl = document.getElementById('final-score');
const tryAgainBtn = document.getElementById('try-again');
const pauseBtn = document.getElementById('pause-btn');
const instructionsBtn = document.getElementById('instructions-btn');
const instructionsOverlay = document.getElementById('instructions-overlay');
const closeInstructionsBtn = document.getElementById('close-instructions');
const startGameOverlay = document.getElementById('start-game-overlay');
const startGameBtn = document.getElementById('start-game-btn');
let wasPausedBeforeInstructions = false;
let paused = false;
let gameStarted = false;

// --- Game Constants ---
const GRID_SIZE = 20;
const CELL_SIZE = 24; // Will be dynamically scaled
const INIT_SNAKE = [ {x: 9, y: 9}, {x: 8, y: 9}, {x: 7, y: 9} ];
const INIT_DIR = {x: 1, y: 0};
const COLORS = {
  board: '#101014',
  grid: '#232526',
  snake: '#39ff14',
  snakeHead: '#baff39',
  food: '#ff3131',
  border: '#39ff14',
};
const SPEEDS = [180, 160, 140, 120, 100, 85, 70, 55, 40, 30]; // ms per move

// --- State ---
let snake, dir, nextDir, food, score, highScore, recentScores, running, wrapBorders, speedIdx;

// --- Responsive Canvas ---
function resizeCanvas() {
  const area = document.querySelector('.game-area');
  let size = Math.min(area.offsetWidth, area.offsetHeight) * 0.95;
  size = Math.max(size, 240);
  canvas.width = canvas.height = Math.floor(size / GRID_SIZE) * GRID_SIZE;
}
window.addEventListener('resize', resizeCanvas);

// --- Storage ---
function loadScores() {
  highScore = parseInt(localStorage.getItem('snake_highScore') || '0');
  recentScores = JSON.parse(localStorage.getItem('snake_recentScores') || '[]');
}
function saveScores() {
  localStorage.setItem('snake_highScore', highScore);
  localStorage.setItem('snake_recentScores', JSON.stringify(recentScores));
}

// --- UI Update ---
function updateScoresUI() {
  scoreEl.textContent = score;
  highScoreEl.textContent = highScore;
  recentScoresEl.innerHTML = '';
  (recentScores.slice(-5).reverse()).forEach(s => {
    const li = document.createElement('li');
    li.textContent = s;
    recentScoresEl.appendChild(li);
  });
}
function updateSettingsUI() {
  borderWrapEl.checked = wrapBorders;
  speedSlider.value = speedIdx + 1;
}

function updatePauseBtn() {
  if (paused) {
    pauseBtn.textContent = 'Resume';
    pauseBtn.classList.add('paused');
  } else {
    pauseBtn.textContent = 'Pause';
    pauseBtn.classList.remove('paused');
  }
}
function pauseGame() {
  if (!paused) {
    paused = true;
    updatePauseBtn();
  }
}
function resumeGame() {
  if (paused) {
    paused = false;
    updatePauseBtn();
    loop();
  }
}
pauseBtn.addEventListener('click', () => {
  if (!running) return;
  if (paused) resumeGame();
  else pauseGame();
});
document.addEventListener('keydown', e => {
  if (e.key === ' ' && running) {
    if (paused) resumeGame();
    else pauseGame();
  }
});

function showInstructions() {
  if (instructionsOverlay.classList.contains('hidden')) {
    instructionsOverlay.classList.remove('hidden');
    wasPausedBeforeInstructions = paused;
    if (!paused && running) pauseGame();
  } else {
    hideInstructions();
  }
}
function hideInstructions() {
  instructionsOverlay.classList.add('hidden');
  if (!wasPausedBeforeInstructions && running) resumeGame();
}
instructionsBtn.addEventListener('click', showInstructions);
closeInstructionsBtn.addEventListener('click', hideInstructions);
document.addEventListener('keydown', e => {
  if ((e.key === 'i' || e.key === 'I' || e.key === 'Tab') && instructionsOverlay.classList.contains('hidden')) {
    showInstructions();
    if (e.key === 'Tab') e.preventDefault();
  } else if ((e.key === 'i' || e.key === 'I' || e.key === 'Tab' || e.key === 'Escape') && !instructionsOverlay.classList.contains('hidden')) {
    hideInstructions();
    if (e.key === 'Tab') e.preventDefault();
  }
});

// --- Start Game Logic ---
function startGame() {
  gameStarted = true;
  startGameOverlay.classList.add('hidden');
  resetGame();
}
startGameBtn.addEventListener('click', startGame);

// --- Game Logic ---
function resetGame() {
  snake = INIT_SNAKE.map(seg => ({...seg}));
  dir = {...INIT_DIR};
  nextDir = {...INIT_DIR};
  placeFood();
  score = 0;
  running = true;
  updateScoresUI();
  gameOverBox.classList.add('hidden');
  resizeCanvas();
  draw();
  paused = false;
  updatePauseBtn();
  
  // Only start the game loop if the game has been started
  if (gameStarted) {
    loop();
  }
}
function placeFood() {
  while (true) {
    const x = Math.floor(Math.random() * GRID_SIZE);
    const y = Math.floor(Math.random() * GRID_SIZE);
    if (!snake.some(seg => seg.x === x && seg.y === y)) {
      food = {x, y};
      break;
    }
  }
}
function loop() {
  if (!running || paused || !gameStarted) return;
  moveTimer = setTimeout(() => {
    move();
    draw();
    loop();
  }, SPEEDS[speedIdx]);
}
function move() {
  dir = {...nextDir};
  let head = {x: snake[0].x + dir.x, y: snake[0].y + dir.y};
  if (wrapBorders) {
    head.x = (head.x + GRID_SIZE) % GRID_SIZE;
    head.y = (head.y + GRID_SIZE) % GRID_SIZE;
  }
  // Collision
  if (!wrapBorders && (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE)) {
    return gameOver();
  }
  if (snake.some(seg => seg.x === head.x && seg.y === head.y)) {
    return gameOver();
  }
  snake.unshift(head);
  if (head.x === food.x && head.y === food.y) {
    score++;
    placeFood();
  } else {
    snake.pop();
  }
  if (score > highScore) {
    highScore = score;
    saveScores();
  }
  updateScoresUI();
}
function gameOver() {
  running = false;
  recentScores.push(score);
  if (recentScores.length > 5) recentScores = recentScores.slice(-5);
  saveScores();
  updateScoresUI();
  finalScoreEl.textContent = `Your Score: ${score}`;
  gameOverBox.classList.remove('hidden');
}

// --- Drawing ---
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // Draw grid
  ctx.strokeStyle = COLORS.grid;
  ctx.lineWidth = 1;
  for (let i = 0; i <= GRID_SIZE; i++) {
    ctx.beginPath();
    ctx.moveTo(i * canvas.width / GRID_SIZE, 0);
    ctx.lineTo(i * canvas.width / GRID_SIZE, canvas.height);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i * canvas.height / GRID_SIZE);
    ctx.lineTo(canvas.width, i * canvas.height / GRID_SIZE);
    ctx.stroke();
  }
  // Draw Food (glowing, pulsing neon circle)
  let TILE = canvas.width / GRID_SIZE;
  let t = performance.now() * 0.005;
  ctx.save();
  ctx.shadowColor = "#fffa44";
  ctx.shadowBlur = 24 + 10 * (Math.sin(t) + 1);
  ctx.fillStyle = "#fa0";
  ctx.beginPath();
  ctx.arc(food.x * TILE + TILE/2, food.y * TILE + TILE/2, TILE * 0.38 + 2 * Math.sin(t), 0, 2 * Math.PI);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.restore();
  // Draw Snake (glowing circles, head with eyes)
  for (let i = snake.length-1; i >= 0; i--) {
    ctx.save();
    let c = i === 0 ? "#fff" : "#0ff";
    ctx.shadowColor = c;
    ctx.shadowBlur = i === 0 ? 24 : 8;
    ctx.strokeStyle = "#121";
    ctx.lineWidth = 2;
    ctx.fillStyle = c;
    let sx = snake[i].x * TILE, sy = snake[i].y * TILE;
    if (i === 0) {
      // Head: big circle + eyes
      ctx.beginPath();
      ctx.arc(sx + TILE/2, sy + TILE/2, TILE/2 - 2, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
      // Eyes (look in direction)
      ctx.fillStyle = "#111";
      let eyeOffset = { x: 0, y: 4 };
      ctx.beginPath();
      ctx.arc(sx + TILE/2 + 5, sy + TILE/2 + eyeOffset.y, 2.5, 0, 2 * Math.PI); // right eye
      ctx.arc(sx + TILE/2 - 5, sy + TILE/2 + eyeOffset.y, 2.5, 0, 2 * Math.PI); // left eye
      ctx.fill();
    } else {
      // Body: smaller glowing circle
      ctx.beginPath();
      ctx.arc(sx + TILE/2, sy + TILE/2, TILE/2 - 3, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }
  // Draw border
  ctx.strokeStyle = COLORS.border;
  ctx.lineWidth = 5;
  ctx.strokeRect(0, 0, canvas.width, canvas.height);
}

// --- Controls ---
const DIRS = {
  ArrowUp:    {x: 0, y: -1},
  ArrowDown:  {x: 0, y: 1},
  ArrowLeft:  {x: -1, y: 0},
  ArrowRight: {x: 1, y: 0},
  w: {x: 0, y: -1},
  s: {x: 0, y: 1},
  a: {x: -1, y: 0},
  d: {x: 1, y: 0},
};
function handleKey(e) {
  if (!running) return;
  const key = e.key;
  if (DIRS[key]) {
    const nd = DIRS[key];
    if (nd.x !== -dir.x && nd.y !== -dir.y) {
      nextDir = nd;
    }
    e.preventDefault();
  }
}
canvas.addEventListener('keydown', handleKey);

// --- Settings Events ---
borderWrapEl.addEventListener('change', () => {
  wrapBorders = borderWrapEl.checked;
  resetGame();
});
speedSlider.addEventListener('input', () => {
  speedIdx = parseInt(speedSlider.value) - 1;
});
speedSlider.addEventListener('change', () => {
  if (running) {
    clearTimeout(moveTimer);
    loop();
  }
});
tryAgainBtn.addEventListener('click', resetGame);

gameOverBox.addEventListener('click', e => {
  if (e.target === gameOverBox) resetGame();
});

// --- Init ---
function init() {
  loadScores();
  wrapBorders = borderWrapEl.checked;
  speedIdx = parseInt(speedSlider.value) - 1;
  updateSettingsUI();
  resizeCanvas();
  canvas.focus();
  
  // Initialize game state but don't start until user clicks start
  snake = INIT_SNAKE.map(seg => ({...seg}));
  dir = {...INIT_DIR};
  nextDir = {...INIT_DIR};
  placeFood();
  score = 0;
  running = false;
  updateScoresUI();
  draw();
  
  // Show start overlay
  startGameOverlay.classList.remove('hidden');
}
window.onload = init; 