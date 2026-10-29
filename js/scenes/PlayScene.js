// A slot machine (js/machines.js says which, and how it looks). One big PULL button spins the three reels; three the same pays,
// two the same pays a little, two tickets win a scratch-off, and now and then Santa flies over and
// drops some coins. CASH OUT takes the coins home: that's the score. Run out of coins and the game is over.
// Everything a pull wins is saved the moment PULL is pressed, so closing the app mid-spin loses nothing.
import * as audio from "../audio.js";
import * as store from "../storage.js";
import { art, machine } from "../machines.js";
import { BET, BIG_WIN, START_COINS, SYMBOLS, TICKET, canPull, santaVisit, scratchTicket, spin } from "../rules.js";
import { shareWin, snapshot } from "../share.js";
import { listenForTaps, near } from "../taps.js";
import { H, W, backdrop, button, coinShower, coins, marquee, setupCamera, text } from "../ui.js";

const MENU = { x: 14, y: 18, w: 120, h: 66 };
const CASH = { x: 402, y: 18, w: 124, h: 66 };
const CASH_YES = { x: 70, y: 560, w: 400, h: 110 };
const CASH_NO = { x: 70, y: 692, w: 400, h: 90 };
const PULL = { x: 50, y: 586, w: 440, h: 136 };
const SHARE = { x: 70, y: 560, w: 400, h: 100 };
const KEEP = { x: 70, y: 692, w: 400, h: 110 };
const REEL_X = [W / 2 - 152, W / 2, W / 2 + 152];
const REEL_Y = 316;
const WINDOW = { w: 142, h: 172 }; // each reel's window
const SPACING = 200; // between pictures on a reel: more than a window, so a stopped reel shows one whole picture
const FACE_SIZE = 128; // the biggest a picture is drawn, either way
const COUNTER = { x: 214, y: 51 }; // where coins fly to

const MISSES = ["PULL AGAIN!", "SO CLOSE!", "NEXT ONE'S LUCKY!", "KEEP GOING!"];

export class PlayScene extends Phaser.Scene {
  constructor() {
    super("Play");
  }

