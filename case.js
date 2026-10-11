/* ============ Case No. 30-01: The Stolen Heart (core, board, accusation, verdict) ============ */
window.Case = (function () {
  const D = () => App.Store.data;
  const save = () => App.Store.save();
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  /* ---------------- words (all from the approved script) ---------------- */
  const T = {
    incident: [
      ["Victim", "Akash Bala"],
      ["Missing", "one (1) heart. Was working fine until January."],
      ["Suspects", "one."],
      ["Witness", "one stuffed toy. Not on campus. Claims he can hear her thoughts anyway."],
      ["Assigned detective", "you."]
    ],
    incidentLine: "Last time we solved a case, we did it together. This time I'm the victim, so you're on your own.",
    statement: [
      "I'll keep this short, detective.",
      "I walked into D Block to talk to a friend. I walked out missing something. I didn't notice right away. That's how good she is. Over the next three months it went missing in pieces, and by the end of April it was just gone.",
      "I know who did it. I want you to prove it. Where she got in. When she took it. Where. And what she used.",
      "The files are on the board. Take your time. Or don't, I'm timing you."
    ],
    suspect: [
      ["Height", "shorter than the victim"],
      ["Distinguishing features", "glasses, hair usually open"],
      ["Known to", "stutter when nervous"],
      ["Known to", "use a baby voice"],
      ["Known to", "scold people who wake her up"],
      ["Status", "at large"]
    ],
    exhibit: { title: "u + me = <3 ?", sub: "Shared playlist. 42 songs, 2h 29m.", songs: ["Sweater Weather", "Yellow", "honeybee"] },
    wrong: [
      "Breeze Day 3? I was drunk, detective. My testimony from that night doesn't count.",
      "That's where you got in, not where you took it. Keep up.",
      "'Take me somewhere' was me. Are you arresting the victim?",
      "The cliff? That's where we keep things, not where we lose them.",
      "I'd call to wake you up over this answer, but you'd scold me.",
      "You're worrying about my mood again instead of solving the case. Focus."
    ],
    rap: {
      head: [
        ["DEFENDANT", "ARUSHI"],
        ["Also known as", "Honey, Jaanu, Aalu Ketchup, the girl at the Mythia stall"],
        ["Year at time of offence", "third. \"Doesn't look like one.\""]
      ],
      charges: [
        "Breaking and entering, Jan 30. Weapon: one \"Hii\".",
        "Selling the victim a ticket he could never use.",
        "Staying completely sober while the victim did not. Breeze Day 3.",
        "Theft of one heart, first degree. Last week of April, Towers bench.",
        "Repeated biting. Unlicensed hickey. Possession of the victim's T shirts.",
        "Ruining her own mood worrying about his. Aggravating circumstance.",
        "Scolding the victim for waking her up. (He deserved it.)"
      ],
      plea: "\"I don't care how long it is.\"",
      sentence: "However long it is."
    },
    ending: [
      "The heart is still out there. So is a treasure hunt you never got to run. Stay reachable, detective. Any night now."
    ],
    passphrase: "TAKE ME SOMEWHERE"
  };

  const FILES = {
    q: { no: "01", name: "Intercepted Messages", game: "Quordle", short: "BENCH. CHAIN. DRUNK. SOBER.",
      card: "Recovered from the suspect's phone: BENCH. CHAIN. DRUNK. SOBER. One of them was drunk. The other was not. There are at least two benches in this case.",
      how: "Four words from the suspect's phone. Guess all four at once in <b>9 guesses</b>. Every guess lands on all four boards. <b>Hard mode:</b> each guess has to use every hint from at least one unsolved board.",
      hint: "Shows one letter of each word you haven't solved." },
    c: { no: "02", name: "Known Associates", game: "Connections", short: "Her world, and her humour",
      card: "The suspect's world: four campus spots, two colours each, love bites, love letters, and a joke she still thinks is funny.",
      how: "Sixteen words, four hidden groups of four. Pick four and submit. <b>Four mistakes</b> and the board reshuffles (that counts against your rank). Most words fit more than one group. Only one answer fits all four.",
      hint: "Tells you the name of one group." },
    x: { no: "03", name: "The Crossword You Lost", game: "Crossword", short: "Where: Towers bench",
      card: "Where it was taken: Towers bench.",
      intro: "You once watched me get one word on your mythology crossword. One. Your turn.",
      how: "Tap a square to start, tap it again to switch direction. Every clue is either real Greek mythology or about us, never both. When the grid is right, the <b>shaded squares</b> drop their letters. Put them in order.",
      hint: "Fills in the word you have selected." },
    z: { no: "04", name: "The Timeline", game: "Zip", short: "When: last week of April",
      card: "When it was taken: the last week of April. The kiss was in February. So it wasn't the kiss.",
      how: "Draw one line from <b>1</b> through every number in order, filling <b>every square</b> exactly once. The line can't cross a wall or itself. Drag back to undo. Some squares hold a letter. Read them in the order your line passes them.",
      hint: "Draws the line from 1 to 4 for you." },
    o: { no: "05", name: "Olive's Statement", game: "Cryptogram", short: "The weapon",
      card: "The weapon: \"I don't care how long it is. I just want to spend it with you.\"",
      how: "Olive gave his statement in code. Every letter has been swapped for a different one. Tap a letter, then type what you think it really is. Every copy of that letter changes with it. The first line is already cracked. Wrong guesses turn <b>red</b>.<br><br><b>How to crack it:</b><br>&bull; A one-letter word is <b>I</b> or <b>A</b>.<br>&bull; One letter after an apostrophe is usually <b>S, T, M or D</b> (she's, don't, I'm, couldn't).<br>&bull; Start with short words that are nearly filled in.<br>&bull; Every letter you crack fills in everywhere, so each word opens up the next.",
      hint: "Decodes three letters for you." },
    d: { no: "06", name: "The Victim's Diary", game: "Fill the blanks", short: "Entry: the Mythia stall",
      card: "Point of entry: the Mythia stall, D Block, Jan 30. Method: one \"Hii\".",
      how: "My diary, with words blacked out. Tap a word, then tap a blank (tap a filled blank to take it back). Some words are decoys. <b>Check</b> tells you how many are right, never which.",
      hint: "Puts two words in the right blanks." }
  };
  const ORDER = ["q", "c", "x", "z", "o", "d"];
  // red strings between solved cards that point at the same thing
  const LINKS = [["x", "o"], ["z", "o"], ["z", "x"], ["q", "c"], ["d", "c"], ["q", "z"]];

  const QUESTIONS = [
    { q: "Where did she get in?", a: "Mythia stall, D Block", o: ["Basketball court", "Outside his class", "Instagram", "Quench", "The signboard road"] },
    { q: "When was it taken?", a: "Last week of April", o: ["Jan 30", "Breeze Day 2", "Breeze Day 3", "May 13"] },
    { q: "Where was it taken?", a: "Towers bench", o: ["The signboard", "The curb by Breeze", "The cliff", "D Block", "Acad Blocks"] },
    { q: "With what?", a: "\"I don't care how long it is. I just want to spend it with you.\"", o: ["\"Hii\"", "\"Do you want my jacket?\"", "\"Take me somewhere\"", "\"God, you have beautiful eyes\"", "\"Go piss girl\""] }
  ];

  /* ---------------- saved state (lives inside the old save, nothing else changes) ---------------- */
  function cs() {
    const d = D();
    if (!d.cs || typeof d.cs !== "object") d.cs = { best: null, bestMs: null, closed: false, notified: false, runs: 0, run: null };
    return d.cs;
  }
  const newRun = () => ({ ms: 0, intro: false, seen: {}, solved: {}, hints: {}, pts: 0, wrong: 0, helped: false, locked: {}, acc: {}, accOrd: null, st: {}, done: false, last: -1, rank: null });
  function run() { const c = cs(); if (!c.run) { c.run = newRun(); save(); } return c.run; }
  const solvedCount = () => ORDER.filter(k => run().solved[k]).length;
  const RANKS = ["S", "A", "B", "C"];
  function rankOf(r) {
    const min = r.ms / 60000;
    if (r.helped) return "C";
    if (r.pts === 0 && r.wrong <= 1 && min <= 75) return "S";
    if (r.pts <= 2 && r.wrong <= 3 && min <= 120) return "A";
    return "B";
  }
  const fmtClock = (ms) => {
    const s = Math.floor(ms / 1000), h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, x = s % 60;
    return (h ? h + ":" + String(m).padStart(2, "0") : String(m).padStart(2, "0")) + ":" + String(x).padStart(2, "0");
  };
  const fmtDur = (ms) => {
    const s = Math.round(ms / 1000), h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60;
    return h ? `${h}h ${m}m` : `${m}m ${s % 60}s`;
  };

  /* ---------------- the case clock: runs only while a case screen is open and visible ---------------- */
  let clock = null, lastT = 0, ticks = 0;
  function paintTimer() { const t = document.querySelector(".case .timer"); if (t) t.textContent = fmtClock(run().ms); }
  function tick() {
    const now = performance.now(), r = run();
    if (!document.hidden && !r.done) r.ms += Math.min(now - lastT, 3000);
    lastT = now; paintTimer();
    if (++ticks % 10 === 0) save();
  }
  function startClock() { stopClock(); lastT = performance.now(); clock = setInterval(tick, 500); }
  function stopClock() { if (clock) { tick(); clearInterval(clock); clock = null; save(); } }

  /* ---------------- little sound effects (made in code) ---------------- */
  function sfx(kind) {
    const a = App.Sound.ctx(); if (!a || D().muted) return;
    const { ctx, master } = a, t0 = ctx.currentTime;
    const blip = (f, s, d, type, v, f2) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type; o.frequency.setValueAtTime(f, t0 + s); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + s + d);
      g.gain.setValueAtTime(0.0001, t0 + s); g.gain.exponentialRampToValueAtTime(v, t0 + s + .01); g.gain.exponentialRampToValueAtTime(0.0001, t0 + s + d);
      o.connect(g); g.connect(master); o.start(t0 + s); o.stop(t0 + s + d + .03);
    };
    if (kind === "stamp") { blip(160, 0, .22, "square", .8, 55); blip(90, .01, .3, "triangle", .9, 40); }
    if (kind === "pin") { blip(1200, 0, .05, "square", .3); blip(800, .05, .08, "square", .25); }
    if (kind === "wrong") { blip(220, 0, .14, "square", .45); blip(165, .12, .22, "square", .45); }
    if (kind === "type") { blip(1800 + Math.random() * 300, 0, .02, "square", .08); }
  }


  /* ---------------- pixel bits ---------------- */
  const FOLDER = App.px(["........", ".yyy....", "yyyyyyyy", "yttttyyy", "yyttttyy", "yyyttttY", "yyyyyyyy", "yyyyyyyy"], { y: "#e8c27a", t: "#ffd60a", Y: "#ffd60a" });
  const PIN = App.px([".rr.", "rrrr", "rrrr", ".rr.", ".kk.", ".k.."], { r: "#e0303a", k: "#2a2a3a" });

  /* ---------------- shared screen shell ---------------- */
  let cur = null; // the open file's game api (for hints)
  function shell(cls, title, o = {}) {
    const root = App.mount(`<section class="screen game case ${cls} ${o.music ? "music" : ""}">${App.topbar(title, !!o.timer, !!o.help)}<div class="game-body"></div></section>`);
    App.wireTopbar(root);
    root.querySelector('[data-act="back"]').onclick = o.back || (() => App.show("hub"));
    if (o.help) root.querySelector('[data-act="help"]').onclick = o.help;
    const extra = [];
    App.onLeave(() => { stopClock(); cur = null; extra.forEach(f => { try { f(); } catch (e) {} }); save(); });
    if (o.timer) { startClock(); paintTimer(); }
    return { root, body: root.querySelector(".game-body"), onLeave: (f) => extra.push(f) };
  }

  /* ---------------- hub tile + arrival popup ---------------- */
  const available = () => App.allDone() && !!D().chestOpened;
  function tileHTML() {
    const c = cs(), r = c.run;
    let sub = "Status: Unsolved";
    if (c.closed) sub = "Closed" + (r && !r.done && r.intro ? " · replay open" : "");
    else if (r && r.intro) sub = `Status: Open · ${solvedCount()} of 6 files`;
    return `<button class="tile px wide case-tile ${c.closed ? "closed" : ""}" data-case aria-label="Case number 30-01">
      <div class="glyph">${FOLDER}</div>
      <div class="meta"><div class="tname">Case No. 30-01</div><div class="tsub">${sub}</div></div>
      ${c.closed && c.best ? `<span class="rank-badge" aria-label="Best rank ${c.best}">${c.best}</span>` : `<span class="tape">UNSOLVED</span>`}
    </button>`;
  }
  function wireTile(root) {
    const b = root.querySelector("[data-case]"); if (!b) return;
    b.onclick = () => { App.Sound.start(); App.show("case"); };
    const c = cs();
    if (!c.notified) {
      c.notified = true; save();
      setTimeout(() => {
        if (!document.querySelector("[data-case]")) return;
        const m = App.modal(`<div class="kicker">NEW CASE FILE</div>
          <div class="arrive-folder">${FOLDER}</div>
          <h2>Case No. 30-01</h2>
          <p>Something of mine went missing. I need a detective.</p>
          <p class="stat">Status: Unsolved</p>
          <div class="row-btns"><button class="btn" data-a="go">Open the case</button><button class="btn small ghost" data-close>Later</button></div>`, { closable: true });
        m.el.querySelector('[data-a="go"]').onclick = () => { m.close(); App.Sound.start(); App.show("case"); };
        App.Sound.win();
      }, 450);
    }
  }

  /* ---------------- open ---------------- */
  function open() {
    const c = cs();
    if (c.closed && (!c.run || c.run.done)) return closedScreen();
    const r = run();
    if (!r.intro) return intro(0);
    board();
  }

  function typeInto(el, total, onDone) {
    // reveals the text already inside el, character by character over `total` ms
    const nodes = []; const walk = (n) => n.childNodes.forEach(x => x.nodeType === 3 ? nodes.push([x, x.textContent]) : walk(x));
    walk(el); el.style.minHeight = el.offsetHeight + "px"; nodes.forEach(([n]) => n.textContent = "");
    const len = nodes.reduce((a, [, t]) => a + t.length, 0);
    let t0 = 0, done = false, raf = 0, lastN = 0;
    const paint = (k) => { let left = k; nodes.forEach(([n, t]) => { n.textContent = t.slice(0, Math.max(0, left)); left -= t.length; }); };
    const finish = () => { if (done) return; done = true; cancelAnimationFrame(raf); paint(len); onDone && onDone(); };
    const step = (now) => {
      if (done) return; if (!t0) t0 = now;
      const k = Math.min(1, (now - t0) / total), n = Math.floor(len * k);
      if (n - lastN > 3) { sfx("type"); lastN = n; }
      paint(n); if (k >= 1) return finish(); raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return finish;
  }

  function intro(page) {
    const r = run();
    const { body } = shell("c-intro", "CASE 30-01", { music: true });
    if (page === 0) {
      body.innerHTML = `<div class="report px light">
          <div class="rep-head"><span>INCIDENT REPORT</span><span class="tape small">CASE 30-01</span></div>
          <div class="rep-body" id="rb">
            ${T.incident.map(([k, v]) => `<div class="rep-row"><span class="k">${k}:</span> <span class="v">${esc(v)}</span></div>`).join("")}
            <p class="rep-line">${esc(T.incidentLine)}</p>
          </div>
        </div>
        <div class="tap-hint" id="th">TAP TO SKIP</div>
        <div class="row-btns" id="nx" hidden><button class="btn" id="next">Next</button></div>`;
    } else {
      body.innerHTML = `<div class="report px light statement">
          <div class="rep-head"><span>VICTIM'S STATEMENT</span><span class="tape small">AKASH BALA</span></div>
          <div class="rep-body" id="rb">${T.statement.map(p => `<p>${esc(p)}</p>`).join("")}</div>
        </div>
        <div class="tap-hint" id="th">TAP TO SKIP</div>
        <div class="row-btns" id="nx" hidden><button class="btn" id="next">Open the board</button></div>`;
    }
    const rb = body.querySelector("#rb"), nx = body.querySelector("#nx"), th = body.querySelector("#th");
    const skip = typeInto(rb, page === 0 ? 3200 : 4200, () => { nx.hidden = false; th.hidden = true; });
    body.querySelector(".report").onclick = skip; th.onclick = skip;
    body.querySelector("#next").onclick = () => {
      App.Sound.start();
      if (page === 0) return intro(1);
      r.intro = true; save(); board(true);
    };
  }

  /* ---------------- the evidence board ---------------- */
  function caseHelp() {
    App.modal(`<div class="kicker">HOW THE CASE WORKS</div><h2>The Stolen Heart</h2>
      <p class="how">Six files, any order. Each one pins a piece of evidence to the board. No single file solves the case.</p>
      <p class="how">Every file has <b>one hint</b>. Hints cost rank. When all six are solved, make your <b>accusation</b>: where she got in, when it was taken, where, and with what.</p>
      <p class="how">The clock only runs while the case is open. Everything saves as you go.</p>
      <div class="row-btns"><button class="btn small" data-close>Got it</button></div>`, { dismiss: true });
  }

  function board(fresh, justPinned) {
    const r = run(), n = solvedCount();
    const { root, body, onLeave } = shell("c-board", "CASE 30-01", { timer: true, help: caseHelp, music: true });
    if (fresh && !r.seen.board) { r.seen.board = true; save(); setTimeout(caseHelp, 300); }
    const susLines = T.suspect.slice(0, n);
    const latest = susLines.length ? susLines[susLines.length - 1] : ["Details", "none yet. Solve files to fill this in."];
    body.innerHTML = `
      <button class="suspect px" id="sus" aria-label="Suspect card">
        <div class="mug"><span>?</span></div>
        <div class="sus-meta">
          <div class="sus-name">SUSPECT: <b>Unknown</b></div>
          <div class="sus-line"><span class="k">${latest[0]}:</span> ${esc(latest[1])}</div>
          <div class="sus-pips">${ORDER.map((_, i) => `<i class="${i < n ? "on" : ""}"></i>`).join("")}<span>${n}/6</span></div>
        </div>
      </button>
      <div class="cb-area">
        <div class="cb-files" id="files">
          ${ORDER.map(k => {
            const f = FILES[k], s = r.solved[k];
            return `<button class="cfile ${s ? "solved" : ""} ${justPinned === k ? "pinned-now" : ""}" data-f="${k}">
              ${s ? `<span class="pin">${PIN}</span>` : ""}
              <span class="no">FILE ${f.no}${s ? " · SOLVED" : ""}</span>
              <span class="nm">${f.name}</span>
              <span class="gm">${s ? esc(f.short) : f.game}</span>
            </button>`;
          }).join("")}
          <svg class="strings" id="strings" aria-hidden="true"></svg>
        </div>
      </div>
      <button class="exhibit" id="exh"><span class="ex-tag">EXHIBIT P</span><span class="ex-t">${esc(T.exhibit.title)}</span><span class="ex-s">${esc(T.exhibit.sub)}</span></button>
      <button class="btn accuse ${n === 6 ? "" : "locked"}" id="acc">${n === 6 ? "Make your accusation" : `Accusation · ${n}/6 files`}</button>`;
    body.querySelector("#sus").onclick = () => App.modal(`<div class="kicker">SUSPECT CARD</div>
        <div class="sus-big"><div class="mug big"><span>?</span></div><div><div class="sus-name">SUSPECT: <b>Unknown</b></div></div></div>
        <ul class="rules">${T.suspect.map((l, i) => `<li class="${i < n ? "" : "redact"}">${i < n ? `<b>${l[0]}:</b> ${esc(l[1])}` : "&nbsp;"}</li>`).join("")}</ul>
        <p class="stat">${n < 6 ? "Each solved file fills in a line." : "Card complete."}</p>
        <div class="row-btns"><button class="btn small" data-close>Back to the board</button></div>`, { dismiss: true, closable: true });
    body.querySelector("#exh").onclick = () => App.modal(`<div class="kicker">EXHIBIT P</div><h2>${esc(T.exhibit.title)}</h2>
        <p class="stat">${esc(T.exhibit.sub)}</p>
        <ul class="songs">${T.exhibit.songs.map(s => `<li>${esc(s)}</li>`).join("")}<li class="more">+ 39 more</li></ul>
        <p class="stat">Seized from a shared account. Both suspects added songs.</p>
        <div class="row-btns"><button class="btn small" data-close>Back to the board</button></div>`, { dismiss: true, closable: true });
    body.querySelectorAll(".cfile").forEach(b => b.onclick = () => {
      const k = b.dataset.f;
      if (r.solved[k]) return evidenceModal(k, false);
      App.Sound.start(); fileScreen(k);
    });
    body.querySelector("#acc").onclick = () => {
      if (solvedCount() < 6) { App.toast("The accusation opens once all 6 files are solved."); return; }
      App.Sound.start(); accusation(0);
    };
    // red strings
    const drawStrings = () => {
      const svg = body.querySelector("#strings"), wrap = body.querySelector("#files"); if (!svg) return;
      const wr = wrap.getBoundingClientRect();
      svg.setAttribute("viewBox", `0 0 ${wr.width} ${wr.height}`);
      const pt = (k) => { const e = wrap.querySelector(`[data-f="${k}"] .pin`); if (!e) return null; const b = e.getBoundingClientRect(); return [b.left - wr.left + b.width / 2, b.top - wr.top + b.height * .35]; };
      svg.innerHTML = LINKS.map(([a, b]) => { const p = pt(a), q = pt(b); if (!p || !q) return ""; const mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2 + 16; return `<path d="M${p[0]} ${p[1]} Q${mx} ${my} ${q[0]} ${q[1]}"/>`; }).join("");
    };
    requestAnimationFrame(drawStrings);
    const ro = window.ResizeObserver ? new ResizeObserver(drawStrings) : null;
    if (ro) ro.observe(body.querySelector("#files"));
    onLeave(() => ro && ro.disconnect());
    if (justPinned) sfx("pin");
  }

  function evidenceModal(k, fresh) {
    const f = FILES[k], all = solvedCount() === 6;
    const m = App.modal(`<div class="kicker">${fresh ? "EVIDENCE RECOVERED" : "FILE " + f.no + " · EVIDENCE"}</div>
      <div class="ev-card"><span class="pin">${PIN}</span><div class="ev-no">FILE ${f.no} · ${f.name.toUpperCase()}</div><p>${esc(f.card)}</p></div>
      ${fresh && all ? `<p class="line">All six files solved. The accusation is open.</p>` : ""}
      <div class="row-btns"><button class="btn" data-a="pin">${fresh ? "Pin it to the board" : "Back to the board"}</button></div>`, { closable: !fresh });
    m.el.querySelector('[data-a="pin"]').onclick = () => { m.close(); if (fresh) board(false, k); };
  }

  /* ---------------- a file ---------------- */
  function fileHelp(k) {
    const f = FILES[k], r = run();
    const hintBlock = r.solved[k] ? "" : r.hints[k]
      ? `<p class="stat">Hint used for this file.</p>`
      : `<div class="hint-box" id="hb"><button class="btn small blue" data-a="hint">Use the hint</button><div class="stat">${f.hint} Costs rank.</div></div>`;
    const m = App.modal(`<div class="kicker">FILE ${f.no} · ${f.game.toUpperCase()}</div><h2>${f.name}</h2>
      ${f.intro ? `<p class="spice">"${esc(f.intro)}"</p>` : ""}
      <p class="how">${f.how}</p>${hintBlock}
      <div class="row-btns"><button class="btn small" data-close>Got it</button></div>`, { dismiss: true, closable: true });
    const hb = m.el.querySelector('[data-a="hint"]');
    if (hb) hb.onclick = () => {
      const box = m.el.querySelector("#hb");
      box.innerHTML = `<div class="confirm-ink">It shows on your final record. Sure?</div><div class="row-btns"><button class="btn small ghost" data-a="no">No</button><button class="btn small blue" data-a="yes">Yes, hint</button></div>`;
      box.querySelector('[data-a="no"]').onclick = () => { m.close(); fileHelp(k); };
      box.querySelector('[data-a="yes"]').onclick = () => {
        r.hints[k] = true; r.pts++; save(); m.close(); App.Sound.soft();
        if (cur && cur.hint) cur.hint();
      };
    };
    return m;
  }

  function fileScreen(k) {
    const f = FILES[k], r = run();
    const { root, body, onLeave } = shell("c-file c-" + k, `FILE ${f.no}`, { timer: true, help: () => fileHelp(k), music: true, back: () => board() });
    const api = {
      r, st: (r.st[k] = r.st[k] || {}), save, root, onLeave, sfx,
      penalty() { r.pts++; save(); },
      solved() {
        if (r.solved[k]) return;
        r.solved[k] = true; save(); App.Sound.win();
        setTimeout(() => evidenceModal(k, true), 650);
      }
    };
    cur = GAMES[k](body, api) || {};
    if (!r.seen[k]) { r.seen[k] = true; save(); fileHelp(k); }
  }

  /* ---------------- the accusation ---------------- */
  function accOrder() {
    const r = run();
    if (!r.accOrd) { r.accOrd = QUESTIONS.map(q => App.shuffle([q.a, ...q.o])); save(); }
    return r.accOrd;
  }
  function accusation(i) {
    const r = run(), ord = accOrder();
    const { body } = shell("c-acc", "ACCUSATION", { timer: true, music: true, back: () => board(), help: () => App.modal(`<div class="kicker">THE ACCUSATION</div><h2>Name it all</h2>
      <p class="how">Answer all four, then submit. A wrong accusation only tells you <b>how many</b> are right, never which. Wrong accusations cost rank.</p>
      <div class="row-btns"><button class="btn small" data-close>Got it</button></div>`, { dismiss: true }) });
    if (i < 4) {
      const Q = QUESTIONS[i], pick = r.acc[i], lock = r.locked[i];
      body.innerHTML = `
        <div class="acc-steps">${QUESTIONS.map((_, j) => `<button class="${j === i ? "on" : ""} ${r.acc[j] != null ? "set" : ""}" data-j="${j}" aria-label="Question ${j + 1}">${j + 1}</button>`).join("")}<button class="${i === 4 ? "on" : ""}" data-j="4">&#10003;</button></div>
        <div class="acc-q px light"><div class="kicker">QUESTION ${i + 1} OF 4</div><h2>${Q.q}</h2></div>
        <div class="acc-opts">${ord[i].map(o => `<button class="acc-o ${pick === o ? "on" : ""} ${lock ? "lock" : ""}" ${lock && o !== Q.a ? "disabled" : ""} data-o="${esc(o)}">${esc(o)}${lock && o === Q.a ? " <em>locked</em>" : ""}</button>`).join("")}</div>
        <div class="row-btns acc-nav"><button class="btn small ghost" data-a="prev" ${i === 0 ? "disabled" : ""}>Back</button><button class="btn small" data-a="next">${i === 3 ? "Review" : "Next"}</button></div>`;
      body.querySelectorAll(".acc-o").forEach(b => b.onclick = () => {
        if (lock) return;
        r.acc[i] = b.dataset.o; save(); App.Sound.start();
        setTimeout(() => accusation(QUESTIONS.every((_, j) => r.acc[j] != null) ? 4 : i + 1), 160);
      });
      body.querySelector('[data-a="prev"]').onclick = () => accusation(i - 1);
      body.querySelector('[data-a="next"]').onclick = () => accusation(i + 1);
    } else {
      const ready = QUESTIONS.every((_, j) => r.acc[j] != null);
      const canHelp = r.wrong >= 3 && QUESTIONS.some((_, j) => !r.locked[j]);
      body.innerHTML = `
        <div class="acc-steps">${QUESTIONS.map((_, j) => `<button class="${r.acc[j] != null ? "set" : ""}" data-j="${j}">${j + 1}</button>`).join("")}<button class="on" data-j="4">&#10003;</button></div>
        <div class="acc-review px light">
          <div class="kicker">YOUR ACCUSATION</div>
          ${QUESTIONS.map((Q, j) => `<button class="acc-row" data-j="${j}"><span class="k">${Q.q}</span><span class="v">${r.acc[j] != null ? esc(r.acc[j]) : "<i>not answered</i>"}${r.locked[j] ? " <em>locked</em>" : ""}</span></button>`).join("")}
          <div class="stat">Wrong accusations so far: ${r.wrong}</div>
        </div>
        <div class="row-btns"><button class="btn accuse" data-a="submit" ${ready ? "" : "disabled"}>Submit accusation</button></div>
        ${canHelp ? `<div class="row-btns"><button class="btn small ghost" data-a="help">Help me</button></div>` : ""}`;
      body.querySelector('[data-a="submit"]').onclick = submit;
      const h = body.querySelector('[data-a="help"]'); if (h) h.onclick = helpMe;
      body.querySelectorAll(".acc-row").forEach(b => b.onclick = () => accusation(+b.dataset.j));
    }
    body.querySelectorAll(".acc-steps button").forEach(b => b.onclick = () => accusation(+b.dataset.j));
  }
  function pickLine(r) {
    const a = r.acc, cands = [];
    if (a[1] === "Breeze Day 3") cands.push(0);
    if (a[2] === "D Block" || a[1] === "Jan 30") cands.push(1);
    if (a[3] === "\"Take me somewhere\"") cands.push(2);
    if (a[2] === "The cliff") cands.push(3);
    let pool = cands.filter(x => x !== r.last);
    if (!pool.length) pool = [4, 5].filter(x => x !== r.last);
    const x = App.pick(pool); r.last = x; return T.wrong[x];
  }
  function submit() {
    const r = run();
    const right = QUESTIONS.filter((Q, j) => r.acc[j] === Q.a).length;
    if (right === 4) return verdict();
    r.wrong++; save(); sfx("wrong");
    const line = pickLine(r); save();
    const m = App.modal(`<div class="kicker">WRONG ACCUSATION</div><h2>${right} of 4 right</h2>
      <p class="spice">"${esc(line)}"</p>
      ${r.wrong >= 3 && QUESTIONS.some((_, j) => !r.locked[j]) ? `<p class="stat">Stuck? "Help me" is on the review page now. It caps your rank at C.</p>` : ""}
      <div class="row-btns"><button class="btn small" data-close>Back to it</button></div>`);
    m.el.querySelector("[data-close]").addEventListener("click", () => accusation(4));
  }
  function helpMe() {
    const r = run();
    const m = App.modal(`<div class="kicker">HELP ME</div><h2>Lock in one answer?</h2>
      <p class="how">I'll lock one right answer in for you. Your rank can't go above <b>C</b> after this.</p>
      <div class="row-btns"><button class="btn small ghost" data-close>No</button><button class="btn small" data-a="yes">Yes, help</button></div>`, { dismiss: true });
    m.el.querySelector('[data-a="yes"]').onclick = () => {
      const open = QUESTIONS.map((Q, j) => j).filter(j => !r.locked[j]);
      const wrongOnes = open.filter(j => r.acc[j] !== QUESTIONS[j].a);
      const j = App.pick(wrongOnes.length ? wrongOnes : open);
      r.locked[j] = true; r.acc[j] = QUESTIONS[j].a; r.helped = true; save();
      m.close(); App.Sound.soft(); accusation(4);
      App.toast(`Question ${j + 1} locked in.`);
    };
  }

  /* ---------------- the verdict ---------------- */
  function verdict() {
    const r = run(), c = cs();
    stopClock();
    r.done = true; r.rank = rankOf(r);
    const prevBest = c.best;
    if (!c.best || RANKS.indexOf(r.rank) < RANKS.indexOf(c.best)) c.best = r.rank;
    if (c.bestMs == null || r.ms < c.bestMs) c.bestMs = r.ms;
    c.closed = true; c.runs = (c.runs || 0) + 1; save();
    App.mount(`<section class="screen case c-verdict"></section>`);
    App.onLeave(() => { timers.forEach(clearTimeout); });
    const timers = []; const later = (f, ms) => timers.push(setTimeout(f, ms));
    const ov = document.querySelector(".c-verdict");
    const cards = ORDER.map((k, i) => {
      const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
      return `<div class="v-card" style="--x:${Math.cos(a) * 38}vmin;--y:${Math.sin(a) * 34}vmin"><b>FILE ${FILES[k].no}</b>${esc(FILES[k].short)}</div>`;
    }).join("");
    ov.innerHTML = `<div class="v-stage" id="vs">
        <svg class="v-strings" viewBox="-50 -50 100 100" preserveAspectRatio="none">${ORDER.map((k, i) => { const a = (i / 6) * Math.PI * 2 - Math.PI / 2; return `<line x1="0" y1="0" x2="${Math.cos(a) * 38}" y2="${Math.sin(a) * 34}"/>`; }).join("")}</svg>
        ${cards}
        <div class="v-flip" id="vf"><div class="v-inner">
          <div class="v-face v-front"><div class="mug big"><span>?</span></div><div class="vf-t">SUSPECT: UNKNOWN</div></div>
          <div class="v-face v-back"><img src="suspect.jpg" alt="The suspect"><div class="stamp-y">GUILTY</div></div>
        </div></div>
        <div class="tap-hint v-tap" id="vt" hidden>TAP TO READ THE CHARGES</div>
      </div>`;
    const vs = ov.querySelector("#vs");
    App.Sound.chest();
    later(() => vs.classList.add("pull"), 700);
    later(() => vs.classList.add("gather"), 1900);
    later(() => { vs.classList.add("flip"); sfx("stamp"); }, 3100);
    later(() => { sfx("stamp"); vs.classList.add("stamped"); }, 3900);
    later(() => { const t = ov.querySelector("#vt"); t.hidden = false; vs.onclick = rapSheet; }, 4600);
  }

  function rapSheet() {
    const r = run();
    App.mount(`<section class="screen case c-rap">
      <div class="rap px light">
        <div class="rap-top">
          <div class="mugshot"><img src="suspect.jpg" alt=""><div class="hlines"></div><div class="plate">30-01</div></div>
          <div class="rap-head" id="rh">${T.rap.head.map(([k, v]) => `<div class="rl"><span class="k">${k}:</span> ${esc(v)}</div>`).join("")}</div>
        </div>
        <div class="rap-sec">CHARGES</div>
        <ol class="charges">${T.rap.charges.map(ch => `<li class="rl">${esc(ch)}</li>`).join("")}</ol>
        <div class="rl plea"><span class="k">PLEA:</span> ${esc(T.rap.plea)}</div>
        <div class="rl sentence"><span class="k">SENTENCE:</span> ${esc(T.rap.sentence)}</div>
        <div class="record rl">
          <div><span>Time on the case</span><b>${fmtDur(r.ms)}</b></div>
          <div><span>Hints used</span><b>${r.pts}</b></div>
          <div><span>Wrong accusations</span><b>${r.wrong}</b></div>
          <div class="rk"><span>DETECTIVE RANK</span><b class="rank-stamp r-${r.rank}">${r.rank}</b></div>
        </div>
        <div class="row-btns rl"><button class="btn" id="close">Close the case</button></div>
      </div>
      <div class="tap-hint" id="tt">TAP TO SKIP</div>
    </section>`);
    const lines = [...document.querySelectorAll(".c-rap .rl")];
    lines.forEach(l => l.classList.add("hid"));
    let i = 0, tm = null, done = false;
    const sheet = document.querySelector(".c-rap .rap");
    const show = () => {
      if (i >= lines.length) { done = true; document.querySelector("#tt").hidden = true; return; }
      const l = lines[i++]; l.classList.remove("hid"); l.classList.add("in");
      if (l.classList.contains("record")) { setTimeout(() => sfx("stamp"), 500); }
      else sfx("type");
      l.scrollIntoView({ block: "nearest", behavior: "smooth" });
      tm = setTimeout(show, l.classList.contains("record") ? 1100 : 520);
    };
    App.onLeave(() => clearTimeout(tm));
    tm = setTimeout(show, 300);
    const skip = () => { if (done) return; clearTimeout(tm); lines.forEach(l => { l.classList.remove("hid"); l.classList.add("in"); }); i = lines.length; done = true; document.querySelector("#tt").hidden = true; };
    sheet.addEventListener("click", (e) => { if (!e.target.closest("button")) skip(); });
    document.querySelector("#tt").onclick = skip;
    document.querySelector("#close").onclick = ending;
  }

  function ending() {
    const c = cs();
    App.mount(`<section class="screen case c-end">
      <div class="folder-big px" id="fb">
        <div class="fb-tab">CASE NO. 30-01</div>
        <div class="fb-title">The Stolen Heart</div>
        <div class="stamp s1">CASE CLOSED</div>
        <div class="stamp s2">PROPERTY NOT<br>RECOVERED</div>
      </div>
      <div class="end-text" id="et" hidden>
        ${T.ending.map(t => `<p>${esc(t)}</p>`).join("")}
        <p class="pp-intro">When you're asked for the passphrase, you'll need this:</p>
        <div class="passphrase px sun">${T.passphrase}</div>
        <p class="pp-note">Don't write it down.</p>
        <div class="row-btns"><button class="btn small blue" data-a="hub">Back to games</button><button class="btn small ghost" data-a="again">Replay for rank</button></div>
      </div>
    </section>`);
    const timers = []; App.onLeave(() => timers.forEach(clearTimeout));
    const fb = document.querySelector("#fb");
    timers.push(setTimeout(() => { fb.classList.add("st1"); sfx("stamp"); }, 500));
    timers.push(setTimeout(() => { fb.classList.add("st2"); sfx("stamp"); }, 1500));
    timers.push(setTimeout(() => { document.querySelector("#et").hidden = false; App.Sound.chime(); }, 2400));
    document.querySelector('[data-a="hub"]').onclick = () => App.show("hub");
    document.querySelector('[data-a="again"]').onclick = replayConfirm;
  }

  function replayConfirm() {
    const m = App.modal(`<div class="kicker">REPLAY FOR RANK</div><h2>Reopen the case?</h2>
      <p class="how">A fresh run with a fresh clock. Same answers, so it's a speedrun. Your best rank stays.</p>
      <div class="row-btns"><button class="btn small ghost" data-close>Not now</button><button class="btn small" data-a="yes">Reopen</button></div>`, { dismiss: true });
    m.el.querySelector('[data-a="yes"]').onclick = () => { const c = cs(); c.run = newRun(); save(); m.close(); App.Sound.start(); open(); };
  }

  function closedScreen() {
    const c = cs();
    const { body } = shell("c-closed", "CASE 30-01", {});
    body.innerHTML = `
      <div class="folder-big px st1 st2 still">
        <div class="fb-tab">CASE NO. 30-01</div>
        <div class="fb-title">The Stolen Heart</div>
        <div class="stamp s1">CASE CLOSED</div>
      </div>
      <div class="closed-meta px">
        <div><span>Best rank</span><b class="rank-stamp r-${c.best}">${c.best || "-"}</b></div>
        <div><span>Fastest time</span><b>${c.bestMs != null ? fmtDur(c.bestMs) : "-"}</b></div>
        <div><span>Times solved</span><b>${c.runs || 1}</b></div>
      </div>
      <div class="row-btns"><button class="btn" data-a="again">Replay for rank</button><button class="btn small blue" data-a="hub">Back to games</button></div>`;
    body.querySelector('[data-a="again"]').onclick = replayConfirm;
    body.querySelector('[data-a="hub"]').onclick = () => App.show("hub");
  }

  const GAMES = {};
  function defineGame(k, fn) { GAMES[k] = fn; }

  return { available, tileHTML, wireTile, open, defineGame, FILES, _rank: rankOf, _cs: cs, _verdict: verdict, _board: board, _file: fileScreen, _acc: accusation, _ending: ending, _rap: rapSheet, fmtClock };
})();
