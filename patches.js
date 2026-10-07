/* ============ Patches ============ */
(function () {
  const C = window.CONTENT;
  const PAL = ["#ffb3c7", "#96beff", "#ffe98a", "#b3dfa0", "#bba3e2", "#ffc992", "#9fd8e0", "#f2b8d6", "#c9e88f", "#ff9e8a", "#a6b8ff", "#e3c6a8", "#d5f0a8", "#c7c0f0", "#ffd0a8", "#a8e6cf"];
  const ICON = {
    square: '<svg viewBox="0 0 10 10"><rect x="1.5" y="1.5" width="7" height="7" fill="none" stroke="#1a1a2e" stroke-width="1.6"/></svg>',
    tall: '<svg viewBox="0 0 10 10"><rect x="3" y="0.8" width="4" height="8.4" fill="none" stroke="#1a1a2e" stroke-width="1.6"/></svg>',
    wide: '<svg viewBox="0 0 10 10"><rect x="0.8" y="3" width="8.4" height="4" fill="none" stroke="#1a1a2e" stroke-width="1.6"/></svg>',
    any: ""
  };
  const HEARTS = {
    6: ["##..##", "######", "######", "######", ".####.", "..##.."],
    7: [".##.##.", "#######", "#######", ".#####.", ".#####.", "..###..", "...#..."]
  };
  const shapeOf = (w, h) => w === h ? "square" : (h > w ? "tall" : "wide");

  App.register("patches", function (body, root) {
    const S = App.Store.data;
    const idx = App.pickIndex("patches", PATCHES.length, S.ptSolved);
    const P = PATCHES[idx], R = P.rows, Cn = P.cols;
    const clues = P.clues.map(([r, c, a, s], k) => ({ r, c, a, s, color: PAL[k % PAL.length] }));
    const clueAt = {}; clues.forEach((q, k) => clueAt[q.r * Cn + q.c] = k);
    let patches = []; // {r,c,w,h}
    const undo = [];
    let over = false;
    const timer = App.makeTimer(root.querySelector(".timer"));
    App.onLeave(() => timer.kill());

    body.innerHTML = `
      <div class="board-wrap"><div class="board" id="bd" style="grid-template-columns:repeat(${Cn},1fr);grid-template-rows:repeat(${R},1fr);background:#d7d9e6"></div></div>
      <div class="row-btns">
        <button class="btn small ghost" data-a="undo">Undo</button>
        <button class="btn small ghost" data-a="hint">Hint</button>
        <button class="btn small ghost" data-a="clear">Clear</button>
      </div>`;
    const bd = body.querySelector("#bd");
    const cells = [];
    for (let r = 0; r < R; r++) for (let c = 0; c < Cn; c++) {
      const d = document.createElement("div");
      d.className = "pt-cell"; d.dataset.i = r * Cn + c;
      d.style.gridRow = r + 1; d.style.gridColumn = c + 1;
      const k = clueAt[r * Cn + c];
      if (k != null) d.innerHTML = `<div class="pt-clue">${clues[k].a}<span class="ico">${ICON[clues[k].s]}</span></div>`;
      bd.appendChild(d); cells.push(d);
    }
    const layer = []; // patch elements
    const draft = document.createElement("div"); draft.className = "pt-draft"; draft.hidden = true; bd.appendChild(draft);

    const inside = (p, r, c) => r >= p.r && r < p.r + p.h && c >= p.c && c < p.c + p.w;
    const overlap = (a, b) => a.r < b.r + b.h && b.r < a.r + a.h && a.c < b.c + b.w && b.c < a.c + a.w;
    function cluesIn(p) { return clues.map((q, k) => k).filter(k => inside(p, clues[k].r, clues[k].c)); }
    function valid(p) {
      const ks = cluesIn(p); if (ks.length !== 1) return false;
      const q = clues[ks[0]];
      return p.w * p.h === q.a && (q.s === "any" || shapeOf(p.w, p.h) === q.s);
    }
    function place(el, p) { el.style.gridRow = `${p.r + 1} / span ${p.h}`; el.style.gridColumn = `${p.c + 1} / span ${p.w}`; }

    function paint() {
      layer.forEach(e => e.remove()); layer.length = 0;
      patches.forEach(p => {
        const e = document.createElement("div"); e.className = "pt-patch"; place(e, p);
        const ks = cluesIn(p);
        e.style.background = ks.length === 1 ? clues[ks[0]].color : "#c9ccd8";
        if (!valid(p)) e.classList.add("bad");
        bd.appendChild(e); layer.push(e);
      });
      const covered = patches.reduce((s, p) => s + p.w * p.h, 0);
      if (!over && covered === R * Cn && patches.every(valid)) won();
    }
    const snapshot = () => { undo.push(patches.map(p => ({ ...p }))); if (undo.length > 200) undo.shift(); };

    // ---- pointer: drag to draw, tap to remove ----
    let a = null, b = null;
    const cellAt = (e) => { const el = document.elementFromPoint(e.clientX, e.clientY); const c = el && el.closest(".pt-cell"); return c && bd.contains(c) ? +c.dataset.i : null; };
    const rectOf = (i, j) => {
      const r1 = (i / Cn) | 0, c1 = i % Cn, r2 = (j / Cn) | 0, c2 = j % Cn;
      return { r: Math.min(r1, r2), c: Math.min(c1, c2), w: Math.abs(c1 - c2) + 1, h: Math.abs(r1 - r2) + 1 };
    };
    bd.addEventListener("pointerdown", (e) => {
      if (over) return;
      const i = cellAt(e); if (i == null) return;
      e.preventDefault(); timer.start();
      a = b = i;
      try { bd.setPointerCapture(e.pointerId); } catch (_) {}
    });
    bd.addEventListener("pointermove", (e) => {
      if (a == null || over) return;
      const i = cellAt(e); if (i == null || i === b) return;
      b = i; draft.hidden = false; place(draft, rectOf(a, b));
    });
    bd.addEventListener("pointerup", () => {
      if (a == null) return;
      draft.hidden = true;
      const rect = rectOf(a, b), tap = a === b; a = b = null;
      if (over) return;
      if (tap) {
        const hit = patches.findIndex(p => inside(p, rect.r, rect.c));
        if (hit >= 0) { snapshot(); patches.splice(hit, 1); return paint(); }
        const k = clueAt[rect.r * Cn + rect.c];
        if (k == null || clues[k].a !== 1) return; // a single tap only draws a 1-square patch on a "1"
      }
      snapshot();
      patches = patches.filter(p => !overlap(p, rect));
      patches.push(rect); paint();
    });
    bd.addEventListener("pointercancel", () => { a = b = null; draft.hidden = true; });

    body.querySelector('[data-a="undo"]').onclick = () => { if (over || !undo.length) return; patches = undo.pop(); paint(); };
    body.querySelector('[data-a="clear"]').onclick = () => { if (over) return; snapshot(); patches = []; paint(); };
    body.querySelector('[data-a="hint"]').onclick = () => {
      if (over) return; timer.start(); App.Sound.soft();
      const sol = P.solution.map(([r, c, w, h]) => ({ r, c, w, h }));
      const same = (x, y) => x.r === y.r && x.c === y.c && x.w === y.w && x.h === y.h;
      const wrong = patches.findIndex(p => !sol.some(s => same(s, p)));
      if (wrong >= 0) { snapshot(); patches.splice(wrong, 1); paint(); return App.toast("That rectangle wasn't right", 1800); }
      const next = sol.find(s => !patches.some(p => same(p, s)));
      if (next) { snapshot(); patches = patches.filter(p => !overlap(p, next)); patches.push(next); paint(); }
    };

    function won() {
      over = true;
      const time = timer.stop();
      const first = App.win("patches");
      if (!S.ptSolved.includes(idx)) { S.ptSolved.push(idx); App.Store.save(); }
      // reveal: patches fade, the grid becomes a yellow pixel heart on royal blue
      const mask = HEARTS[R] || HEARTS[7];
      setTimeout(() => {
        bd.classList.add("pixelheart");
        cells.forEach((d, i) => {
          const r = (i / Cn) | 0, c = i % Cn;
          d.classList.add("px-on");
          setTimeout(() => {
            d.style.background = mask[r] && mask[r][c] === "#" ? "#ffd60a" : "#1f3fbf";
            d.style.borderColor = mask[r] && mask[r][c] === "#" ? "#e6b800" : "#1a3399";
          }, (r + c) * 70);
        });
      }, 500);
      setTimeout(() => {
        const m = App.modal(`
          <div class="kicker">${first ? "PATCHES CONQUERED" : "SOLVED"}</div>
          <div class="line big">${C.patchesWin}</div>
          <div class="stat">Time ${time}<br>${S.ptSolved.length} of ${PATCHES.length} solved</div>
          <div class="row-btns">
            <button class="btn small" data-a="again">Another puzzle</button>
            <button class="btn small blue" data-a="hub">Back to games</button>
          </div>`, { closable: true, sheet: true });
        m.el.querySelector('[data-a="again"]').onclick = () => App.show("patches");
        m.el.querySelector('[data-a="hub"]').onclick = () => App.show("hub");
      }, 500 + (R + Cn) * 70 + 1400);
    }

    paint();
  });
})();
