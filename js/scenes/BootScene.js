// Loads the cartoon pictures, draws the rest, then opens the title.
import { ALL_SYMBOLS, MACHINES, TICKET_ART, TICKET_EMOJI } from "../machines.js";
import { makeTextures } from "../textures.js";
import { setupCamera } from "../ui.js";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("Boot");
  }

  preload() {
    this.load.image("felicia", "img/felicia.png");
    for (const key of ALL_SYMBOLS) this.load.image(key, `img/symbols/${key}.png`);
    this.load.on("loaderror", (file) => console.warn("Could not load", file.src));
  }

  create() {
    setupCamera(this);
    makeTextures(this);
    // Any reel picture that isn't drawn yet gets its machine's emoji instead.
    const standIns = [...MACHINES.flatMap((m) => m.symbols.map((key, i) => [key, m.emoji[i]])), [TICKET_ART, TICKET_EMOJI]];
    for (const [key, emoji] of standIns) {
      if (this.textures.exists(key)) continue;
      const canvas = this.textures.createCanvas(key, 256, 256);
      const ctx = canvas.getContext();
      ctx.font = "200px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(emoji, 128, 140);
      canvas.refresh();
    }
    this.scene.start("Title");
  }
}