  create(data) {
    setupCamera(this);
    this.run = store.get("game") ?? store.newGame();
    if (data?.machine) {
      this.run.machine = data.machine;
      store.save();
    }
    this.machine = machine(this.run.machine);
    if (this.run.ticket) {
      this.scene.start("Scratch");
      return;
    }
    this.busy = false;
    this.overlay = null;
    this.shown = this.run.coins;

    backdrop(this);
    this.drawCounter();
    this.drawMachine();
    this.drawPayTable();

    this.pullButton = button(this, PULL, 0x2a9d3a, "PULL!", 72);
    this.pullGlow = this.tweens.add({ targets: this.pullButton.label, scale: 1.08, duration: 550, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    text(this, W / 2, 748, `${BET} COINS A PULL`, 24, { color: "#fff3c4", strokeThickness: 5 });

    if (!canPull(this.run.coins)) {
      this.gameOver();
    } else if (this.run.pulls === 0) {
      this.busy = true;
      this.say(`HERE ARE ${START_COINS} CHRISTMAS COINS!`, "#ffe066");
      this.shown = 0;
      this.showCoins();
      audio.say("welcome", 0.3);
      coinShower(this, W / 2, 300, COUNTER.x, COUNTER.y, 20, () => {
        this.countTo(this.run.coins);
        this.busy = false;
        this.say("TAP PULL TO PLAY!");
        this.pointAtPull();
      });
    } else {
      this.say("TAP PULL TO PLAY!");
    }

    listenForTaps(this, (x, y) => {
      if (this.overlay) return this.overlay.tap(x, y);
      if (near(x, y, MENU, 14)) this.scene.start("Floor");
      else if (near(x, y, CASH, 14)) this.askCashOut();
      else if (near(x, y, PULL, 30)) this.pull();
    }, { lockMs: 400 });
  }

  update(_, delta) {
    for (const reel of this.reels ?? []) {
      if (!reel.spinning) continue;
      reel.offset += delta * 2.2;
      while (reel.offset >= SPACING) {
        reel.offset -= SPACING;
        reel.faces.unshift(reel.faces.pop());
        this.showFace(reel.faces[0], this.randomKind());
      }
      this.placeFaces(reel);
    }
  }

  // ---- drawing ----

  drawCounter() {
    button(this, MENU, 0x7d5a3c, "BACK", 28);
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.45).fillRoundedRect(150, 18, 238, 66, 33);
    g.lineStyle(3, 0xd4a017).strokeRoundedRect(150, 18, 238, 66, 33);
    this.add.image(186, 51, "coin").setScale(0.8);
    this.coinText = text(this, 222, 52, "", 46, { originX: 0, color: "#ffe066", strokeThickness: 7 });
    this.showCoins();
    const cash = button(this, CASH, 0xd4a017, "CASH\nOUT", 26);
    cash.label.setColor("#2a0a14").setStroke("#fff3c4", 4);
  }

  showCoins() {
    this.coinText.setText(coins(this.shown));
    if (this.coinText.width > 160) this.coinText.setScale(160 / this.coinText.width);
  }

  // Rolls the coin count up (or down) to n.
  countTo(n) {
    const from = this.shown;
    this.tweens.addCounter({
      from, to: n, duration: Math.min(1200, 250 + Math.abs(n - from) * 4), ease: "Cubic.easeOut",
      onUpdate: (t) => {
        this.shown = t.getValue();
        this.showCoins();
      },
      onComplete: () => {
        this.shown = n;
        this.showCoins();
      },
    });
  }

  drawMachine() {
    const g = this.add.graphics();
    const top = REEL_Y - WINDOW.h / 2;
    // the cabinet, across the whole screen
    g.fillStyle(0x2a0a14).fillRoundedRect(14, 196, W - 28, 370, 30);
    g.fillStyle(this.machine.rim).fillRoundedRect(20, 202, W - 40, 358, 26);
    g.fillStyle(this.machine.cabinet).fillRoundedRect(30, 212, W - 60, 338, 20);
    // the reel windows
    g.fillStyle(0x2a0a14).fillRoundedRect(38, top - 12, W - 76, WINDOW.h + 24, 16);
    for (const x of REEL_X) g.fillStyle(0xfffbea).fillRoundedRect(x - WINDOW.w / 2, top, WINDOW.w, WINDOW.h, 12);
    // the win line, with arrows at both ends
    g.fillStyle(0xff3b3b);
    g.fillTriangle(26, REEL_Y - 14, 26, REEL_Y + 14, 42, REEL_Y);
    g.fillTriangle(W - 26, REEL_Y - 14, W - 26, REEL_Y + 14, W - 42, REEL_Y);
    // the message display
    g.fillStyle(0x2a0a14).fillRoundedRect(38, 438, W - 76, 100, 14);
    g.fillStyle(0x0d0306).fillRoundedRect(44, 444, W - 88, 88, 10);
    this.flash = this.add.graphics();
    this.message = text(this, W / 2, 488, "", 36, { color: "#ffe066", strokeThickness: 6, wrap: W - 110 });

    marquee(this, W / 2, 150, W - 40, 84);
    const name = text(this, W / 2, 150, this.machine.name, 50, { color: this.machine.title, strokeThickness: 8 });
    if (name.width > W - 90) name.setScale((W - 90) / name.width);

    // the reels: five pictures each, the middle one on the win line
    const mask = this.make.graphics({}, false);
    for (const x of REEL_X) mask.fillRect(x - WINDOW.w / 2, top, WINDOW.w, WINDOW.h);
    const geometryMask = mask.createGeometryMask();
    this.reels = REEL_X.map((x, i) => {
      const faces = [-2, -1, 0, 1, 2].map(() => this.showFace(this.add.image(x, REEL_Y, "coin").setMask(geometryMask), this.randomKind()));
      this.showFace(faces[2], (i * 2 + 1) % 6);
      const reel = { x, faces, offset: 0, spinning: false };
      this.placeFaces(reel);
      return reel;
    });
  }

  placeFaces(reel) {
    reel.faces.forEach((f, i) => f.setY(REEL_Y + (i - 2) * SPACING + reel.offset));
  }

  drawPayTable() {
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.45).fillRoundedRect(24, 800, W - 48, 150, 20);
    const row = (y, kinds) => kinds.forEach((n, i) => {
      const x = 46 + i * 162;
      for (let k = 0; k < 3; k++) this.picture(x + 15 + k * 28, y, n, 34);
      text(this, x + 100, y, String(SYMBOLS[n].pay), 26, { originX: 0, color: "#ffe066", strokeThickness: 5 });
    });
    row(832, [0, 1, 2]);
    row(874, [3, 4, 5]);
    text(this, 46, 922, "ANY 2 THE SAME", 22, { originX: 0, strokeThickness: 4 });
    text(this, 228, 922, "10", 26, { originX: 0, color: "#ffe066", strokeThickness: 5 });
    this.picture(300, 922, TICKET, 34);
    this.picture(330, 922, TICKET, 34);
    text(this, 356, 922, "SCRATCH-OFF!", 22, { originX: 0, color: "#7CFC9A", strokeThickness: 4 });
  }

