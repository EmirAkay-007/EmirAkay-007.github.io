/* Hüseyin Emir Akay – scroll behaviour.
   Everything here is an enhancement: without it the page is complete.
   "motion" on <html> means the visitor has not asked for reduced motion
   or reduced data; "still" means they have. */

const root = document.documentElement;
const MOTION = root.classList.contains("motion");

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (t) => t * t * (3 - 2 * t);
const docTop = (el) => el.getBoundingClientRect().top + window.scrollY;

let vh = window.innerHeight;
let maxScroll = 1;
const tasks = [];
let queued = false;

// Layout is sized from the small viewport height, which does not change when a
// phone's toolbars slide away, so nothing jumps under the reader's thumb.
const svhProbe = document.createElement("div");
svhProbe.setAttribute("aria-hidden", "true");
svhProbe.style.cssText = "position:fixed;top:0;left:0;width:0;height:100vh;height:100svh;visibility:hidden;pointer-events:none";
document.body.appendChild(svhProbe);
let svh = vh;

function frame() {
  queued = false;
  const y = window.scrollY;
  for (const t of tasks) if (t.update) t.update(y);
}
function queue() {
  if (!queued) { queued = true; requestAnimationFrame(frame); }
}
function measureAll() {
  vh = window.innerHeight;
  svh = svhProbe.offsetHeight || vh;
  maxScroll = Math.max(1, root.scrollHeight - vh);
  for (const t of tasks) if (t.measure) t.measure();
  queue();
}
let measureTimer = 0;
function remeasure() {
  clearTimeout(measureTimer);
  measureTimer = setTimeout(measureAll, 120);
}

/* Name: rides up with the page and shrinks into the header ---------------- */

function dock() {
  const h1 = $("[data-name]");
  const bar = $("[data-bar]");
  const barName = $(".bar-name", bar || document);
  if (!h1 || !bar || !barName) return;
  const wide = window.matchMedia("(min-width: 700px)");
  let morph = false, end = 1, reveal = 1, k = 1, f1 = 1;

  // Size the single-line name to the column: measure its width in ems once.
  function fitName() {
    if (!wide.matches) { h1.style.removeProperty("--name-em"); return; }
    const probe = h1.cloneNode(true);
    probe.removeAttribute("id");
    probe.style.cssText = "position:absolute;visibility:hidden;font-size:100px;transform:none;white-space:nowrap;width:auto;left:-9999px";
    h1.parentNode.appendChild(probe);
    const em = probe.getBoundingClientRect().width / 100;
    probe.remove();
    if (em > 0) h1.parentNode.style.setProperty("--name-em", (em * 1.015).toFixed(3));
  }

  function measure() {
    fitName();
    morph = MOTION && wide.matches;
    h1.style.transform = "";
    h1.style.fontVariationSettings = "";
    const r = h1.getBoundingClientRect();
    const b = barName.getBoundingClientRect();
    f1 = parseFloat(getComputedStyle(h1).fontSize);
    k = parseFloat(getComputedStyle(barName).fontSize) / f1;
    end = Math.max(1, r.top + window.scrollY - b.top);
    reveal = r.bottom + window.scrollY - bar.offsetHeight;
  }

  function update(y) {
    if (morph) {
      const p = clamp(y / end);
      const s = lerp(1, k, smooth(p));
      const docked = p >= 0.999;
      h1.style.transform = `scale(${(docked ? k : s).toFixed(4)})`;
      // The optical size follows the rendered size, so the small name is
      // drawn as small type, matching the header exactly at the hand-over.
      h1.style.fontVariationSettings = `"opsz" ${clamp(f1 * (docked ? k : s), 7, 72).toFixed(1)}`;
      h1.classList.toggle("is-morphing", p > 0 && p < 1);
      h1.classList.toggle("is-docked", docked);
      bar.classList.toggle("is-docked", docked);
      bar.style.setProperty("--bar-bg", clamp((p - 0.55) / 0.45).toFixed(3));
    } else {
      const on = y > reveal;
      bar.classList.toggle("is-docked", on);
      bar.style.setProperty("--bar-bg", on ? "1" : "0");
    }
    bar.style.setProperty("--p", (y / maxScroll).toFixed(4));
  }

  tasks.push({ measure, update });
}

