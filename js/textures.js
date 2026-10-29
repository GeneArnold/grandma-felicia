// The pictures the game draws for itself: the casino backdrop and a gold coin.
import { H, W } from "./ui.js";

export function makeTextures(scene) {
  const g = scene.make.graphics({ x: 0, y: 0 }, false);

  // A gold coin with a star on it, drawn at twice size so it stays sharp.
  g.fillStyle(0x8a5a00).fillCircle(32, 32, 30);
  g.fillStyle(0xffc928).fillCircle(32, 32, 27);
  g.fillStyle(0xffe58a).fillCircle(32, 32, 20);
  g.fillStyle(0xe0a800);
  const star = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? 6 : 14;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    star.push({ x: 32 + r * Math.cos(a), y: 32 + r * Math.sin(a) });
  }
  g.fillPoints(star, true);
  g.generateTexture("coin", 64, 64);
  g.clear();

  // The casino at Christmas (backdrop() in ui.js uses it): deep red walls, a garland of lights along
  // the top, and a green carpet with a pattern.
  g.fillGradientStyle(0x3a0812, 0x3a0812, 0x1c0710, 0x1c0710, 1);
  g.fillRect(0, 0, W, H);
  g.fillStyle(0x0f3d24).fillRect(0, H - 184, W, 184);
  g.fillStyle(0x145230);
  for (let y = H - 164; y < H; y += 40) for (let x = (y / 40) % 2 ? 0 : 20; x < W; x += 40) g.fillCircle(x, y, 6);
  g.fillStyle(0xd4a017).fillRect(0, H - 188, W, 6);
  // the garland
  g.lineStyle(10, 0x1d6b3a);
  for (let x = 0; x < W; x += 90) {
    g.beginPath();
    g.arc(x + 45, 6, 52, Math.PI * 0.15, Math.PI * 0.85);
    g.strokePath();
  }
  const lights = [0xff4d4d, 0xffd23f, 0x4dd2ff, 0x7CFC9A];
  for (let i = 0, x = 12; x < W; x += 30, i++) {
    const y = 6 + 44 * Math.sin(Math.PI * (((x % 90) + 7) / 104));
    g.fillStyle(lights[i % 4]).fillCircle(x, y, 7);
  }
  g.generateTexture("bg-title", W, H);
  g.destroy();
}
