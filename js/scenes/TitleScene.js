// Fun Shed kit v1.4
// The title: the casino's sign, and Grandma Felicia waving everyone in. PLAY starts a game, or carries
// on the one in progress (it is saved after every pull). Only the buttons do anything, so a stray tap does nothing.
// At the top, SOUND on or off. At the bottom: the version, and an update button when a newer release
// is out (js/update.js).
import * as audio from "../audio.js";
import * as store from "../storage.js";
import { install, installHint, onHintChange } from "../install.js";
import { listenForTaps, near } from "../taps.js";
import { checkForUpdate, update, versionLabel } from "../update.js";
import { W, backdrop, button, coins, inside, marquee, setupCamera, snow, text } from "../ui.js";

const PLAY = { x: W / 2 - 190, y: 590, w: 380, h: 120 };
const SCORES = { x: W / 2 - 140, y: 800, w: 280, h: 72 };
const SOUND = { x: 8, y: 6, w: 210, h: 60 };
const INSTALL = { x: 40, y: 900, w: W - 80, h: 36 }; // the install hint, or the update button
const VERSION_AREA = { x: 60, y: 940, w: W - 120, h: 20 };

export class TitleScene extends Phaser.Scene {
  constructor() {
    super("Title");
  }

  create() {
    setupCamera(this);
    backdrop(this);
    snow(this, 30);

    marquee(this, W / 2, 210, 480, 250);
    text(this, W / 2, 136, "GRANDMA FELICIA'S", 34, { color: "#ffffff", strokeThickness: 7 });
    text(this, W / 2, 200, "CHRISTMAS", 64, { color: "#ffe066", strokeThickness: 10 });
    text(this, W / 2, 268, "CASINO", 64, { color: "#7CFC9A", strokeThickness: 10 });

    // Felicia, standing behind PLAY, bobbing happily
    const felicia = this.add.image(W / 2, 620, "felicia").setOrigin(0.5, 1);
    felicia.setScale(300 / felicia.height);
    this.tweens.add({ targets: felicia, y: 612, angle: 1.5, duration: 900, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });

    const go = button(this, PLAY, 0x2a9d3a, "▶ PLAY", 56);
    this.tweens.add({ targets: go.label, scale: 1.08, duration: 600, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    if (store.topScore()) text(this, W / 2, PLAY.y + PLAY.h + 26, `YOUR BEST  ${coins(store.topScore())} COINS`, 24, { strokeThickness: 5 });
    button(this, SCORES, 0x2a6f9d, "HIGH SCORES", 32);

    this.soundText = text(this, SOUND.x + 14, SOUND.y + SOUND.h / 2, "", 24, { originX: 0, strokeThickness: 5 });
    this.showSound();

    this.installBox = this.add.graphics();
    this.installText = text(this, W / 2, INSTALL.y + INSTALL.h / 2, "", 18, { color: "#ffffff", strokeThickness: 3 });
    this.versionText = text(this, W / 2, 951, versionLabel(), 12, { color: "#ffffff", strokeThickness: 2 });
    this.showInstall();
    onHintChange(() => this.scene.isActive() && this.showInstall());
    this.lookForUpdate(false);
    // Coming back to the game from another app checks again: a phone often keeps the game open for days.
    const back = () => !document.hidden && this.lookForUpdate(false);
    document.addEventListener("visibilitychange", back);
    this.events.once("shutdown", () => document.removeEventListener("visibilitychange", back));

    listenForTaps(this, (x, y) => {
      if (near(x, y, PLAY)) this.play();
      else if (near(x, y, SCORES, 16)) this.scene.start("Board");
      else if (this.hint?.update && inside(x, y, INSTALL)) this.runUpdate();
      else if (this.hint?.tap && inside(x, y, INSTALL)) install();
      else if (this.hint?.link && inside(x, y, INSTALL)) window.open(this.hint.link, "_blank");
      else if (inside(x, y, VERSION_AREA)) this.lookForUpdate(true);
      else if (inside(x, y, SOUND)) this.toggleSound();
    }, { lockMs: 800 });
  }

  play() {
    audio.unlock();
    audio.play("pair");
    this.scene.start("Intro");
  }

  // Asks the site whether a newer release is out. `asked` is a tap on the version, which gets an answer.
  async lookForUpdate(asked) {
    if (asked) this.versionText.setText("checking for an update…");
    const newer = await checkForUpdate();
    if (!this.scene.isActive()) return;
    this.updateReady = newer === true;
    this.showInstall();
    if (!asked) return;
    const answer = newer === null ? "couldn't check (no signal?)" : newer ? "an update is ready" : "you have the latest version ✓";
    this.versionText.setText(answer);
    this.time.delayedCall(2500, () => this.versionText.setText(versionLabel()));
  }

  runUpdate() {
    this.installText.setText("⏳ UPDATING…");
    this.hint = null;
    update();
  }

  // "Install me", while the game is playing in a browser tab on a phone (js/install.js), or the
  // update button when a newer release is out.
  showInstall() {
    this.hint = this.updateReady ? { words: "⬆ NEW VERSION! TAP TO UPDATE", tap: true, update: true } : installHint();
    this.installBox.clear();
    this.installText.setText(this.hint?.words ?? "");
    if (!this.hint || this.hint.link) return; // the install link is plain small words, no box
    this.installBox.fillStyle(this.hint.update ? 0xe07a1f : this.hint.tap ? 0x2a9d8f : 0x000000, this.hint.tap ? 1 : 0.3);
    this.installBox.fillRoundedRect(INSTALL.x, INSTALL.y, INSTALL.w, INSTALL.h, 18);
  }

  toggleSound() {
    const on = !store.get("sound");
    store.set("sound", on);
    audio.setEnabled(on);
    this.showSound();
    audio.play("pair");
  }

  showSound() {
    this.soundText.setText(store.get("sound") ? "🔊 SOUND ON" : "🔇 SOUND OFF");
  }
}