/* Mission rail: waypoints at the real position of each section ------------ */

function rail() {
  const nav = $("[data-rail]");
  if (!nav) return;
  const items = $$("li", nav);
  const links = items.map((li) => $("a", li));
  const targets = links.map((a) => document.getElementById(a.hash.slice(1)));
  let H = 0, ys = [], tops = [], current = -1;

  function measure() {
    H = getComputedStyle(nav).display === "none" ? 0 : nav.clientHeight;
    if (!H) return;
    tops = targets.map((t) => (t ? docTop(t) : 0));
    ys = tops.map((t, i) => (i === tops.length - 1 ? H : clamp((t - vh * 0.35) / maxScroll) * H));
    for (let i = 1; i < ys.length; i++) ys[i] = Math.max(ys[i], ys[i - 1] + 18);
    const last = ys[ys.length - 1];
    if (last > H) ys = ys.map((v) => (v * H) / last);
    items.forEach((li, i) => li.style.setProperty("--y", ys[i].toFixed(1) + "px"));
  }

  function update(y) {
    if (!H) return;
    const ac = clamp(y / maxScroll) * H;
    nav.style.setProperty("--ac", ac.toFixed(1) + "px");
    let cur = 0;
    tops.forEach((t, i) => { if (y + vh * 0.35 >= t) cur = i; });
    if (y >= maxScroll - 2) cur = items.length - 1;
    items.forEach((li, i) => li.classList.toggle("is-passed", ys[i] <= ac + 0.5));
    if (cur !== current) {
      items.forEach((li, i) => li.classList.toggle("is-current", i === cur));
      links.forEach((a, i) => (i === cur ? a.setAttribute("aria-current", "location") : a.removeAttribute("aria-current")));
      current = cur;
    }
  }

  tasks.push({ measure, update });
}

/* The dive: frames scrubbed by scroll, phases and profile in step ---------- */

