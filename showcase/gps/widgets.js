/* Interactive figures for "How GPS Knows Where You Are". Each widget registers a self-test (L.test).
   Units in the 2-D toy world: positions in km, clock error b in microseconds (µs). */
const C = (v) => L.css(v);
const LIGHT_KM_PER_US = 0.299792458;            // c = 299,792,458 m/s = 0.299792458 km per µs
const TX_COLORS = ["--blue", "--purple", "--green", "--amber"];
const TX_NAMES = ["A", "B", "C", "D"];
const DEMO = /[?&]demo\b/.test(location.search);   // ?demo: show each widget in its most telling state (used for previews)
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

/* ---------- shared helpers ---------- */
/** Text with a halo in the surface colour, so labels stay readable over lines. */
function label(P, x, y, s, attrs = {}, parent = P.root) {
  const t = P.text(x, y, s, Object.assign({ "font-size": 13, fill: C("--ink"), stroke: C("--surface"), "stroke-width": 4,
    "paint-order": "stroke", "stroke-linejoin": "round" }, attrs), parent);
  t.removeAttribute("class"); t.style.font = `${attrs["font-weight"] || 500} ${attrs["font-size"] || 13}px var(--sans)`;
  return t;
}
/** Circle in data coordinates (needs an equal-aspect plot). */
function circle(P, cx, cy, r, attrs, parent = P.root) {
  const k = P.X(1) - P.X(0);
  return L.el("circle", Object.assign({ cx: P.X(cx), cy: P.Y(cy), r: Math.max(0, r * k), fill: "none" }, attrs), parent);
}
/** Solve A x = y (small dense system) by Gaussian elimination with partial pivoting. */
function linsolve(A, y) {
  const n = y.length, M = A.map((row, i) => [...row, y[i]]);
  for (let c = 0; c < n; c++) {
    let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    [M[c], M[p]] = [M[p], M[c]];
    if (Math.abs(M[c][c]) < 1e-14) return null;
    for (let r = c + 1; r < n; r++) { const f = M[r][c] / M[c][c]; for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k]; }
  }
  const x = new Array(n).fill(0);
  for (let r = n - 1; r >= 0; r--) { let s = M[r][n]; for (let k = r + 1; k < n; k++) s -= M[r][k] * x[k]; x[r] = s / M[r][r]; }
  return x;
}
/** One Gauss–Newton step for pseudoranges rho_i = |p - s_i| + cb·b. u = [x, y, b].
    Rows of the Jacobian: (unit vector from s_i to the guess, cb). Least squares via normal equations. */
function gnStep(S, rho, u, cb = LIGHT_KM_PER_US, fixB = false) {
  const H = [], r = [];
  S.forEach((s, i) => {
    const d = Math.max(1e-9, dist([u[0], u[1]], s));
    const row = [(u[0] - s[0]) / d, (u[1] - s[1]) / d]; if (!fixB) row.push(cb);
    H.push(row); r.push(rho[i] - (d + cb * u[2]));
  });
  const m = H[0].length, N = Array.from({ length: m }, () => new Array(m).fill(0)), g = new Array(m).fill(0);
  H.forEach((row, i) => { for (let a = 0; a < m; a++) { g[a] += row[a] * r[i]; for (let b = 0; b < m; b++) N[a][b] += row[a] * row[b]; } });
  const dx = linsolve(N, g); if (!dx) return null;
  return [u[0] + dx[0], u[1] + dx[1], fixB ? u[2] : u[2] + dx[2]];
}
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/* =====================================================================================
   1. Time of flight → a circle around the satellite (to scale)
   ===================================================================================== */
