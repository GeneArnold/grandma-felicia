// The casino's rules: the slot machine's reels and pay table, the scratch-off tickets and Santa.
// Nothing here draws anything, so tools/sim.mjs can play thousands of games to check the odds.

export const START_COINS = 200;
export const BET = 10; // every pull costs the same

// The reel pictures, best first. Every machine has the same seven kinds of picture (its own art for
// each), so the odds are the same on all of them. weight: how many of each are on a reel (more =
// turns up more often). pay: coins for three in a row. The ticket pays nothing itself: two or three
// give a scratch-off. Pictures on a line are numbers: 0 is the jackpot picture, TICKET the ticket.
export const SYMBOLS = [
  { weight: 1, pay: 500 },
  { weight: 2, pay: 200 },
  { weight: 3, pay: 120 },
  { weight: 4, pay: 80 },
  { weight: 5, pay: 50 },
  { weight: 6, pay: 30 },
  { weight: 3, pay: 0 }, // the ticket
];
export const TICKET = 6;
export const PAIR_PAY = 10; // any two the same (not tickets)
export const BIG_WIN = 100; // a win this size gets the big cheer and the share button

function pickWeighted(items, rng) {
  const total = items.reduce((n, it) => n + it.weight, 0);
  let r = rng() * total;
  for (const it of items) if ((r -= it.weight) < 0) return it;
  return items.at(-1);
}

// What a line of three pictures wins.
// → { kind: "jackpot" | "three" | "pair" | "ticket" | "none", coins, symbol? }
export function judge(line) {
  const tickets = line.filter((n) => n === TICKET).length;
  if (tickets >= 2) return { kind: "ticket", coins: 0 };
  const [a, b, c] = line;
  if (a === b && b === c) return { kind: a === 0 ? "jackpot" : "three", coins: SYMBOLS[a].pay, symbol: a };
  const pair = a === b || a === c ? a : b === c ? b : null;
  if (pair !== null && pair !== TICKET) return { kind: "pair", coins: PAIR_PAY, symbol: pair };
  return { kind: "none", coins: 0 };
}

export function spin(rng = Math.random) {
  const line = [0, 1, 2].map(() => SYMBOLS.indexOf(pickWeighted(SYMBOLS, rng)));
  return { line, ...judge(line) };
}

// Santa drops in now and then, win or lose, with a sack of coins.
export const SANTA_CHANCE = 0.02;
const SANTA_GIFTS = [20, 30, 50, 50, 75, 100];
export function santaVisit(rng = Math.random) {
  return rng() < SANTA_CHANCE ? SANTA_GIFTS[Math.floor(rng() * SANTA_GIFTS.length)] : 0;
}

// The scratch-off tickets. Each kind plays differently (styles from real lottery tickets), but the
// prize is drawn first, the same way for every kind, and the ticket is then made to show it.
// A ticket: { type, prize, spots: [...], winners: [spot numbers that win, lit up at the end], ... }
export const SCRATCH_AMOUNTS = [10, 20, 50, 100, 250, 500];
const SCRATCH_PRIZES = [
  { coins: 20, weight: 30 },
  { coins: 50, weight: 30 },
  { coins: 100, weight: 22 },
  { coins: 250, weight: 12 },
  { coins: 500, weight: 6 },
];
export const SCRATCH_WIN_CHANCE = 0.6;
export const TICKET_TYPES = ["match3", "gifts", "lucky", "tictac"];

function shuffle(list, rng) {
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}
const pick = (list, rng) => list[Math.floor(rng() * list.length)];

// Six amounts; three the same wins that amount. spots: [amount]
function match3(prize, rng) {
  const spots = prize ? [prize, prize, prize] : [];
  const others = shuffle(SCRATCH_AMOUNTS.filter((n) => n !== prize), rng);
  const pool = shuffle([...others, ...others], rng); // at most two of any other amount
  while (spots.length < 6) spots.push(pool.pop());
  shuffle(spots, rng);
  return { spots, winners: prize ? spots.flatMap((n, i) => (n === prize ? [i] : [])) : [] };
}

// Six pictures, each with an amount. A gift wins its amount, a star wins double, and Santa wins
// every amount on the ticket. spots: [{ icon, amount }]
const PLAIN = ["tree", "bell", "snowman", "stocking"];
function gifts(prize, rng) {
  const plain = () => ({ icon: pick(PLAIN, rng), amount: pick([10, 20, 50, 100], rng) });
  const spots = Array.from({ length: 6 }, plain);
  if (prize) {
    const half = SCRATCH_AMOUNTS.includes(prize / 2) ? prize / 2 : 0;
    const way = rng();
    if (prize >= 100 && way < 0.3) {
      // Santa: the amounts add up to the prize
      const amounts = Array(6).fill(10);
      for (let left = prize / 10 - 6; left > 0; left--) amounts[Math.floor(rng() * 6)] += 10;
      amounts.forEach((a, i) => (spots[i].amount = a));
      spots[0].icon = "santa";
    } else if (half && way < 0.6) {
      spots[0] = { icon: "star", amount: half };
    } else {
      spots[0] = { icon: "gift", amount: prize };
    }
  }
  shuffle(spots, rng);
  const santa = spots.some((s) => s.icon === "santa");
  return { spots, winners: spots.flatMap((s, i) => (santa || !PLAIN.includes(s.icon) ? [i] : [])) };
}

// A lucky number and six of yours, each with an amount; yours matching the lucky one wins its amount.
// spots: [{ number, amount }], with the lucky number first.
function lucky(prize, rng) {
  const numbers = shuffle(Array.from({ length: 30 }, (_, i) => i + 1), rng);
  const luckyNumber = numbers.pop();
  const yours = Array.from({ length: 6 }, () => ({ number: numbers.pop(), amount: pick([10, 20, 50, 100, 250], rng) }));
  if (prize) yours[0] = { number: luckyNumber, amount: prize };
  shuffle(yours, rng);
  const spots = [{ number: luckyNumber, lucky: true }, ...yours];
  return { spots, winners: prize ? [0, spots.findIndex((s, i) => i > 0 && s.number === luckyNumber)] : [] };
}

// Nine pictures in a 3 x 3 grid; three the same in a row (across, down or corner to corner) wins
// the prize printed on the ticket. spots: [icon], row by row.
export const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
const SNOW = ["flake", "snowman", "tree"];
function tictac(prize, rng) {
  const rows = (spots) => LINES.filter(([a, b, c]) => spots[a] === spots[b] && spots[b] === spots[c]);
  for (;;) {
    const spots = Array.from({ length: 9 }, () => pick(SNOW, rng));
    if (prize) {
      const line = pick(LINES, rng);
      const icon = pick(SNOW, rng);
      for (const i of line) spots[i] = icon;
    }
    const won = rows(spots);
    if (won.length === (prize ? 1 : 0)) return { spots, winners: won.flat(), shows: prize || pick([50, 100, 250], rng) };
  }
}

const MAKERS = { match3, gifts, lucky, tictac };

// → { type, prize, spots, winners, shows? }. type: a kind of ticket, or one at random but not `not`.
export function scratchTicket(rng = Math.random, { type, not } = {}) {
  const prize = rng() < SCRATCH_WIN_CHANCE ? pickWeighted(SCRATCH_PRIZES, rng).coins : 0;
  type ??= pick(TICKET_TYPES.filter((t) => t !== not), rng);
  return { type, prize, ...MAKERS[type](prize, rng) };
}

export const canPull = (coins) => coins >= BET;