function dive() {
  const track = $("[data-dive]");
  if (!track) return;
  const stage = $(".dive-stage", track);
  const screen = $(".screen", track);
  const canvas = $("canvas", screen);
  const ctx = canvas.getContext("2d", { alpha: false });
  const phases = $$("[data-phase]", track);
  const panel = $(".dive-panel", track);
  const paras = phases.map((li) => $("p", li));
  const svg = $("[data-profile]");
  const flown = $$(".flown path", svg);
  const marker = $(".marker", svg);
  const lens = flown.map((p) => p.getTotalLength());

  if (!MOTION) {
    flown.forEach((p) => { p.style.strokeDasharray = "none"; });
    return;
  }
  flown.forEach((p, i) => { p.style.strokeDasharray = `${lens[i]} ${lens[i]}`; p.style.strokeDashoffset = `${lens[i]}`; });

  // Scroll share and frame range of each state of the run (131 frames, 15 fps).
  const N = 131;
  const PHASE = [
    { p0: 0.00, p1: 0.13, f0: 1, f1: 7 },
    { p0: 0.13, p1: 0.60, f0: 8, f1: 77 },
    { p0: 0.60, p1: 0.82, f0: 78, f1: 104 },
    { p0: 0.82, p1: 1.00, f0: 105, f1: 131 },
  ];
  const frames = new Array(N + 1);
  const src = (i) => `assets/dive/f${String(i).padStart(3, "0")}.webp`;
  let started = false, start = 0, span = 1, want = 1, drawn = -1, active = -1, cw = 0, ch = 0;

  function load() {
    if (started) return;
    started = true;
    // Coarse frames first, so scrubbing works before everything has arrived.
    const order = [], seen = new Set();
    for (let step = 16; step >= 1; step = step >> 1) {
      for (let i = 1; i <= N; i += step) if (!seen.has(i)) { seen.add(i); order.push(i); }
    }
    let k = 0;
    const next = () => {
      if (k >= order.length) return;
      const i = order[k++];
      const img = new Image();
      img.decoding = "async";
      img.src = src(i);
      img.decode()
        .then(() => { frames[i] = img; if (Math.abs(i - want) <= Math.abs(drawn - want) || drawn < 0) queue(); })
        .catch(() => {})
        .finally(next);
    };
    for (let c = 0; c < 6; c++) next();
  }
  new IntersectionObserver((entries, io) => {
    if (entries.some((e) => e.isIntersecting)) { load(); io.disconnect(); }
  }, { rootMargin: "150% 0px" }).observe(track);

  function size() {
    const r = canvas.getBoundingClientRect();
    const d = Math.min(2, window.devicePixelRatio || 1);
    cw = Math.max(1, Math.round(r.width * d));
    ch = Math.max(1, Math.round(r.height * d));
    if (canvas.width !== cw) canvas.width = cw;
    if (canvas.height !== ch) canvas.height = ch;
    drawn = -1;
  }

  function draw(i) {
    let j = i;
    if (!frames[j]) {
      j = -1;
      for (let d = 1; d < N; d++) {
        if (frames[i - d]) { j = i - d; break; }
        if (frames[i + d]) { j = i + d; break; }
      }
    }
    if (j < 0 || j === drawn) return;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(frames[j], 0, 0, cw, ch);
    drawn = j;
    screen.classList.add("is-live");
  }

  // Make the pinned stage fit any window. Side by side, the panel is checked
  // against the height and, if it is too tall, only the active phase keeps its
  // text open. Stacked, the screen takes whatever height the panel leaves.
  function fit() {
    track.classList.remove("is-compact", "is-tight", "no-profile");
    track.style.removeProperty("--screen-max");
    paras.forEach((p) => p.style.removeProperty("--pad"));
    const stageH = stage.clientHeight;
    const panelH = () => panel.getBoundingClientRect().height;
    if (panel.getBoundingClientRect().left >= screen.getBoundingClientRect().right - 1) {
      const room = stageH - 40;
      if (panelH() <= room) return;
      track.classList.add("is-compact");
      const hs = paras.map((p) => p.scrollHeight);
      const max = Math.max(...hs);
      paras.forEach((p, i) => p.style.setProperty("--pad", `${max - hs[i]}px`));
      if (panelH() > room) track.classList.add("is-tight");
      return;
    }
    const cs = getComputedStyle(stage);
    const used = (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.rowGap) || 0) + 28;
    const least = stageH * 0.36;
    let avail = stageH - used - panelH();
    if (avail < least) { track.classList.add("is-tight"); avail = stageH - used - panelH(); }
    if (avail < least) { track.classList.add("no-profile"); avail = stageH - used - panelH(); }
    track.style.setProperty("--screen-max", `${Math.max(150, ((avail - 14) * 4) / 3 + 14).toFixed(0)}px`);
  }

  function measure() {
    const barH = parseFloat(getComputedStyle(root).getPropertyValue("--bar-h")) || 56;
    fit();
    start = docTop(track) - barH;
    span = Math.max(1, track.offsetHeight - stage.offsetHeight);
    size();
  }

  function update(y) {
    const p = clamp((y - start) / span);
    let ph = 0;
    while (ph < 3 && p > PHASE[ph].p1) ph++;
    const t = clamp((p - PHASE[ph].p0) / (PHASE[ph].p1 - PHASE[ph].p0));
    want = Math.round(lerp(PHASE[ph].f0, PHASE[ph].f1, t));
    draw(want);
    if (ph !== active) {
      phases.forEach((li, i) => li.classList.toggle("is-active", i === ph));
      active = ph;
    }
    flown.forEach((path, i) => {
      const f = i < ph ? 1 : i > ph ? 0 : t;
      path.style.strokeDashoffset = (lens[i] * (1 - f)).toFixed(2);
    });
    const pt = flown[ph].getPointAtLength(lens[ph] * t);
    marker.setAttribute("cx", pt.x.toFixed(1));
    marker.setAttribute("cy", pt.y.toFixed(1));
  }

  tasks.push({ measure, update });
}

