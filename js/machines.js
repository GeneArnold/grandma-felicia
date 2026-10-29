// The casino's slot machines. They all play the same way (js/rules.js); each has its own name,
// colours and pictures. More open up as a player wins: unlockAt is the coins to reach, once, in any
// game on this phone.
// symbols: the picture for each kind in rules.js SYMBOLS, best first; the ticket is shared.
// emoji: stand-ins, drawn in place of any picture that isn't in img/symbols/ yet.
export const MACHINES = [
  {
    id: "jingle",
    name: "JINGLE SLOTS",
    unlockAt: 0,
    cabinet: 0xa3122a, rim: 0xd4a017, title: "#ffe066",
    symbols: ["jingle-star", "jingle-gift", "jingle-snowman", "jingle-bell", "jingle-tree", "jingle-stocking"],
    emoji: ["⭐", "🎁", "⛄", "🔔", "🎄", "🧦"],
  },
  {
    id: "reindeer",
    name: "REINDEER GAMES",
    unlockAt: 300,
    cabinet: 0x6b3a1f, rim: 0xd4a017, title: "#ff6b6b",
    symbols: ["deer-rednose", "deer-gold", "deer-scarf", "deer-bells", "deer-baby", "deer-sleigh"],
    emoji: ["🔴", "🦌", "🧣", "🔔", "🐾", "🛷"],
  },
  {
    id: "workshop",
    name: "SANTA'S WORKSHOP",
    unlockAt: 500,
    cabinet: 0x1d6b3a, rim: 0xe63946, title: "#ffffff",
    symbols: ["shop-santa", "shop-elf", "shop-train", "shop-bear", "shop-horse", "shop-soldier"],
    emoji: ["🎅", "🧝", "🚂", "🧸", "🐴", "💂"],
  },
  {
    id: "snowy",
    name: "SNOWY CHRISTMAS",
    unlockAt: 800,
    cabinet: 0x2a6f9d, rim: 0xe8f4ff, title: "#ffffff",
    symbols: ["snow-flake", "snow-globe", "snow-cocoa", "snow-sled", "snow-mittens", "snow-skates"],
    emoji: ["❄️", "🔮", "☕", "🛷", "🧤", "⛸️"],
  },
];

export const TICKET_ART = "ticket";
export const TICKET_EMOJI = "🎟️";

export const machine = (id) => MACHINES.find((m) => m.id === id) ?? MACHINES[0];

// Every picture's texture key, for loading.
export const ALL_SYMBOLS = [...MACHINES.flatMap((m) => m.symbols), TICKET_ART];

// The picture key for kind n (0-5, or rules.js TICKET) on a machine.
export const art = (m, n) => m.symbols[n] ?? TICKET_ART;