L.onReady(() => {
  const fig = document.getElementById("w-tof"), svg = fig.querySelector("svg");
  const RE = 6.371, ALT = 20.2, S = RE + ALT;                  // thousands of km
  const HORIZON = Math.sqrt(S * S - RE * RE);                  // 25.796 thousand km
  let tms = 72, wave = null, anim = null;
  const st = { visible: 0 };
  function draw() {
    svg.innerHTML = "";
    const P = L.plot(svg, { xmin: -31, xmax: 31, ymin: -8, ymax: 29.5, w: 760, h: 460, pad: 18, grid: false, equal: true });
    svg.querySelectorAll(".svg-axis").forEach((e) => e.remove());   // no axes: this is a scale drawing, not a graph
    const d = LIGHT_KM_PER_US * tms;                           // km per µs × ms = thousand km
    // Earth and orbit
    circle(P, 0, 0, RE, { fill: C("--muted"), "fill-opacity": 0.16, stroke: C("--muted"), "stroke-width": 1.5 });
    circle(P, 0, 0, S, { stroke: C("--rule"), "stroke-width": 1.5, "stroke-dasharray": "3 6" });
    label(P, 0, -3.2, "Earth (radius 6,371 km)", { "text-anchor": "middle", fill: C("--muted") });
    label(P, 25.4, -3.6, "GPS orbit, 20,200 km up", { "text-anchor": "end", fill: C("--muted") });
    // horizon lines from the satellite (tangent to Earth)
    // tangent points: the radius to them is perpendicular to the line of sight, at angle acos(RE/S) from vertical
    const tan = (sgn) => { const a = Math.PI / 2 + sgn * Math.acos(RE / S); return [RE * Math.cos(a), RE * Math.sin(a)]; };
    for (const sg of [1, -1]) { const [hx, hy] = tan(sg); P.line(0, S, hx, hy, { stroke: C("--muted"), "stroke-width": 1, "stroke-dasharray": "2 4", "stroke-opacity": 0.7 }); }
    // the measured-distance circle (or the expanding wavefront while animating)
    const shownR = wave === null ? d : wave;
    circle(P, 0, S, shownR, { stroke: C("--blue"), "stroke-width": 2.5, "stroke-dasharray": wave === null ? "8 6" : "none" });
    // intersections with the surface
    st.visible = 0;
    if (wave === null) {
      const y = (RE * RE - d * d + S * S) / (2 * S);
      if (Math.abs(y) <= RE) {
        const x = Math.sqrt(RE * RE - y * y), hidden = d > HORIZON;
        for (const sx of [x, -x]) {
          P.dot(sx, y, 7, hidden ? { fill: C("--surface"), stroke: C("--muted"), "stroke-width": 2 } : { fill: C("--accent"), stroke: C("--surface"), "stroke-width": 2 });
          if (!hidden) st.visible++;
        }
        if (!hidden) {
          P.line(0, S, x, y, { stroke: C("--accent"), "stroke-width": 1.5 });
          label(P, x / 2 + 0.8, (S + y) / 2, "d = " + Math.round(d * 1000).toLocaleString("en-US") + " km", { fill: C("--accent") });
          label(P, -x - 1, y - 1.6, "possible positions", { "text-anchor": "end", fill: C("--accent") });
        } else label(P, 0, 4.2, "the circle only meets the ground behind the Earth's curve", { "text-anchor": "middle", fill: C("--muted") });
      } else if (d < ALT) label(P, 0, 4.2, "too short: the circle doesn't reach the ground", { "text-anchor": "middle", fill: C("--muted") });
    }
    // satellite
    P.dot(0, S, 8, { fill: C("--blue"), stroke: C("--surface"), "stroke-width": 2 });
    label(P, 1.2, S + 0.3, "satellite", { fill: C("--blue"), "font-weight": 600 });
    document.getElementById("tof-tv").textContent = tms.toFixed(2);
    document.getElementById("tof-d").textContent = Math.round(d * 1000).toLocaleString("en-US");
    fig.dataset.visible = st.visible;
  }
  const sl = document.getElementById("tof-t");
  L.slider(sl, (v) => { tms = v; if (anim) { cancelAnimationFrame(anim); anim = null; wave = null; } draw(); });
  document.getElementById("tof-play").onclick = () => {
    if (anim) cancelAnimationFrame(anim);
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { wave = null; draw(); return; }
    const t0 = performance.now(), dur = tms * 50, d = LIGHT_KM_PER_US * tms;   // slowed down 50×
    const step = (t) => { const u = Math.min(1, (t - t0) / dur); wave = u * d; draw();
      if (u < 1) anim = requestAnimationFrame(step); else { wave = null; anim = null; draw(); } };
    anim = requestAnimationFrame(step);
  };
  L.onTheme.push(draw);
  L.test("time of flight: 67.38 ms ↦ ≈20,200 km; 75 ms gives two visible ground points", () => {
    sl.value = "67.38"; sl.dispatchEvent(new Event("input"));
    const km = parseFloat(document.getElementById("tof-d").textContent.replace(/,/g, ""));
    sl.value = "75"; sl.dispatchEvent(new Event("input"));
    const two = fig.dataset.visible === "2";
    sl.value = "88"; sl.dispatchEvent(new Event("input"));
    const none = fig.dataset.visible === "0";
    sl.value = "72"; sl.dispatchEvent(new Event("input"));
    return Math.abs(km - 20200) < 5 && two && none;
  });
});

/* =====================================================================================
   2. Draggable trilateration (perfect clocks)
   ===================================================================================== */
