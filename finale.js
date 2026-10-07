/* ============ Finale: chest -> glow -> pixel heart -> note ============ */
window.Finale = (function () {
  const C = window.CONTENT;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const SPRITE = [".##.##.", "#######", "#######", ".#####.", "..###..", "...#..."]; // 7 x 6
  const COLORS = ["#ffd60a", "#ffc300", "#ffe066", "#ffea8a", "#f5b700", "#fff3b0"];
  let el = null, raf = 0, timers = [];

  const later = (fn, ms) => timers.push(setTimeout(fn, ms));
  function stopAll() { cancelAnimationFrame(raf); timers.forEach(clearTimeout); timers = []; }

  function open() {
    stopAll();
    const chest = document.querySelector("#chest canvas");
    if (chest) App.drawChest(chest, true);
    App.Sound.chest();
    App.Store.data.chestOpened = true; App.Store.save();
    const glow = document.createElement("div"); glow.className = "glow";
    document.body.appendChild(glow);
    requestAnimationFrame(() => glow.classList.add("go"));
    later(() => mountScene(), reduce ? 0 : 1300);
    later(() => glow.remove(), reduce ? 50 : 2700);
  }

  function mountScene() {
    if (el) { el.__offResize && el.__offResize(); el.remove(); }
    el = document.createElement("div");
    el.className = "finale";
    el.innerHTML = `
      <canvas class="scene"></canvas>
      <button class="icon-btn f-close" aria-label="Back to games">${App.px(["...#...", "..##...", ".######", "#######", ".######", "..##...", "...#..."], { "#": "#c7d1ff" })}</button>
      <button class="btn f-start" id="fstart"><span class="blink">&#9654;</span> START</button>`;
    document.body.appendChild(el);
    document.body.style.overflow = "hidden";
    el.querySelector(".f-close").onclick = close;
    el.querySelector("#fstart").onclick = () => { App.Sound.chime(); showNote(); };
    runHearts();
  }

  function close() {
    stopAll();
    if (el) { el.__offResize && el.__offResize(); el.remove(); } el = null;
    document.body.style.overflow = "";
    App.show("hub");
  }

  /* ---------- the pixel heart scene ---------- */
  function runHearts() {
    const cv = el.querySelector("canvas.scene"), g = cv.getContext("2d");
    const startBtn = el.querySelector("#fstart");
    let W, H, SC, cx, cy, size, parts, bokeh, t0;
    const DRIFT = reduce ? 0 : 4, GATHER = reduce ? 0.01 : 6.5, STAG = 0.55;
    const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const rnd = (a, b) => a + Math.random() * (b - a);

    function build() {
      SC = innerWidth < 700 ? 3 : 4;                   // one canvas pixel = SC screen pixels
      W = Math.ceil(innerWidth / SC); H = Math.ceil(innerHeight / SC);
      cv.width = W; cv.height = H; g.imageSmoothingEnabled = false;
      size = Math.min(W, H) / 38;
      cx = W / 2; cy = H / 2 + size * 0.6;
      const N = Math.round(Math.min(230, Math.max(130, W * H / 170)));
      parts = [];
      for (let i = 0; i < N; i++) {
        const t = Math.random() * Math.PI * 2;
        const hx = 16 * Math.sin(t) ** 3, hy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
        const k = Math.random() < 0.8 ? rnd(0.96, 1.04) : rnd(0.55, 0.9);
        parts.push({
          x: rnd(0, W), y: rnd(0, H), vx: rnd(-0.35, 0.35), vy: rnd(-0.35, 0.35),
          tx: cx + hx * size * k, ty: cy + hy * size * k,
          s: Math.random() < 0.12 ? 2 : 1, color: COLORS[(Math.random() * COLORS.length) | 0],
          delay: Math.random(), swirl: rnd(0.8, 1.6) * (Math.random() < .5 ? -1 : 1),
          shake: rnd(0.4, 1.4), phase: rnd(0, 100), sx: 0, sy: 0
        });
      }
      bokeh = [];
      for (let i = 0; i < 12; i++) bokeh.push({ x: rnd(0, W), y: rnd(0, H), vy: rnd(-0.12, -0.04), s: (Math.random() * 2 | 0) + 2, a: rnd(.08, .16) });
      t0 = performance.now();
      startBtn.classList.remove("show");
    }

    function sprite(x, y, s, col, alpha) {
      g.globalAlpha = alpha; g.fillStyle = col;
      const ox = Math.round(x - 3.5 * s), oy = Math.round(y - 3 * s);
      for (let r = 0; r < 6; r++) {
        const row = SPRITE[r];
        let c = 0;
        while (c < 7) {
          if (row[c] === "#") { let e = c; while (e < 7 && row[e] === "#") e++; g.fillRect(ox + c * s, oy + r * s, (e - c) * s, s); c = e; }
          else c++;
        }
      }
    }

    function frame(now) {
      const s = (now - t0) / 1000, t = now / 1000;
      g.globalAlpha = 1; g.fillStyle = "#070a1f"; g.fillRect(0, 0, W, H);
      // faint pixel stars
      g.fillStyle = "#1b2766";
      for (let i = 0; i < 40; i++) { const x = (i * 97.3) % W, y = (i * 53.7 + i * i) % H; if (Math.sin(t * 1.5 + i) > .2) g.fillRect(x | 0, y | 0, 1, 1); }
      // drifting background hearts
      for (const b of bokeh) {
        b.y += b.vy; if (b.y < -10) { b.y = H + 10; b.x = rnd(0, W); }
        sprite(b.x, b.y, b.s, "#ffd60a", b.a);
      }
      const span = GATHER * (1 - STAG);
      for (const p of parts) {
        // free motion, bouncing off the edges
        p.x += p.vx; p.y += p.vy;
        if (p.x < 3 || p.x > W - 3) p.vx *= -1;
        if (p.y < 3 || p.y > H - 3) p.vy *= -1;
        let k = (s - DRIFT - p.delay * GATHER * STAG) / span;
        k = Math.min(1, Math.max(0, k));
        if (k === 0) { p.sx = p.x; p.sy = p.y; }
        const e = ease(k);
        let x = p.sx + (p.tx - p.sx) * e, y = p.sy + (p.ty - p.sy) * e;
        if (e > 0 && e < 1) {
          const a = p.swirl * Math.sin(Math.PI * e), dx = x - cx, dy = y - cy;
          x = cx + dx * Math.cos(a) - dy * Math.sin(a); y = cy + dx * Math.sin(a) + dy * Math.cos(a);
        }
        // shake while free; a still heart once formed (just a soft twinkle)
        const jit = reduce ? 0 : p.shake * (1 - e);
        x += Math.sin(t * 19 + p.phase) * jit; y += Math.cos(t * 17 + p.phase) * jit;
        const tw = e === 1 ? 0.88 + 0.12 * Math.sin(t * 2.2 + p.phase) : 0.92 + 0.08 * Math.sin(t * 6 + p.phase);
        sprite(x, y, p.s, p.color, tw);
      }
      if (s > DRIFT + GATHER + 0.3 && !startBtn.classList.contains("show")) startBtn.classList.add("show");
      raf = requestAnimationFrame(frame);
    }

    let rt;
    const onResize = () => { clearTimeout(rt); rt = setTimeout(() => { if (el) build(); }, 200); };
    addEventListener("resize", onResize);
    build(); raf = requestAnimationFrame(frame);
    el.__offResize = () => removeEventListener("resize", onResize);
  }

  /* ---------- the note ---------- */
  function showNote() {
    const startBtn = el.querySelector("#fstart"); startBtn.classList.remove("show");
    const wrap = document.createElement("div");
    wrap.className = "dialog-wrap";
    wrap.innerHTML = `
      <div class="dialog px" role="dialog" aria-label="A note from Akash">
        <div class="who">FROM: ${C.signoff[1].toUpperCase()}</div>
        <div class="scroll" id="nscroll"><div class="text"><span id="nbody"></span><span class="sign" id="nsign"></span><span class="caret" id="ncaret"></span></div></div>
        <div class="more" id="nmore" hidden>${App.px(["#######", ".#####.", "..###..", "...#..."], { "#": "#ffd60a" })}</div>
        <div class="tap" id="ntap">TAP TO SKIP</div>
        <div class="acts" id="nacts" hidden></div>
      </div>`;
    el.appendChild(wrap);
    const sc = wrap.querySelector("#nscroll"), nb = wrap.querySelector("#nbody"), ns = wrap.querySelector("#nsign"),
      caret = wrap.querySelector("#ncaret"), more = wrap.querySelector("#nmore"), tap = wrap.querySelector("#ntap"), acts = wrap.querySelector("#nacts");
    sc.scrollTop = 0;

    const body = C.note.join("\n\n") + "\n\n";
    const sign = C.signoff.join("\n");
    const total = body.length + sign.length;
    let i = 0, follow = false, done = false, tid = null, programmatic = false;

    const atBottom = () => sc.scrollTop + sc.clientHeight >= sc.scrollHeight - 6;
    const updMore = () => { more.hidden = atBottom(); };
    sc.addEventListener("scroll", () => {
      if (programmatic) { programmatic = false; return updMore(); }
      follow = atBottom(); updMore();
    }, { passive: true });

    function render() {
      nb.textContent = body.slice(0, Math.min(i, body.length));
      ns.textContent = i > body.length ? sign.slice(0, i - body.length) : "";
      if (follow) { programmatic = true; sc.scrollTop = sc.scrollHeight; }
      updMore();
    }
    // the whole note types out in TYPE_MS, however long it is
    const TYPE_MS = 2500;
    let t0 = 0;
    function step(now) {
      if (done) return;
      if (!t0) t0 = now;
      const k = reduce ? 1 : Math.min(1, (now - t0) / TYPE_MS);
      const next = Math.floor(total * k);
      if (next !== i) { i = next; render(); }
      if (k >= 1) return finish();
      tid = requestAnimationFrame(step);
    }
    function finish() {
      if (done) return; done = true; cancelAnimationFrame(tid);
      i = total; render(); caret.remove(); tap.hidden = true;
      acts.hidden = false;
      acts.innerHTML = `
        <button class="btn small" data-a="replay">Replay</button>
        <button class="btn small blue" data-a="hub">Back to games</button>
        <button class="btn small ghost" data-a="reset">Start over</button>`;
      acts.querySelector('[data-a="replay"]').onclick = replay;
      acts.querySelector('[data-a="hub"]').onclick = () => { sc.scrollTop = 0; close(); };
      acts.querySelector('[data-a="reset"]').onclick = askReset;
      updMore();
    }
    function askReset() {
      acts.innerHTML = `<div class="confirm" style="flex-basis:100%">This wipes all progress and every game starts fresh. Sure?</div>
        <button class="btn small ghost" data-a="no">Keep it</button>
        <button class="btn small" data-a="yes">Yes, start over</button>`;
      acts.querySelector('[data-a="no"]').onclick = () => { done = false; finish(); };
      acts.querySelector('[data-a="yes"]').onclick = () => {
        sc.scrollTop = 0; stopAll(); if (el) { el.__offResize && el.__offResize(); el.remove(); } el = null;
        document.body.style.overflow = "";
        App.Store.reset(); App.show("welcome"); App.toast("Everything's reset. Have fun :)");
      };
    }
    function replay() {
      sc.scrollTop = 0;
      if (el) { el.__offResize && el.__offResize(); }
      stopAll();
      const glow = document.createElement("div"); glow.className = "glow";
      document.body.appendChild(glow);
      App.Sound.chest();
      requestAnimationFrame(() => glow.classList.add("go"));
      later(() => mountScene(), reduce ? 0 : 1300);
      later(() => glow.remove(), reduce ? 50 : 2700);
    }
    const skip = () => { if (done) return; finish(); follow = false; programmatic = true; sc.scrollTop = 0; updMore(); };
    sc.addEventListener("click", skip);
    tap.addEventListener("click", skip);
    tid = requestAnimationFrame(step);
  }

  return { open };
})();
