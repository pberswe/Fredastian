const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");

function fail(message) {
  console.log(`FAIL: ${message}`);
  process.exit(1);
}

function ensureFile(name) {
  const filePath = path.join(ROOT, name);
  if (!fs.existsSync(filePath)) {
    fail(`missing ${name}`);
  }
}

ensureFile("index.html");
ensureFile("game.js");
ensureFile("AGENTS.md");

const htmlPath = path.join(ROOT, "index.html");
const html = fs.readFileSync(htmlPath, "utf8");
const hasCanvas = /<canvas[^>]*id=["']game["'][^>]*>/i.test(html);
if (!hasCanvas) {
  fail('index.html missing canvas id="game"');
}

console.log("PASS");
