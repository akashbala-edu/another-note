/* ============ The Hungry Games : core (state, sound, screens, hub) ============ */
window.App = (function () {
  const C = window.CONTENT;
  const KEY = "thg-v1";
  const $ = (s, r = document) => r.querySelector(s);
  const app = () => document.getElementById("app");

  /* ---------- saved progress ---------- */
  const fresh = () => ({
    done: {}, wordleFound: [], ppFound: [], qSolved: [], ptSolved: [],
    mmBest: null, chestOpened: false, last: {}, muted: false, bags: {}, seenHow: {},
    wordle2Found: [], mmDone2: false, mmDone3: false, mmBest2: null, mmBest3: null, mmStars2: 0, mmStars3: 0,
    level: {}, unlockSeen: {}
  });
  const Store = {
    data: fresh(),
    load() {
      let d = null;
      try { d = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
      this.data = Object.assign(fresh(), d || {});
    },
    save() { try { localStorage.setItem(KEY, JSON.stringify(this.data)); } catch (e) {} },
    reset() {
      const muted = this.data.muted;
      try { localStorage.removeItem(KEY); } catch (e) {}
      this.data = fresh(); this.data.muted = muted; this.save();
    }
  };

  /* ---------- 8-bit sound (made in code, no files) ---------- */
  const Sound = (function () {
    let ctx = null, master = null;
    // iPhones in silent mode mute web audio unless the page asks for "playback"
    try { if (navigator.audioSession) navigator.audioSession.type = "playback"; } catch (e) {}
    function ensure() {
      if (!ctx) {
        try {
          ctx = new (window.AudioContext || window.webkitAudioContext)();
          master = ctx.createGain(); master.gain.value = 0.22; master.connect(ctx.destination);
          // a silent blip fully wakes audio on iOS and some Android browsers
          const b = ctx.createBuffer(1, 1, 22050), src = ctx.createBufferSource();
          src.buffer = b; src.connect(ctx.destination); src.start(0);
        } catch (e) { ctx = null; }
      }
      if (ctx && ctx.state !== "running") { try { ctx.resume(); } catch (e) {} }
      return ctx;
    }
    // every tap re-wakes audio in case the browser put it to sleep
    ["pointerdown", "touchend", "keydown"].forEach(ev => document.addEventListener(ev, () => ensure(), { passive: true, capture: true }));
    function tone(freq, start, dur, type = "square", vol = 1) {
      if (!ctx || Store.data.muted) return;
      window.__tones = (window.__tones || 0) + 1;
      const t = ctx.currentTime + start;
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type; o.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.02);
    }
    const N = { C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880, B5: 987.77, C6: 1046.5, E6: 1318.5, G6: 1568, C7: 2093 };
    return {
      unlock() { ensure(); },
      win() { // tick earned
        if (!ensure()) return;
        [["C5", 0], ["E5", .09], ["G5", .18], ["C6", .27]].forEach(([n, s]) => tone(N[n], s, .14, "square", .7));
        tone(N.E6, .4, .35, "square", .5); tone(N.C6, .4, .35, "triangle", .6);
      },
      chest() { // treasure chest opening sparkle
        if (!ensure()) return;
        const seq = [523, 659, 784, 1047, 1319, 1568, 2093];
        seq.forEach((f, i) => tone(f, i * 0.07, .18, "square", .45));
        [0, .12, .24, .36, .48, .6].forEach((s, i) => tone(2093 + i * 180, .55 + s, .12, "triangle", .35));
        tone(N.C6, 1.25, .9, "triangle", .5); tone(N.E6, 1.25, .9, "triangle", .35); tone(N.G6, 1.25, .9, "triangle", .3);
      },
      chime() { // START and note
        if (!ensure()) return;
        tone(N.G5, 0, .5, "triangle", .6); tone(N.C6, .12, .7, "triangle", .55); tone(N.E6, .26, .9, "triangle", .4);
      },
      soft() { // tiny cue used for hints
        if (!ensure()) return;
        tone(N.A5, 0, .12, "triangle", .4); tone(N.D5, .1, .16, "triangle", .35);
      },
      start() { // pressing Start / opening a game
        if (!ensure()) return;
        tone(N.C5, 0, .08, "square", .5); tone(N.G5, .07, .12, "square", .5);
      },
      state() { return ctx ? ctx.state : "none"; }
    };
  })();

  /* ---------- small helpers ---------- */
  function px(map, pal, cls = "") {
    // map: array of strings, each char a palette key ("." = empty)
    const h = map.length, w = map[0].length;
    let r = "";
    map.forEach((row, y) => [...row].forEach((ch, x) => {
      if (ch !== "." && pal[ch]) r += `<rect x="${x}" y="${y}" width="1.02" height="1.02" fill="${pal[ch]}"/>`;
    }));
    return `<svg class="${cls}" viewBox="0 0 ${w} ${h}" aria-hidden="true">${r}</svg>`;
  }
  const HEART = [".##.##.", "#######", "#######", ".#####.", "..###..", "...#..."];
  const heartSVG = (c = "#ffd60a") => px(HEART, { "#": c });
  const CHECK = ["......#", ".....##", "#...##.", "##.##..", ".###...", "..#...."];
  const checkSVG = px(CHECK, { "#": "#07103f" });
  const BACK = ["...#...", "..##...", ".######", "#######", ".######", "..##...", "...#..."];
  const SPK_ON = ["...#....", "..##.#..", "####..#.", "####.#.#", "####.#.#", "####..#.", "..##.#..", "...#...."];
  const SPK_OFF = ["...#....", "..##....", "####.#.#", "####..#.", "####..#.", "####.#.#", "..##....", "...#...."];

  let toastT = null;
  function toast(msg, ms = 2600) {
    let t = document.querySelector(".toast");
    if (t) t.remove();
    t = document.createElement("div");
    t.className = "toast px sun"; t.textContent = msg;
    document.body.appendChild(t);
    clearTimeout(toastT); toastT = setTimeout(() => t.remove(), ms);
  }
  const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const pick = (a) => a[Math.random() * a.length | 0];

  // shuffled deck: every puzzle shows once before any repeats, unsolved ones first
  function pickIndex(game, n, solved = []) {
    const last = Store.data.last[game];
    let bag = (Store.data.bags[game] || []).filter(i => i < n);
    if (!bag.length) {
      const fresh = shuffle([...Array(n).keys()].filter(i => !solved.includes(i)));
      const old = shuffle([...Array(n).keys()].filter(i => solved.includes(i)));
      bag = fresh.concat(old);
      if (bag.length > 1 && bag[0] === last) bag.push(bag.shift());
    } else {
      // unsolved first within what is left
      bag.sort((a, b) => solved.includes(a) - solved.includes(b));
    }
    const i = bag.shift();
    Store.data.bags[game] = bag; Store.data.last[game] = i; Store.save();
    return i;
  }

  /* ---------- pop-up card (results, how to play) ---------- */
  function modal(inner, opts = {}) {
    const old = document.querySelector(".modal-wrap"); if (old) old.remove();
    const w = document.createElement("div");
    w.className = "modal-wrap" + (opts.sheet ? " sheet" : "");
    w.innerHTML = `<div class="modal result px light" role="dialog">${opts.closable ? '<button class="modal-x" data-close aria-label="Close">&times;</button>' : ""}${inner}</div>`;
    document.body.appendChild(w);
    const close = () => { w.remove(); opts.onClose && opts.onClose(); };
    if (opts.dismiss) w.addEventListener("click", (e) => { if (e.target === w) close(); });
    w.querySelectorAll("[data-close]").forEach(b => b.onclick = close);
    return { el: w, close };
  }

  function makeTimer(el) {
    let start = 0, acc = 0, id = null;
    const fmt = (ms) => { const s = Math.floor(ms / 1000); return String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0"); };
    const paint = () => { el.textContent = fmt(acc + (start ? Date.now() - start : 0)); };
    paint();
    return {
      start() { if (start || id === -1) return; start = Date.now(); id = setInterval(paint, 250); },
      stop() { if (start) acc += Date.now() - start; start = 0; clearInterval(id); id = -1; paint(); return fmt(acc); },
      kill() { clearInterval(id); },
      text() { return fmt(acc + (start ? Date.now() - start : 0)); }
    };
  }

  /* ---------- screens ---------- */
  let cleanup = null;
  function mount(html) {
    if (cleanup) { try { cleanup(); } catch (e) {} cleanup = null; }
    document.querySelectorAll(".modal-wrap, .toast").forEach(x => x.remove());
    const a = app(); a.innerHTML = html; window.scrollTo(0, 0);
    return a.firstElementChild;
  }
  function onLeave(fn) { cleanup = fn; }

  const QMARK = [".###.", "#...#", "....#", "..##.", "..#..", ".....", "..#.."];
  function topbar(title, withTimer, withHelp) {
    return `<div class="topbar">
      <button class="icon-btn" data-act="back" aria-label="Back to games">${px(BACK, { "#": "#c7d1ff" })}</button>
      <div class="title">${title}</div>
      ${withTimer ? '<div class="timer" aria-label="Timer">00:00</div>' : ""}
      ${withHelp ? `<button class="icon-btn" data-act="help" aria-label="How to play">${px(QMARK, { "#": "#ffd60a" })}</button>` : ""}
      <button class="icon-btn" data-act="mute" aria-label="Sound on or off">${Store.data.muted ? px(SPK_OFF, { "#": "#8fa0e6" }) : px(SPK_ON, { "#": "#c7d1ff" })}</button>
    </div>`;
  }
  function wireTopbar(root) {
    const b = root.querySelector('[data-act="back"]'); if (b) b.onclick = () => show("hub");
    const m = root.querySelector('[data-act="mute"]');
    if (m) m.onclick = () => {
      Store.data.muted = !Store.data.muted; Store.save();
      m.innerHTML = Store.data.muted ? px(SPK_OFF, { "#": "#8fa0e6" }) : px(SPK_ON, { "#": "#c7d1ff" });
      if (!Store.data.muted) Sound.soft();
    };
  }

  function welcome() {
    const root = mount(`<section class="screen welcome">
      <div class="name">${C.herName}</div>
      <div class="card px">
        <p>${C.welcome[0]}</p>
        <p class="big">${C.welcome[1]}</p>
        <p class="motto">${C.welcomeMotto}</p>
      </div>
      <button class="btn start" id="go"><span class="blink">&#9654;</span> Start</button>
    </section>`);
    root.querySelector("#go").onclick = () => { Sound.start(); show("hub"); };
  }

  const GLYPHS = {
    wordle: px(["gg.yy.kk", "gg.yy.kk", "........", "kk.gg.yy", "kk.gg.yy", "........", "yy.kk.gg", "yy.kk.gg"], { g: "#538d4e", y: "#b59f3b", k: "#6878c8" }),
    memory: px(["######..", "#yyyy#..", "#y##y###", "#yyyy#p#", "######p#", "..#pppp#", "..#pppp#", "..######"], { "#": "#07103f", y: "#3d63f0", p: "#f5f7ff" }),
    pinpoint: px(["..####..", ".#yyyy#.", "#yy##yy#", "#yy##yy#", ".#yyyy#.", "..#yy#..", "...##...", "...##..."], { "#": "#07103f", y: "#ffd60a" }),
    queens: px(["aaaabbbb", "a.##.##b", "a#######", "aa#####b", "ccc###dd", "cccc#ddd", "ccccdddd", "ccccdddd"], { a: "#bba3e2", b: "#96beff", c: "#ffc992", d: "#b3dfa0", "#": "#ffd60a" }),
    patches: px(["aaabbbbb", "aaabbbbb", "aaabbbbb", "ccddddee", "ccddddee", "ccffffee", "ccffffee", "ccffffee"], { a: "#ffb3c7", b: "#96beff", c: "#ffe98a", d: "#b3dfa0", e: "#bba3e2", f: "#ffc992" })
  };

  /* ---------- levels (Wordle 1-2, Memory 1-3) ---------- */
  const Levels = {
    max(game) {
      const d = Store.data;
      if (game === "wordle") return C.wordle.every(([w]) => d.wordleFound.includes(w)) ? 2 : 1;
      if (game === "memory") return d.done.memory ? (d.mmDone2 ? 3 : 2) : 1;
      return 1;
    },
    current(game) {
      const m = this.max(game), l = Store.data.level[game] || 1;
      return Math.min(Math.max(1, l), m);
    },
    set(game, l) { Store.data.level[game] = l; Store.save(); },
    pending(game) { // a newly unlocked level she hasn't been told about yet
      const m = this.max(game);
      return m > 1 && !Store.data.unlockSeen[game + m] ? m : 0;
    },
    unlockHTML(game, l) {
      const lines = C.unlock[game + l] || [];
      const rules = game === "memory" ? (l === 2 ? C.memoryRules2 : C.memoryRules3) : null;
      return `<div class="kicker">NEW LEVEL UNLOCKED</div>
        ${lines.map((t, i) => `<p class="${i ? "spice" : ""}">${t}</p>`).join("")}
        ${rules ? `<ul class="rules">${rules.map(r => `<li>${r}</li>`).join("")}</ul>` : ""}
        <div class="row-btns"><button class="btn" data-a="level">Level ${l}</button></div>`;
    },
    wireUnlock(m, game, l) {
      Store.data.unlockSeen[game + l] = true; Store.data.level[game] = l; Store.save();
      m.el.querySelector('[data-a="level"]').onclick = () => { Sound.start(); show(game); };
    },
    popup(game, l) {
      const m = modal(this.unlockHTML(game, l));
      this.wireUnlock(m, game, l);
      Sound.win();
      return m;
    }
  };
  const starsText = (n) => n ? `${n} ${n === 1 ? "star" : "stars"}` : "";

  function counters() {
    const d = Store.data;
    const wl = Levels.max("wordle"), ml = Levels.max("memory");
    const mBest = ml === 3 ? (d.mmStars3 || 0) : (d.mmStars2 || 0);
    return {
      wordle: wl === 2 ? `Level 2 · ${d.wordle2Found.length} of ${C.wordle2.length} words` : (d.done.wordle ? `${d.wordleFound.length} of ${C.wordle.length} words found` : "Guess the word"),
      memory: ml > 1 ? `Level ${ml}${mBest ? " · best " + starsText(mBest) : ""}` : (d.done.memory ? (d.mmBest ? `Best: ${d.mmBest} flips` : "Done") : "Find the pairs"),
      pinpoint: d.done.pinpoint ? `${d.ppFound.length} of ${C.pinpoint.length} solved` : "Guess the link",
      queens: d.done.queens ? `${d.qSolved.length} of ${QUEENS.length} solved` : "One heart per row",
      patches: d.done.patches ? `${d.ptSolved.length} of ${PATCHES.length} solved` : "Fill the grid"
    };
  }
  const HOWTO = {
    wordle: "Guess the <b>5-letter word</b> in 6 tries. <b>Green</b> means the letter is in the right spot, <b>gold</b> means it's in the word but somewhere else. Every word here means something to us.",
    memory: "Flip two cards at a time and find all <b>8 matching pairs</b> of photos. Fewer flips is better.",
    pinpoint: "All 5 clues belong to the <b>same category</b>. Guess the category. Every wrong guess reveals another clue, so the fewer you need, the better.",
    queens: "Place one <b>heart</b> in every row, every column and every color. Hearts can't touch, not even diagonally. Tap once for an <b>X</b>, twice for a <b>heart</b>. Drag to mark lots of X's.",
    patches: "Split the grid into <b>rectangles</b>. Each one holds exactly one number, and the number is how many squares it covers. The icon says <b>square</b>, <b>tall</b> or <b>wide</b> (no icon means any shape). Drag to draw, tap a rectangle to remove it."
  };
  const NAMES = { wordle: "Wordle", memory: "Memory Match", pinpoint: "Pinpoint", queens: "Queens", patches: "Patches" };
  const ORDER = ["wordle", "memory", "pinpoint", "queens", "patches"];
  const allDone = () => ORDER.every(k => Store.data.done[k]);

  function hub() {
    const d = Store.data, cnt = counters(), n = ORDER.filter(k => d.done[k]).length;
    const tile = (k, wide) => `<button class="tile px ${d.done[k] ? "done" : ""} ${wide ? "wide" : ""}" data-game="${k}">
        <div class="glyph">${GLYPHS[k]}</div>
        ${wide ? '<div class="meta">' : ""}
        <div class="tname">${NAMES[k]}</div>
        <div class="tsub">${cnt[k]}</div>
        ${wide ? "</div>" : ""}
        ${d.done[k] ? `<span class="check" aria-label="Done">${checkSVG}</span>` : ""}
      </button>`;
    const chest = allDone() ? `<div class="chest-wrap px">
        <p>${d.chestOpened ? "Your prize is still in here" : "Something unlocked..."}</p>
        <button class="chest-btn" id="chest" aria-label="Open the treasure chest"><canvas width="32" height="28"></canvas></button>
        <p class="blink">Tap the chest</p>
      </div>` : "";
    const root = mount(`<section class="screen">
      ${topbar(C.siteName.toUpperCase(), false).replace('data-act="back"', 'data-act="home"')}
      <div class="hub-head px">
        <h1>Choose your game</h1>
        <p>${n === 5 ? "All 5 done. Your prize is waiting below." : `${n} of 5 done. Finish all 5 to unlock your prize.`}</p>
        <div class="progress">${ORDER.map(k => `<i class="${d.done[k] ? "on" : ""}"></i>`).join("")}</div>
      </div>
      ${chest}
      <div class="tiles">
        ${tile("wordle")}${tile("memory")}${tile("pinpoint")}${tile("queens")}${tile("patches", true)}
      </div>
      <div class="hub-foot">Progress saves on this device.</div>
    </section>`);
    wireTopbar(root);
    const home = root.querySelector('[data-act="home"]'); home.setAttribute("aria-label", "Back to welcome"); home.onclick = () => show("welcome");
    root.querySelectorAll("[data-game]").forEach(b => b.onclick = () => { Sound.start(); show(b.dataset.game); });
    const ch = root.querySelector("#chest");
    if (ch) { drawChest(ch.querySelector("canvas"), false); ch.onclick = () => Finale.open(); }
  }

  function drawChest(cv, open) {
    const g = cv.getContext("2d"); g.clearRect(0, 0, 32, 28);
    const P = (c, x, y, w = 1, h = 1) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
    const wood = "#9a5a22", woodD = "#6b3a12", gold = "#ffd60a", goldD = "#b88a00", ink = "#07103f";
    // body
    P(ink, 3, 13, 26, 14); P(wood, 4, 14, 24, 12); P(woodD, 4, 20, 24, 1); P(woodD, 4, 25, 24, 1);
    P(gold, 4, 14, 3, 12); P(gold, 25, 14, 3, 12); P(goldD, 6, 14, 1, 12); P(goldD, 25, 14, 1, 12);
    if (!open) {
      P(ink, 3, 5, 26, 9); P(ink, 5, 3, 22, 2); P(wood, 4, 6, 24, 7); P(wood, 6, 4, 20, 2);
      P(woodD, 4, 9, 24, 1); P(gold, 4, 6, 3, 7); P(gold, 25, 6, 3, 7);
      P(ink, 14, 10, 4, 6); P(gold, 15, 11, 2, 4); P(ink, 15, 13, 2, 1);
    } else {
      P(ink, 3, 2, 26, 6); P(wood, 4, 3, 24, 4); P(gold, 4, 3, 3, 4); P(gold, 25, 3, 3, 4);
      P("#fff6c2", 6, 9, 20, 5); P(gold, 8, 10, 16, 4); P("#fff", 12, 9, 2, 2); P("#fff", 20, 10, 1, 1);
    }
  }

  /* ---------- game registration ---------- */
  const games = {};
  function register(id, mountFn) { games[id] = mountFn; }

  function show(name) {
    if (name === "welcome") return welcome();
    if (name === "hub") return hub();
    if (games[name]) {
      const pend = Levels.pending(name);
      if (pend) Levels.set(name, pend);
      const maxL = Levels.max(name), cur = Levels.current(name);
      const tabs = maxL > 1 ? `<div class="lvl-tabs" role="tablist">${[...Array(maxL).keys()].map(i => `<button class="lvl ${i + 1 === cur ? "on" : ""}" role="tab" aria-selected="${i + 1 === cur}" data-l="${i + 1}">Level ${i + 1}</button>`).join("")}</div>` : "";
      const root = mount(`<section class="screen game g-${name} ${tabs ? "has-levels" : ""} lvl-${cur}">${topbar(NAMES[name].toUpperCase(), name === "queens" || name === "patches", true)}${tabs}<div class="game-body"></div></section>`);
      wireTopbar(root);
      root.querySelectorAll(".lvl").forEach(b => b.onclick = () => { if (+b.dataset.l !== cur) { Levels.set(name, +b.dataset.l); show(name); } });
      games[name](root.querySelector(".game-body"), root, cur);
      const help = () => {
        const extra = name === "memory" && cur > 1 ? `<ul class="rules">${(cur === 2 ? C.memoryRules2 : C.memoryRules3).map(r => `<li>${r}</li>`).join("")}</ul>` : "";
        return modal(`<div class="kicker">HOW TO PLAY${cur > 1 ? " · LEVEL " + cur : ""}</div><h2>${NAMES[name]}</h2><p class="how">${HOWTO[name]}</p>${extra}
        <div class="row-btns"><button class="btn small" data-close>Got it</button></div>`, { dismiss: true });
      };
      root.querySelector('[data-act="help"]').onclick = help;
      if (pend) Levels.popup(name, pend);
      else if (!Store.data.seenHow[name]) { Store.data.seenHow[name] = true; Store.save(); help(); }
    }
  }

  // called by a game when she wins it
  function win(id) {
    const first = !Store.data.done[id];
    Store.data.done[id] = true; Store.save();
    Sound.win();
    return first;
  }

  function boot() {
    Store.load();
    if (location.hash === "#reset") {
      Store.reset();
      try { history.replaceState(null, "", location.pathname + location.search); } catch (e) { location.hash = ""; }
      setTimeout(() => toast("Everything's reset. Have fun :)"), 300);
    }
    document.addEventListener("pointerdown", () => Sound.unlock(), { once: true });
    document.addEventListener("pointerdown", () => document.body.classList.add("pointer"), true);
    document.addEventListener("keydown", (e) => { if (e.key === "Tab") document.body.classList.remove("pointer"); }, true);
    welcome();
  }

  return { boot, show, register, win, Store, Sound, toast, shuffle, pick, pickIndex, makeTimer, onLeave, heartSVG, px, HEART, drawChest, allDone, modal, Levels, C };
})();