L.onReady(() => {
  const fig = document.getElementById("w-tri"), svg = fig.querySelector("svg");
  const T = [[8, 34], [54, 36], [30, 4]], phone = [34, 22];
  let n = 3;
  const P = L.plot(svg, { xmin: 0, xmax: 64, ymin: 0, ymax: 40, w: 760, h: 502, equal: true });
  const g = P.layer(), top = P.layer();
  /** The two crossings of circles (c1, r1) and (c2, r2), or [] if none. */
  function crossings(c1, r1, c2, r2) {
    const D = dist(c1, c2); if (D < 1e-9 || D > r1 + r2 + 1e-9 || D < Math.abs(r1 - r2) - 1e-9) return [];
    const a = (r1 * r1 - r2 * r2 + D * D) / (2 * D), h = Math.sqrt(Math.max(0, r1 * r1 - a * a));
    const mx = c1[0] + a * (c2[0] - c1[0]) / D, my = c1[1] + a * (c2[1] - c1[1]) / D;
    return [[mx + h * (c2[1] - c1[1]) / D, my - h * (c2[0] - c1[0]) / D], [mx - h * (c2[1] - c1[1]) / D, my + h * (c2[0] - c1[0]) / D]];
  }
  /** Three circles → one point: subtracting circle equations pairwise cancels x² and y², leaving two linear equations. */
  function solve3(Ts, ds) {
    const [[x1, y1], [x2, y2], [x3, y3]] = Ts, [d1, d2, d3] = ds;
    const A = [[2 * (x2 - x1), 2 * (y2 - y1)], [2 * (x3 - x1), 2 * (y3 - y1)]];
    const y = [d1 * d1 - d2 * d2 + x2 * x2 - x1 * x1 + y2 * y2 - y1 * y1, d1 * d1 - d3 * d3 + x3 * x3 - x1 * x1 + y3 * y3 - y1 * y1];
    return linsolve(A, y);
  }
  function draw() {
    g.clear(); top.clear();
    const ds = T.map((t) => dist(t, phone));
    for (let i = 0; i < n; i++) {
      circle(P, T[i][0], T[i][1], ds[i], { stroke: C(TX_COLORS[i]), "stroke-width": 2.5 }, g);
      P.line(T[i][0], T[i][1], phone[0], phone[1], { stroke: C(TX_COLORS[i]), "stroke-width": 1, "stroke-dasharray": "3 4", "stroke-opacity": 0.8 }, g);
    }
    let cands = [], msg;
    if (n === 1) msg = "infinitely many (the whole circle)";
    else if (n === 2) { cands = crossings(T[0], ds[0], T[1], ds[1]); msg = String(cands.length); }
    else { const p = solve3(T, ds); cands = p ? [p] : []; msg = p ? "1" : "ambiguous (transmitters in a line)"; }
    cands.forEach((c) => P.dot(c[0], c[1], 11, { fill: "none", stroke: C("--accent"), "stroke-width": 3 }, top));
    document.getElementById("tri-count").textContent = msg;
    fig.dataset.cands = JSON.stringify(cands);
    // phone
    const ph = P.dot(phone[0], phone[1], 7, { fill: C("--ink"), stroke: C("--surface"), "stroke-width": 2 }, top);
    label(P, phone[0] + 1.3, phone[1] - 1.9, "phone", { "font-weight": 600 }, top);
    P.drag(ph, (x, y) => { phone[0] = clamp(x, 1, 63); phone[1] = clamp(y, 1, 39); draw(); });
    T.forEach((t, i) => {
      const on = i < n;
      const d = P.dot(t[0], t[1], 10, { fill: on ? C(TX_COLORS[i]) : C("--surface"), stroke: on ? C("--surface") : C("--muted"), "stroke-width": 2 }, top);
      label(P, t[0], t[1] + 2, TX_NAMES[i], { "text-anchor": "middle", "font-weight": 700, fill: on ? C(TX_COLORS[i]) : C("--muted") }, top);
      P.drag(d, (x, y) => { t[0] = clamp(x, 1, 63); t[1] = clamp(y, 1, 39); draw(); });
    });
    label(P, 1, 1.2, "toy world, km (illustrative)", { fill: C("--muted"), "font-size": 12 }, top);
  }
  fig.querySelectorAll('input[name="tri-n"]').forEach((r) => r.addEventListener("change", () => { n = +r.value; draw(); }));
  draw(); L.onTheme.push(draw);
  L.test("trilateration: 3 circles recover the phone, 2 circles give 2 candidates", () => {
    const ds = T.map((t) => dist(t, phone)), p = solve3(T, ds);
    const r2 = fig.querySelector('input[name="tri-n"][value="2"]'); r2.checked = true; r2.dispatchEvent(new Event("change"));
    const c2 = JSON.parse(fig.dataset.cands);
    const okTwo = c2.length === 2 && c2.every((c) => Math.abs(dist(c, T[0]) - ds[0]) < 1e-6 && Math.abs(dist(c, T[1]) - ds[1]) < 1e-6);
    const r3 = fig.querySelector('input[name="tri-n"][value="3"]'); r3.checked = true; r3.dispatchEvent(new Event("change"));
    return dist(p, phone) < 1e-6 && okTwo;
  });
});