/* Real-flight clip: plays while on screen, with a pause control ------------ */

function clip() {
  const fig = $("[data-clip]");
  if (!fig) return;
  const video = $("video", fig);
  const button = $(".clip-toggle", fig);
  let held = !MOTION;   // reduced motion: never start on its own
  video.removeAttribute("controls");   // native controls stay for visitors without JavaScript
  button.hidden = false;
  const label = () => { button.textContent = video.paused ? "Play" : "Pause"; };
  button.addEventListener("click", () => {
    if (video.paused) { held = false; video.preload = "auto"; video.play().catch(() => {}); }
    else { held = true; video.pause(); }
  });
  video.addEventListener("play", label);
  video.addEventListener("pause", label);
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting && !held) { video.preload = "auto"; video.play().catch(label); }
    else if (!e.isIntersecting && !video.paused) video.pause();
  }, { threshold: 0.4 }).observe(video);
  label();
}

/* Detection: the fallback order, stepped through as it scrolls past -------- */

function pipeline() {
  const fig = $("[data-pipeline]");
  if (!fig) return;
  const rows = $$(".pl-row", fig).map((row) => Object.fromEntries($$("li", row).map((li) => [li.dataset.s, li])));
  const ORDER = ["plain", "contrast", "light", "sharpen", "upscale", "deblur"];
  const STEPS = [
    [],
    [[0, "plain", "try"]],
    [[0, "plain", "miss"], [0, "contrast", "try"]],
    [[0, "contrast", "miss"], [0, "light", "try"]],
    [[0, "light", "hit"]],
    [[1, "plain", "try"]],
    [[1, "plain", "miss"], [1, "contrast", "skip"], [1, "light", "try"]],
    [[1, "light", "hit"]],
  ];
  function stateAt(n) {
    const s = [{}, {}];
    for (let i = 1; i <= n; i++) for (const [r, k, v] of STEPS[i]) s[r][k] = v;
    s.forEach((row) => {
      if (Object.values(row).includes("hit")) ORDER.forEach((k) => { if (!row[k]) row[k] = "rest"; });
    });
    return s;
  }
  function paint(n) {
    const s = stateAt(n);
    rows.forEach((row, r) => ORDER.forEach((k) => {
      const v = s[r][k];
      if (v) row[k].dataset.state = v; else row[k].removeAttribute("data-state");
    }));
  }
  const LAST = STEPS.length - 1;
  if (!MOTION) { paint(LAST); return; }
  let top = 0, shown = -1;
  function measure() { top = docTop(fig); }
  function update(y) {
    const p = clamp((y + vh * 0.82 - top) / (vh * 0.62));
    const n = Math.min(LAST, Math.floor(p * (LAST + 0.999)));
    if (n !== shown) { paint(n); shown = n; }
  }
  tasks.push({ measure, update });
}

/* Ground station tours: the spot follows the step being read --------------- */

function tours() {
  $$("[data-tour]").forEach((tour) => {
    const spot = $(".spot", tour);
    const fig = $(".tour-fig", tour);
    const steps = $$(".tour-steps li", tour);
    if (!spot || !fig || !steps.length) return;
    let active = -1, tops = [], line = 0;
    const set = (i) => {
      if (i === active) return;
      active = i;
      steps.forEach((li, j) => li.classList.toggle("is-active", j === i));
      if (i < 0) { tour.classList.remove("has-spot"); return; }
      const [x, y, w, h] = steps[i].dataset.spot.split(/\s+/).map(Number);
      spot.style.setProperty("--x", x);
      spot.style.setProperty("--y", y);
      spot.style.setProperty("--w", w);
      spot.style.setProperty("--h", h);
      tour.classList.add("has-spot");
    };
    // The step being read is the one crossing the reading line, in the middle
    // of the space the screenshot leaves free: beside it, or below it when it
    // is pinned on top. Each step is made just tall enough that its text stays
    // whole in that space for as long as it is the active one, so the hand-over
    // happens with the old text at the top and the new one at the bottom.
    function measure() {
      const barH = parseFloat(getComputedStyle(root).getPropertyValue("--bar-h")) || 56;
      const stacked = getComputedStyle(tour).gridTemplateColumns.trim().split(/\s+/).length < 2;
      const figBottom = stacked ? (parseFloat(getComputedStyle(fig).top) || barH) + fig.offsetHeight : barH;
      const free = Math.max(0, svh - figBottom);
      line = figBottom + free * 0.5;
      steps.forEach((li) => {
        const text = li.lastElementChild.getBoundingClientRect().bottom - li.firstElementChild.getBoundingClientRect().top;
        const h = Math.max(text + 24, Math.min(free - text - 24, svh * 0.62));
        li.style.setProperty("--step-h", `${h.toFixed(0)}px`);
      });
      tops = steps.map(docTop);
    }
    function update(y) {
      let i = -1;
      for (let k = 0; k < tops.length; k++) if (y + line >= tops[k]) i = k;
      set(i);
    }
    tasks.push({ measure, update });
  });
}

