const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const GRID_SIZE = 40;
const ROAD_WIDTH = 80;
const DUNGEON_PATHS = [
  { x: 120, y: 360, w: 940, h: 120 },
  { x: 320, y: 200, w: 120, h: 300 },
  { x: 580, y: 320, w: 150, h: 260 },
  { x: 440, y: 460, w: 480, h: 110 },
  { x: 400, y: 160, w: 140, h: 80 },
  { x: 700, y: 160, w: 120, h: 80 },
  { x: 900, y: canvas.height / 2 - 40, w: 140, h: 80 },
  { x: 80, y: 200, w: 200, h: 260 },
];
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
  jump: { active: false, timer: 0, duration: 0.4, height: 12 },
  key: { x: 0, y: 0, radius: 12, collected: false },
  inventory: { key1: false, key2: false, key3: false, key4: false, shovel: false },
  mode: "village1",
  currentHouse: null,
  lastFieldPosition: null,
  lastDoorRect: null,
  roomsUnlocked: [false, false, false, false],
  lockNoticeTimer: 0,
  lockNoticeText: "",
  ovenKeyGiven: false,
  toiletKeyGiven: false,
  digSiteUsed: false,
  savedFieldPosition: null,
  debugLogs: [],
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

function placeKey() {
  const margin = state.key.radius + 6;
  state.key.x = margin + Math.random() * (canvas.width - margin * 2);
  state.key.y = margin + Math.random() * (canvas.height - margin * 2);
}

placeKey();

function collectKey() {
  state.key.collected = true;
  state.inventory.key1 = true;
  state.roomsUnlocked[0] = true;
  state.lockNoticeText = "Room 1 unlocked!";
  state.lockNoticeTimer = 2.5;
  addDebugLog("Collected Village Key 1");
}

function giveRoomTwoKey() {
  state.inventory.key2 = true;
  state.roomsUnlocked[1] = true;
  state.ovenKeyGiven = true;
  state.lockNoticeText = "Room 2 unlocked!";
  state.lockNoticeTimer = 2.5;
  addDebugLog("Received Room 2 key from oven");
}

function giveRoomThreeKey() {
  state.inventory.key3 = true;
  state.roomsUnlocked[2] = true;
  state.toiletKeyGiven = true;
  state.lockNoticeText = "Room 3 unlocked!";
  state.lockNoticeTimer = 2.5;
  addDebugLog("Received Room 3 key from sink");
}

function giveRoomFourKey() {
  state.inventory.key4 = true;
  state.roomsUnlocked[3] = true;
  state.lockNoticeText = "Room 4 unlocked!";
  state.lockNoticeTimer = 2.5;
  addDebugLog("Dug up Room 4 key in Village 1");
}