/* =====================================================================================
   3. Clock error: every circle inflated by the same c·b, and they stop meeting
   ===================================================================================== */
L.onReady(() => {
  const fig = document.getElementById("w-clock"), svg = fig.querySelector("svg");
  const T = [[8, 34], [54, 36], [30, 4]], phone = [34, 22];
  let b = 6;
  const P = L.plot(svg, { xmin: 0, xmax: 64, ymin: 0, ymax: 40, w: 760, h: 502, equal: true });
  const g = P.layer(), top = P.layer();
  function draw() {
    g.clear(); top.clear();
    const cb = LIGHT_KM_PER_US * b;
    T.forEach((t, i) => {
      const d = dist(t, phone);
      circle(P, t[0], t[1], d, { stroke: C(TX_COLORS[i]), "stroke-width": 1.5, "stroke-dasharray": "4 5", "stroke-opacity": 0.75 }, g);
      circle(P, t[0], t[1], d + cb, { stroke: C(TX_COLORS[i]), "stroke-width": 2.75, class: "pr" }, g);
    });
    P.dot(phone[0], phone[1], 7, { fill: C("--ink"), stroke: C("--surface"), "stroke-width": 2 }, top);
    label(P, phone[0] + 1.3, phone[1] - 1.9, "phone (true position)", { "font-weight": 600 }, top);
    T.forEach((t, i) => { P.dot(t[0], t[1], 9, { fill: C(TX_COLORS[i]), stroke: C("--surface"), "stroke-width": 2 }, top);
      label(P, t[0], t[1] + 2, TX_NAMES[i], { "text-anchor": "middle", "font-weight": 700, fill: C(TX_COLORS[i]) }, top); });
    label(P, 63, 2.9, "solid: pseudoranges ρ = d + c·b", { "font-size": 12.5, "text-anchor": "end" }, top);
    label(P, 63, 1.1, "dashed: true distances d", { "font-size": 12.5, fill: C("--muted"), "text-anchor": "end" }, top);
    document.getElementById("clk-cb").textContent = (cb >= 0 ? "+" : "−") + Math.abs(cb).toFixed(2);
  }
  const sl = document.getElementById("clk-b");
  L.slider(sl, (v) => { b = v; draw(); }, (v) => (v > 0 ? "+" : v < 0 ? "−" : "") + Math.abs(v).toFixed(1));
  L.onTheme.push(draw);
  /** Best single point for the circles, ignoring the clock: least-squares fit of |p - s_i| = rho_i. */
  function bestMiss(bias) {
    const rho = T.map((t) => dist(t, phone) + LIGHT_KM_PER_US * bias);
    let u = [30, 25, 0]; for (let k = 0; k < 30; k++) { const n = gnStep(T, rho, u, LIGHT_KM_PER_US, true); if (n) u = n; }
    return Math.hypot(...T.map((t, i) => dist(t, [u[0], u[1]]) - rho[i]));
  }
  L.test("clock error: circles meet at b = 0, and no point fits all three at b = 6 µs", () => {
    sl.value = "6"; sl.dispatchEvent(new Event("input"));
    const r = [...g.querySelectorAll("circle.pr")].map((c) => +c.getAttribute("r"));
    return r.length === 3 && bestMiss(0) < 1e-6 && bestMiss(6) > 0.3;
  });
});

/* =====================================================================================
   4. Solve for the clock error: animated Gauss–Newton iterations
   ===================================================================================== */
