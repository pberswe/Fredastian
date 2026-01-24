const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const GRID_SIZE = 40;
const ROAD_WIDTH = 80;
const roomThemes = [
  {
    wallTop: ["#d9d0c5", "#f4f0ea"],
    stripeColor: "rgba(255,255,255,0.2)",
    railColor: "#a27052",
    floorColor: "#b88452",
    rugColor: "#6d1c33",
    rugBorder: "#f5d442",
    accentColor: "#c28b60",
    overlay: "Room 1 — Hearth Hall",
  },
  {
    wallTop: ["#d7e3f4", "#edf6ff"],
    stripeColor: "rgba(255,255,255,0.3)",
    railColor: "#5a6b91",
    floorColor: "#9a7f6d",
    rugColor: "#25445f",
    rugBorder: "#76d1ff",
    accentColor: "#7b95c9",
    overlay: "Room 2 — Moonlit Study",
  },
  {
    wallTop: ["#f5e0d5", "#ffece0"],
    stripeColor: "rgba(255,255,255,0.25)",
    railColor: "#b96b4a",
    floorColor: "#c79c68",
    rugColor: "#8c1f3e",
    rugBorder: "#ffd5a3",
    accentColor: "#f0c6a4",
    overlay: "Room 3 — Rosewood Parlor",
  },
  {
    wallTop: ["#dbe8d1", "#f1f8ea"],
    stripeColor: "rgba(255,255,255,0.2)",
    railColor: "#71936a",
    floorColor: "#8c6f57",
    rugColor: "#305642",
    rugBorder: "#b1f2c1",
    accentColor: "#97c29d",
    overlay: "Room 4 — Verdant Conservatory",
  },
];

const state = {
  score: 0,
  player: { x: canvas.width / 2, y: canvas.height / 2, radius: 14, speed: 190 },
  coin: { x: 0, y: 0, radius: 10 },
  mode: "field",
  currentHouse: null,
  lastFieldPosition: null,
  lastDoorRect: null,
};

const keys = {
  up: false,
  down: false,
  left: false,
  right: false,
};

const gravelField = {
  vertical: [],
  horizontal: [],
};
let strawField = [];

function generateGravel() {
  const verticalCount = 150;
  const horizontalCount = 150;
  gravelField.vertical = Array.from({ length: verticalCount }, () => ({
    offset: Math.random(),
    y: Math.random(),
    size: Math.random() * 3 + 1,
    tone: Math.random() > 0.5,
  }));
  gravelField.horizontal = Array.from({ length: horizontalCount }, () => ({
    x: Math.random(),
    offset: Math.random(),
    size: Math.random() * 3 + 1,
    tone: Math.random() > 0.5,
  }));
}
generateGravel();
generateStraws();

function generateStraws() {
  const strawCount = 350;
  strawField = Array.from({ length: strawCount }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    height: 15 + Math.random() * 25,
    lean: (Math.random() - 0.5) * 0.6,
    tone: Math.random(),
  }));
}

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
  if (evt.code === "KeyE" && pressed) {
    handleInteract();
    evt.preventDefault();
    return;
  }
  const dir = keyLookup[evt.code];
  if (dir) {
    keys[dir] = pressed;
    evt.preventDefault();
  }
}

document.addEventListener("keydown", (evt) => handleKey(evt, true));
document.addEventListener("keyup", (evt) => handleKey(evt, false));

function handleInteract() {
  if (state.mode === "house") {
    exitHouse();
    return;
  }
  const doorHit = detectDoorOverlap();
  if (doorHit) {
    enterHouse(doorHit.index, doorHit.doorRect);
  }
}

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

  if (state.mode !== "field") {
    return;
  }

  const distX = state.player.x - state.coin.x;
  const distY = state.player.y - state.coin.y;
  const radii = state.player.radius + state.coin.radius;
  if (distX * distX + distY * distY <= radii * radii) {
    state.score += 1;
    placeCoin();
  }
}

function drawBackground() {
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#5fb15f");
  gradient.addColorStop(1, "#3d7f3d");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // subtle grass texture dots
  for (let i = 0; i < 600; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    ctx.fillStyle = Math.random() > 0.5 ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.05)";
    ctx.fillRect(x, y, 2, 2);
  }

  drawGrassStraws();
  drawHouses();
  drawCrossroads();

  // light grid for movement cues
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 1;
  for (let x = 0; x <= canvas.width; x += GRID_SIZE) {
    ctx.beginPath();
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y <= canvas.height; y += GRID_SIZE) {
    ctx.beginPath();
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(canvas.width, y + 0.5);
    ctx.stroke();
  }
}