  // This machine's picture of kind n (rules.js SYMBOLS), size pixels across at most.
  picture(x, y, n, size) {
    const img = this.add.image(x, y, art(this.machine, n));
    return img.setScale(size / Math.max(img.width, img.height));
  }

  showFace(img, n) {
    img.setTexture(art(this.machine, n));
    return img.setScale(FACE_SIZE / Math.max(img.width, img.height));
  }

  randomKind() {
    return Math.floor(Math.random() * SYMBOLS.length);
  }

  say(words, colour = "#ffe066", size = 36) {
    this.message.setText(words).setColor(colour).setFontSize(size).setScale(0.6);
    this.tweens.add({ targets: this.message, scale: 1, duration: 260, ease: "Back.easeOut" });
  }

  // A bouncing finger pointing at PULL, until the first pull.
  pointAtPull() {
    this.finger = this.add.text(PULL.x + PULL.w - 50, PULL.y + 70, "👆", { fontSize: "64px", resolution: 2 }).setOrigin(0.5, 0).setDepth(10);
    this.tweens.add({ targets: this.finger, y: PULL.y + 100, duration: 450, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
  }

  // ---- a pull ----

  pull() {
    const run = this.run;
    if (this.busy || !canPull(run.coins)) return;
    this.busy = true;
    this.finger?.destroy();
    this.finger = null;
    this.pullButton.g.setAlpha(0.55);
    this.pullGlow.pause();

    // Settle it all now: the bet, the result, a scratch-off and Santa's visit.
    run.coins -= BET;
    run.pulls++;
    const result = spin();
    const santa = result.kind === "ticket" ? 0 : santaVisit();
    if (result.coins) store.addWin(run, result.coins);
    if (result.kind === "ticket") {
      run.tickets++;
      run.ticket = scratchTicket(Math.random, { not: run.lastTicket }); // a different kind each time
      run.lastTicket = run.ticket.type;
    }
    if (santa) {
      run.santas++;
      store.addWin(run, santa, { counts: false });
    }
    store.save();

    audio.play("lever");
    this.countTo(this.shown - BET);
    this.say("GOOD LUCK!", "#ffffff");
    this.flash.clear();

    this.reels.forEach((reel, i) => {
      this.time.delayedCall(140 + i * 90, () => (reel.spinning = true));
    });
    const ticking = this.time.addEvent({ delay: 75, loop: true, callback: () => audio.play("tick") });
    result.line.forEach((id, i) => {
      this.time.delayedCall(900 + i * 420, () => {
        this.stopReel(this.reels[i], id);
        if (i === 2) {
          ticking.remove();
          this.time.delayedCall(260, () => this.showResult(result, santa));
        }
      });
    });
  }

  stopReel(reel, id) {
    reel.spinning = false;
    reel.faces.forEach((f) => this.showFace(f, this.randomKind()));
    this.showFace(reel.faces[2], id);
    reel.offset = -60;
    this.placeFaces(reel);
    this.tweens.addCounter({
      from: -60, to: 0, duration: 300, ease: "Back.easeOut",
      onUpdate: (t) => {
        reel.offset = t.getValue();
        this.placeFaces(reel);
      },
    });
    audio.play("stop");
  }

  // Lights up the reels that won.
  lightUp(which) {
    this.flash.clear();
    this.flash.lineStyle(8, 0xffe066);
    for (const i of which) this.flash.strokeRoundedRect(REEL_X[i] - WINDOW.w / 2, REEL_Y - WINDOW.h / 2, WINDOW.w, WINDOW.h, 12);
    this.tweens.add({ targets: this.flash, alpha: { from: 1, to: 0.3 }, duration: 260, yoyo: true, repeat: 3 });
    for (const i of which) this.tweens.add({ targets: this.reels[i].faces[2], scale: 1.18, duration: 200, yoyo: true, repeat: 2 });
  }

  showResult(result, santa) {
    const { kind, line } = result;
    const next = () => (santa ? this.santaFlies(santa) : this.ready());
    const matching = [0, 1, 2].filter((i) => line[i] === result.symbol);

    if (kind === "jackpot" || kind === "three") {
      this.lightUp(matching);
      const big = kind === "jackpot" || result.coins >= BIG_WIN;
      this.say(kind === "jackpot" ? `JACKPOT! +${result.coins}` : `WINNER! +${result.coins}`, "#7CFC9A", 40);
      audio.play(kind === "jackpot" ? "jackpot" : big ? "bigWin" : "win");
      audio.say(kind === "jackpot" ? "jackpot" : big ? "bigWin" : "win", 0.2);
      coinShower(this, W / 2, REEL_Y, COUNTER.x, COUNTER.y, Math.ceil(result.coins / 10), () => {
        this.countTo(this.shown + result.coins);
        if (big) this.bigWin(result, next);
        else next();
      });
    } else if (kind === "pair") {
      this.lightUp(matching);
      this.say(`TWO THE SAME! +${result.coins}`, "#7CFC9A");
      audio.play("pair");
      coinShower(this, W / 2, REEL_Y, COUNTER.x, COUNTER.y, 4, () => {
        this.countTo(this.shown + result.coins);
        next();
      });
    } else if (kind === "ticket") {
      this.lightUp([0, 1, 2].filter((i) => line[i] === TICKET));
      this.say("🎟️ SCRATCH-OFF TICKET! 🎟️", "#7CFC9A", 34);
      audio.play("ticket");
      audio.say("ticket", 0.3);
      this.time.delayedCall(2200, () => this.scene.start("Scratch"));
    } else {
      this.say(MISSES[Math.floor(Math.random() * MISSES.length)], "#ffffff");
      audio.play("miss");
      this.time.delayedCall(250, next);
    }
  }

  // Santa and his reindeer fly across the top, and a sack of coins falls out.
  santaFlies(gift) {
    audio.play("sleigh");
    audio.say("santa", 0.4);
    const sleigh = this.add.image(W + 200, 160, "santa-sleigh").setDepth(9000);
    sleigh.setScale(380 / sleigh.width);
    this.tweens.add({ targets: sleigh, x: -200, duration: 3400, ease: "Linear", onComplete: () => sleigh.destroy() });
    this.tweens.add({ targets: sleigh, y: 130, duration: 400, yoyo: true, repeat: 3, ease: "Sine.easeInOut" });
    this.time.delayedCall(1300, () => {
      this.say(`🎅 SANTA GAVE YOU ${gift} COINS!`, "#7CFC9A", 32);
      coinShower(this, W / 2, 160, COUNTER.x, COUNTER.y, Math.ceil(gift / 5), () => {
        this.countTo(this.shown + gift);
        this.time.delayedCall(600, () => this.ready());
      });
    });
  }

  // Ready for the next pull, or out of coins.
  ready() {
    if (!canPull(this.run.coins)) return this.gameOver();
    const opened = store.unlockFor(this.run.coins);
    if (opened.length) return this.newMachine(opened[0]);
    this.busy = false;
    this.pullButton.g.setAlpha(1);
    this.pullGlow.resume();
  }

  // A new machine has opened on the casino floor: a big sign for a moment, then back to this one.
  newMachine(m) {
    const layer = this.add.container(0, 0).setDepth(9500);
    layer.add(this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.6));
    layer.add(marquee(this, W / 2, 380, 480, 300));
    layer.add(text(this, W / 2, 290, "NEW MACHINE OPEN!", 40, { color: "#7CFC9A", strokeThickness: 8 }));
    const name = text(this, W / 2, 370, m.name, 44, { color: m.title, strokeThickness: 8 });
    if (name.width > 420) name.setScale(420 / name.width);
    layer.add(name);
    layer.add(text(this, W / 2, 450, "TAP BACK TO VISIT IT\nON THE CASINO FLOOR", 24, { strokeThickness: 5 }));
    layer.setAlpha(0);
    this.tweens.add({ targets: layer, alpha: 1, duration: 300 });
    audio.play("ticket");
    audio.say("newMachine", 0.3);
    this.time.delayedCall(3200, () => {
      this.tweens.add({ targets: layer, alpha: 0, duration: 300, onComplete: () => layer.destroy() });
      this.ready();
    });
  }

  gameOver() {
    this.busy = true;
    this.pullButton.g.setAlpha(0.55);
    this.pullGlow.pause();
    this.say("OUT OF COINS!", "#ffe066", 40);
    audio.play("gameOver");
    audio.say("gameOver", 0.4);
    const run = { ...this.run };
    store.finishGame(this.run);
    this.time.delayedCall(2800, () => this.scene.start("Results", { run }));
  }

  // ---- cashing out ----

  // Take the coins home? A big YES, or back to the slots.
  askCashOut() {
    if (this.busy) return;
    this.busy = true;
    this.pullGlow.pause();
    audio.play("pop");
    const layer = this.add.container(0, 0).setDepth(9500);
    layer.add(this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.88));
    layer.add(marquee(this, W / 2, 330, 470, 330));
    layer.add(text(this, W / 2, 230, "CASH OUT?", 64, { color: "#ffe066", strokeThickness: 10 }));
    layer.add(text(this, W / 2, 310, "TAKE HOME", 32, { color: "#fff3c4", strokeThickness: 6 }));
    layer.add(this.add.image(W / 2 - 120, 390, "coin").setScale(1.1));
    layer.add(text(this, W / 2 + 20, 392, coins(this.run.coins), 76, { color: "#7CFC9A", strokeThickness: 10 }));
    const yes = button(this, CASH_YES, 0xd4a017, "💰 CASH OUT", 46);
    yes.label.setColor("#2a0a14").setStroke("#fff3c4", 5);
    const no = button(this, CASH_NO, 0x2a9d3a, "▶ BACK TO THE SLOTS", 34);
    layer.add([yes.g, yes.label, no.g, no.label]);
    this.tweens.add({ targets: yes.label, scale: 1.06, duration: 550, yoyo: true, repeat: -1 });
    this.overlay = {
      tap: (x, y) => {
        if (near(x, y, CASH_YES, 16)) {
          this.overlay = { tap: () => {} };
          this.cashOut();
        } else if (near(x, y, CASH_NO, 16)) {
          this.overlay = null;
          layer.destroy();
          this.busy = false;
          this.pullGlow.resume();
        }
      },
    };
  }