/* Flight log: the route is flown as it comes into view --------------------- */

function route() {
  const ol = $("[data-route]");
  if (!ol || !MOTION) return;
  const items = $$("li", ol);
  let top = 0, height = 1;
  items.forEach((li) => { li.style.setProperty("--leg", "0"); li.style.setProperty("--lit", "0"); });
  function measure() { top = docTop(ol); height = ol.offsetHeight; }
  function update(y) {
    const p = clamp((y + vh * 0.85 - top) / (vh * 0.5 + height * 0.6));
    const v = p * (items.length - 1);
    items.forEach((li, i) => {
      li.style.setProperty("--lit", v >= i - 0.02 ? "1" : "0");
      li.style.setProperty("--leg", clamp(v - i).toFixed(3));
    });
  }
  tasks.push({ measure, update });
}

/* Closing: the amber horizon runs from the photograph to the text ---------- */

function closing() {
  const box = $("[data-closing]");
  if (!box) return;
  const fig = $(".dusk", box);
  const text = $(".closing-text", box);
  const HORIZON = 0.575;   // where the horizon sits in the photograph
  let lineTop = 0, on = false;

  function measure() {
    box.style.setProperty("--text-pad", "0px");
    box.style.setProperty("--fig-pad", "0px");
    box.classList.remove("has-line");
    on = false;
    const fr = fig.getBoundingClientRect();
    const br = box.getBoundingClientRect();
    const tr = text.getBoundingClientRect();
    const sideBySide = fr.left > tr.right - 1;
    if (!sideBySide || fr.height < 10) return;
    // Sit the text just above the photograph's horizon: pad the text down if
    // there is room, otherwise lower the photograph.
    let horizon = fr.top - br.top + fr.height * HORIZON;
    const room = horizon - tr.height - 28;
    if (room >= 0) box.style.setProperty("--text-pad", room.toFixed(1) + "px");
    else { box.style.setProperty("--fig-pad", (-room).toFixed(1) + "px"); horizon -= room; }
    const padL = parseFloat(getComputedStyle(box).paddingLeft) || 0;
    box.style.setProperty("--horizon", horizon.toFixed(1) + "px");
    box.style.setProperty("--line-l", padL.toFixed(1) + "px");
    box.style.setProperty("--line-w", Math.max(0, fr.left - br.left - padL).toFixed(1) + "px");
    box.classList.add("has-line");
    lineTop = docTop(box) + horizon;
    on = true;
  }
  function update(y) {
    if (!on || !MOTION) return;
    const p = clamp((y + vh * 0.9 - lineTop) / (vh * 0.4));
    box.style.setProperty("--draw", smooth(p).toFixed(3));
  }
  tasks.push({ measure, update });
}

/* Start ----------------------------------------------------------------------- */

dock();
rail();
dive();
clip();
pipeline();
tours();
route();
closing();

measureAll();
window.addEventListener("scroll", queue, { passive: true });
window.addEventListener("resize", remeasure);
window.addEventListener("load", measureAll);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(measureAll);
if ("ResizeObserver" in window) new ResizeObserver(remeasure).observe(document.body);
