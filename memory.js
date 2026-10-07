/* ============ Memory Match ============ */
(function () {
  const C = window.CONTENT;
  App.register("memory", function (body) {
    const S = App.Store.data;
    const back = App.px(App.HEART, { "#": "#ffd60a" });
    // warm the photo cache so flips are instant
    C.photos.forEach(([src]) => { const i = new Image(); i.src = src; });

    function deal() {
      let open = [], lock = false, flips = 0, found = 0;
      body.innerHTML = `
        <div class="mm-stats px">
          <div class="s">FLIPS<br><b id="mv">0</b></div>
          <div class="mm-pips" id="pips">${C.photos.map(() => "<i></i>").join("")}</div>
          <div class="s" style="text-align:right">PAIRS<br><b id="fd">0/${C.photos.length}</b></div>
        </div>
        <div class="mm-area"><div class="mm-grid" id="grid"></div></div>`;
      const grid = body.querySelector("#grid");
      const upd = () => {
        body.querySelector("#mv").textContent = flips;
        body.querySelector("#fd").textContent = `${found}/${C.photos.length}`;
        [...body.querySelector("#pips").children].forEach((p, i) => p.classList.toggle("on", i < found));
      };
      App.shuffle([...Array(C.photos.length * 2).keys()].map(i => i % C.photos.length)).forEach((k, i) => {
        const b = document.createElement("button");
        b.className = "mm-card"; b.dataset.k = k; b.id = "mm" + i;
        b.setAttribute("aria-label", "Hidden card");
        b.innerHTML = `<div class="mm-inner"><div class="mm-face mm-back">${back}</div><div class="mm-face mm-front"><img src="${C.photos[k][0]}" alt="" draggable="false"><div class="cap">${C.photos[k][1]}</div></div></div>`;
        b.onclick = () => flip(b);
        grid.appendChild(b);
      });

      function flip(b) {
        if (lock || b.classList.contains("up") || b.classList.contains("done")) return;
        b.classList.add("up"); b.setAttribute("aria-label", C.photos[b.dataset.k][1]);
        open.push(b);
        if (open.length < 2) return;
        flips++; upd();
        const [a, c] = open;
        if (a.dataset.k === c.dataset.k) {
          setTimeout(() => {
            [a, c].forEach(x => { x.classList.remove("up"); x.classList.add("done"); });
            open = []; found++; upd();
            if (found === C.photos.length) setTimeout(finish, 600);
          }, 420);
        } else {
          lock = true;
          setTimeout(() => {
            [a, c].forEach(x => { x.classList.remove("up"); x.setAttribute("aria-label", "Hidden card"); });
            open = []; lock = false;
          }, 950);
        }
      }

      function finish() {
        const first = App.win("memory");
        const best = S.mmBest == null || flips < S.mmBest;
        if (best) { S.mmBest = flips; App.Store.save(); }
        const m = App.modal(`
          <div class="kicker">${first ? "MEMORY MATCH CONQUERED" : "ALL PAIRS FOUND"}</div>
          <h2>All ${C.photos.length} memories found</h2>
          <div class="stat">${flips} flips${best ? " · new best" : ` · best ${S.mmBest}`}</div>
          <div class="row-btns">
            <button class="btn small" data-a="again">Play again</button>
            <button class="btn small blue" data-a="hub">Back to games</button>
          </div>`, { closable: true });
        m.el.querySelector('[data-a="again"]').onclick = () => { m.close(); deal(); };
        m.el.querySelector('[data-a="hub"]').onclick = () => App.show("hub");
      }
    }
    deal();
  });
})();
