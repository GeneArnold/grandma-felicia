// Makes thousands of each kind of scratch-off and checks each one shows exactly the prize it pays.
// Run from the project folder:  node tools/test-tickets.mjs
import { LINES, TICKET_TYPES, scratchTicket } from "../js/rules.js";

const shown = {
  match3: (t) => {
    const counts = {};
    for (const n of t.spots) counts[n] = (counts[n] || 0) + 1;
    const three = Object.entries(counts).filter(([, c]) => c >= 3);
    return three.length ? Number(three[0][0]) : 0;
  },
  gifts: (t) => {
    if (t.spots.some((s) => s.icon === "santa")) return t.spots.reduce((n, s) => n + s.amount, 0);
    return t.spots.reduce((n, s) => n + (s.icon === "gift" ? s.amount : s.icon === "star" ? 2 * s.amount : 0), 0);
  },
  lucky: (t) => t.spots.slice(1).reduce((n, s) => n + (s.number === t.spots[0].number ? s.amount : 0), 0),
  tictac: (t) => LINES.filter(([a, b, c]) => t.spots[a] === t.spots[b] && t.spots[b] === t.spots[c]).length * t.shows,
};
let bad = 0;
for (const type of TICKET_TYPES) {
  let wins = 0;
  for (let i = 0; i < 20000; i++) {
    const t = scratchTicket(Math.random, { type });
    if (shown[type](t) !== t.prize || (t.prize > 0) !== (t.winners.length > 0)) {
      if (bad++ < 5) console.log("WRONG", JSON.stringify(t));
    }
    if (t.prize) wins++;
  }
  console.log(`${type}: ${(wins / 200).toFixed(0)}% win`);
}
console.log(bad ? `${bad} wrong tickets` : "every ticket shows what it pays");
process.exit(bad ? 1 : 0);