  cashOut() {
    audio.play("bigWin");
    coinShower(this, COUNTER.x, COUNTER.y, W / 2, 900, 30);
    const run = { ...this.run };
    const { rank, previousTop } = store.finishGame(this.run, { cashedOut: true });
    this.time.delayedCall(1400, () => this.scene.start("Results", { run, cashedOut: true, rank, previousTop }));
  }

  // ---- the big-win window ----

  bigWin(result, next) {
    const layer = this.add.container(0, 0).setDepth(9500);
    const dim = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.7);
    layer.add(dim);
    const jackpot = result.kind === "jackpot";
    const sign = marquee(this, W / 2, 320, 470, 340);
    layer.add(sign);
    layer.add(text(this, W / 2, 210, jackpot ? "JACKPOT!" : "BIG WIN!", 70, { color: "#ffe066", strokeThickness: 10 }));
    for (const dx of [-130, 0, 130]) layer.add(this.picture(W / 2 + dx, 300, result.symbol, 110));
    const amount = text(this, W / 2, 410, `+${coins(result.coins)}`, 84, { color: "#7CFC9A", strokeThickness: 10 });
    layer.add(amount);
    this.tweens.add({ targets: amount, scale: 1.1, duration: 450, yoyo: true, repeat: -1 });
    const share = button(this, SHARE, 0xe63946, "📣 SHARE MY WIN", 38);
    const keep = button(this, KEEP, 0x2a9d3a, "▶ KEEP PLAYING", 42);
    layer.add([share.g, share.label, keep.g, keep.label]);
    layer.setAlpha(0);
    this.tweens.add({ targets: layer, alpha: 1, duration: 250 });

    // The share picture is the big-win window, without the buttons.
    let picture = null;
    const buttons = [share.g, share.label, keep.g, keep.label];
    this.time.delayedCall(450, () => {
      buttons.forEach((b) => b.setVisible(false));
      snapshot(this.game).then((png) => {
        picture = png;
        buttons.forEach((b) => b.setVisible(true));
      });
    });

    const words = jackpot
      ? `I hit the JACKPOT at Grandma Felicia's Christmas Casino! ⭐⭐⭐ +${coins(result.coins)} coins! 🎄`
      : `Big win at Grandma Felicia's Christmas Casino! +${coins(result.coins)} coins! 🎄🎰`;
    this.overlay = {
      tap: async (x, y) => {
        if (near(x, y, SHARE, 14)) {
          audio.play("pop");
          const outcome = await shareWin(words, picture);
          if (outcome !== "cancelled") share.label.setText("📣 SHARED! AGAIN?");
        } else if (near(x, y, KEEP, 20)) {
          this.overlay = null;
          layer.destroy();
          next();
        }
      },
    };
  }
}