L.onReady(() => {
  const fig = document.getElementById("w-solve"), svg = fig.querySelector("svg");
  const T = [[8, 34], [54, 36], [30, 4]], phone = [34, 22];
  let bTrue = 10, hist, shown, anim = null;            // hist: list of guesses [x, y, b]; shown: interpolated guess
  const table = document.createElement("div"); table.className = "sol-table"; fig.insertBefore(table, fig.querySelector(".controls-row"));
  const P = L.plot(svg, { xmin: 0, xmax: 64, ymin: 0, ymax: 40, w: 760, h: 502, equal: true });
  const g = P.layer(), top = P.layer();
  const rhos = () => T.map((t) => dist(t, phone) + LIGHT_KM_PER_US * bTrue);
  function reset() {
    if (anim) { cancelAnimationFrame(anim); anim = null; }
    hist = [[(T[0][0] + T[1][0] + T[2][0]) / 3, (T[0][1] + T[1][1] + T[2][1]) / 3, 0]]; shown = hist[0].slice(); draw();
  }
  const converged = () => hist.length > 1 && Math.hypot(hist.at(-1)[0] - hist.at(-2)[0], hist.at(-1)[1] - hist.at(-2)[1]) < 1e-7;
  function step() { const n = gnStep(T, rhos(), hist.at(-1)); if (n) hist.push(n); return n; }
  function fmtErr(km) { const m = km * 1000; return m >= 1000 ? (m / 1000).toFixed(2) + " km" : m >= 10 ? m.toFixed(0) + " m" : m >= 0.01 ? m.toFixed(2) + " m" : "< 1 cm"; }
  function draw() {
    g.clear(); top.clear();
    const rho = rhos(), cb = LIGHT_KM_PER_US * shown[2];
    T.forEach((t, i) => circle(P, t[0], t[1], Math.max(0, rho[i] - cb), { stroke: C(TX_COLORS[i]), "stroke-width": 2.75 }, g));
    // trail of guesses
    if (hist.length > 1) {
      let d = ""; hist.forEach((h, i) => (d += (i ? "L" : "M") + P.X(h[0]).toFixed(1) + "," + P.Y(h[1]).toFixed(1)));
      L.el("path", { d, fill: "none", stroke: C("--accent"), "stroke-width": 1.5, "stroke-dasharray": "4 4" }, g);
      hist.slice(0, -1).forEach((h) => P.dot(h[0], h[1], 3.5, { fill: C("--accent") }, g));
    }
    P.dot(phone[0], phone[1], 7, { fill: C("--ink"), stroke: C("--surface"), "stroke-width": 2 }, top).classList.add("phone");
    label(P, phone[0] + 1.3, phone[1] - 1.9, "phone", { "font-weight": 600 }, top);
    const X = P.X(shown[0]), Y = P.Y(shown[1]), k = 9;
    L.el("path", { d: `M${X - k},${Y - k}L${X + k},${Y + k}M${X - k},${Y + k}L${X + k},${Y - k}`, stroke: C("--accent"), "stroke-width": 3.5, "stroke-linecap": "round" }, top);
    label(P, shown[0] - 1.3, shown[1] + 1.6, "guess", { fill: C("--accent"), "font-weight": 600, "text-anchor": "end" }, top);
    T.forEach((t, i) => { const d = P.dot(t[0], t[1], 9, { fill: C(TX_COLORS[i]), stroke: C("--surface"), "stroke-width": 2 }, top);
      label(P, t[0], t[1] + 2, TX_NAMES[i], { "text-anchor": "middle", "font-weight": 700, fill: C(TX_COLORS[i]) }, top);
      P.drag(d, (x, y) => { t[0] = clamp(x, 1, 63); t[1] = clamp(y, 1, 39); reset(); }); });
    P.drag(top.querySelector(".phone"), (x, y) => { phone[0] = clamp(x, 1, 63); phone[1] = clamp(y, 1, 39); reset(); });
    label(P, 63, 1.1, "circles: ρ − c·(guessed b)", { "font-size": 12.5, "text-anchor": "end" }, top);
    // iteration table
    const rows = hist.map((h, i) => `<tr><td>${i}</td><td>${h[0].toFixed(3)}</td><td>${h[1].toFixed(3)}</td><td>${h[2].toFixed(3)}</td><td>${fmtErr(dist(h, phone))}</td></tr>`).join("");
    table.innerHTML = `<table><thead><tr><th>step</th><th>x (km)</th><th>y (km)</th><th>b (µs)</th><th>position error</th></tr></thead><tbody>${rows}</tbody></table>`;
    const last = hist.at(-1);
    document.getElementById("sol-msg").textContent = hist.length === 1
      ? "Start: the centre of the transmitters, with b = 0. The circles don't meet."
      : converged() ? `Converged after ${hist.length - 2} steps: clock error ${last[2].toFixed(3)} µs (true ${bTrue.toFixed(1)}), position error ${fmtErr(dist(last, phone))}.`
      : `Step ${hist.length - 1}: guessed clock error ${last[2].toFixed(3)} µs, position error ${fmtErr(dist(last, phone))}.`;
  }
  function animateTo(from, to, done) {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { shown = to.slice(); draw(); done && done(); return; }
    const t0 = performance.now();
    const f = (t) => { const u = Math.min(1, (t - t0) / 650), e = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
      shown = from.map((v, i) => v + (to[i] - v) * e); draw();
      if (u < 1) anim = requestAnimationFrame(f); else { anim = null; done && done(); } };
    anim = requestAnimationFrame(f);
  }
  document.getElementById("sol-step").onclick = () => { if (anim || converged() || hist.length > 12) return; const prev = hist.at(-1); if (step()) animateTo(prev, hist.at(-1)); };
  document.getElementById("sol-run").onclick = () => {
    if (anim) return; if (converged() || hist.length > 1) reset();
    const go = () => { if (converged() || hist.length > 12) return; const prev = hist.at(-1); if (step()) animateTo(prev, hist.at(-1), () => setTimeout(go, 250)); };
    go();
  };
  document.getElementById("sol-reset").onclick = reset;
  L.slider(document.getElementById("sol-b"), (v) => { bTrue = v; reset(); }, (v) => (v > 0 ? "+" : v < 0 ? "−" : "") + Math.abs(v).toFixed(1));
  L.onTheme.push(draw);
  if (DEMO) { while (!converged() && hist.length < 10) step(); shown = hist.at(-1).slice(); draw(); }
  L.test("solver recovers position and clock error from a 10 µs bias in ≤ 6 steps", () => {
    const s = document.getElementById("sol-b"); s.value = "10"; s.dispatchEvent(new Event("input"));
    let k = 0; while (!converged() && k < 10) { step(); k++; }
    const last = hist.at(-1), ok = k <= 6 && dist(last, phone) < 1e-6 && Math.abs(last[2] - 10) < 1e-6;
    reset(); return ok;
  });
});