function drawInterior(roomNumber) {
  const theme = roomThemes[(roomNumber - 1) % roomThemes.length];
  ctx.fillStyle = theme.wallTop[0];
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = theme.wallTop[1];
  ctx.fillRect(0, 0, canvas.width, canvas.height * 0.4);

  ctx.fillStyle = theme.stripeColor;
  const stripeWidth = 90;
  for (let x = 0; x < canvas.width; x += stripeWidth) {
    ctx.fillRect(x, 0, stripeWidth / 2, canvas.height * 0.55);
  }

  const chairRailY = canvas.height * 0.55;
  ctx.fillStyle = theme.railColor;
  ctx.fillRect(0, chairRailY - 8, canvas.width, 16);

  ctx.fillStyle = theme.floorColor;
  ctx.fillRect(0, chairRailY, canvas.width, canvas.height - chairRailY);

  ctx.strokeStyle = "rgba(0,0,0,0.15)";
  for (let x = 0; x <= canvas.width; x += 50) {
    ctx.beginPath();
    ctx.moveTo(x, chairRailY);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = chairRailY; y <= canvas.height; y += 24) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  drawInteriorDecor(chairRailY, theme, roomNumber);
}

function drawInteriorDecor(floorStart, theme, roomNumber) {
  ctx.fillStyle = theme.rugColor;
  const rugWidth = canvas.width * 0.4;
  const rugHeight = 160;
  ctx.fillRect(
    canvas.width / 2 - rugWidth / 2,
    floorStart + 40,
    rugWidth,
    rugHeight
  );
  ctx.strokeStyle = theme.rugBorder;
  ctx.lineWidth = 6;
  ctx.strokeRect(
    canvas.width / 2 - rugWidth / 2,
    floorStart + 40,
    rugWidth,
    rugHeight
  );

  ctx.fillStyle = theme.accentColor;
  ctx.fillRect(160, floorStart - 150, 200, 120);
  ctx.fillStyle = "#f6e5d1";
  ctx.fillRect(220, floorStart - 130, 80, 50);

  ctx.fillStyle = "#73401f";
  ctx.fillRect(canvas.width - 300, floorStart - 180, 180, 30);
  ctx.fillRect(canvas.width - 270, floorStart - 20, 30, 120);
  ctx.fillRect(canvas.width - 210, floorStart - 20, 30, 120);
  ctx.fillRect(canvas.width - 150, floorStart - 20, 30, 120);

  ctx.fillStyle = roomNumber % 2 === 0 ? "#3f7d8c" : "#b73e2d";
  ctx.fillRect(70, floorStart - 220, 80, 120);
  ctx.fillStyle = "#f1c27d";
  ctx.fillRect(85, floorStart - 150, 50, 40);

  ctx.strokeStyle = "#75442b";
  ctx.lineWidth = 4;
  ctx.strokeRect(canvas.width - 320, floorStart - 230, 140, 100);
  ctx.fillStyle = roomNumber % 2 === 0 ? "#9fe6ff" : "#a8c5ff";
  ctx.fillRect(canvas.width - 310, floorStart - 220, 120, 80);
  ctx.strokeStyle = "#75442b";
  ctx.beginPath();
  ctx.moveTo(canvas.width - 310, floorStart - 180);
  ctx.lineTo(canvas.width - 190, floorStart - 180);
  ctx.moveTo(canvas.width - 250, floorStart - 220);
  ctx.lineTo(canvas.width - 250, floorStart - 140);
  ctx.stroke();
}

