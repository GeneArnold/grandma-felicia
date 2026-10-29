// What the announcer says, by moment: { clip id: words }. tools/make-voices.mjs records each line
// into voices/<clip id>.mp3, and the game picks one of a moment's lines at random.
export const VOICES = {
  // Grandma Felicia herself, on the intro screen
  feliciaHello: {
    "felicia-hello-1": "Let's go to the casino!",
    "felicia-hello-2": "Come on, let's go play! I'm feeling lucky!",
  },
  feliciaBack: {
    "felicia-back-1": "Welcome back, sweetie! Let's win some more!",
  },
  // ...and cheering on the big wins
  feliciaBigWin: {
    "felicia-big-1": "Way to go, sweetie!",
    "felicia-big-2": "Look at you go!",
  },
  feliciaJackpot: {
    "felicia-jackpot-1": "Woo-hoo! Jackpot! I knew you could do it!",
  },
  welcome: {
    "welcome-1": "Welcome to the Christmas Casino! Here are your coins. Good luck!",
    "welcome-2": "Merry Christmas! Let's pull that lever!",
  },
  win: {
    "win-1": "Winner!",
    "win-2": "Ho ho, nice one!",
    "win-3": "Look at that!",
  },
  bigWin: {
    "big-1": "Big win! Big win!",
    "big-2": "Oh my goodness, what a win!",
    "big-3": "Ring the bells! That's a big one!",
  },
  jackpot: {
    "jackpot-1": "Jackpot! Jackpot! Merry Christmas!",
    "jackpot-2": "Three gold stars! It's the jackpot!",
  },
  ticket: {
    "ticket-1": "You won a scratch-off ticket!",
    "ticket-2": "Scratch-off time!",
  },
  scratchWin: {
    "scratch-1": "It's a match! You win!",
    "scratch-2": "Three of a kind! Winner!",
  },
  santa: {
    "santa-1": "Ho ho ho! Merry Christmas! Here's a little something for you.",
    "santa-2": "Ho ho ho! Santa dropped by with some coins!",
  },
  newMachine: {
    "machine-1": "Ooh, a new machine just opened on the casino floor!",
  },
  gameOver: {
    "over-1": "That's all your coins. What a fun night at the casino!",
    "over-2": "Out of coins! Shall we play again?",
  },
};
