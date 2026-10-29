// Everything the game remembers, in localStorage on this phone only.
// The game in progress is saved after every pull, so closing the app never loses any coins.
import { MACHINES } from "./machines.js";
import { START_COINS } from "./rules.js";

const KEY = "casino.v1";
const BOARD_SIZE = 10;

const DEFAULTS = {
  sound: true,
  seenIntro: false, // the first intro waits a little longer
  unlocked: ["jingle"], // the slot machines open on this phone (js/machines.js)
  game: null,  // the game in progress (see newGame), or null
  board: [],   // this phone's top 10 games, [{ score (coins cashed out), machine, biggest, pulls, at }], best first
};

let cache = null;

function load() {
  if (cache) return cache;
  try {
    cache = { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || "{}") };
  } catch {
    cache = { ...DEFAULTS };
  }
  return cache;
}

export function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    // Storage full or blocked (private window): keep playing, just without saving.
  }
}

export function get(name) {
  return load()[name];
}

export function set(name, value) {
  load()[name] = value;
  save();
}

export function newGame() {
  const game = {
    coins: START_COINS,
    best: START_COINS, // the most coins held at once
    biggest: 0,        // the biggest single win
    pulls: 0,
    tickets: 0,        // scratch-offs won
    santas: 0,         // Santa's visits
    ticket: null,      // a scratch-off waiting to be scratched (rules.js scratchTicket)
    machine: "jingle", // the slot machine being played
  };
  set("game", game);
  return game;
}

// Adds a win to the game in progress, keeping the best bank and biggest win up to date.
export function addWin(game, coins, { counts = true } = {}) {
  game.coins += coins;
  game.best = Math.max(game.best, game.coins);
  if (counts) game.biggest = Math.max(game.biggest, coins);
  save();
}

// Opens any machine whose coin goal this many coins reaches. → the machines just opened
export function unlockFor(coins) {
  const data = load();
  const opened = MACHINES.filter((m) => coins >= m.unlockAt && !data.unlocked.includes(m.id));
  if (opened.length) {
    data.unlocked = [...data.unlocked, ...opened.map((m) => m.id)];
    save();
  }
  return opened;
}

export function board() {
  return load().board;
}

export function topScore() {
  return Math.max(0, ...load().board.map((r) => r.score));
}

// Ends the game. Cashed out, the coins taken home are the score, filed on this phone's board.
// → { rank (1-10, or 0 if it missed the board or wasn't cashed out), previousTop }
export function finishGame(game, { cashedOut = false } = {}) {
  const data = load();
  const previousTop = topScore();
  data.game = null;
  if (!cashedOut) {
    save();
    return { rank: 0, previousTop };
  }
  const entry = { score: game.coins, machine: game.machine, biggest: game.biggest, pulls: game.pulls, at: Date.now() };
  data.board = [...data.board, entry].sort((a, b) => b.score - a.score || a.at - b.at).slice(0, BOARD_SIZE);
  save();
  return { rank: data.board.indexOf(entry) + 1, previousTop };
}