function handleKey(evt, pressed) {
  if (evt.code === "KeyE" && pressed) {
    handleInteract();
    evt.preventDefault();
    return;
  }
  if (evt.code === "Space" && pressed) {
    triggerJump();
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
    const roomNumber = (state.currentHouse ?? 0) + 1;
    if (roomNumber === 1 && !state.ovenKeyGiven) {
      const ovenRect = getRoomOneOvenRect();
      if (pointInRect(state.player.x, state.player.y, ovenRect)) {
        giveRoomTwoKey();
        return;
      }
    }
    if (roomNumber === 3) {
      const djRect = getRoomThreeDJRect();
      if (!state.inventory.shovel && pointInRect(state.player.x, state.player.y, djRect)) {
        state.inventory.shovel = true;
        state.lockNoticeText = "Got a shovel from the DJ!";
        state.lockNoticeTimer = 2.5;
        addDebugLog("DJ stand handed over a shovel");
        return;
      }
    }
    if (roomNumber === 2 && !state.toiletKeyGiven) {
      const toiletRect = getRoomTwoToiletRect();
      const sinkRect = getRoomTwoSinkRect();
      if (pointInRect(state.player.x, state.player.y, sinkRect)) {
        giveRoomThreeKey();
        return;
      }
      if (pointInRect(state.player.x, state.player.y, toiletRect)) {
        state.lockNoticeText = "Nothing interesting happens.";
        state.lockNoticeTimer = 1.5;
        return;
      }
    }
    const exitDoor = getInteriorExitDoorRect(roomNumber);
    if (pointInRect(state.player.x, state.player.y, exitDoor)) {
      exitHouse();
    }
    return;
  }
  if (state.mode === "dungeon1") {
    const exitSign = getDungeonExitSignRect();
    if (pointInRect(state.player.x, state.player.y, exitSign)) {
      exitDungeonToField();
      return;
    }
    state.lockNoticeText = "Dungeon 1 is eerily silent.";
    state.lockNoticeTimer = 1.5;
    return;
  }
  if (state.mode === "village1") {
    const entrySign = getVillageSignRect();
    if (pointInRect(state.player.x, state.player.y, entrySign)) {
      enterDungeonFromPath();
      return;
    }
  }
  if (attemptDigSite()) {
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

function addDebugLog(message) {
  const stamp = new Date().toLocaleTimeString("en-US", { hour12: false });
  state.debugLogs.push(`[${stamp}] ${message}`);
  if (state.debugLogs.length > 5) {
    state.debugLogs.shift();
  }
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
  const prevX = state.player.x;
  const prevY = state.player.y;
  if (state.lockNoticeTimer > 0) {
    state.lockNoticeTimer = Math.max(0, state.lockNoticeTimer - dt);
  }
  if (state.jump.active) {
    state.jump.timer -= dt;
    if (state.jump.timer <= 0) {
      state.jump.active = false;
      state.jump.timer = 0;
    }
  }
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

  if (state.mode === "house") {
    enforceInteriorCollisions(prevX, prevY);
    return;
  }
  if (state.mode === "dungeon1") {
    handleDungeonState(prevX, prevY);
    return;
  }

  if (!state.key.collected) {
    const distX = state.player.x - state.key.x;
    const distY = state.player.y - state.key.y;
    const radii = state.player.radius + state.key.radius;
    if (distX * distX + distY * distY <= radii * radii) {
      collectKey();
    }
  }

  // village -> dungeon transition is now handled via sign interaction
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
  drawDigSite();
  drawHouses();
  drawCrossroads();
  drawVillageSign();

  ctx.fillStyle = "#f5d442";
  ctx.font = "28px 'Trebuchet MS', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Village 1", canvas.width / 2, 36);

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
  if (roomNumber === 4) {
    drawRoomFourWalls();
  } else {
    ctx.fillStyle = theme.wallTop[0];
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  if (roomNumber === 2) {
    ctx.fillStyle = "#050505";
    ctx.fillRect(0, 0, canvas.width, canvas.height * 0.55);
  } else if (roomNumber === 4) {
    // skip stripe highlights for poop room
  } else {
    ctx.fillStyle = theme.wallTop[1];
    ctx.fillRect(0, 0, canvas.width, canvas.height * 0.4);

    ctx.fillStyle = theme.stripeColor;
    const stripeWidth = 90;
    for (let x = 0; x < canvas.width; x += stripeWidth) {
      ctx.fillRect(x, 0, stripeWidth / 2, canvas.height * 0.55);
    }
  }

  const chairRailY = canvas.height * 0.55;
  ctx.fillStyle =
    roomNumber === 2 ? "#111" : roomNumber === 4 ? "#4a2a0b" : theme.railColor;
  ctx.fillRect(0, chairRailY - 8, canvas.width, 16);

  if (roomNumber === 2) {
    drawRoomTwoFloor(chairRailY);
  } else if (roomNumber === 4) {
    drawRoomFourFloor(chairRailY);
  } else {
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
  }

  drawInteriorExitDoor(roomNumber);
  if (roomNumber === 2) {
    drawRoomTwoGlow();
  }
  if (roomNumber === 3) {
    drawRoomThreeDanceFloor();
    drawRoomThreeDJStand();
    drawRoomThreeDisco();
  }
  if (roomNumber === 4) {
    drawRoomFourPoop();
  }
  drawInteriorDecor(chairRailY, theme, roomNumber);
}

function drawInteriorDecor(floorStart, theme, roomNumber) {

  if (roomNumber !== 2 && roomNumber !== 3 && roomNumber !== 4) {
    ctx.fillStyle = theme.accentColor;
    ctx.fillRect(160, floorStart - 150, 200, 120);
    ctx.fillStyle = "#f6e5d1";
    ctx.fillRect(220, floorStart - 130, 80, 50);
  }

  if (roomNumber !== 2 && roomNumber !== 1 && roomNumber !== 3 && roomNumber !== 4) {
    ctx.fillStyle = "#73401f";
    ctx.fillRect(canvas.width - 300, floorStart - 180, 180, 30);
    ctx.fillRect(canvas.width - 270, floorStart - 20, 30, 120);
    ctx.fillRect(canvas.width - 210, floorStart - 20, 30, 120);
    ctx.fillRect(canvas.width - 150, floorStart - 20, 30, 120);
  }

  if (roomNumber !== 2 && roomNumber !== 3 && roomNumber !== 4) {
    ctx.fillStyle = "#b73e2d";
    ctx.fillRect(70, floorStart - 220, 80, 120);
    ctx.fillStyle = "#f1c27d";
    ctx.fillRect(85, floorStart - 150, 50, 40);
  }

  if (roomNumber !== 2 && roomNumber !== 1 && roomNumber !== 3 && roomNumber !== 4) {
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

  if (roomNumber === 1) {
    drawRoomOneKitchen(floorStart);
  }
  if (roomNumber === 2) {
    drawRoomTwoBlood(floorStart);
    drawRoomTwoSink();
    drawRoomTwoToilet();
  }
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
  ctx.fillText("Stand in the doorframe and press E to leave", canvas.width / 2, 78);
}

function drawDungeon() {
  ctx.fillStyle = "#4e4e4e";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#7c7c7c";
  ctx.fillRect(0, 0, 80, canvas.height);
  ctx.fillRect(canvas.width - 80, 0, 80, canvas.height);
  ctx.fillRect(0, 0, canvas.width, 80);
  ctx.fillRect(0, canvas.height - 80, canvas.width, 80);

  ctx.fillStyle = "#3a2614";
  DUNGEON_PATHS.forEach((seg) => ctx.fillRect(seg.x, seg.y, seg.w, seg.h));

  ctx.fillStyle = "#9a9a9a";
  const step = (canvas.width - 200) / 12;
  for (let i = 0; i < 12; i++) {
    const x = 100 + i * step;
    ctx.beginPath();
    ctx.moveTo(x, canvas.height - 80);
    ctx.lineTo(x + 12, canvas.height - 140 - 20);
    ctx.lineTo(x + 24, canvas.height - 80);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(x, 80);
    ctx.lineTo(x + 12, 140 + 20);
    ctx.lineTo(x + 24, 80);
    ctx.closePath();
    ctx.fill();
  }

  ctx.fillStyle = "#f7e19c";
  ctx.font = "26px 'Trebuchet MS', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Dungeon 1 — Cavern", canvas.width / 2, 50);
  ctx.font = "16px 'Trebuchet MS', sans-serif";
  ctx.fillText("Move left to return to Village 1", canvas.width / 2, 80);

  drawDungeonExitSign();
}

function drawRoomOneKitchen(floorStart) {
  const upperHeight = 120;
  ctx.fillStyle = "#f2deb6";
  ctx.fillRect(50, 40, canvas.width - 100, upperHeight);
  ctx.strokeStyle = "#b68a5f";
  ctx.lineWidth = 4;
  ctx.strokeRect(50, 40, canvas.width - 100, upperHeight);

  const cabinetCount = 8;
  const cabinetWidth = (canvas.width - 120) / cabinetCount;
  ctx.fillStyle = "#e3c48b";
  for (let i = 0; i < cabinetCount; i++) {
    const x = 60 + i * cabinetWidth;
    ctx.fillRect(x, 50, cabinetWidth - 10, upperHeight - 20);
    ctx.strokeRect(x, 50, cabinetWidth - 10, upperHeight - 20);
    ctx.fillStyle = "#b68a5f";
    ctx.fillRect(x + (cabinetWidth - 10) / 2 - 3, 100, 6, 12);
    ctx.fillStyle = "#e3c48b";
  }

  ctx.fillStyle = "#a86c3d";
  ctx.fillRect(50, floorStart - 80, canvas.width - 100, 60);
  ctx.fillStyle = "#d9d0c5";
  ctx.fillRect(60, floorStart - 70, canvas.width - 120, 40);

  const fridgeWidth = 90;
  const fridgeHeight = floorStart - 120;
  ctx.fillStyle = "#dfe4ef";
  ctx.fillRect(70, floorStart - fridgeHeight - 20, fridgeWidth, fridgeHeight);
  ctx.strokeStyle = "#9ea7b3";
  ctx.lineWidth = 3;
  ctx.strokeRect(70, floorStart - fridgeHeight - 20, fridgeWidth, fridgeHeight);
  ctx.beginPath();
  ctx.moveTo(70, floorStart - fridgeHeight / 2 - 20);
  ctx.lineTo(70 + fridgeWidth, floorStart - fridgeHeight / 2 - 20);
  ctx.stroke();
  ctx.fillStyle = "#b0b8c5";
  ctx.fillRect(70 + fridgeWidth - 12, floorStart - fridgeHeight + 10, 6, fridgeHeight / 2 - 20);

  const ovenWidth = 110;
  const ovenHeight = 120;
  const ovenX = canvas.width - 70 - ovenWidth;
  const ovenY = floorStart - ovenHeight - 20;
  ctx.fillStyle = "#303030";
  ctx.fillRect(ovenX, ovenY, ovenWidth, ovenHeight);
  ctx.fillStyle = "#9ea7b3";
  ctx.fillRect(ovenX + 15, ovenY + 20, ovenWidth - 30, ovenHeight - 50);
  ctx.fillStyle = "#c7cdd6";
  ctx.fillRect(ovenX + 20, ovenY + 25, ovenWidth - 40, ovenHeight - 60);
  ctx.fillStyle = "#505050";
  ctx.fillRect(ovenX + 18, ovenY + ovenHeight - 18, ovenWidth - 36, 8);
  ctx.fillStyle = "#c7cdd6";
  ctx.beginPath();
  ctx.arc(ovenX + 30, ovenY + 10, 5, 0, Math.PI * 2);
  ctx.arc(ovenX + 50, ovenY + 10, 5, 0, Math.PI * 2);
  ctx.arc(ovenX + 70, ovenY + 10, 5, 0, Math.PI * 2);
  ctx.arc(ovenX + 90, ovenY + 10, 5, 0, Math.PI * 2);
  ctx.fill();
}

function getRoomOneTableRect(floorStart) {
  const width = GRID_SIZE * 4;
  const height = GRID_SIZE * 2;
  return {
    x: canvas.width / 2 - width / 2,
    y: floorStart + 100,
    w: width,
    h: height,
  };
}

function drawRoomTwoFloor(floorStart) {
  const tile = 70;
  for (let y = floorStart; y < canvas.height; y += tile) {
    for (let x = 0; x < canvas.width; x += tile) {
      const isLight =
        (Math.floor(x / tile) + Math.floor((y - floorStart) / tile)) % 2 === 0;
      ctx.fillStyle = isLight ? "#f5f5f5" : "#050505";
      ctx.fillRect(x, y, tile, tile);
    }
  }
}

function drawRoomTwoBlood(floorStart) {
  ctx.fillStyle = "rgba(170, 0, 0, 0.8)";
  const splats = [
    { x: canvas.width / 2 - 80, y: floorStart + 120, r: 50 },
    { x: canvas.width / 2 + 140, y: floorStart + 80, r: 30 },
    { x: canvas.width / 2 - 200, y: floorStart + 200, r: 25 },
  ];
  splats.forEach((splat) => {
    ctx.beginPath();
    ctx.ellipse(splat.x, splat.y, splat.r * 1.2, splat.r, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(220,0,0,0.4)";
    ctx.beginPath();
    ctx.ellipse(splat.x + 30, splat.y - 20, splat.r * 0.6, splat.r * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(170,0,0,0.8)";
  });
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

function getDigSiteRect() {
  const width = 160;
  const height = 90;
  return {
    x: canvas.width / 2 - width / 2,
    y: canvas.height / 2 - height / 2,
    w: width,
    h: height,
  };
}

function drawDigSite() {
  const rect = getDigSiteRect();
  ctx.fillStyle = "#5f3d1a";
  ctx.beginPath();
  ctx.ellipse(
    rect.x + rect.w / 2,
    rect.y + rect.h / 2,
    rect.w / 2,
    rect.h / 2,
    0,
    0,
    Math.PI * 2
  );
  ctx.fill();
  ctx.strokeStyle = "#a2723d";
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = "#d1a46b";
  ctx.font = "18px 'Trebuchet MS', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("DIG", rect.x + rect.w / 2, rect.y + rect.h / 2 + 6);
}

function getVillageSignRect() {
  const width = 140;
  const height = 60;
  return {
    x: canvas.width - width - 70,
    y: canvas.height / 2 - height - 20,
    w: width,
    h: height,
  };
}

function drawVillageSign() {
  const rect = getVillageSignRect();
  ctx.fillStyle = "#4b3517";
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.strokeStyle = "#f0d580";
  ctx.lineWidth = 4;
  ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
  ctx.fillStyle = "#f7e19c";
  ctx.font = "20px 'Trebuchet MS', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Danger", rect.x + rect.w / 2, rect.y + 24);
  ctx.fillText("Warning", rect.x + rect.w / 2, rect.y + 48);
}

function drawInteriorExitDoor(roomNumber) {
  const rect = getInteriorExitDoorRect(roomNumber);
  const jumpOffset = state.jump.active
    ? Math.sin((1 - state.jump.timer / state.jump.duration) * Math.PI) *
      state.jump.height
    : 0;
  ctx.fillStyle = "#5d3a2b";
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.fillStyle = "#d9d0c5";
  ctx.fillRect(rect.x + 10, rect.y + 10, rect.w - 20, rect.h - 40);
  ctx.fillStyle = "#94704d";
  ctx.beginPath();
  ctx.arc(rect.x + rect.w - 18, rect.y + rect.h / 2 - jumpOffset * 0.1, 6, 0, Math.PI * 2);
  ctx.fill();
}

function getInteriorExitDoorRect(roomNumber) {
  const width = 140;
  const height = 150;
  return {
    x: canvas.width / 2 - width / 2,
    y: canvas.height - height - 20,
    w: width,
    h: height,
  };
}

function getRoomOneOvenRect() {
  const floorStart = canvas.height * 0.55;
  const ovenWidth = 110;
  const ovenHeight = 120;
  const ovenX = canvas.width - 70 - ovenWidth;
  const ovenY = floorStart - ovenHeight - 20;
  return { x: ovenX, y: ovenY, w: ovenWidth, h: ovenHeight };
}

function getRoomOneAllowedAreas() {
  const oven = getRoomOneOvenRect();
  const door = getInteriorExitDoorRect(1);
  const bottomRect = {
    x: door.x - 20,
    y: canvas.height - 240,
    w: oven.x + oven.w + 20 - (door.x - 20),
    h: 240,
  };
  const ovenBand = {
    x: oven.x - 20,
    y: 0,
    w: oven.w + 40,
    h: canvas.height,
  };
  const topWallBand = {
    x: 0,
    y: 0,
    w: canvas.width,
    h: 140,
  };
  return [bottomRect, ovenBand, topWallBand];
}

function getRoomTwoToiletRect() {
  const baseWidth = 120;
  const baseHeight = 80;
  const x = 60;
  const y = canvas.height - baseHeight - 90;
  return { x, y: y - 50, w: baseWidth, h: baseHeight + 70 };
}

function drawRoomTwoGlow() {
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
  gradient.addColorStop(0, "rgba(0,255,120,0.35)");
  gradient.addColorStop(0.5, "rgba(0,0,0,0)");
  gradient.addColorStop(1, "rgba(0,255,120,0.35)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const gradientVertical = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradientVertical.addColorStop(0, "rgba(0,255,120,0.25)");
  gradientVertical.addColorStop(0.5, "rgba(0,0,0,0)");
  gradientVertical.addColorStop(1, "rgba(0,255,120,0.25)");
  ctx.fillStyle = gradientVertical;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawRoomTwoSink() {
  const width = 160;
  const height = 100;
  const x = canvas.width - width - 60;
  const y = canvas.height - height - 80;
  ctx.fillStyle = "#d9d9d9";
  ctx.fillRect(x, y, width, height);
  ctx.strokeStyle = "#6f6f6f";
  ctx.lineWidth = 4;
  ctx.strokeRect(x, y, width, height);

  ctx.fillStyle = "#b1b1b1";
  ctx.fillRect(x + 20, y + 20, width - 40, height - 40);

  ctx.fillStyle = "#4b4b4b";
  ctx.beginPath();
  ctx.arc(x + width / 2, y + height / 2, 12, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#4b4b4b";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(x + width - 30, y + 10);
  ctx.lineTo(x + width - 30, y - 30);
  ctx.lineTo(x + width - 60, y - 30);
  ctx.stroke();
}

function drawRoomTwoToilet() {
  const baseWidth = 120;
  const baseHeight = 80;
  const x = 60;
  const y = canvas.height - baseHeight - 90;
  ctx.fillStyle = "#e6ede5";
  ctx.fillRect(x, y, baseWidth, baseHeight);
  ctx.fillStyle = "#b9c4ba";
  ctx.fillRect(x + 20, y - 40, baseWidth - 40, 40);
  ctx.strokeStyle = "#9da8a0";
  ctx.lineWidth = 4;
  ctx.strokeRect(x, y, baseWidth, baseHeight);
  ctx.beginPath();
  ctx.ellipse(x + baseWidth / 2, y + baseHeight / 2, baseWidth / 3, baseHeight / 2, 0, 0, Math.PI * 2);
  ctx.stroke();
}

function getRoomTwoSinkRect() {
  const width = 160;
  const height = 100;
  const x = canvas.width - width - 60;
  const y = canvas.height - height - 80;
  return { x, y: y - 20, w: width, h: height + 40 };
}

function drawRoomTwoDebugGrid() {
  ctx.strokeStyle = "rgba(0,255,120,0.2)";
  ctx.lineWidth = 1;
  for (let x = 0; x <= canvas.width; x += 80) {
    ctx.beginPath();
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, canvas.height);
    ctx.stroke();
    ctx.fillStyle = "rgba(0,255,120,0.5)";
    ctx.font = "16px monospace";
    ctx.fillText(`x:${x}`, x + 4, 20);
  }
  for (let y = 0; y <= canvas.height; y += 80) {
    ctx.beginPath();
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(canvas.width, y + 0.5);
    ctx.stroke();
    ctx.fillStyle = "rgba(0,255,120,0.5)";
    ctx.fillText(`y:${y}`, 4, y + 20);
  }
  const toilet = getRoomTwoToiletRect();
  ctx.fillStyle = "rgba(0,255,120,0.5)";
  ctx.font = "22px monospace";
  ctx.fillText(
    `Toilet center (${Math.round(toilet.x + toilet.w / 2)}, ${Math.round(toilet.y + toilet.h / 2)})`,
    toilet.x + 10,
    toilet.y - 10
  );
}

function drawRoomThreeDanceFloor() {
  const tileSize = 80;
  const offset = (Date.now() / 300) % 1;
  for (let y = 340; y < canvas.height - 20; y += tileSize) {
    for (let x = 0; x < canvas.width; x += tileSize) {
      const idx = ((x + y) / tileSize + Math.floor(offset * 6)) % 4;
      const colors = ["#ff74d8", "#68f7ff", "#ffd966", "#9a6bff"];
      ctx.fillStyle = colors[Math.floor(idx)];
      ctx.fillRect(x, y, tileSize - 4, tileSize - 4);
    }
  }
}

function drawRoomThreeDisco() {
  const centerX = canvas.width / 2;
  const radius = 40;
  const bounce = Math.sin(Date.now() / 400) * 6;
  ctx.save();
  ctx.translate(centerX, 80 + bounce);
  ctx.rotate((Date.now() / 800) % (Math.PI * 2));
  ctx.fillStyle = "#f5f5f5";
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#d3d3d3";
  for (let i = -radius; i <= radius; i += 10) {
    ctx.beginPath();
    ctx.moveTo(-radius, i);
    ctx.lineTo(radius, i);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(i, -radius);
    ctx.lineTo(i, radius);
    ctx.stroke();
  }
  ctx.restore();

  const beams = 6;
  for (let i = 0; i < beams; i++) {
    const angle = (i / beams) * Math.PI * 2 + (Date.now() / 600);
    const length = 200;
    ctx.strokeStyle = `rgba(${100 + i * 20},${255 - i * 30},255,0.25)`;
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.moveTo(centerX, 80 + bounce);
    ctx.lineTo(
      centerX + Math.cos(angle) * length,
      80 + bounce + Math.sin(angle) * length
    );
    ctx.stroke();
  }
}

function drawRoomThreeDJStand() {
  const width = 220;
  const height = 120;
  const x = 60;
  const y = 360;
  ctx.fillStyle = "#1c1c1c";
  ctx.fillRect(x, y, width, height);
  ctx.strokeStyle = "#8c57ff";
  ctx.lineWidth = 4;
  ctx.strokeRect(x, y, width, height);
  ctx.fillStyle = "#333";
  ctx.fillRect(x + 20, y + 20, width - 40, height - 60);
  ctx.fillStyle = "#ff5bd3";
  ctx.fillRect(x + 30, y + 30, 40, 40);
  ctx.fillStyle = "#5bd7ff";
  ctx.fillRect(x + width - 70, y + 30, 40, 40);
  ctx.fillStyle = "#f5f5f5";
  ctx.font = "20px 'Trebuchet MS', sans-serif";
  ctx.fillText("DJ FRED", x + width / 2, y + height - 20);
}

function getRoomThreeDJRect() {
  const width = 220;
  const height = 120;
  const x = 60;
  const y = 360;
  return { x, y, w: width, h: height };
}

function getDungeonExitSignRect() {
  const width = 120;
  const height = 50;
  return {
    x: 100,
    y: canvas.height / 2 - height - 80,
    w: width,
    h: height,
  };
}

function drawDungeonExitSign() {
  const rect = getDungeonExitSignRect();
  ctx.fillStyle = "#4b3517";
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.strokeStyle = "#f0d580";
  ctx.lineWidth = 4;
  ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
  ctx.fillStyle = "#f7e19c";
  ctx.font = "20px 'Trebuchet MS', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Exit", rect.x + rect.w / 2, rect.y + 30);
}

function drawRoomFourWalls() {
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#523011");
  gradient.addColorStop(1, "#2b1a08");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawRoomFourFloor(chairRailY) {
  ctx.fillStyle = "#3d220c";
  ctx.fillRect(0, chairRailY, canvas.width, canvas.height - chairRailY);
  ctx.strokeStyle = "rgba(255,205,120,0.15)";
  ctx.lineWidth = 2;
  for (let x = 0; x <= canvas.width; x += 80) {
    ctx.beginPath();
    ctx.moveTo(x, chairRailY);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = chairRailY; y <= canvas.height; y += 80) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
}

function drawRoomFourPoop() {
  const centerX = canvas.width / 2;
  const baseY = canvas.height - 160;
  ctx.fillStyle = "#5a360f";
  ctx.beginPath();
  ctx.arc(centerX, baseY, 110, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = "#6c4014";
  ctx.beginPath();
  ctx.arc(centerX, baseY - 80, 70, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = "#835017";
  ctx.beginPath();
  ctx.arc(centerX, baseY - 140, 40, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = "#9b601e";
  ctx.beginPath();
  ctx.arc(centerX, baseY - 190, 20, 0, Math.PI * 2);
  ctx.fill();
  // stink lines
  ctx.strokeStyle = "rgba(200,255,170,0.5)";
  ctx.lineWidth = 4;
  [ -80, -40, 40, 80 ].forEach((offset) => {
    ctx.beginPath();
    ctx.moveTo(centerX + offset, baseY - 140);
    ctx.bezierCurveTo(
      centerX + offset - 20,
      baseY - 200,
      centerX + offset + 20,
      baseY - 260,
      centerX + offset,
      baseY - 320
    );
    ctx.stroke();
  });
  ctx.fillStyle = "#f5e6c8";
  ctx.font = "24px 'Trebuchet MS', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Poop Throne", centerX, baseY + 30);
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

function enforceInteriorCollisions(prevX, prevY) {
  if (state.currentHouse == null) return;
  const roomNumber = state.currentHouse + 1;
  const obstacles = getInteriorObstacles(roomNumber);
  for (const rect of obstacles) {
    if (pointInRect(state.player.x, state.player.y, rect)) {
      state.player.x = prevX;
      state.player.y = prevY;
      return;
    }
  }
  if (roomNumber === 1) {
    const allowedAreas = [
      ...getRoomOneAllowedAreas(),
      getRoomOneOvenRect(),
      getInteriorExitDoorRect(1),
    ];
    const insideAllowed = allowedAreas.some((rect) =>
      pointInRect(state.player.x, state.player.y, rect)
    );
    if (!insideAllowed) {
      state.player.x = prevX;
      state.player.y = prevY;
    }
  }
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

function attemptDigSite() {
  if (state.mode !== "village1") return false;
  const rect = getDigSiteRect();
  if (!pointInRect(state.player.x, state.player.y, rect)) return false;
  if (!state.inventory.shovel) {
    state.lockNoticeText = "You need a shovel.";
    state.lockNoticeTimer = 1.8;
    addDebugLog("Tried digging without shovel");
    return true;
  }
  if (state.digSiteUsed) {
    state.lockNoticeText = "The hole is empty.";
    state.lockNoticeTimer = 1.5;
    addDebugLog("Dig site already used");
    return true;
  }
  state.digSiteUsed = true;
  giveRoomFourKey();
  addDebugLog("Successfully dug up treasure");
  return true;
}

function checkDungeonEntrance() {
  if (state.mode !== "village1") return;
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const half = ROAD_WIDTH / 2;
  const inPathBand = Math.abs(state.player.y - centerY) < half + 20;
  const beyondEdge = state.player.x >= canvas.width - 80;
  if (inPathBand && beyondEdge) {
    enterDungeonFromPath();
  }
}

function handleDungeonState(prevX, prevY) {
  if (!isInDungeonPath(state.player.x, state.player.y)) {
    state.player.x = prevX;
    state.player.y = prevY;
  }
}

function isInDungeonPath(x, y) {
  return DUNGEON_PATHS.some(
    (rect) => x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h
  );
}

function enterHouse(index, doorRect) {
  if (!state.roomsUnlocked[index]) {
    state.lockNoticeText = `Room ${index + 1} is locked.`;
    state.lockNoticeTimer = 2.2;
    return;
  }
  state.mode = "house";
  state.currentHouse = index;
  state.lastFieldPosition = { x: state.player.x, y: state.player.y };
  state.lastDoorRect = doorRect;
  const roomNumber = index + 1;
  const exitDoor = getInteriorExitDoorRect(roomNumber);
  state.player.x = exitDoor.x + exitDoor.w / 2;
  state.player.y = exitDoor.y + exitDoor.h - state.player.radius - 4;
}

function exitHouse() {
  state.mode = "village1";
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

function enterDungeonFromPath() {
  if (!state.inventory.key1 || !state.inventory.key2 || !state.inventory.key3 || !state.inventory.key4) {
    state.lockNoticeText = "Need all four keys before entering.";
    state.lockNoticeTimer = 2.5;
    return;
  }
  state.savedFieldPosition = {
    x: Math.min(state.player.x, canvas.width - 200),
    y: state.player.y,
  };
  state.mode = "dungeon1";
  const entryPath = DUNGEON_PATHS[0];
  state.player.x = entryPath.x + 40;
  state.player.y = entryPath.y + entryPath.h / 2;
  addDebugLog("Transitioned from Village 1 to Dungeon 1");
}

function exitDungeonToField() {
  state.mode = "village1";
  if (state.savedFieldPosition) {
    state.player.x = Math.min(state.savedFieldPosition.x, canvas.width - 200);
    state.player.y = state.savedFieldPosition.y;
  } else {
    state.player.x = canvas.width / 2 + ROAD_WIDTH;
    state.player.y = canvas.height / 2;
  }
  state.savedFieldPosition = null;
  addDebugLog("Returned from Dungeon 1 to Village 1");
}

function getInteriorObstacles(roomNumber) {
  if (roomNumber === 1) {
    return [];
  }
  return [];
}

function drawPlayer() {
  const { x, y, radius } = state.player;
  const jumpOffset = state.jump.active
    ? Math.sin((1 - state.jump.timer / state.jump.duration) * Math.PI) * state.jump.height
    : 0;

  // boots
  ctx.fillStyle = "#6b3b1b";
  ctx.fillRect(x - radius + 4, y + radius - jumpOffset, radius - 2, 10);
  ctx.fillRect(x + 2, y + radius - jumpOffset, radius - 2, 10);

  // tunic body
  ctx.fillStyle = "#3e8a2f";
  ctx.strokeStyle = "#1f4d1a";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x - radius + 6, y - jumpOffset);
  ctx.lineTo(x + radius - 6, y - jumpOffset);
  ctx.lineTo(x + radius, y + radius - jumpOffset);
  ctx.lineTo(x - radius, y + radius - jumpOffset);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // belt
  ctx.fillStyle = "#c48c38";
  ctx.fillRect(x - radius, y + radius / 3 - jumpOffset, radius * 2, 8);
  ctx.fillStyle = "#39210e";
  ctx.fillRect(x - 8, y + radius / 3 - jumpOffset, 16, 8);

  // head
  ctx.fillStyle = "#f1cf9a";
  ctx.beginPath();
  ctx.arc(x, y - radius - 8 - jumpOffset, radius * 0.9, 0, Math.PI * 2);
  ctx.fill();

  // hair
  ctx.fillStyle = "#e2c174";
  ctx.beginPath();
  ctx.arc(x - radius / 2, y - radius - 12 - jumpOffset, radius, Math.PI, Math.PI * 1.8);
  ctx.lineTo(x + radius / 1.5, y - radius - 14 - jumpOffset);
  ctx.closePath();
  ctx.fill();

  // hat
  ctx.fillStyle = "#2d6e22";
  ctx.beginPath();
  ctx.moveTo(x - radius, y - radius - 18 - jumpOffset);
  ctx.lineTo(x + radius, y - radius - 18 - jumpOffset);
  ctx.lineTo(x + radius * 1.4, y - radius - 6 - jumpOffset);
  ctx.lineTo(x - radius, y - radius - 6 - jumpOffset);
  ctx.closePath();
  ctx.fill();

  // eyes
  ctx.fillStyle = "#1c1c1c";
  ctx.beginPath();
  ctx.arc(x - radius * 0.35, y - radius - 4 - jumpOffset, radius * 0.12, 0, Math.PI * 2);
  ctx.arc(x + radius * 0.35, y - radius - 4 - jumpOffset, radius * 0.12, 0, Math.PI * 2);
  ctx.fill();

  // shield outline (back)
  ctx.strokeStyle = "#7d4a1f";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(x, y + radius / 2 - jumpOffset, radius + 6, Math.PI * 1.1, Math.PI * 1.9);
  ctx.stroke();
}

function drawKey() {
  if (state.key.collected) return;
  const gradient = ctx.createLinearGradient(
    state.key.x - state.key.radius,
    state.key.y,
    state.key.x + state.key.radius,
    state.key.y
  );
  gradient.addColorStop(0, "#f7e96a");
  gradient.addColorStop(1, "#ffcf4a");
  ctx.fillStyle = gradient;

  ctx.beginPath();
  ctx.arc(state.key.x - 10, state.key.y, state.key.radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillRect(state.key.x - 2, state.key.y - 8, 24, 16);
  ctx.fillRect(state.key.x + 18, state.key.y - 6, 10, 12);

  ctx.strokeStyle = "#c18f32";
  ctx.lineWidth = 3;
  ctx.stroke();
}

function drawScore() {
  ctx.fillStyle = "#f5d442";
  ctx.font = "22px 'Trebuchet MS', sans-serif";
  ctx.textAlign = "left";
  const key1 = state.inventory.key1 ? "Found" : "Missing";
  const key2 = state.inventory.key2 ? "Found" : "Missing";
  const key3 = state.inventory.key3 ? "Found" : "Missing";
  const key4 = state.inventory.key4 ? "Found" : "Missing";
  const shovelStatus = state.inventory.shovel ? "Yes" : "No";
  ctx.fillText(`Key 1: ${key1}`, 16, 32);
  ctx.fillText(`Key 2: ${key2}`, 16, 60);
  ctx.fillText(`Key 3: ${key3}`, 16, 88);
  ctx.fillText(`Key 4: ${key4}`, 16, 116);
  ctx.fillText(`Shovel: ${shovelStatus}`, 16, 144);
}

function drawLockNotice() {
  if (state.mode !== "village1" || state.lockNoticeTimer <= 0) return;
  ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
  ctx.fillRect(0, canvas.height - 60, canvas.width, 60);
  ctx.fillStyle = "#ffdede";
  ctx.font = "24px 'Trebuchet MS', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(state.lockNoticeText, canvas.width / 2, canvas.height - 22);
}

function drawDebugOverlay() {
  // overlay disabled by default; enable for debugging by returning early.
  return;
}

function draw() {
  if (state.mode === "house") {
    const roomNumber = (state.currentHouse ?? 0) + 1;
    drawInterior(roomNumber);
    drawPlayer();
    drawInteriorOverlay(roomNumber);
  } else if (state.mode === "dungeon1") {
    drawDungeon();
    drawPlayer();
  } else {
    drawBackground();
    drawKey();
    drawPlayer();
  }
  drawScore();
  drawLockNotice();
  drawDebugOverlay();
}
