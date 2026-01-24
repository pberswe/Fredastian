const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const state = {
  score: 0,
  player: { x: canvas.width / 2, y: canvas.height / 2, radius: 14, speed: 190 },
  coin: { x: 0, y: 0, radius: 10 },
};

const keys = {
  up: false,
  down: false,
  left: false,
  right: false,
};

const keyLookup = {
  ArrowUp: "up",
  KeyW: "up",
  ArrowDown: "down",
  KeyS: "down",
  ArrowLeft: "left",
  KeyA: "left",
  ArrowRight: "right",
  KeyD: "right",
};

function placeCoin() {
  const margin = state.coin.radius + 6;
  state.coin.x = margin + Math.random() * (canvas.width - margin * 2);
  state.coin.y = margin + Math.random() * (canvas.height - margin * 2);
}

placeCoin();

function handleKey(evt, pressed) {
  const dir = keyLookup[evt.code];
  if (dir) {
    keys[dir] = pressed;
    evt.preventDefault();
  }
}

document.addEventListener("keydown", (evt) => handleKey(evt, true));
document.addEventListener("keyup", (evt) => handleKey(evt, false));

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

let lastTime = 0;
function loop(timestamp) {
  const delta = (timestamp - lastTime) / 1000 || 0;
  lastTime = timestamp;
  update(delta);
  draw();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

function update(dt) {
  let dx = 0;
  let dy = 0;
  if (keys.up) dy -= 1;
  if (keys.down) dy += 1;
  if (keys.left) dx -= 1;
  if (keys.right) dx += 1;

  const movingDiagonal = dx !== 0 && dy !== 0;
  if (movingDiagonal) {
    dx *= Math.SQRT1_2;
    dy *= Math.SQRT1_2;
  }

  state.player.x += dx * state.player.speed * dt;
  state.player.y += dy * state.player.speed * dt;
  state.player.x = clamp(
    state.player.x,
    state.player.radius,
    canvas.width - state.player.radius
  );
  state.player.y = clamp(
    state.player.y,
    state.player.radius,
    canvas.height - state.player.radius
  );

  const distX = state.player.x - state.coin.x;
  const distY = state.player.y - state.coin.y;
  const radii = state.player.radius + state.coin.radius;
  if (distX * distX + distY * distY <= radii * radii) {
    state.score += 1;
    placeCoin();
  }
}

function drawBackground() {
  ctx.fillStyle = "#071731";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "rgba(255,255,255,0.05)";
  ctx.lineWidth = 1;
  const gridSize = 40;
  for (let x = 0; x <= canvas.width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y <= canvas.height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(canvas.width, y + 0.5);
    ctx.stroke();
  }
}

function drawPlayer() {
  ctx.fillStyle = "#4ad9d9";
  ctx.beginPath();
  ctx.arc(state.player.x, state.player.y, state.player.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#32a7a2";
  ctx.lineWidth = 3;
  ctx.stroke();
}

function drawCoin() {
  const gradient = ctx.createRadialGradient(
    state.coin.x,
    state.coin.y,
    2,
    state.coin.x,
    state.coin.y,
    state.coin.radius
  );
  gradient.addColorStop(0, "#fff2a6");
  gradient.addColorStop(1, "#f5c542");

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(state.coin.x, state.coin.y, state.coin.radius, 0, Math.PI * 2);
  ctx.fill();
}

function drawScore() {
  ctx.fillStyle = "#f5d442";
  ctx.font = "24px 'Trebuchet MS', sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(`Score: ${state.score}`, 16, 32);
}

function draw() {
  drawBackground();
  drawCoin();
  drawPlayer();
  drawScore();
}
