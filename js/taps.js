// One-finger input for every screen. A touch counts the moment the finger lands, wherever it goes
// after, and it counts once: a second touch straight after the first is the same press.
// Touches in the first lockMs of a screen are ignored, so the tap that ended the last screen does not
// also act on this one.
import * as audio from "./audio.js";
import { fingerAt } from "./ui.js";

export function listenForTaps(scene, onTap, { lockMs = 500, gapMs = 400 } = {}) {
  const openAt = performance.now() + lockMs;
  let last = -Infinity;
  scene.input.on("pointerdown", (p) => {
    audio.unlock();
    const now = performance.now();
    if (now < openAt || now - last < gapMs) return;
    last = now;
    const at = fingerAt(scene, p);
    onTap(at.x, at.y);
  });
  // phones only allow sound once a touch has ended, so try again here
  scene.input.on("pointerup", () => audio.unlock());
}

// Is (x, y) on the button r, or close enough to it? Every button takes taps a little outside its edge.
export function near(x, y, r, pad = 22) {
  return x >= r.x - pad && x <= r.x + r.w + pad && y >= r.y - pad && y <= r.y + r.h + pad;
}
