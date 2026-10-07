/* ============ Queens (with hearts) ============ */
(function () {
  const C = window.CONTENT;
  // soft pastels like the original, plus a pale royal blue and a soft yellow for us
  const PAL = ["#bba3e2", "#ffc992", "#a6b8ff", "#b3dfa0", "#dfdfdf", "#ff9e8a", "#ffe98a", "#9fd8e0", "#f2b8d6", "#c9e88f"];
  // outlined heart so it reads on every pastel
  const HQ = [".kk.kk.", "kyykyyk", "kyyyyyk", "kyyyyyk", ".kyyyk.", "..kyk..", "...k..."];
  const heart = () => App.px(HQ, { k: "#1a1a2e", y: "#ffd60a" });
  const xMark = App.px(["#...#", ".#.#.", "..#..", ".#.#.", "#...#"], { "#": "#1a1a2e" });

  App.register("queens", function (body, root) {
    const S = App.Store.data;
    const idx = App.pickIndex("queens", QUEENS.length, S.qSolved);
    const P = QUEENS[idx], n = P.n;
    const reg = P.r.map(row => [...row].map(ch => ch.charCodeAt(0) - 97));
    const colors = App.shuffle(PAL.slice()).slice(0, n);
    let st = Array(n * n).fill(0); // 0 empty, 1 x, 2 heart
    const undo = [];
    let over = false;
    const timer = App.makeTimer(root.querySelector(".timer"));
    App.onLeave(() => timer.kill());

    body.innerHTML = `
      <div class="board-wrap"><div class="board" id="bd" style="grid-template-columns:repeat(${n},1fr);grid-template-rows:repeat(${n},1fr)"></div></div>
      <div class="row-btns">
        <button class="btn small ghost" data-a="undo">Undo</button>
        <button class="btn small ghost" data-a="hint">Hint</button>
        <button class="btn small ghost" data-a="clear">Clear</button>
      </div>`;
    const bd = body.querySelector("#bd");
    const cells = [];
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
      const d = document.createElement("div");
      d.className = "q-cell"; d.dataset.i = r * n + c;
      const g = reg[r][c], thick = "2px solid #1a1a2e", thin = "1px solid rgba(26,26,46,.28)";
      d.style.background = colors[g];
      d.style.borderTop = r === 0 ? "0" : (reg[r - 1][c] !== g ? thick : thin);
      d.style.borderLeft = c === 0 ? "0" : (reg[r][c - 1] !== g ? thick : thin);
      d.setAttribute("role", "button"); d.setAttribute("aria-label", `Row ${r + 1}, column ${c + 1}`);
      bd.appendChild(d); cells.push(d);
    }

    function paint() {
      const hearts = [];
      st.forEach((v, i) => { if (v === 2) hearts.push(i); });
      const clash = new Set(), bad = new Set();
      const groups = (key) => { const m = {}; hearts.forEach(i => { const k = key(i); (m[k] = m[k] || []).push(i); }); return m; };
      const rowG = groups(i => (i / n) | 0), colG = groups(i => i % n), regG = groups(i => reg[(i / n) | 0][i % n]);
      Object.entries(rowG).forEach(([k, a]) => { if (a.length > 1) { a.forEach(i => bad.add(i)); for (let c = 0; c < n; c++) clash.add(+k * n + c); } });
      Object.entries(colG).forEach(([k, a]) => { if (a.length > 1) { a.forEach(i => bad.add(i)); for (let r = 0; r < n; r++) clash.add(r * n + +k); } });
      Object.entries(regG).forEach(([k, a]) => { if (a.length > 1) { a.forEach(i => bad.add(i)); for (let i = 0; i < n * n; i++) if (reg[(i / n) | 0][i % n] === +k) clash.add(i); } });
      for (let a = 0; a < hearts.length; a++) for (let b = a + 1; b < hearts.length; b++) {
        const i = hearts[a], j = hearts[b];
        if (Math.abs(((i / n) | 0) - ((j / n) | 0)) <= 1 && Math.abs((i % n) - (j % n)) <= 1) { bad.add(i); bad.add(j); clash.add(i); clash.add(j); }
      }
      cells.forEach((d, i) => {
        const v = st[i];
        d.innerHTML = v === 1 ? `<div class="x">${xMark}</div>` : v === 2 ? `<div class="hq">${heart()}</div>` : "";
        d.classList.toggle("clash", clash.has(i));
        d.classList.toggle("bad", bad.has(i));
      });
      if (!over && hearts.length === n && bad.size === 0) won(hearts);
    }

    function snapshot() { undo.push(st.slice()); if (undo.length > 200) undo.shift(); }

    // ---- pointer: tap cycles, drag marks X's ----
    let down = null, dragged = false, visited = null;
    const cellAt = (e) => { const el = document.elementFromPoint(e.clientX, e.clientY); const c = el && el.closest(".q-cell"); return c && bd.contains(c) ? +c.dataset.i : null; };
    bd.addEventListener("pointerdown", (e) => {
      if (over) return;
      const i = cellAt(e); if (i == null) return;
      e.preventDefault(); timer.start();
      down = i; dragged = false; visited = new Set([i]);
      try { bd.setPointerCapture(e.pointerId); } catch (_) {}
    });
    bd.addEventListener("pointermove", (e) => {
      if (down == null || over) return;
      const i = cellAt(e); if (i == null || visited.has(i)) return;
      if (!dragged) { snapshot(); dragged = true; if (st[down] === 0) st[down] = 1; }
      visited.add(i); if (st[i] === 0) st[i] = 1;
      paint();
    });
    const up = () => {
      if (down == null) return;
      if (!dragged && !over) { snapshot(); st[down] = (st[down] + 1) % 3; paint(); }
      down = null;
    };
    bd.addEventListener("pointerup", up);
    bd.addEventListener("pointercancel", () => { down = null; });

    body.querySelector('[data-a="undo"]').onclick = () => { if (over || !undo.length) return; st = undo.pop(); paint(); };
    body.querySelector('[data-a="clear"]').onclick = () => { if (over) return; snapshot(); st.fill(0); paint(); };
    body.querySelector('[data-a="hint"]').onclick = () => {
      if (over) return; timer.start(); App.Sound.soft();
      const sol = new Set(P.s.map((c, r) => r * n + c));
      const flash = (i) => { cells[i].classList.remove("hintflash"); void cells[i].offsetWidth; cells[i].classList.add("hintflash"); };
      const wrongHeart = st.findIndex((v, i) => v === 2 && !sol.has(i));
      if (wrongHeart >= 0) { snapshot(); st[wrongHeart] = 0; paint(); flash(wrongHeart); return App.toast("That heart didn't belong there", 1800); }
      const wrongX = st.findIndex((v, i) => v === 1 && sol.has(i));
      if (wrongX >= 0) { snapshot(); st[wrongX] = 0; paint(); flash(wrongX); return App.toast("A heart goes where that X was", 1800); }
      const next = [...sol].find(i => st[i] !== 2);
      if (next != null) { snapshot(); st[next] = 2; paint(); flash(next); }
    };

    function won(hearts) {
      over = true;
      const time = timer.stop();
      const first = App.win("queens");
      if (!S.qSolved.includes(idx)) { S.qSolved.push(idx); App.Store.save(); }
      hearts.sort((a, b) => a - b).forEach((i, k) => setTimeout(() => cells[i].classList.add("lit"), 120 * k));
      setTimeout(() => {
        const m = App.modal(`
          <div class="kicker">${first ? "QUEENS CONQUERED" : "SOLVED"}</div>
          <div class="line big">${C.queensWin}</div>
          <div class="stat">Time ${time}<br>${S.qSolved.length} of ${QUEENS.length} solved</div>
          <div class="row-btns">
            <button class="btn small" data-a="again">Another puzzle</button>
            <button class="btn small blue" data-a="hub">Back to games</button>
          </div>`, { closable: true, sheet: true });
        m.el.querySelector('[data-a="again"]').onclick = () => App.show("queens");
        m.el.querySelector('[data-a="hub"]').onclick = () => App.show("hub");
      }, 120 * n + 1300);
    }

    paint();
  });
})();
