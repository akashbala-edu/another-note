/* ============ Pinpoint ============ */
(function () {
  const C = window.CONTENT;
  const norm = (s) => s.toLowerCase().replace(/[’']/g, "").replace(/[^a-z0-9]+/g, " ").trim();
  function lev(a, b) {
    const m = a.length, n = b.length, d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
    for (let j = 1; j <= n; j++) d[0][j] = j;
    for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[m][n];
  }
  function correct(guess, p) {
    const g = norm(guess); if (!g) return false;
    if (g === norm(p.answer)) return true;
    const words = g.split(" ");
    return p.keys.some(k => {
      const nk = norm(k);
      if (nk.includes(" ")) return (" " + g + " ").includes(" " + nk + " ");
      return words.some(w => w === nk || (nk.length >= 5 && w.length >= 4 && lev(w, nk) <= 1));
    });
  }

  App.register("pinpoint", function (body) {
    const S = App.Store.data;
    const begin = () => play(App.pickIndex("pinpoint", C.pinpoint.length, S.ppFound));

    function play(idx) {
      const p = C.pinpoint[idx];
      let shown = 1, wrong = [], hinted = false, misses = 0, over = false;
      body.innerHTML = `
        <div class="pp-clues" id="cl"></div>
        <div class="wd-hintline" id="hl"></div>
        <form class="pp-form" id="fm" autocomplete="off">
          <input class="pp-input" id="pp-guess" type="text" placeholder="Type your guess" enterkeyhint="go" autocapitalize="off" spellcheck="false" maxlength="60" aria-label="Your guess">
          <button class="btn" type="submit">Guess</button>
        </form>
        <div class="pp-guesses" id="gs"></div>`;
      const cl = body.querySelector("#cl"), fm = body.querySelector("#fm"), inp = body.querySelector("#pp-guess"),
        gs = body.querySelector("#gs"), hl = body.querySelector("#hl");

      function drawClues(animateLast) {
        cl.innerHTML = p.clues.map((c, i) => i < shown
          ? `<div class="pp-clue" style="${animateLast && i === shown - 1 ? "" : "animation:none"}"><span class="n">${i + 1}</span>${c}</div>`
          : `<div class="pp-clue locked"><span class="n">${i + 1}</span>&nbsp;</div>`).join("");
      }
      function drawGuesses() { gs.innerHTML = wrong.slice().reverse().slice(0, 6).map(w => `<span>${w.replace(/</g, "&lt;")}</span>`).join(""); }

      fm.onsubmit = (e) => {
        e.preventDefault();
        if (over) return;
        const g = inp.value.trim(); if (!g) return;
        inp.value = "";
        if (correct(g, p)) return solved();
        wrong.push(g); drawGuesses();
        if (shown < 5) { shown++; drawClues(true); }
        else {
          misses++;
          if (!hinted) {
            hinted = true; App.Sound.soft();
            App.toast(C.teases[(misses - 1) % C.teases.length], 3400);
            hl.textContent = `Hint: the answer starts with "${p.answer.split(" ")[0]}"`;
          } else App.toast("Nope. Keep going :)", 1300);
        }
      };

      function solved() {
        over = true; inp.blur();
        const first = App.win("pinpoint");
        if (!S.ppFound.includes(idx)) { S.ppFound.push(idx); App.Store.save(); }
        const used = shown;
        const line = hinted ? App.pick(C.teases.slice(1)) : C.pinpointLines[used - 1];
        shown = 5; drawClues(false);
        fm.remove(); hl.textContent = ""; gs.innerHTML = "";
        const m = App.modal(`
          <div class="kicker">${first ? "PINPOINT CONQUERED" : "SOLVED"}</div>
          <h2>${p.answer}</h2>
          <div class="pp-dots" aria-label="Clues used">${p.clues.map((_, i) => `<i class="${i < used ? "used" : ""}"></i>`).join("")}</div>
          <div class="line">${line}</div>
          <div class="stat">${hinted ? "Solved with a hint" : `Solved in ${used} ${used === 1 ? "clue" : "clues"}`}<br>${S.ppFound.length} of ${C.pinpoint.length} solved</div>
          <div class="row-btns">
            <button class="btn small" data-a="again">Another puzzle</button>
            <button class="btn small blue" data-a="hub">Back to games</button>
          </div>`, { closable: true });
        m.el.querySelector('[data-a="hub"]').onclick = () => App.show("hub");
        m.el.querySelector('[data-a="again"]').onclick = () => { m.close(); begin(); };
      }

      drawClues(true);
    }
    begin();
  });

  window.__ppCorrect = correct; // for testing
})();
