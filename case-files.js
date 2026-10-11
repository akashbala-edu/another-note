/* ============ Case No. 30-01: the six files ============ */
(function () {
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  /* an on-screen keyboard that also listens to a real one */
  function keyboard(onKey, opts = {}) {
    const rows = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];
    const el = document.createElement("div");
    el.className = "keyboard ck" + (opts.quad ? " quad" : "");
    el.innerHTML = rows.map((r, i) => `<div class="krow">${i === 2 && opts.enter ? '<button class="key wide" data-k="ENTER">Enter</button>' : ""}${[...r].map(c => `<button class="key" data-k="${c}">${opts.quad ? '<span class="q"><i></i><i></i><i></i><i></i></span>' : ""}<b>${c}</b></button>`).join("")}${i === 2 ? '<button class="key wide" data-k="BACK" aria-label="Delete">DEL</button>' : ""}</div>`).join("");
    el.addEventListener("click", (e) => { const b = e.target.closest("[data-k]"); if (b) onKey(b.dataset.k); });
    const kd = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey || document.querySelector(".modal-wrap")) return;
      const k = e.key;
      if (k === "Enter") onKey("ENTER"); else if (k === "Backspace") onKey("BACK");
      else if (/^[a-z]$/i.test(k)) onKey(k.toUpperCase());
      else if (opts.arrows && k.startsWith("Arrow")) onKey(k.toUpperCase());
      else return;
      e.preventDefault();
    };
    document.addEventListener("keydown", kd);
    return { el, off: () => document.removeEventListener("keydown", kd), key: (c) => el.querySelector(`[data-k="${c}"]`) };
  }

  /* ================= FILE 01 · Quordle ================= */
  let DICT = null;
  const dictP = fetch("words.txt").then(r => r.ok ? r.text() : "").then(t => {
    const s = new Set(); t = t.trim(); for (let i = 0; i + 5 <= t.length; i += 5) s.add(t.slice(i, i + 5).toUpperCase());
    if (s.size > 1000) DICT = s;
  }).catch(() => {});

  Case.defineGame("q", function (body, api) {
    const W = ["BENCH", "CHAIN", "DRUNK", "SOBER"], MAX = 9, st = api.st;
    st.g = st.g || []; st.rev = st.rev || [[], [], [], []]; st.kept = st.kept || [];
    let typed = "", done = false;
    const score = (g, a) => {
      const res = Array(5).fill("a"), cnt = {};
      for (let i = 0; i < 5; i++) { if (g[i] === a[i]) res[i] = "c"; else cnt[a[i]] = (cnt[a[i]] || 0) + 1; }
      for (let i = 0; i < 5; i++) if (res[i] !== "c" && cnt[g[i]] > 0) { res[i] = "p"; cnt[g[i]]--; }
      return res;
    };
    const isSolved = (b) => st.kept.includes(b) || st.g.includes(W[b]);
    const B = [0, 1, 2, 3];
    body.innerHTML = `<div class="qd-status" id="qs"></div><div class="qd-boards" id="qb">${B.map(b => `<div class="qd-board" data-b="${b}"></div>`).join("")}</div>`;
    const kb = keyboard(onKey, { enter: true, quad: true });
    body.appendChild(kb.el); api.onLeave(kb.off);

    function render(shakeRow) {
      const left = MAX - st.g.length;
      body.querySelector("#qs").innerHTML = `<span>${left} ${left === 1 ? "guess" : "guesses"} left</span><span class="hm">HARD MODE</span><span>${B.filter(isSolved).length}/4 found</span>`;
      B.forEach(b => {
        const el = body.querySelector(`[data-b="${b}"]`), kept = st.kept.includes(b), at = st.g.indexOf(W[b]);
        let html = "";
        for (let i = 0; i < MAX; i++) {
          let cells = null, cls = "";
          if (kept) { if (i === 0) cells = [...W[b]].map(ch => [ch, "c"]); }
          else if (at >= 0 ? i <= at : i < st.g.length) { const g = st.g[i], sc = score(g, W[b]); cells = [...g].map((ch, j) => [ch, sc[j]]); }
          else if (at < 0 && i === st.g.length) { cls = "cur" + (shakeRow ? " shake" : ""); cells = [0, 1, 2, 3, 4].map(j => typed[j] ? [typed[j], "t"] : (st.rev[b].includes(j) ? [W[b][j], "ghost"] : ["", ""])); }
          html += `<div class="qd-row ${cls}">${(cells || [["", ""], ["", ""], ["", ""], ["", ""], ["", ""]]).map(([ch, s]) => `<span class="qc ${s}">${ch}</span>`).join("")}</div>`;
        }
        el.className = "qd-board" + (isSolved(b) ? " done" : "");
        el.innerHTML = html;
      });
      for (const L of "ABCDEFGHIJKLMNOPQRSTUVWXYZ") {
        const k = kb.key(L); if (!k) continue;
        const qs = k.querySelectorAll(".q i");
        B.forEach(b => {
          let s = "";
          if (isSolved(b)) s = "x";
          else st.g.forEach(g => { const sc = score(g, W[b]); [...g].forEach((ch, j) => { if (ch !== L) return; const v = sc[j]; if (v === "c" || (v === "p" && s !== "c") || (v === "a" && !s)) s = v; }); });
          qs[b].className = s;
        });
      }
    }
    function hardOK(g) {
      if (!st.g.length) return true;
      return B.filter(b => !isSolved(b)).some(b => st.g.every(pg => {
        const sc = score(pg, W[b]), need = {};
        for (let i = 0; i < 5; i++) { if (sc[i] === "c" && g[i] !== pg[i]) return false; if (sc[i] !== "a") need[pg[i]] = (need[pg[i]] || 0) + 1; }
        for (const L in need) if ([...g].filter(x => x === L).length < need[L]) return false;
        return true;
      }));
    }
    const nope = (msg) => { App.toast(msg, 1800); render(true); };
    function onKey(k) {
      if (done) return;
      if (k === "BACK") typed = typed.slice(0, -1);
      else if (k === "ENTER") return submit();
      else if (/^[A-Z]$/.test(k) && typed.length < 5) typed += k;
      render();
    }
    function submit() {
      if (typed.length < 5) return nope("Five letters.");
      if (DICT && !DICT.has(typed) && !W.includes(typed)) return nope("Not in the word list.");
      if (!hardOK(typed)) return nope("Hard mode: use every hint from at least one unsolved board.");
      st.g.push(typed); typed = ""; api.save(); render();
      if (B.every(isSolved)) { done = true; return api.solved(); }
      if (st.g.length >= MAX) setTimeout(out, 500);
    }
    function reveal(b) {
      const free = [0, 1, 2, 3, 4].filter(j => !st.rev[b].includes(j));
      if (free.length > 1) st.rev[b].push(App.pick(free));
    }
    function out() {
      const m = App.modal(`<div class="kicker">OUT OF GUESSES</div><h2>Nine guesses and you're still here?</h2>
        <p class="how">The boards reset with one more letter of each word shown. Words you found stay found. It counts as a hint.</p>
        <div class="row-btns"><button class="btn" data-a="go">Reset the boards</button></div>`);
      m.el.querySelector('[data-a="go"]').onclick = () => {
        st.kept = B.filter(isSolved); st.g = []; B.filter(b => !isSolved(b)).forEach(reveal);
        api.penalty(); api.save(); m.close(); render();
      };
    }
    render();
    if (st.g.length >= MAX && !B.every(isSolved)) out();
    return { hint() { B.filter(b => !isSolved(b)).forEach(reveal); api.save(); render(); App.toast("One letter of each word is showing in your next row."); } };
  });

  /* ================= FILE 02 · Connections ================= */
  Case.defineGame("c", function (body, api) {
    const G = [
      { name: "Colours of the case", c: "y", w: ["PINK", "MAROON", "YELLOW", "BLUE"] },
      { name: "Campus spots, first word only", c: "g", w: ["D", "G", "ACAD", "LAKE"] },
      { name: "Add LOVE", c: "b", w: ["CRAZY STUPID", "HYPOTHESIS", "BITES", "LETTER"] },
      { name: "___er? I barely know her", c: "p", w: ["SWEATER", "STUTTER", "SOBER", "LOVER"] }
    ];
    const st = api.st;
    if (!st.order) { st.order = App.shuffle(G.flatMap(g => g.w)); st.solved = []; st.mis = 0; st.tried = []; st.resets = 0; }
    let sel = [], done = false, fresh = null; // fresh = the group that just got solved (only it animates)
    body.innerHTML = `<div class="cn-hint" id="ch" hidden></div><div class="cn-grid" id="cg"></div>
      <div class="cn-mis" id="cm"></div>
      <div class="row-btns cn-btns"><button class="btn small ghost" data-a="shuf">Shuffle</button><button class="btn small ghost" data-a="clr">Deselect</button><button class="btn small" data-a="sub">Submit</button></div>`;
    const grid = body.querySelector("#cg");
    function render() {
      const solvedW = new Set(st.solved.flatMap(i => G[i].w));
      grid.innerHTML = st.solved.map(i => `<div class="cn-solved g-${G[i].c} ${i === fresh ? "new" : ""}"><b>${esc(G[i].name.toUpperCase())}</b><span>${G[i].w.join(", ")}</span></div>`).join("") +
        st.order.filter(w => !solvedW.has(w)).map(w => `<button class="cn-t ${sel.includes(w) ? "on" : ""} ${w.length > 9 ? "xs" : w.length > 6 ? "sm" : ""}" data-w="${w}">${w}</button>`).join("");
      body.querySelector("#cm").innerHTML = `Mistakes left <span>${[0, 1, 2, 3].map(i => `<i class="${i < 4 - st.mis ? "on" : ""}"></i>`).join("")}</span>`;
      const h = body.querySelector("#ch");
      if (st.hintG != null && !st.solved.includes(st.hintG)) { h.hidden = false; h.textContent = `Hint: one group is "${G[st.hintG].name}"`; } else h.hidden = true;
      body.querySelector('[data-a="sub"]').disabled = sel.length !== 4;
      grid.querySelectorAll(".cn-t").forEach(b => b.onclick = () => {
        if (done) return;
        const w = b.dataset.w;
        if (sel.includes(w)) sel = sel.filter(x => x !== w); else if (sel.length < 4) sel.push(w);
        render();
      });
    }
    body.querySelector('[data-a="shuf"]').onclick = () => { st.order = App.shuffle(st.order); api.save(); render(); };
    body.querySelector('[data-a="clr"]').onclick = () => { sel = []; render(); };
    body.querySelector('[data-a="sub"]').onclick = () => {
      if (sel.length !== 4 || done) return;
      const key = [...sel].sort().join("|");
      if (st.tried.includes(key)) { App.toast("Already guessed.", 1500); return; }
      const gi = G.findIndex((g, i) => !st.solved.includes(i) && sel.every(w => g.w.includes(w)));
      if (gi >= 0) {
        st.solved.push(gi); sel = []; api.save(); App.Sound.soft(); fresh = gi; render(); fresh = null;
        if (st.solved.length === 4) { done = true; api.solved(); }
        return;
      }
      st.tried.push(key);
      const best = Math.max(...G.map((g, i) => st.solved.includes(i) ? 0 : sel.filter(w => g.w.includes(w)).length));
      st.mis++; api.save(); api.sfx("wrong");
      grid.querySelectorAll(".cn-t.on").forEach(b => b.classList.add("shake"));
      if (st.mis >= 4) {
        App.toast("Four mistakes. The board reshuffles.", 2200);
        setTimeout(() => { st.mis = 0; st.resets++; st.order = App.shuffle(st.order); sel = []; api.penalty(); api.save(); render(); }, 900);
      } else { App.toast(best === 3 ? "One away..." : "Not quite.", 1500); setTimeout(render, 450); }
    };
    render();
    return { hint() { st.hintG = [0, 1, 2, 3].find(i => !st.solved.includes(i)); api.save(); render(); } };
  });

  /* ================= FILE 03 · Crossword ================= */
  Case.defineGame("x", function (body, api) {
    const X = window.CASE_DATA.cross, Wd = X.w, Ht = X.h, st = api.st;
    const sol = {}, at = {}, nums = {};
    const cellsOf = (i) => { const w = X.words[i]; return [...w.a].map((_, j) => `${w.r + (w.d === "D" ? j : 0)},${w.c + (w.d === "A" ? j : 0)}`); };
    X.words.forEach((w, i) => { cellsOf(i).forEach((k, j) => { sol[k] = w.a[j]; (at[k] = at[k] || {})[w.d] = i; }); nums[`${w.r},${w.c}`] = w.n; });
    const shade = new Set(X.shaded.map(([r, c]) => `${r},${c}`));
    const LIST = X.words.map((_, i) => i).sort((a, b) => X.words[a].d === X.words[b].d ? X.words[a].n - X.words[b].n : (X.words[a].d === "A" ? -1 : 1));
    const JUMBLE = ["S", "R", "O", "E", "T", "W"], TARGET = "TOWERS";
    st.L = st.L || {}; st.phase = st.phase || 1; st.slots = st.slots || []; st.lockN = st.lockN || 0;
    let curK = cellsOf(LIST[0])[0], dir = X.words[LIST[0]].d, warned = false, done = false;
    const wordIdx = () => at[curK][dir] != null ? at[curK][dir] : at[curK][dir === "A" ? "D" : "A"];

    body.innerHTML = `<div class="xw-area"><div class="xw-grid" id="xg" style="--w:${Wd};--h:${Ht}"></div></div><div class="xw-clue" id="xc"></div><div id="xbot"></div>`;
    const xg = body.querySelector("#xg"), bot = body.querySelector("#xbot");
    let kb = null;

    function renderGrid() {
      const wi = wordIdx(), inW = new Set(st.phase === 1 ? cellsOf(wi) : []);
      let h = "";
      for (let r = 0; r < Ht; r++) for (let c = 0; c < Wd; c++) {
        const k = `${r},${c}`;
        if (!sol[k]) { h += `<div class="xe"></div>`; continue; }
        h += `<div class="xc ${shade.has(k) ? "sh" : ""} ${inW.has(k) ? "hl" : ""} ${st.phase === 1 && k === curK ? "cur" : ""} ${st.phase === 2 ? "fin" : ""}" data-k="${k}">${nums[k] ? `<i>${nums[k]}</i>` : ""}<b>${st.L[k] || ""}</b></div>`;
      }
      xg.innerHTML = h;
      const w = X.words[wi];
      body.querySelector("#xc").innerHTML = st.phase === 1
        ? `<button class="xn" data-a="prev" aria-label="Previous clue">&lsaquo;</button><button class="xt" data-a="list"><b>${w.n}${w.d === "A" ? " ACROSS" : " DOWN"}</b><span>${esc(w.clue)}</span></button><button class="xn" data-a="next" aria-label="Next clue">&rsaquo;</button>`
        : `<div class="xt done"><b>GRID COMPLETE</b><span>Six shaded squares. Six letters.</span></div>`;
      if (st.phase === 1) {
        body.querySelector('[data-a="prev"]').onclick = () => jump(-1);
        body.querySelector('[data-a="next"]').onclick = () => jump(1);
        body.querySelector('[data-a="list"]').onclick = clueList;
        xg.querySelectorAll(".xc").forEach(el => el.onclick = () => {
          const k = el.dataset.k;
          if (k === curK && at[k].A != null && at[k].D != null) dir = dir === "A" ? "D" : "A";
          else { curK = k; if (at[k][dir] == null) dir = dir === "A" ? "D" : "A"; }
          renderGrid();
        });
      }
    }
    function jump(d) {
      const p = LIST.indexOf(wordIdx()), i = LIST[(p + d + LIST.length) % LIST.length], cells = cellsOf(i);
      curK = cells.find(k => !st.L[k]) || cells[0]; dir = X.words[i].d; renderGrid();
    }
    function clueList() {
      const sec = (d) => LIST.filter(i => X.words[i].d === d).map(i => `<button class="xl ${cellsOf(i).every(k => st.L[k]) ? "filled" : ""}" data-i="${i}"><b>${X.words[i].n}</b> ${esc(X.words[i].clue)} <em>(${X.words[i].a.length})</em></button>`).join("");
      const m = App.modal(`<div class="kicker">CLUES</div><div class="xl-wrap"><div class="xl-h">ACROSS</div>${sec("A")}<div class="xl-h">DOWN</div>${sec("D")}</div>
        <div class="row-btns"><button class="btn small" data-close>Back to the grid</button></div>`, { dismiss: true, closable: true });
      m.el.querySelectorAll(".xl").forEach(b => b.onclick = () => { const i = +b.dataset.i, cells = cellsOf(i); curK = cells.find(k => !st.L[k]) || cells[0]; dir = X.words[i].d; m.close(); renderGrid(); });
    }
    function onKey(k) {
      if (st.phase !== 1 || done) return;
      const cells = cellsOf(wordIdx()), p = cells.indexOf(curK);
      if (k === "BACK") {
        if (st.L[curK]) delete st.L[curK];
        else if (p > 0) { curK = cells[p - 1]; delete st.L[curK]; }
      } else if (k.startsWith("ARROW")) {
        const [r, c] = curK.split(",").map(Number), d = { ARROWUP: [-1, 0], ARROWDOWN: [1, 0], ARROWLEFT: [0, -1], ARROWRIGHT: [0, 1] }[k];
        if (!d) return;
        let rr = r + d[0], cc = c + d[1];
        while (rr >= 0 && rr < Ht && cc >= 0 && cc < Wd && !sol[`${rr},${cc}`]) { rr += d[0]; cc += d[1]; }
        if (sol[`${rr},${cc}`]) { curK = `${rr},${cc}`; const nd = d[0] ? "D" : "A"; if (at[curK][nd] != null) dir = nd; else if (at[curK][dir] == null) dir = dir === "A" ? "D" : "A"; }
      } else if (/^[A-Z]$/.test(k)) {
        st.L[curK] = k;
        if (p < cells.length - 1) curK = cells[p + 1];
      } else return;
      api.save(); renderGrid(); check();
    }
    function check() {
      const keys = Object.keys(sol);
      if (!keys.every(k => st.L[k])) { warned = false; return; }
      if (keys.every(k => st.L[k] === sol[k])) {
        st.phase = 2; api.save(); App.Sound.soft();
        setTimeout(() => { renderGrid(); renderBottom(); }, 450);
      } else if (!warned) { warned = true; App.toast("The grid's full, but something's off.", 2200); }
    }
    function renderBottom() {
      if (st.phase === 1) {
        if (!kb) { kb = keyboard(onKey, { arrows: true }); api.onLeave(kb.off); }
        bot.innerHTML = ""; bot.appendChild(kb.el); return;
      }
      if (kb) { kb.off(); kb = null; }
      const used = new Set(st.slots);
      bot.innerHTML = `<div class="xj px light">
          <p>The shaded squares dropped these. Put them in order.</p>
          <div class="xj-slots" id="xs">${[0, 1, 2, 3, 4, 5].map(i => `<button class="xj-s ${i < st.lockN ? "lock" : ""}" data-s="${i}">${st.slots[i] != null ? JUMBLE[st.slots[i]] : ""}</button>`).join("")}</div>
          <div class="xj-tiles">${JUMBLE.map((L, i) => `<button class="xj-t" data-t="${i}" ${used.has(i) ? "disabled" : ""}>${L}</button>`).join("")}</div>
        </div>`;
      bot.querySelectorAll(".xj-t").forEach(b => b.onclick = () => {
        if (done || st.slots.length >= 6) return;
        st.slots.push(+b.dataset.t); api.save(); renderBottom();
        if (st.slots.length === 6) {
          if (st.slots.map(i => JUMBLE[i]).join("") === TARGET) { done = true; api.solved(); }
          else {
            api.sfx("wrong"); bot.querySelector("#xs").classList.add("shake"); App.toast("Not quite.", 1400);
            setTimeout(() => { st.slots = st.slots.slice(0, st.lockN); api.save(); renderBottom(); }, 700);
          }
        }
      });
      bot.querySelectorAll(".xj-s").forEach(b => b.onclick = () => {
        const i = +b.dataset.s; if (done || i < st.lockN || st.slots[i] == null) return;
        st.slots.splice(i, 1); api.save(); renderBottom();
      });
    }
    renderGrid(); renderBottom();
    return {
      hint() {
        if (st.phase === 1) {
          const wi = wordIdx(); cellsOf(wi).forEach(k => st.L[k] = sol[k]); api.save(); renderGrid(); check();
        } else {
          st.slots = [JUMBLE.indexOf("T"), JUMBLE.indexOf("O")]; st.lockN = 2; api.save(); renderBottom();
        }
      }
    };
  });

  /* ================= FILE 04 · Zip ================= */
  Case.defineGame("z", function (body, api) {
    const Z = window.CASE_DATA.zip, N = Z.n, NC = N * N, st = api.st;
    const dots = {}, letters = {};
    Object.keys(Z.dots).forEach(k => dots[+k] = Z.dots[k]);
    Object.keys(Z.letters).forEach(k => letters[+k] = Z.letters[k]);
    const K = Math.max(...Object.values(dots)), NL = Object.keys(letters).length;
    const walls = new Set(Z.walls.map(([a, b]) => a + "-" + b));
    const wall = (a, b) => walls.has(Math.min(a, b) + "-" + Math.max(a, b));
    st.p = st.p || [];
    let done = false, dragging = false;

    body.innerHTML = `<div class="zp-letters" id="zl"></div>
      <div class="board-wrap zp-wrap"><div class="zp-board" id="zb" style="--n:${N}">
        ${[...Array(NC).keys()].map(c => {
          const r = Math.floor(c / N), k = c % N;
          const cls = [(k < N - 1 && wall(c, c + 1)) ? "wr" : "", (r < N - 1 && wall(c, c + N)) ? "wb" : ""].join(" ");
          return `<div class="zc ${cls}" data-c="${c}">${dots[c] ? `<span class="zd">${dots[c]}</span>` : letters[c] ? `<span class="zl">${letters[c]}</span>` : ""}</div>`;
        }).join("")}
        <svg class="zp-line" viewBox="0 0 ${N} ${N}" aria-hidden="true"><polyline id="zpl" points=""/></svg>
      </div></div>
      <div class="row-btns"><button class="btn small ghost" data-a="undo">Undo</button><button class="btn small ghost" data-a="clr">Clear</button></div>`;
    const zb = body.querySelector("#zb"), cellsEl = [...zb.querySelectorAll(".zc")];
    const nextNum = () => 1 + st.p.filter(c => dots[c]).length;
    const rc = (c) => [Math.floor(c / N), c % N];
    function canStep(a, b) {
      const [ar, ac] = rc(a), [br, bc] = rc(b);
      if (Math.abs(ar - br) + Math.abs(ac - bc) !== 1 || wall(a, b) || st.p.includes(b)) return false;
      if (dots[b] && dots[b] !== nextNum()) return false;
      return true;
    }
    function render() {
      const on = new Set(st.p);
      cellsEl.forEach((el, c) => { el.classList.toggle("on", on.has(c)); el.classList.toggle("end", c === st.p[st.p.length - 1]); });
      body.querySelector("#zpl").setAttribute("points", st.p.map(c => `${c % N + .5},${Math.floor(c / N) + .5}`).join(" "));
      const got = st.p.filter(c => letters[c]).map(c => letters[c]);
      const full = done || (st.p.length === NC && dots[st.p[NC - 1]] === K);
      body.querySelector("#zl").innerHTML = full
        ? `<div class="zl-done">LAST WEEK OF APRIL</div>`
        : [...Array(NL).keys()].map(i => `<span class="${got[i] ? "f" : ""}">${got[i] || ""}</span>`).join("");
    }
    function check() {
      if (st.p.length === NC && dots[st.p[NC - 1]] === K && !done) { done = true; render(); api.solved(); }
    }
    function tryMove(c) {
      const end = st.p[st.p.length - 1]; if (end == null) return;
      if (st.p.length > 1 && c === st.p[st.p.length - 2]) { st.p.pop(); return; }
      const i = st.p.indexOf(c); if (i >= 0) { st.p = st.p.slice(0, i + 1); return; }
      const [er, ec] = rc(end), [tr, tc] = rc(c);
      if (er !== tr && ec !== tc) return;
      let cur = end;
      while (cur !== c) {
        const [r, k] = rc(cur), nx = r === tr ? cur + Math.sign(tc - k) : cur + N * Math.sign(tr - r);
        if (!canStep(cur, nx)) break;
        st.p.push(nx); cur = nx;
      }
    }
    const cellAt = (e) => {
      const r = zb.getBoundingClientRect(), x = Math.floor((e.clientX - r.left) / r.width * N), y = Math.floor((e.clientY - r.top) / r.height * N);
      return x < 0 || y < 0 || x >= N || y >= N ? -1 : y * N + x;
    };
    zb.addEventListener("pointerdown", (e) => {
      if (done) return;
      const c = cellAt(e); if (c < 0) return;
      e.preventDefault(); dragging = true; try { zb.setPointerCapture(e.pointerId); } catch (x) {}
      if (!st.p.length) { if (dots[c] === 1) st.p = [c]; else { App.toast("Start at 1.", 1200); dragging = false; } }
      else { const i = st.p.indexOf(c); if (i >= 0) st.p = st.p.slice(0, i + 1); else tryMove(c); }
      render();
    });
    zb.addEventListener("pointermove", (e) => {
      if (!dragging || done) return;
      const c = cellAt(e); if (c < 0 || c === st.p[st.p.length - 1]) return;
      tryMove(c); render();
    });
    const up = () => { if (!dragging) return; dragging = false; api.save(); check(); };
    zb.addEventListener("pointerup", up); zb.addEventListener("pointercancel", up);
    body.querySelector('[data-a="undo"]').onclick = () => { if (done) return; st.p.pop(); api.save(); render(); };
    body.querySelector('[data-a="clr"]').onclick = () => { if (done) return; st.p = []; api.save(); render(); };
    render();
    return {
      hint() {
        const c4 = +Object.keys(dots).find(c => dots[c] === 4);
        st.p = Z.path.slice(0, Z.path.indexOf(c4) + 1); api.save(); render();
      }
    };
  });

  /* ================= FILE 05 · Olive's statement (cryptogram) ================= */
  Case.defineGame("o", function (body, api) {
    const PARAS = [
      "WITNESS: OLIVE.",
      "I'm at her home. She's at college. She hasn't slept next to me in months.",
      "But you don't share a pillow with someone for that many years without learning to hear her from far away.",
      "One night in the last week of April, her thoughts got so loud I couldn't sleep.",
      "She was smiling. She was nervous. She kept saying the same thing, like she was practising it.",
      "I don't care how long it is. I just want to spend it with you.",
      "I'm a stuffed toy. I didn't ask who. I think I already know."
    ].map(s => s.toUpperCase());
    const st = api.st, A = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
    if (!st.key) {
      let b; do { b = App.shuffle(A.slice()); } while (b.some((x, i) => x === A[i]));
      st.key = {}; A.forEach((a, i) => st.key[a] = b[i]); st.g = {}; st.lock = [];
    }
    const plainOf = {}; Object.keys(st.key).forEach(p => plainOf[st.key[p]] = p);
    // the first line (WITNESS: OLIVE.) comes already cracked
    [..."WITNESOLV"].forEach(p => { const k = st.key[p]; Object.keys(st.g).forEach(c => { if (st.g[c] === p && c !== k) delete st.g[c]; }); st.g[k] = p; if (!st.lock.includes(k)) st.lock.push(k); });
    api.save();
    const ORDER = []; PARAS.join(" ").split("").forEach(ch => { if (/[A-Z]/.test(ch)) { const k = st.key[ch]; if (!ORDER.includes(k)) ORDER.push(k); } });
    let sel = ORDER.find(k => !st.g[k]) || ORDER[0], warned = false, done = false;

    body.innerHTML = `<div class="cg-text px light" id="ct"></div><div class="cg-bar" id="cb"></div>`;
    const kb = keyboard(onKey); body.appendChild(kb.el); api.onLeave(kb.off);
    const ct = body.querySelector("#ct");
    const cipherWord = (w) => [...w].map(ch => /[A-Z]/.test(ch) ? { k: st.key[ch] } : { p: ch });
    const MODEL = PARAS.map(p => p.split(" ").map(cipherWord));
    function render() {
      ct.innerHTML = MODEL.map(par => `<p>${par.map(w => `<span class="cg-w">${w.map(x => x.k
        ? `<span class="cg-c ${x.k === sel ? "sel" : ""} ${st.lock.includes(x.k) ? "lock" : ""} ${st.g[x.k] ? "set" : ""} ${st.g[x.k] && st.g[x.k] !== plainOf[x.k] ? "bad" : ""}" data-k="${x.k}"><b>${st.g[x.k] || ""}</b><i>${x.k}</i></span>`
        : `<span class="cg-p">${esc(x.p)}</span>`).join("")}</span>`).join(" ")}</p>`).join("");
      const set = ORDER.filter(k => st.g[k]).length;
      body.querySelector("#cb").innerHTML = `<span>Code letter <b>${sel}</b> = <b class="g">${st.g[sel] || "?"}</b></span><span>${set}/${ORDER.length} decoded</span>`;
      const used = new Set(Object.values(st.g));
      A.forEach(L => { const k = kb.key(L); if (k) k.classList.toggle("used", used.has(L)); });
    }
    ct.addEventListener("click", (e) => { const c = e.target.closest(".cg-c"); if (!c || done) return; sel = c.dataset.k; render(); });
    function onKey(k) {
      if (done) return;
      if (k === "BACK") { if (!st.lock.includes(sel)) delete st.g[sel]; }
      else if (/^[A-Z]$/.test(k)) {
        if (st.lock.includes(sel)) return;
        Object.keys(st.g).forEach(c => { if (st.g[c] === k && c !== sel && !st.lock.includes(c)) delete st.g[c]; });
        if (Object.keys(st.g).some(c => st.g[c] === k && st.lock.includes(c))) { App.toast("That letter's already decoded.", 1400); return; }
        st.g[sel] = k;
        const p = ORDER.indexOf(sel);
        const nx = ORDER.slice(p + 1).concat(ORDER.slice(0, p)).find(c => !st.g[c]);
        if (nx) sel = nx;
      } else return;
      api.save(); render(); check();
    }
    function check() {
      if (!ORDER.every(k => st.g[k])) { warned = false; return; }
      if (ORDER.every(k => st.g[k] === plainOf[k])) { done = true; render(); api.solved(); }
      else if (!warned) { warned = true; App.toast("Every letter's filled, but that's not what Olive heard.", 2400); }
    }
    render(); check();
    return {
      hint() {
        const todo = App.shuffle(ORDER.filter(k => st.g[k] !== plainOf[k])).slice(0, 3);
        todo.forEach(k => {
          const p = plainOf[k];
          Object.keys(st.g).forEach(c => { if (st.g[c] === p) delete st.g[c]; });
          st.g[k] = p; st.lock.push(k);
        });
        api.save(); render(); check();
      }
    };
  });

  /* ================= FILE 06 · The victim's diary ================= */
  Case.defineGame("d", function (body, api) {
    const TEXT = "A young boy finishing up his class saw his friend at some stall in D Block. He approached his friend to catch up. Then he heard a [1] that stole his whole attention. A beautiful girl looks at him, her stunning eyes mesmerising the boy. Her [2], putting a hole right through his heart, and her [3] mending that same hole. She [4] looking into his eyes. He smiled, knowing what went through her mind. The girl, wanting nothing but the time to [5]. The boy, wanting nothing but the time to [6]. Their voices saying goodbye, their eyes saying [7]. He walks out the door, his voice whispers to his mind, \"[8]...\"";
    const ANS = ["hii", "smile", "voice", "stuttered", "slow", "stop", "hello", "arushi"];
    const DEC = ["hello", "laugh", "eyes", "blushed", "end", "honey"];
    const st = api.st;
    if (!st.chips) { st.chips = App.shuffle(ANS.concat(DEC)); st.place = {}; st.lock = []; }
    let selC = null, selB = null, done = false;
    const parts = TEXT.split(/\[(\d)\]/);
    body.innerHTML = `<div class="dy-text px light" id="dt"></div><div class="dy-bank" id="db"></div>
      <div class="row-btns"><button class="btn" data-a="check">Check</button></div>`;
    const placedChips = () => new Set(Object.values(st.place));
    function render() {
      const pc = placedChips();
      body.querySelector("#dt").innerHTML = `<div class="dy-head">DIARY · JAN 30</div><p>` + parts.map((p, i) => {
        if (i % 2 === 0) return esc(p);
        const b = +p - 1, j = st.place[b];
        return `<button class="dy-b ${j != null ? "f" : ""} ${selB === b ? "sel" : ""} ${st.lock.includes(b) ? "lock" : ""}" data-b="${b}">${j != null ? esc(st.chips[j]) : b + 1}</button>`;
      }).join("") + `</p>`;
      body.querySelector("#db").innerHTML = st.chips.map((w, j) => pc.has(j) ? "" : `<button class="dy-c ${selC === j ? "sel" : ""}" data-c="${j}">${esc(w)}</button>`).join("");
      const n = Object.keys(st.place).length, btn = body.querySelector('[data-a="check"]');
      btn.textContent = `Check (${n}/8)`; btn.disabled = n < 8;
      body.querySelectorAll(".dy-b").forEach(el => el.onclick = () => {
        if (done) return; const b = +el.dataset.b; if (st.lock.includes(b)) return;
        if (st.place[b] != null) {
          if (selC != null) { st.place[b] = selC; selC = null; } else { delete st.place[b]; selB = b; }
          api.save(); return render();
        }
        if (selC != null) { st.place[b] = selC; selC = null; selB = null; api.save(); return render(); }
        selB = selB === b ? null : b; render();
      });
      body.querySelectorAll(".dy-c").forEach(el => el.onclick = () => {
        if (done) return; const j = +el.dataset.c;
        if (selB != null) { st.place[selB] = j; selB = null; selC = null; api.save(); return render(); }
        selC = selC === j ? null : j; render();
      });
    }
    body.querySelector('[data-a="check"]').onclick = () => {
      if (done || Object.keys(st.place).length < 8) return;
      const right = ANS.filter((a, i) => st.chips[st.place[i]] === a).length;
      if (right === 8) { done = true; api.solved(); return; }
      api.sfx("wrong"); App.toast(`${right} of 8 right.`, 1800);
    };
    render();
    return {
      hint() {
        const todo = App.shuffle([...Array(8).keys()].filter(i => st.chips[st.place[i]] !== ANS[i])).slice(0, 2);
        todo.forEach(i => {
          const correctSpots = new Set([...Array(8).keys()].filter(b => st.chips[st.place[b]] === ANS[b]).map(b => st.place[b]));
          const j = st.chips.findIndex((w, x) => w === ANS[i] && !correctSpots.has(x));
          Object.keys(st.place).forEach(b => { if (st.place[b] === j) delete st.place[b]; });
          st.place[i] = j; st.lock.push(i);
        });
        selB = selC = null; api.save(); render();
      }
    };
  });
})();
