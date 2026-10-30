// Sound: the casino's effects, made with the Web Audio API, and the announcer's recorded voice.
// Browsers only allow sound after a touch, and Android only once the touch has ended, so unlock()
// runs on both the start and the end of a touch.
import { VOICES } from "./voices.js";

let ctx = null;
let enabled = true;
let noiseBuffer = null;
const clips = {}; // voice clips by id, decoded once the sound is unlocked

export function setEnabled(on) {
  enabled = on;
}

export function unlock() {
  if (!ctx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    ctx = new AudioCtx();
    noiseBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    loadVoices();
  }
  if (ctx.state !== "running") ctx.resume().catch(() => {}); // "suspended", or "interrupted" (iPhone, after a call)
}

function ready() {
  return enabled && ctx && ctx.state === "running";
}

function tone(freq, duration, { type = "square", volume = 0.06, slideTo = null, delay = 0 } = {}) {
  if (!ready()) return;
  const t0 = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + duration);
  gain.gain.setValueAtTime(volume, t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

function noise(duration, { volume = 0.15, filter = 1200, type = "lowpass", delay = 0 } = {}) {
  if (!ready()) return;
  const t0 = ctx.currentTime + delay;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer;
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.frequency.value = filter;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume, t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  src.connect(f).connect(gain).connect(ctx.destination);
  src.start(t0);
  src.stop(t0 + duration + 0.02);
}

// A bell: a bright tone with a softer one an octave and a fifth up.
function bell(freq, delay = 0, volume = 0.07) {
  tone(freq, 0.6, { type: "sine", volume, delay });
  tone(freq * 3, 0.3, { type: "sine", volume: volume / 3, delay });
}

// A brassy note: two sawtooth waves a hair apart through a soft filter, the way a horn sounds, with
// an optional wobble (vibrato) and a slide down at the end.
function horn(freq, start, duration, { wobble = false, droop = 1 } = {}) {
  if (!ready()) return;
  const t0 = ctx.currentTime + start;
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(1400, t0);
  filter.Q.value = 2;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(0.09, t0 + 0.04);
  gain.gain.setValueAtTime(0.09, t0 + duration * 0.7);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  filter.connect(gain).connect(ctx.destination);
  let lfo = null;
  if (wobble) {
    lfo = ctx.createOscillator();
    lfo.frequency.value = 6;
    const depth = ctx.createGain();
    depth.gain.value = freq * 0.025;
    lfo.connect(depth);
    lfo.depth = depth;
    lfo.start(t0);
    lfo.stop(t0 + duration);
  }
  for (const detune of [-6, 6]) {
    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.detune.value = detune;
    osc.frequency.setValueAtTime(freq, t0);
    if (droop !== 1) osc.frequency.exponentialRampToValueAtTime(freq * droop, t0 + duration);
    lfo?.depth.connect(osc.frequency);
    osc.connect(filter);
    osc.start(t0);
    osc.stop(t0 + duration + 0.02);
  }
}

const E5 = 659, G5 = 784, C5 = 523, D5 = 587, C6 = 1047;

const SOUNDS = {
  lever() {
    noise(0.12, { volume: 0.25, filter: 500 });
    tone(140, 0.15, { type: "sine", volume: 0.2, slideTo: 70 });
  },
  tick() {
    noise(0.03, { volume: 0.06, filter: 3000, type: "bandpass" });
  },
  stop() {
    noise(0.08, { volume: 0.2, filter: 700 });
    tone(200, 0.1, { type: "sine", volume: 0.12, slideTo: 120 });
  },
  coin() {
    tone(1320 + Math.random() * 80, 0.12, { type: "square", volume: 0.03 });
    tone(1980, 0.18, { type: "sine", volume: 0.03, delay: 0.05 });
  },
  pair() {
    bell(E5);
    bell(G5, 0.12);
  },
  // "Jingle bells, jingle bells"
  win() {
    [E5, E5, E5, 0, E5, E5, E5].forEach((f, i) => f && bell(f, i * 0.16));
  },
  // "...jingle all the way!"
  bigWin() {
    [E5, E5, E5, 0, E5, E5, E5, 0, E5, G5, C5, D5, E5].forEach((f, i) => f && bell(f, i * 0.15, 0.08));
    for (let i = 0; i < 14; i++) noise(0.05, { volume: 0.05, filter: 6000, type: "highpass", delay: 0.6 + i * 0.12 });
  },
  jackpot() {
    SOUNDS.bigWin();
    [C5, E5, G5, C6].forEach((f, i) => tone(f, i === 3 ? 0.8 : 0.15, { type: "triangle", volume: 0.07, delay: 2.1 + i * 0.13 }));
  },
  sleigh() {
    for (let i = 0; i < 16; i++) noise(0.06, { volume: 0.07, filter: 7000, type: "highpass", delay: i * 0.1 });
  },
  scratch() {
    noise(0.25, { volume: 0.12, filter: 2500, type: "bandpass" });
  },
  ticket() {
    [C5, E5, G5, C6].forEach((f, i) => bell(f, i * 0.1));
  },
  // a drumroll that builds, while the last reel decides
  drumroll() {
    for (let i = 0; i < 22; i++) noise(0.07, { volume: 0.05 + i * 0.006, filter: 900, delay: i * 0.055 });
  },
  // a firework: a whoosh up, a bang and a crackle
  firework() {
    noise(0.35, { volume: 0.05, filter: 2500, type: "bandpass" });
    noise(0.4, { volume: 0.22, filter: 400, delay: 0.35 });
    for (let i = 0; i < 8; i++) noise(0.03, { volume: 0.06, filter: 5000, type: "highpass", delay: 0.45 + i * 0.06 + Math.random() * 0.04 });
  },
  // a sparkle, for a new album card
  newCard() {
    [C6, 1319, 1568, 2093].forEach((f, i) => tone(f, 0.25, { type: "sine", volume: 0.05, delay: i * 0.07 }));
  },
  // a soft, friendly "oh well"
  miss() {
    tone(440, 0.18, { type: "sine", volume: 0.05 });
    tone(392, 0.3, { type: "sine", volume: 0.05, delay: 0.16 });
  },
  // wah, wah, wah, waaah: the game-show "better luck next time" horn, for a scratch-off that didn't win
  sadTrombone() {
    horn(294, 0, 0.42);
    horn(277, 0.45, 0.42);
    horn(262, 0.9, 0.42);
    horn(247, 1.35, 1.3, { wobble: true, droop: 0.94 });
  },
  pop() {
    tone(500, 0.08, { type: "sine", volume: 0.06, slideTo: 900 });
  },
  gameOver() {
    [G5, E5, C5].forEach((f, i) => bell(f, i * 0.25));
  },
};

export function play(name) {
  SOUNDS[name]?.();
}

// The announcer. Each kind of moment has a few recorded lines (js/voices.js); one is picked at random.
async function loadVoices() {
  for (const lines of Object.values(VOICES)) {
    for (const id of Object.keys(lines)) {
      fetch(`voices/${id}.mp3`)
        .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject()))
        .then((data) => ctx.decodeAudioData(data))
        .then((buffer) => (clips[id] = buffer))
        .catch(() => {}); // not recorded yet: the moment just goes without a voice
    }
  }
}

// A line right after the first tap (Felicia's hello) can come before the phone has turned the sound
// on (Android waits for the finger to lift) or before the clips have loaded, so it waits for both,
// up to VOICE_WAIT_MS; after that the moment has passed and it stays quiet.
const VOICE_WAIT_MS = 2500;

export function say(kind, delay = 0, waited = 0) {
  if (!enabled) return;
  const recorded = Object.keys(VOICES[kind] || {}).filter((id) => clips[id]);
  if (!ready() || !recorded.length) {
    if (ctx && waited < VOICE_WAIT_MS) setTimeout(() => say(kind, Math.max(0, delay - 0.1), waited + 100), 100);
    return;
  }
  const src = ctx.createBufferSource();
  src.buffer = clips[recorded[Math.floor(Math.random() * recorded.length)]];
  const gain = ctx.createGain();
  gain.gain.value = 1.4;
  src.connect(gain).connect(ctx.destination);
  src.start(ctx.currentTime + delay);
}
