// Starts the game: Phaser (loaded as vendor/phaser.min.js), the scenes, the back gesture and offline.
import * as audio from "./audio.js";
import * as store from "./storage.js";
import { AlbumScene } from "./scenes/AlbumScene.js";
import { BoardScene } from "./scenes/BoardScene.js";
import { BootScene } from "./scenes/BootScene.js";
import { FloorScene } from "./scenes/FloorScene.js";
import { IntroScene } from "./scenes/IntroScene.js";
import { PlayScene } from "./scenes/PlayScene.js";
import { ResultsScene } from "./scenes/ResultsScene.js";
import { ScratchScene } from "./scenes/ScratchScene.js";
import { TitleScene } from "./scenes/TitleScene.js";
import { H, THEME, W, ZOOM } from "./ui.js";

THEME.outline = 0x2a0a14; // deep wine red

audio.setEnabled(store.get("sound"));

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: "app",
  backgroundColor: "#1c0710",
  banner: false,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, width: W * ZOOM, height: H * ZOOM },
  scene: [BootScene, TitleScene, IntroScene, FloorScene, PlayScene, ScratchScene, ResultsScene, BoardScene, AlbumScene],
});

// Android's back gesture returns to the title instead of closing the app. The game in progress is
// saved after every pull, so nothing is lost.
history.pushState({ game: true }, "");
window.addEventListener("popstate", () => {
  const active = game.scene.getScenes(true)[0];
  if (active && !["Boot", "Title"].includes(active.scene.key)) active.scene.start("Title");
  history.pushState({ game: true }, "");
});

// Not on this computer (localhost) or the home network, where a stored copy would hide every edit.
const developing = ["localhost", "127.0.0.1"].includes(location.hostname) || location.protocol === "http:";
if (developing) window.game = game; // for poking at the game from the browser console
if ("serviceWorker" in navigator && !developing) {
  navigator.serviceWorker.register("sw.js").catch(() => {
    // Offline play needs HTTPS; the game still works online without it.
  });
}
