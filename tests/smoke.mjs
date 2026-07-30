import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("portfolio is GitHub Pages compatible", async () => {
  const [html, css, script] = await Promise.all([
    readFile(new URL("index.html", root), "utf8"),
    readFile(new URL("styles.css", root), "utf8"),
    readFile(new URL("script.js", root), "utf8"),
  ]);

  assert.match(html, /Benaya Arlen Kundimang/i);
  assert.match(html, /PokeStore/i);
  assert.match(html, /pokestore-showcase\.png/i);
  assert.match(html, /ASMON/i);
  assert.match(html, /InfoMedic/i);
  assert.match(html, /Car Performance Ranking/i);
  assert.doesNotMatch(html, /demos\/car-performance/i);
  assert.match(html, /TECH STACK \/ CV/i);
  assert.match(html, /Visual Studio Code/i);
  assert.match(html, /Android Studio/i);
  assert.match(html, /CapCut/i);
  assert.match(html, /--technology-color:#777bb4/i);
  assert.match(html, /--technology-color:#f7df1e/i);
  assert.match(html, /technology-logo-frame/i);
  assert.match(html, /assets\/tech\/php\.svg/i);
  assert.doesNotMatch(html, /--technology-icon/i);
  assert.doesNotMatch(css, /mask:\s*var\(--technology-icon/i);
  assert.doesNotMatch(html, />12\+</i);
  assert.match(script, /addEventListener\("wheel"/);
  assert.match(script, /passive: false/);
  assert.match(script, /drawWireframe/);
  assert.match(script, /IntersectionObserver/);
  assert.match(css, /academic-web-gallery figure:only-child img/);
  assert.doesNotMatch(css, /grayscale\(1\)/i);
  assert.doesNotMatch(html, /\/_next\//i);
  assert.doesNotMatch(html, /\.php(?:["'?])/i);
  assert.doesNotMatch(css, /@import\s+["']tailwindcss/i);

  await Promise.all([
    "assets/benaya-photo.png",
    "assets/onda-website.png",
    "assets/medical-chatbot.png",
    "assets/asmon-dashboard.jpeg",
    "assets/asmon-qr-scan.jpeg",
    "assets/asmon-borrowed.jpeg",
    "assets/pokestore-showcase.png",
    "assets/tech/php.svg",
    "assets/tech/rasa.svg",
    "assets/tech/vscode.svg",
    "assets/tech/canva.svg",
    "downloads/Benaya-Arlen-CV.pdf",
    "downloads/Benaya-Arlen-Portofolio.pdf",
    "og-editorial.png",
  ].map((path) => access(new URL(path, root))));
});
