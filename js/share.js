// Sharing a win: the phone's own share sheet, with a picture of the screen and a link to the game.
import { CONFIG } from "./config.js";

export function gameLink() {
  // Testing on a computer or the home network (plain http) keeps links pointing at that copy.
  return location.protocol === "https:" && CONFIG.homeUrl ? CONFIG.homeUrl : location.origin + location.pathname;
}

// words: what to say. picture: a PNG Blob or null.
// → "shared", "texted" (fell back to a text message), or "cancelled"
export async function shareWin(words, picture) {
  const url = gameLink();
  if (navigator.share) {
    const file = picture && new File([picture], "christmas-casino.png", { type: "image/png" });
    const withPicture = { text: `${words} ${url}`, files: [file] };
    try {
      if (file && navigator.canShare?.(withPicture)) await navigator.share(withPicture);
      else await navigator.share({ text: words, url });
      return "shared";
    } catch (err) {
      if (err.name === "AbortError") return "cancelled";
    }
  }
  // No share sheet (plain http, or an old browser): open a text message instead.
  location.href = `sms:?&body=${encodeURIComponent(`${words} ${url}`)}`;
  return "texted";
}

// A PNG of what is on screen right now, for the share picture.
export function snapshot(game) {
  return new Promise((resolve) => {
    game.renderer.snapshot((img) => {
      try {
        const c = document.createElement("canvas");
        c.width = img.width;
        c.height = img.height;
        c.getContext("2d").drawImage(img, 0, 0);
        c.toBlob((blob) => resolve(blob), "image/png");
      } catch {
        resolve(null);
      }
    });
  });
}
