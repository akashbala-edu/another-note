// ============================================================
//  THE HUNGRY GAMES : all the personal content lives here.
//  Edit text in this file only; the games read from it.
// ============================================================

window.CONTENT = {
  herName: "Arushi",
  siteName: "The Hungry Games",

  welcome: [
    "You've heard of the Hunger Games.",
    "Welcome to The Hungry Games."
  ],
  welcomeMotto: "May the odds be ever in your favor.",

  // ---------- WORDLE ----------
  wordle: [
    ["HONEY", "My name for you. Always will be."],
    ["SMILE", "You love my smile. I love that it's usually because of you."],
    ["LOVER", "Because that's what you are. Mine."],
    ["STARS", "For all the nights we spent looking up at them together."],
    ["HEART", "You took my shattered heart and mended it."],
    ["DREAM", "I dream about you. I know you dream about me too."],
    ["MAGIC", "Your voice and the way you are just feel like magic."],
    ["TOUCH", "Every memory of us still lights me on fire. Even underwater."],
    ["VOICE", "Your voice calms everything in my head."],
    ["ANGEL", "Looking the way you do, you might actually be one."],
    ["TRUST", "Everything we have is built on it."],
    ["ALIVE", "You took a dead man and made him feel alive. That's me."],
    ["FIGHT", "We fight every other night, and we always find our way back."],
    ["CLIFF", "Our place."],
    ["GUESS", "For every airplane we've guessed together."],
    ["OLIVE", "Yes, your stuffed toy made the list."]
  ],

  // shown when she runs out of tries (Wordle and Pinpoint)
  teases: [
    "More than 6 tries? Not as smart as I thought hehe :)",
    "Wow. Okay. Take your time, genius.",
    "I'm not saying anything. I'm just watching :)",
    "Here's a hint, because I love you and you clearly need it."
  ],

  // ---------- MEMORY MATCH ----------
  photos: [
    ["1.jpg", "i love you"],
    ["2.jpg", "under the night sky"],
    ["3.jpg", "yeah i mog"],
    ["4.jpg", "the bite."],
    ["5.jpg", "jigsaw puzzle"],
    ["6.jpg", "our dirty mirror"],
    ["7.jpg", "hop the fence"],
    ["8.jpg", "us."]
  ],

  // ---------- LEVELS (added later) ----------
  wordle2: [
    ["NIGHT", "For all the nights we spent together."],
    ["SWEET", "Because that's exactly what you are."],
    ["BLUSH", "For every time I made you blush."],
    ["LAUGH", "For all the times we laughed over the stupidest things."],
    ["CLOSE", "For how close we've gotten."],
    ["PEACE", "The peace you bring into my life."],
    ["CHAOS", "And all the chaos that never lets us live."],
    ["WORLD", "The one we're going to travel together."],
    ["FAITH", "What we keep in each other."],
    ["SLEEP", "For every night we lost sleep, and every night we fell asleep on video call."],
    ["ADORE", "The way I absolutely adore you."],
    ["PROUD", "For every time you make me proud."],
    ["TEASE", "The way we never stop teasing each other."],
    ["CRUSH", "What we keep developing on each other. Clock it."],
    ["GRACE", "How graceful, soft and serene you are."],
    ["AGAIN", "Somehow we find our way back, again and again."],
    ["FOUND", "For finding each other when neither of us expected it."],
    ["BLOCK", "You know it. D Block."],
    ["BOOBS", "Of course this was going to be here."],
    ["BOOTY", "Since boobs is here, why not this. P.S. Your booty da best."]
  ],
  photos2: [
    ["9.jpg", "what a kiss"],
    ["10.jpg", "hand as big as face"],
    ["11.jpg", "reel, yt shorts addict"],
    ["12.jpg", "head kissss"],
    ["13.jpg", "gonna frame this"],
    ["14.jpg", "me like kissing you"],
    ["15.jpg", "eye to eye?"],
    ["16.jpg", "yeah my gf hot"]
  ],
  photos3: [
    ["17.jpg", "first time"],
    ["18.jpg", "the iconic hickey"],
    ["19.jpg", "GOAT of wordle"],
    ["20.jpg", "wallpaper"],
    ["21.jpg", "sleeping beauty"],
    ["22.jpg", "daddy and mommy are hot."],
    ["23.jpg", "always biting me"],
    ["24.jpg", "shirt swap"]
  ],
  unlock: {
    wordle2: ["Didn't expect you to finish it all so soon. Here's your reward for being so quick."],
    memory2: ["Didn't expect you to finish it all so soon. Here's your reward for being so quick.",
              "Since you find this so easy, let's add some spice."],
    memory3: ["Okay, now you're just showing off. Fine. Final level, extra spicy."]
  },
  memoryRules2: ["Wrong cards flip back faster", "Every 3 wrong guesses, two cards secretly swap places", "Finish in fewer flips for 3 stars"],
  memoryRules3: ["Half the cards are photos, half are captions", "Match each photo to its caption", "Still faster, still shuffling"],
  swapTeases: ["Oops, those two just moved :)", "Keep up, genius.", "Did you blink?"],
  starLines: ["Spicy enough for you? :)", "Not bad, not bad.", "Too easy for you, huh?"],
  wordleAllDone: "All 36 words. You've officially beaten every word I could think of.",
  memoryAllDone: "Every level, every memory. You win. You always do.",

  // ---------- PINPOINT ----------
  // keys: any guess containing one of these words counts as correct
  pinpoint: [
    { answer: "Foods associated with Arushi",
      clues: ["Pesto", "Oregano", "Snickers", "Blue Lays", "Momos"],
      keys: ["food", "foods", "snack", "snacks", "eat", "eats", "dish", "dishes"] },
    { answer: "Food places Arushi would like to go",
      clues: ["Din Tai Fung", "P.F. Chang's", "Chili's", "Wagamama", "Cali Burrito"],
      keys: ["restaurant", "restaurants", "place", "places", "spot", "spots", "try", "wishlist", "eatery", "eateries", "cafe", "cafes", "dine", "dining"] },
    { answer: "Campus memories",
      clues: ["Campus", "Quench", "Acad Blocks", "D Block", "Mythia stall"],
      keys: ["campus", "college", "snu", "uni", "university", "shiv nadar"] },
    { answer: "Our story",
      clues: ["February", "Instagram", "Jacket", "Walks", "Kiss"],
      keys: ["story", "relationship", "met", "meet", "start", "started", "began", "beginning", "love", "us", "dating", "first"] },
    { answer: "Nicknames between us",
      clues: ["Honey", "Stupid Boy", "Aalu Ketchup", "Jaanu", "Sundar Akash"],
      keys: ["nickname", "nicknames", "name", "names", "call", "calls", "pet"] }
  ],
  pinpointLines: [
    "First try?? Okay, who told you.",
    "Smart girl. Knew I picked the right one.",
    "Not bad, Aalu Ketchup.",
    "Took you a while, but I'll allow it.",
    "All 5 clues... we need to talk :)"
  ],

  // ---------- WIN LINES ----------
  queensWin: "you da real queen of hearts",
  patchesWin: "We fit perfectly, just like these patches.",

  // ---------- THE NOTE ----------
  note: [
    "You did it! Five games and one treasure chest later you managed to unlock the thing I actually wanted you to find.",
    "I could have made this website about anything, but I wanted it to be about us. The little things I remember, the places we've been, the things we do, the names you call me, and all those tiny pieces of you that somehow became pieces of my life.",
    "Somewhere between the Mythia stall, our walks, guessing airplanes, looking at the stars, the cliff, and all our nights where we somehow went from fighting to finding our way back to each other, you became so much more to me than I ever expected you to be.",
    "You took someone who thought he was perfectly capable of keeping his heart out of everything and somehow made him feel things he didn't even know he was missing. You made him realise how long even 16 hours can be without you. And now I get to be the stupid boy who knows your little habits, remembers your random details, and still gets ridiculously happy just because it's you.",
    "So if you ever forget how much you mean to me, come back here and play it again.",
    "I'll still choose you. Every single time."
  ],
  signoff: ["Forever yours,", "Akash"]
};