/* =====================================================================================
   5. Dilution of precision: geometry vs. noise, by simulation
   ===================================================================================== */
L.onReady(() => {
  const fig = document.getElementById("w-dop"), svg = fig.querySelector("svg");
  const PRESETS = {
    spread: [[100, 40], [215, 38], [335, 42], [40, 36]],
    cluster: [[50, 40], [70, 34], [90, 42], [110, 37]],   // HDOP ≈ 8.5 (spread: ≈ 1.04)
  };
  const polar = ([deg, r]) => [r * Math.cos(deg * Math.PI / 180), r * Math.sin(deg * Math.PI / 180)];
  let T = PRESETS.spread.map(polar), sigma = 3, seed = 7;
  const ERR = 30;                                                     // right panel half-width, metres
  const NS = 300;
  function rng(s) { return () => { s |= 0; s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const gauss = (r) => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
  /** Q = (HᵀH)⁻¹ for rows (u_x, u_y, 1): the clock column in distance units. */
  function Qmat() {
    const N = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
    T.forEach((t) => { const d = Math.hypot(...t), row = [-t[0] / d, -t[1] / d, 1];
      for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) N[a][b] += row[a] * row[b]; });
    const cols = [0, 1, 2].map((j) => linsolve(N, [0, 1, 2].map((i) => +(i === j))));
    return cols.some((c) => !c) ? null : [0, 1, 2].map((i) => cols.map((c) => c[i]));
  }
  /** Simulate fixes: ranges in metres to transmitters at km positions, true phone at the origin, clock b = 0. */
  function simulate() {
    const r = rng(seed), S = T.map((t) => [t[0] * 1000, t[1] * 1000]), out = [];
    for (let k = 0; k < NS; k++) {
      const rho = S.map((s) => Math.hypot(...s) + sigma * gauss(r));
      let u = [0, 0, 0]; for (let it = 0; it < 4; it++) { const n = gnStep(S, rho, u, 1); if (n) u = n; }
      out.push([u[0], u[1]]);
    }
    return out;
  }
  let pts = [], Q = null;
  function draw() {
    svg.innerHTML = ""; svg.setAttribute("viewBox", "0 0 760 400");
    const left = L.el("svg", { x: 0, y: 0, width: 380, height: 400 }, svg), right = L.el("svg", { x: 380, y: 0, width: 380, height: 400 }, svg);
    const A = L.plot(left, { xmin: -50, xmax: 50, ymin: -50, ymax: 50, w: 380, h: 400, pad: 24, equal: true, grid: false });
    const B = L.plot(right, { xmin: -ERR, xmax: ERR, ymin: -ERR, ymax: ERR, w: 380, h: 400, pad: 24, equal: true });
    // left: geometry (no axes: only directions matter here)
    left.querySelectorAll(".svg-axis").forEach((e) => e.remove());
    L.el("rect", { x: 24, y: 24, width: 332, height: 352, fill: "none", stroke: C("--rule") }, left);
    T.forEach((t, i) => A.line(0, 0, t[0], t[1], { stroke: C(TX_COLORS[i]), "stroke-width": 1.5, "stroke-dasharray": "4 4" }));
    A.dot(0, 0, 7, { fill: C("--ink"), stroke: C("--surface"), "stroke-width": 2 });
    label(A, 2, -5, "phone", { "font-weight": 600 });
    T.forEach((t, i) => { const d = A.dot(t[0], t[1], 10, { fill: C(TX_COLORS[i]), stroke: C("--surface"), "stroke-width": 2 });
      label(A, t[0], t[1] + 4.2, TX_NAMES[i], { "text-anchor": "middle", "font-weight": 700, fill: C(TX_COLORS[i]) });
      A.drag(d, (x, y) => { const r = Math.hypot(x, y); if (r < 8) { x *= 8 / Math.max(r, 1e-6); y *= 8 / Math.max(r, 1e-6); }
        t[0] = clamp(x, -47, 47); t[1] = clamp(y, -47, 47); recompute(); }); });
    label(A, -47, -47, "geometry (km, illustrative)", { fill: C("--muted"), "font-size": 12 });
    // right: error cloud in metres (grid every 10 m; tick numbers would hide under the dots)
    right.querySelectorAll(".svg-tick").forEach((e) => e.remove());
    L.el("rect", { x: B.X(B.xmin), y: B.Y(B.ymax), width: B.X(B.xmax) - B.X(B.xmin), height: B.Y(B.ymin) - B.Y(B.ymax), fill: "none", stroke: C("--rule") }, right);
    let outside = 0;
    pts.forEach(([x, y]) => { if (Math.abs(x) > ERR || Math.abs(y) > ERR) outside++;
      B.dot(x, y, 2.6, { fill: C("--accent"), "fill-opacity": 0.55 }); });
    if (Q) {   // 95% ellipse of the position covariance σ²·Q[0:2,0:2]
      const a = Q[0][0], b = Q[0][1], d = Q[1][1], tr = (a + d) / 2, det = Math.sqrt(Math.max(0, ((a - d) / 2) ** 2 + b * b));
      const l1 = tr + det, l2 = Math.max(0, tr - det), ang = Math.atan2(l1 - a, b || 1e-12);
      const k = 2.4477 * sigma, sc = B.X(1) - B.X(0);   // sqrt(chi²₂(0.95)) = 2.4477
      L.el("ellipse", { cx: B.X(0), cy: B.Y(0), rx: k * Math.sqrt(l1) * sc, ry: k * Math.sqrt(l2) * sc,
        transform: `rotate(${-ang * 180 / Math.PI} ${B.X(0)} ${B.Y(0)})`, fill: "none", stroke: C("--ink"), "stroke-width": 1.75 }, B.root);
    }
    B.dot(0, 0, 4, { fill: C("--ink") });
    label(B, B.xmin + 1.5, B.ymax - 3.2, "position errors (grid: 10 m)", { "font-size": 12.5 });
    const note = L.el("text", { x: 190, y: 393, "text-anchor": "middle", class: "svg-tick" }, right);
    note.style.fill = outside ? C("--red") : C("--muted");
    note.textContent = outside ? `${outside} of ${NS} fixes fall outside this frame` : `all ${NS} fixes inside the frame`;
    const hd = Q ? Math.sqrt(Q[0][0] + Q[1][1]) : Infinity;
    const rms = Math.sqrt(pts.reduce((s, [x, y]) => s + x * x + y * y, 0) / Math.max(1, pts.length));
    document.getElementById("dop-h").textContent = isFinite(hd) ? hd.toFixed(2) : "∞";
    document.getElementById("dop-pred").textContent = isFinite(hd) ? (hd * sigma).toFixed(1) : "∞";
    document.getElementById("dop-rms").textContent = rms.toFixed(1);
    fig.dataset.hdop = hd; fig.dataset.rms = rms;
  }
  function recompute() { Q = Qmat(); pts = Q ? simulate() : []; draw(); }
  document.getElementById("dop-spread").onclick = () => { T = PRESETS.spread.map(polar); recompute(); };
  document.getElementById("dop-cluster").onclick = () => { T = PRESETS.cluster.map(polar); recompute(); };
  document.getElementById("dop-resample").onclick = () => { seed++; recompute(); };
  L.slider(document.getElementById("dop-sig"), (v) => { sigma = v; recompute(); }, (v) => v.toFixed(1));
  L.onTheme.push(draw);
  if (DEMO) document.getElementById("dop-cluster").click();
  L.test("DOP: clustered geometry amplifies noise; simulation agrees with HDOP·σ", () => {
    document.getElementById("dop-spread").click();
    const hs = +fig.dataset.hdop, rs = +fig.dataset.rms, agree = Math.abs(rs / (hs * sigma) - 1) < 0.2;
    document.getElementById("dop-cluster").click();
    const hc = +fig.dataset.hdop, rc = +fig.dataset.rms;
    document.getElementById("dop-spread").click();
    return agree && hc > 4 * hs && rc > 4 * rs;
  });
});

/* =====================================================================================
   6. Relativity: clock-rate offset vs. orbit altitude (computed from the formulas)
   ===================================================================================== */
L.onReady(() => {
  const fig = document.getElementById("w-rel"), svg = fig.querySelector("svg");
  const GM = 3.986004418e14, RE = 6.371e6, c = 299792458, DAY_US = 86400e6;
  const gr = (hkm) => GM * (1 / RE - 1 / (RE + hkm * 1e3)) / (c * c) * DAY_US;      // µs/day, gravity (faster)
  const sr = (hkm) => -GM / (RE + hkm * 1e3) / (2 * c * c) * DAY_US;               // µs/day, speed (slower)
  const net = (h) => gr(h) + sr(h);
  let alt = 20200;
  function draw() {
    svg.innerHTML = "";
    const P = L.plot(svg, { xmin: 0, xmax: 41, ymin: -36, ymax: 62, w: 760, h: 420, pad: 44 });
    // altitude tick labels belong at the bottom edge, not on the zero line where the curves cross
    svg.querySelectorAll('text.svg-tick[text-anchor="middle"]').forEach((t) => t.setAttribute("y", 420 - 44 + 18));
    const k = (f) => (x) => f(x * 1000);
    P.fn(k(gr), { stroke: C("--purple"), "stroke-width": 2.5 });
    P.fn(k(sr), { stroke: C("--blue"), "stroke-width": 2.5 });
    P.fn(k(net), { stroke: C("--accent"), "stroke-width": 3.5 });
    // reference altitudes
    const refs = [[0.4, "ISS ≈ 400 km", "start"], [20.2, "GPS 20,200 km", "middle"], [35.786, "geostationary", "middle"]];
    refs.forEach(([x, s, anc]) => { P.line(x, -36, x, 62, { stroke: C("--muted"), "stroke-width": 1, "stroke-dasharray": "2 4" });
      label(P, x + (anc === "start" ? 0.5 : 0), 57.5, s, { "text-anchor": anc, fill: C("--muted"), "font-size": 12 }); });
    label(P, 28, gr(28000) + 3, "gravity: runs fast", { "text-anchor": "middle", fill: C("--purple"), "font-weight": 600 });
    label(P, 28, sr(28000) - 5.5, "speed: runs slow", { "text-anchor": "middle", fill: C("--blue"), "font-weight": 600 });
    label(P, 28, net(28000) - 6, "net effect", { "text-anchor": "middle", fill: C("--accent"), "font-weight": 700 });
    label(P, 3.8, -4.5, "cancel ≈ 3,200 km", { fill: C("--muted"), "font-size": 12 });
    P.dot(3.186, 0, 4, { fill: C("--muted") });
    // current altitude
    const x = alt / 1000;
    P.line(x, -36, x, 62, { stroke: C("--ink"), "stroke-width": 1.5 });
    [[gr, "--purple"], [sr, "--blue"], [net, "--accent"]].forEach(([f, col]) => P.dot(x, f(alt), 6, { fill: C(col), stroke: C("--surface"), "stroke-width": 2 }));
    // axis titles (outside the clip region)
    const U = P.unclipped();
    L.el("text", { x: 716, y: 414, "text-anchor": "end", class: "svg-tick" }, U).textContent = "orbit altitude (thousand km) →";
    L.el("text", { x: 50, y: 30, class: "svg-tick" }, U).textContent = "↑ clock gain vs. ground (µs per day)";
    const sgn = (v) => (v >= 0 ? "+" : "−") + Math.abs(v).toFixed(1);
    document.getElementById("rel-hv").textContent = alt.toLocaleString("en-US");
    document.getElementById("rel-gr").textContent = sgn(gr(alt));
    document.getElementById("rel-sr").textContent = sgn(sr(alt));
    document.getElementById("rel-net").textContent = sgn(net(alt));
    document.getElementById("rel-km").textContent = (Math.abs(net(alt)) * 1e-6 * c / 1000).toFixed(1);
  }
  const sl = document.getElementById("rel-h");
  L.slider(sl, (v) => { alt = v; draw(); });
  L.onTheme.push(draw);
  L.test("relativity: GPS ≈ +45.7 − 7.2 = +38.5 µs/day; effects cancel near 3,190 km", () => {
    sl.value = "20200"; sl.dispatchEvent(new Event("input"));
    const n = parseFloat(document.getElementById("rel-net").textContent.replace("−", "-"));
    let lo = 200, hi = 20000; for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; if (net(m) < 0) lo = m; else hi = m; }
    return Math.abs(n - 38.5) < 0.15 && Math.abs(gr(20200) - 45.7) < 0.1 && Math.abs(sr(20200) + 7.2) < 0.1 && Math.abs(lo - 3186) < 20;
  });
});