function drawInteriorOverlay(roomNumber) {
  const theme = roomThemes[(roomNumber - 1) % roomThemes.length];
  ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
  ctx.fillRect(0, 0, canvas.width, 70);
  ctx.fillStyle = "#f5e6c8";
  ctx.font = "32px 'Trebuchet MS', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(theme.overlay, canvas.width / 2, 48);
  ctx.font = "20px 'Trebuchet MS', sans-serif";
  ctx.fillText("Press E to step outside", canvas.width / 2, 78);
}
function drawCrossroads() {
  const roadWidth = ROAD_WIDTH;
  const centerX = canvas.width / 2 - roadWidth / 2;
  const centerY = canvas.height / 2 - roadWidth / 2;
  ctx.fillStyle = "#b49c7b";
  ctx.fillRect(centerX, 0, roadWidth, canvas.height);
  ctx.fillRect(0, centerY, canvas.width, roadWidth);

  gravelField.vertical.forEach((stone) => {
    const x = centerX + stone.offset * roadWidth;
    const y = stone.y * canvas.height;
    ctx.fillStyle = stone.tone
      ? "rgba(255,255,255,0.4)"
      : "rgba(90,70,50,0.5)";
    ctx.beginPath();
    ctx.arc(x, y, stone.size, 0, Math.PI * 2);
    ctx.fill();
  });

  gravelField.horizontal.forEach((stone) => {
    const x = stone.x * canvas.width;
    const y = centerY + stone.offset * roadWidth;
    ctx.fillStyle = stone.tone
      ? "rgba(255,255,255,0.4)"
      : "rgba(90,70,50,0.5)";
    ctx.beginPath();
    ctx.arc(x, y, stone.size, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.strokeStyle = "rgba(0,0,0,0.25)";
  ctx.lineWidth = 2;
  ctx.strokeRect(centerX, 0, roadWidth, canvas.height);
  ctx.strokeRect(0, centerY, canvas.width, roadWidth);
}

function drawGrassStraws() {
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const houses = getHouseRects();
  ctx.lineWidth = 2;
  strawField.forEach((straw) => {
    if (Math.abs(straw.x - centerX) < ROAD_WIDTH / 2 + 6) return;
    if (Math.abs(straw.y - centerY) < ROAD_WIDTH / 2 + 6) return;
    if (houses.some((house) => pointInRect(straw.x, straw.y, house))) return;
    const shade = straw.tone > 0.5 ? "#b4ffb0" : "#6cad63";
    ctx.strokeStyle = shade;
    ctx.beginPath();
    ctx.moveTo(straw.x, straw.y);
    ctx.lineTo(
      straw.x + straw.lean * straw.height,
      straw.y - straw.height
    );
    ctx.stroke();
  });
}

function drawHouses() {
  const houses = getHouseRects();
  houses.forEach((rect, index) => {
    ctx.fillStyle = "#efd9a0";
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.strokeStyle = "#8d6f47";
    ctx.lineWidth = 3;
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);

    const roofHeight = GRID_SIZE * 1.5;
    ctx.fillStyle = "#c3564d";
    ctx.beginPath();
    ctx.moveTo(rect.x - 10, rect.y);
    ctx.lineTo(rect.x + rect.w / 2, rect.y - roofHeight);
    ctx.lineTo(rect.x + rect.w + 10, rect.y);
    ctx.closePath();
    ctx.fill();

    const door = getHouseDoorRect(rect);
    ctx.fillStyle = "#5d3a2b";
    ctx.fillRect(door.x, door.y, door.w, door.h);

    ctx.fillStyle = "#fdf4d6";
    ctx.font = "20px 'Trebuchet MS', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`Room ${index + 1}`, door.x + door.w / 2, door.y - 8);

    const windowSize = GRID_SIZE * 0.9;
    const leftWindowX = rect.x + GRID_SIZE * 0.6;
    const windowY = rect.y + GRID_SIZE * 0.4;
    const rightWindowX = rect.x + rect.w - GRID_SIZE * 1.5;
    ctx.fillStyle = "#f4f8ff";
    ctx.fillRect(leftWindowX, windowY, windowSize, windowSize);
    ctx.fillRect(rightWindowX, windowY, windowSize, windowSize);

    ctx.strokeStyle = "rgba(0,0,0,0.2)";
    ctx.lineWidth = 1.5;
    [leftWindowX, rightWindowX].forEach((wx) => {
      ctx.beginPath();
      ctx.moveTo(wx, windowY + windowSize / 2);
      ctx.lineTo(wx + windowSize, windowY + windowSize / 2);
      ctx.moveTo(wx + windowSize / 2, windowY);
      ctx.lineTo(wx + windowSize / 2, windowY + windowSize);
      ctx.stroke();
    });
  });
}

function getHouseRects() {
  const houseWidth = GRID_SIZE * 6;
  const houseHeight = GRID_SIZE * 3;
  const marginX = GRID_SIZE * 2;
  const marginY = GRID_SIZE * 1.5;
  return [
    { x: marginX, y: marginY, w: houseWidth, h: houseHeight },
    {
      x: canvas.width - marginX - houseWidth,
      y: marginY,
      w: houseWidth,
      h: houseHeight,
    },
    {
      x: marginX,
      y: canvas.height - marginY - houseHeight,
      w: houseWidth,
      h: houseHeight,
    },
    {
      x: canvas.width - marginX - houseWidth,
      y: canvas.height - marginY - houseHeight,
      w: houseWidth,
      h: houseHeight,
    },
  ];
}

function pointInRect(x, y, rect) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

function getHouseDoorRect(rect) {
  const doorWidth = GRID_SIZE * 0.9;
  const doorHeight = GRID_SIZE * 1.6;
  const doorX = rect.x + rect.w / 2 - doorWidth / 2;
  const doorY = rect.y + rect.h - doorHeight;
  return { x: doorX, y: doorY, w: doorWidth, h: doorHeight };
}

function detectDoorOverlap() {
  const houses = getHouseRects();
  for (let i = 0; i < houses.length; i++) {
    const doorRect = getHouseDoorRect(houses[i]);
    if (pointInRect(state.player.x, state.player.y, doorRect)) {
      return { index: i, doorRect };
    }
  }
  return null;
}

function enterHouse(index, doorRect) {
  state.mode = "house";
  state.currentHouse = index;
  state.lastFieldPosition = { x: state.player.x, y: state.player.y };
  state.lastDoorRect = doorRect;
  state.player.x = canvas.width / 2;
  state.player.y = canvas.height - 160;
}

function exitHouse() {
  state.mode = "field";
  if (state.lastFieldPosition) {
    state.player.x = state.lastFieldPosition.x;
    state.player.y = state.lastFieldPosition.y;
  } else if (state.lastDoorRect) {
    state.player.x = state.lastDoorRect.x + state.lastDoorRect.w / 2;
    state.player.y = state.lastDoorRect.y + state.lastDoorRect.h + state.player.radius + 6;
  }
  state.currentHouse = null;
  state.lastDoorRect = null;
  state.lastFieldPosition = null;
}

function drawPlayer() {
  const { x, y, radius } = state.player;

  // glow aura
  const glowRadius = radius + 10;
  const glow = ctx.createRadialGradient(x, y, radius / 2, x, y, glowRadius);
  glow.addColorStop(0, "rgba(74, 217, 217, 0.35)");
  glow.addColorStop(1, "rgba(74, 217, 217, 0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
  ctx.fill();

  // ghost body
  ctx.fillStyle = "#c2f5ff";
  ctx.strokeStyle = "#4ad9d9";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x - radius, y);
  ctx.quadraticCurveTo(x - radius, y - radius * 1.4, x, y - radius * 1.4);
  ctx.quadraticCurveTo(x + radius, y - radius * 1.4, x + radius, y);
  const bumps = 4;
  const bumpWidth = (radius * 2) / bumps;
  for (let i = 0; i < bumps; i++) {
    const startX = x + radius - bumpWidth * (i + 1);
    const midX = startX + bumpWidth / 2;
    ctx.quadraticCurveTo(midX, y + radius * 0.7, startX, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // eyes
  const eyeOffsetX = radius * 0.4;
  const eyeOffsetY = radius * -0.4;
  ctx.fillStyle = "#0e1424";
  ctx.beginPath();
  ctx.ellipse(x - eyeOffsetX, y + eyeOffsetY, radius * 0.17, radius * 0.26, 0, 0, Math.PI * 2);
  ctx.ellipse(x + eyeOffsetX, y + eyeOffsetY, radius * 0.17, radius * 0.26, 0, 0, Math.PI * 2);
  ctx.fill();

  // mouth
  ctx.strokeStyle = "#0e1424";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, radius * 0.25, 0, Math.PI);
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
  if (state.mode === "house") {
    const roomNumber = (state.currentHouse ?? 0) + 1;
    drawInterior(roomNumber);
    drawPlayer();
    drawInteriorOverlay(roomNumber);
  } else {
    drawBackground();
    drawCoin();
    drawPlayer();
  }
  drawScore();
}
