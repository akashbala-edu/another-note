/* ============ Wordle ============ */
(function () {
  const C = window.CONTENT;
  let DICT = null, dictLoading = null;
  function loadDict() {
    if (DICT || dictLoading) return dictLoading;
    dictLoading = fetch("words.txt").then(r => r.ok ? r.text() : Promise.reject()).then(t => {
      const s = new Set(); for (let i = 0; i + 5 <= t.length; i += 5) s.add(t.slice(i, i + 5).toUpperCase());
      C.wordle.forEach(([w]) => s.add(w)); DICT = s;
    }).catch(() => { DICT = "any"; });
    return dictLoading;
  }
  const isWord = (w) => DICT === "any" || !DICT || DICT.has(w);

  function score(guess, target) {
    const res = Array(5).fill("absent"), t = target.split(""), used = Array(5).fill(false);
    for (let i = 0; i < 5; i++) if (guess[i] === t[i]) { res[i] = "correct"; used[i] = true; }
    for (let i = 0; i < 5; i++) {
      if (res[i] === "correct") continue;
      for (let j = 0; j < 5; j++) if (!used[j] && guess[i] === t[j]) { res[i] = "present"; used[j] = true; break; }
    }
    return res;
  }

  App.register("wordle", function (body) {
    loadDict();
    const S = App.Store.data;
    let idx;
    const start = () => {
      const solved = C.wordle.map((w, i) => i).filter(i => S.wordleFound.includes(C.wordle[i][0]));
      idx = App.pickIndex("wordle", C.wordle.length, solved);
      play();
    };

    function play() {
      const [target, reason] = C.wordle[idx];
      let rows = [], cur = "", over = false, busy = false, hint = false, rounds = 0;
      const keyState = {};

      body.innerHTML = `
        <div class="wd-hintline" id="hl"></div>
        <div class="wd-board" id="bd"></div>
        <div class="keyboard" id="kb"></div>`;
      const bd = body.querySelector("#bd"), kb = body.querySelector("#kb"), hl = body.querySelector("#hl");

      function drawBoard() {
        bd.innerHTML = "";
        for (let r = 0; r < 6; r++) {
          const row = document.createElement("div"); row.className = "wd-row";
          for (let c = 0; c < 5; c++) {
            const t = document.createElement("div"); t.className = "wd-tile";
            row.appendChild(t);
          }
          bd.appendChild(row);
        }
        paint();
      }
      function paint() {
        const rowsEl = bd.children;
        for (let r = 0; r < 6; r++) {
          const tiles = rowsEl[r].children;
          for (let c = 0; c < 5; c++) {
            const t = tiles[c];
            if (r < rows.length) continue; // already revealed
            t.className = "wd-tile"; t.textContent = "";
            if (r === rows.length) {
              if (cur[c]) { t.textContent = cur[c]; t.classList.add("filled"); }
              else if (hint && c === 0) { t.textContent = target[0]; t.classList.add("ghost"); }
            }
          }
        }
      }
      const KEYS = ["QWERTYUIOP", "ASDFGHJKL", "+ZXCVBNM-"];
      function drawKeys() {
        kb.innerHTML = KEYS.map(r => `<div class="krow">${[...r].map(k => {
          if (k === "+") return `<button class="key wide" data-k="ENTER">Enter</button>`;
          if (k === "-") return `<button class="key wide" data-k="BACK" aria-label="Delete">&#9003;</button>`;
          return `<button class="key ${keyState[k] || ""}" data-k="${k}">${k}</button>`;
        }).join("")}</div>`).join("");
        kb.querySelectorAll(".key").forEach(b => b.onclick = (e) => { e.preventDefault(); press(b.dataset.k); b.blur(); });
      }
      function rank(s) { return { correct: 3, present: 2, absent: 1 }[s] || 0; }

      function press(k) {
        if (over || busy) return;
        if (k === "ENTER") return submit();
        if (k === "BACK") { cur = cur.slice(0, -1); return paint(); }
        if (/^[A-Z]$/.test(k) && cur.length < 5) { cur += k; paint(); }
      }
      function submit() {
        const rowEl = bd.children[rows.length];
        if (cur.length < 5) { shake(rowEl); return App.toast("Not enough letters", 1400); }
        if (!isWord(cur)) { shake(rowEl); return App.toast("Not in word list", 1400); }
        const res = score(cur, target);
        const guess = cur; rows.push(guess); cur = ""; busy = true;
        [...rowEl.children].forEach((t, i) => {
          t.textContent = guess[i];
          setTimeout(() => { t.classList.add("flip"); setTimeout(() => { t.classList.remove("filled"); t.classList.add(res[i]); }, 250); }, i * 260);
        });
        setTimeout(() => {
          [...guess].forEach((ch, i) => { if (rank(res[i]) > rank(keyState[ch])) keyState[ch] = res[i]; });
          drawKeys(); busy = false;
          if (guess === target) return won(rowEl);
          if (rows.length === 6) outOfTries();
          else paint();
        }, 5 * 260 + 260);
      }
      function shake(el) { el.classList.remove("shake"); void el.offsetWidth; el.classList.add("shake"); }

      function outOfTries() {
        rounds++;
        App.Sound.soft();
        App.toast(C.teases[(rounds - 1) % C.teases.length], 3400);
        hint = true;
        hl.textContent = `Hint: it starts with ${target[0]}. Here are 6 fresh tries.`;
        setTimeout(() => { rows = []; drawBoard(); }, 900);
      }

      function won(rowEl) {
        over = true;
        [...rowEl.children].forEach((t, i) => setTimeout(() => t.classList.add("win"), i * 90));
        const first = App.win("wordle");
        if (!S.wordleFound.includes(target)) { S.wordleFound.push(target); App.Store.save(); }
        const tries = rounds * 6 + rows.length;
        setTimeout(() => {
          const m = App.modal(`
            <div class="kicker">${first ? "WORDLE CONQUERED" : "ANOTHER ONE"}</div>
            <h2>${target}</h2>
            <p>${reason}</p>
            <div class="stat">Solved in ${tries} ${tries === 1 ? "try" : "tries"}<br>${S.wordleFound.length} of ${C.wordle.length} words found</div>
            <div class="row-btns">
              <button class="btn small" data-a="again">Another word</button>
              <button class="btn small blue" data-a="hub">Back to games</button>
            </div>`, { closable: true });
          m.el.querySelector('[data-a="hub"]').onclick = () => App.show("hub");
          m.el.querySelector('[data-a="again"]').onclick = () => { m.close(); start(); };
        }, 1000);
      }

      const onKey = (e) => {
        if (e.metaKey || e.ctrlKey || e.altKey) return;
        if (e.key === "Enter") { e.preventDefault(); press("ENTER"); }
        else if (e.key === "Backspace") { e.preventDefault(); press("BACK"); }
        else if (/^[a-zA-Z]$/.test(e.key)) press(e.key.toUpperCase());
      };
      document.removeEventListener("keydown", window.__wdKey || (() => {}));
      window.__wdKey = onKey;
      document.addEventListener("keydown", onKey);
      App.onLeave(() => document.removeEventListener("keydown", onKey));

      drawBoard(); drawKeys();
    }

    start();
  });
})();
