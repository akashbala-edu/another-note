/* ============ Memory Match (Level 1, 2, 3) ============ */
(function () {
  const C = window.CONTENT;
  const STAR = ["...#...", "...#...", "..###..", "#######", ".#####.", "..###..", ".##.##.", "##...##"];

  App.register("memory", function (body, root, level) {
    const S = App.Store.data;
    const back = App.px(App.HEART, { "#": "#ffd60a" });
    const PH = level === 3 ? C.photos3 : level === 2 ? C.photos2 : C.photos;
    const captionMode = level === 3;                 // half photos, half captions
    const spicy = level > 1;                         // faster flip-back + shuffles + stars
    const FLIP_BACK = spicy ? 500 : 950;
    const SWAP_EVERY = 3;
    const STARS = level === 3 ? [18, 26] : [16, 22]; // flips for 3 stars / 2 stars
    PH.forEach(([src]) => { const i = new Image(); i.src = src; });

    function deal() {
      let open = [], lock = false, flips = 0, found = 0, misses = 0, swapT = null;
      App.onLeave(() => clearTimeout(swapT));
      body.innerHTML = `
        <div class="mm-stats px">
          <div class="s">FLIPS<br><b id="mv">0</b></div>
          <div class="mm-pips" id="pips">${PH.map(() => "<i></i>").join("")}</div>
          <div class="s" style="text-align:right">PAIRS<br><b id="fd">0/${PH.length}</b></div>
        </div>
        <div class="mm-area"><div class="mm-grid" id="grid"></div></div>`;
      const grid = body.querySelector("#grid");
      const upd = () => {
        body.querySelector("#mv").textContent = flips;
        body.querySelector("#fd").textContent = `${found}/${PH.length}`;
        [...body.querySelector("#pips").children].forEach((p, i) => p.classList.toggle("on", i < found));
      };

      // build the deck: two of each photo, or one photo + one caption card in Level 3
      const deck = [];
      PH.forEach((_, k) => { deck.push({ k, t: "p" }); deck.push({ k, t: captionMode ? "c" : "p" }); });
      App.shuffle(deck).forEach((card, i) => {
        const [src, cap] = PH[card.k];
        const b = document.createElement("button");
        b.className = "mm-card" + (card.t === "c" ? " is-cap" : "");
        b.dataset.k = card.k; b.id = "mm" + i;
        b.setAttribute("aria-label", "Hidden card");
        const front = card.t === "c"
          ? `<div class="mm-face mm-front cap-card"><div class="capbig">${cap}</div></div>`
          : `<div class="mm-face mm-front${captionMode ? " photo-only" : ""}"><img src="${src}" alt="" draggable="false"><div class="cap">${cap}</div></div>`;
        b.innerHTML = `<div class="mm-inner"><div class="mm-face mm-back">${back}</div>${front}</div>`;
        b.onclick = () => flip(b);
        grid.appendChild(b);
      });

      const label = (b) => b.classList.contains("is-cap") ? "Caption: " + PH[b.dataset.k][1] : (captionMode && !b.classList.contains("done") ? "Photo" : PH[b.dataset.k][1]);

      function flip(b) {
        if (lock || b.classList.contains("up") || b.classList.contains("done") || b.classList.contains("swapping")) return;
        b.classList.add("up"); b.setAttribute("aria-label", label(b));
        open.push(b);
        if (open.length < 2) return;
        flips++; upd();
        const [a, c] = open;
        if (a.dataset.k === c.dataset.k) {
          setTimeout(() => {
            [a, c].forEach(x => { x.classList.remove("up"); x.classList.add("done"); x.setAttribute("aria-label", PH[x.dataset.k][1]); });
            open = []; found++; upd();
            if (found === PH.length) setTimeout(finish, 600);
          }, 420);
        } else {
          lock = true; misses++;
          setTimeout(() => {
            [a, c].forEach(x => { x.classList.remove("up"); x.setAttribute("aria-label", "Hidden card"); });
            open = [];
            if (spicy && misses % SWAP_EVERY === 0) swapTwo();
            else lock = false;
          }, FLIP_BACK);
        }
      }

      // the spice: two face-down cards trade places
      function swapTwo() {
        const pool = [...grid.children].filter(x => !x.classList.contains("done") && !x.classList.contains("up"));
        if (pool.length < 2) { lock = false; return; }
        App.shuffle(pool);
        const [a, b] = pool;
        a.classList.add("swapping"); b.classList.add("swapping");
        App.toast(App.pick(C.swapTeases), 1600);
        swapT = setTimeout(() => {
          const marker = document.createElement("span");
          grid.replaceChild(marker, a);
          grid.replaceChild(a, b);
          grid.replaceChild(b, marker);
          swapT = setTimeout(() => { a.classList.remove("swapping"); b.classList.remove("swapping"); lock = false; }, 250);
        }, 650);
      }

      function finish() {
        const first = level === 1 ? App.win("memory") : false;
        if (level > 1) App.Sound.win();
        let stars = 0, best, bestTxt, allDone = false;
        if (level === 1) {
          best = S.mmBest == null || flips < S.mmBest;
          if (best) S.mmBest = flips;
          bestTxt = best ? " · new best" : ` · best ${S.mmBest}`;
        } else {
          stars = flips <= STARS[0] ? 3 : flips <= STARS[1] ? 2 : 1;
          const bk = "mmBest" + level, sk = "mmStars" + level, dk = "mmDone" + level;
          best = S[bk] == null || flips < S[bk];
          if (best) S[bk] = flips;
          if (stars > (S[sk] || 0)) S[sk] = stars;
          if (level === 3 && !S[dk]) allDone = true;
          S[dk] = true;
          bestTxt = best ? " · new best" : ` · best ${S[bk]}`;
        }
        App.Store.save();
        const unlock = level < 3 && App.Levels.pending("memory") === level + 1 ? level + 1 : 0;
        const starRow = stars ? `<div class="stars" aria-label="${stars} of 3 stars">${[1, 2, 3].map(i => App.px(STAR, { "#": i <= stars ? "#ffc300" : "#c7d1ff" }, i <= stars ? "on" : "")).join("")}</div>
          <div class="line">${C.starLines[stars - 1]}</div>` : "";
        const m = App.modal(`
          <div class="kicker">${first ? "MEMORY MATCH CONQUERED" : (level > 1 ? "LEVEL " + level + " CLEARED" : "ALL PAIRS FOUND")}</div>
          <h2>All ${PH.length} memories found</h2>
          ${starRow}
          <div class="stat">${flips} flips${bestTxt}</div>
          ${allDone ? `<div class="line big">${C.memoryAllDone}</div>` : ""}
          ${unlock ? `<div class="unlock-block">${App.Levels.unlockHTML("memory", unlock)}</div>` : `
          <div class="row-btns">
            <button class="btn small" data-a="again">Play again</button>
            <button class="btn small blue" data-a="hub">Back to games</button>
          </div>`}`, { closable: true });
        if (unlock) App.Levels.wireUnlock(m, "memory", unlock);
        else {
          m.el.querySelector('[data-a="again"]').onclick = () => { m.close(); deal(); };
          m.el.querySelector('[data-a="hub"]').onclick = () => App.show("hub");
        }
      }
    }
    deal();
  });
})();
