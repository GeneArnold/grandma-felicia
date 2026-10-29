// Plays lots of games with the real rules, to check the odds feel right: how long a game lasts,
// how often each bonus comes up, and how much of each bet comes back.
// Run from the project folder:  node tools/sim.mjs [games]
import { BET, LUCKY_CHANCE, SANTA_CHANCE, START_COINS, SYMBOLS, canPull, judge, santaVisit, scratchTicket, spin } from "../js/rules.js";

// The exact return of one pull, from every possible line.
const total = SYMBOLS.reduce((n, s) => n + s.weight, 0);
let slots = 0;
let ticketChance = 0;
const kinds = SYMBOLS.map((_, i) => i);
for (const a of kinds) for (const b of kinds) for (const c of kinds) {
  const p = (1 - LUCKY_CHANCE) * (SYMBOLS[a].weight * SYMBOLS[b].weight * SYMBOLS[c].weight) / total ** 3;
  const r = judge([a, b, c]);
  slots += p * r.coins;
  if (r.kind === "ticket") ticketChance += p;
}
// the lucky lines: three of kind 0-3, weighted 1-4
for (const k of [0, 1, 2, 3]) slots += LUCKY_CHANCE * ((k + 1) / 10) * SYMBOLS[k].pay;
let scratchAverage = 0;
for (let i = 0; i < 200000; i++) scratchAverage += scratchTicket().prize / 200000;
let santaAverage = 0;
for (let i = 0; i < 200000; i++) santaAverage += santaVisit() / 200000;
const back = (coins) => `${(coins / BET * 100).toFixed(1)}%`;
console.log(`of each bet, the slots give back ${back(slots)}, scratch-offs ${back(scratchAverage * ticketChance)}, Santa ${back(santaAverage)}: ${back(slots + scratchAverage * ticketChance + santaAverage)} in all`);
console.log(`a scratch-off every ${(1 / ticketChance).toFixed(1)} pulls, worth ${scratchAverage.toFixed(0)} on average; Santa every ${(1 / SANTA_CHANCE).toFixed(0)} pulls`);

const games = Number(process.argv[2]) || 20000;
const lengths = [];
const bests = [];
let bigs = 0;
let wins = 0;
let pulls = 0;
for (let g = 0; g < games; g++) {
  let coins = START_COINS;
  let best = coins;
  let n = 0;
  while (canPull(coins) && n < 5000) {
    coins -= BET;
    const r = spin();
    coins += r.coins;
    if (r.kind === "ticket") coins += scratchTicket().prize;
    coins += santaVisit();
    if (r.coins > 0 || r.kind === "ticket") wins++;
    if (r.coins >= 80) bigs++;
    best = Math.max(best, coins);
    n++;
  }
  pulls += n;
  lengths.push(n);
  bests.push(best);
}
const sorted = (xs) => [...xs].sort((a, b) => a - b);
const pct = (xs, p) => sorted(xs)[Math.floor(xs.length * p)];
console.log(`pulls per game: quarter ${pct(lengths, 0.25)}, half ${pct(lengths, 0.5)}, three quarters ${pct(lengths, 0.75)}, 1 in 20 over ${pct(lengths, 0.95)}`);
console.log(`best bank: half over ${pct(bests, 0.5)}, 1 in 10 over ${pct(bests, 0.9)}`);
console.log(`a win of 80 or more every ${(pulls / bigs).toFixed(0)} pulls; ${[300, 500, 800].map((t) => `${(bests.filter((b) => b >= t).length / games * 100).toFixed(0)}% reach ${t}`).join(", ")}`);
console.log(`something won on ${(wins / pulls * 100).toFixed(0)}% of pulls`);
