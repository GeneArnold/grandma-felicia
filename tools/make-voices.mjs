// Records the announcer's lines (js/voices.js) with Chatterbox on cerebro, into voices/<clip id>.mp3.
// Run from the project folder:  node tools/make-voices.mjs [--force]
// Lines already recorded are skipped unless --force is given.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { VOICES } from "../js/voices.js";

const CHATTERBOX = process.env.CHATTERBOX_URL || "http://192.168.40.110:8004";
const SAMPLE_RATE = 24000;

// Who says what: the casino's announcer, except Santa and Grandma Felicia, who speak for themselves.
// pitch below 1 = deeper and slower.
const ANNOUNCER = { voice: "Olivia.wav", pitch: 1.0 };
const FELICIA = { voice: "Elena.wav", pitch: 1.0 }; // Gene picked Elena from the samples
const SPEAKERS = { santa: { voice: "Jeremiah.wav", pitch: 0.86 }, feliciaHello: FELICIA, feliciaBack: FELICIA };

const force = process.argv.includes("--force");
const tmp = "voices/.raw.wav";

async function record(text, { voice, pitch }, out) {
  const res = await fetch(`${CHATTERBOX}/v1/audio/speech`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ model: "chatterbox", input: text, voice, response_format: "wav", speed: 1.0 }),
  });
  if (!res.ok) throw new Error(`Chatterbox said HTTP ${res.status} for "${text}" (${voice})`);
  writeFileSync(tmp, Buffer.from(await res.arrayBuffer()));
  // change the pitch, trim the silence at the start, and even out the loudness between clips
  const filters = [
    `asetrate=${SAMPLE_RATE}*${pitch}`, `aresample=${SAMPLE_RATE}`,
    "silenceremove=start_periods=1:start_threshold=-45dB", "loudnorm=I=-16:TP=-1.5",
  ].join(",");
  execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-i", tmp, "-af", filters, "-ac", "1", "-c:a", "libmp3lame", "-q:a", "5", out]);
}

mkdirSync("voices", { recursive: true });
for (const [kind, lines] of Object.entries(VOICES)) {
  for (const [id, words] of Object.entries(lines)) {
    const out = `voices/${id}.mp3`;
    if (!force && existsSync(out)) continue;
    await record(words, SPEAKERS[kind] ?? ANNOUNCER, out);
    console.log(out, words);
  }
}
