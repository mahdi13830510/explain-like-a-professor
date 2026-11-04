/* Interactive figures for "The Derivative". Each widget registers a self-test (L.test). */
const s = (t) => 4.9 * t * t;
const C = (v) => L.css(v);

/* ---------- 1. Secant: drag two points ---------- */
L.onReady(() => {
  const fig = document.getElementById("w-secant");
  const P = L.plot(fig.querySelector("svg"), { xmin: 0, xmax: 3.4, ymin: 0, ymax: 55, h: 400 });
  const g = P.layer(), lab = P.layer();
  let a = 1, b = 2.5;
  const out = (id, v) => (document.getElementById(id).textContent = v);
  function draw() {
    g.clear(); lab.clear();
    P.fn(s, { stroke: C("--ink") }, g);
    const m = (s(b) - s(a)) / (b - a);
    P.line(0, s(a) - m * a, 3.4, s(a) + m * (3.4 - a), { stroke: C("--accent"), "stroke-width": 2.5 }, g);
    P.line(a, s(a), b, s(a), { stroke: C("--muted"), "stroke-dasharray": "4 4" }, g);
    P.line(b, s(a), b, s(b), { stroke: C("--muted"), "stroke-dasharray": "4 4" }, g);
    P.text((a + b) / 2, s(a) - 3, "Δt", { "text-anchor": "middle" }, lab);
    P.text(b + 0.05, (s(a) + s(b)) / 2, "Δs", {}, lab);
    P.text(3.3, 4, "time t (s)", { "text-anchor": "end" }, lab);
    P.text(0.06, 52, "distance fallen s (m)", {}, lab);
    for (const [t, which] of [[a, "a"], [b, "b"]]) {
      const d = P.dot(t, s(t), 9, { fill: C("--blue"), stroke: C("--surface"), "stroke-width": 2 }, g);
      P.drag(d, (x) => { x = Math.max(0.05, Math.min(3.3, x)); if (which === "a") { if (Math.abs(x - b) > 0.02) a = x; } else if (Math.abs(x - a) > 0.02) b = x; draw(); });
    }
    out("sec-dt", (b - a).toFixed(2)); out("sec-ds", (s(b) - s(a)).toFixed(2)); out("sec-m", m.toFixed(2));
  }
  draw(); L.onTheme.push(draw);
  L.test("secant slope equals 4.9·(a+b)", () => { const m = parseFloat(document.getElementById("sec-m").textContent); return Math.abs(m - 4.9 * (a + b)) < 0.02; });
});

/* ---------- 2. Limit: shrink h, secant → tangent ---------- */
L.onReady(() => {
  const fig = document.getElementById("w-limit");
  const P = L.plot(fig.querySelector("svg"), { xmin: 0, xmax: 3.4, ymin: 0, ymax: 55, h: 400 });
  const g = P.layer(); let h = 1;
  function draw() {
    g.clear();
    P.fn(s, { stroke: C("--ink") }, g);
    P.line(0.6, 19.6 - 19.6 * 1.4, 3.4, 19.6 + 19.6 * 1.4, { stroke: C("--green"), "stroke-dasharray": "7 6" }, g);
    const m = (s(2 + h) - s(2)) / h;
    P.line(0, s(2) - m * 2, 3.4, s(2) + m * 1.4, { stroke: C("--accent"), "stroke-width": 2.5 }, g);
    P.dot(2, s(2), 7, { fill: C("--blue") }, g);
    P.dot(2 + h, s(2 + h), 7, { fill: C("--accent") }, g);
    P.text(2.05, s(2) - 4, "t = 2", {}, g);
    P.text(0.1, 50, "dashed: tangent at t = 2 (slope 19.6)", { fill: C("--green") }, g);
    document.getElementById("lim-hv").textContent = L.fmt(h, 4);
    document.getElementById("lim-m").textContent = m.toFixed(4);
  }
  const sl = document.getElementById("lim-h");
  L.slider(sl, (v) => { h = Math.pow(10, v); draw(); });
  L.onTheme.push(draw);
  L.test("slope → 19.6 as h → 0.001", () => { sl.value = "-3"; sl.dispatchEvent(new Event("input"));
    return Math.abs(parseFloat(document.getElementById("lim-m").textContent) - 19.6049) < 1e-3; });
});

/* ---------- 3. Zoom: local linearity ---------- */
L.onReady(() => {
  const fig = document.getElementById("w-zoom"), svg = fig.querySelector("svg");
  const F = { sq: [(x) => x * x, (x) => 2 * x], sin: [Math.sin, Math.cos], abs: [Math.abs, (x) => (x === 0 ? NaN : Math.sign(x))] };
  const st = { f: "sq", a: 1, z: 1 };
  function draw() {
    svg.innerHTML = "";
    const [f, df] = F[st.f], a = st.a, y0 = f(a), w = 2.2 / st.z;
    const P = L.plot(svg, { xmin: a - w, xmax: a + w, ymin: y0 - w * 0.62, ymax: y0 + w * 0.62, h: 400, grid: false });
    const m = df(a), corner = st.f === "abs" && Math.abs(a) < 1e-9;
    if (!corner) P.line(a - w, y0 - m * w, a + w, y0 + m * w, { stroke: C("--green"), "stroke-dasharray": "7 6" });
    P.fn(f, { stroke: C("--blue"), "stroke-width": 3 }, P.root, 800);
    P.dot(a, y0, 6, { fill: C("--accent") });
    const msg = document.getElementById("zoom-msg");
    msg.textContent = corner ? "No tangent: slopes are −1 from the left and +1 from the right, at every zoom level."
      : `Tangent slope f′(${a.toFixed(2)}) = ${m.toFixed(3)}. Window width: ${L.fmt(2 * w, 3)}`;
    document.getElementById("zoom-zv").textContent = L.fmt(st.z, 1);
  }
  document.getElementById("zoom-f").onchange = (e) => { st.f = e.target.value; if (st.f === "abs") { const s2 = document.getElementById("zoom-a"); s2.value = "0"; s2.dispatchEvent(new Event("input")); } draw(); };
  L.slider(document.getElementById("zoom-a"), (v) => { st.a = v; draw(); }, (v) => v.toFixed(2));
  L.slider(document.getElementById("zoom-z"), (v) => { st.z = Math.pow(10, v); draw(); });
  L.onTheme.push(draw);
  L.test("zoom shows corner message for |x| at 0", () => { const sel = document.getElementById("zoom-f"); sel.value = "abs"; sel.dispatchEvent(new Event("change"));
    const ok = /No tangent/.test(document.getElementById("zoom-msg").textContent); sel.value = "sq"; sel.dispatchEvent(new Event("change")); return ok; });
});

/* ---------- 4. Growing square ---------- */
L.onReady(() => {
  const fig = document.getElementById("w-square"), svg = fig.querySelector("svg");
  let x = 2.5, h = 0.6;
  function draw() {
    svg.innerHTML = ""; svg.setAttribute("viewBox", "0 0 720 400");
    const k = 330 / 5.2, ox = 60, oy = 360;           // pixels per unit, origin bottom-left
    const R = (x0, y0, w, hh, fill, op = 1) => L.el("rect", { x: ox + x0 * k, y: oy - (y0 + hh) * k, width: w * k, height: hh * k, fill, "fill-opacity": op, stroke: C("--surface"), "stroke-width": 1.5 }, svg);
    R(0, 0, x, x, C("--muted"), 0.25);
    R(x, 0, h, x, C("--blue"), 0.75); R(0, x, x, h, C("--blue"), 0.75);
    R(x, x, h, h, C("--accent"), 0.9);
    const T = (px, py, t, extra = {}) => { const e = L.el("text", Object.assign({ x: px, y: py, class: "svg-tick", "font-size": 14 }, extra), svg); e.textContent = t; };
    T(ox + x * k / 2, oy - x * k / 2, "x² (old area)", { "text-anchor": "middle" });
    T(ox + (x + h) * k + 8, oy - x * k / 2, "x·h");
    T(ox + x * k / 2, oy - (x + h) * k - 8, "x·h", { "text-anchor": "middle" });
    T(ox + (x + h) * k + 8, oy - (x + h) * k + 4, "h²", { fill: C("--accent") });
    // right: bar comparing contributions per unit h
    const bx = 470, bw = 70, scale = 240 / 9;
    L.el("rect", { x: bx, y: 360 - 2 * x * scale, width: bw, height: 2 * x * scale, fill: C("--blue"), "fill-opacity": .75 }, svg);
    L.el("rect", { x: bx, y: 360 - (2 * x + h) * scale, width: bw, height: h * scale, fill: C("--accent"), "fill-opacity": .9 }, svg);
    L.el("line", { x1: bx - 10, x2: bx + bw + 120, y1: 360 - 2 * x * scale, y2: 360 - 2 * x * scale, stroke: C("--green"), "stroke-dasharray": "6 5", "stroke-width": 2 }, svg);
    T(bx + bw + 8, 360 - 2 * x * scale - 6, "2x", { fill: C("--green") });
    T(bx + bw / 2, 385, "added area ÷ h", { "text-anchor": "middle" });
    const set = (id, v) => (document.getElementById(id).textContent = v.toFixed(3));
    set("sq-strips", 2 * x * h); set("sq-corner", h * h); set("sq-ratio", 2 * x + h); set("sq-2x", 2 * x);
  }
  L.slider(document.getElementById("sq-x"), (v) => { x = v; draw(); }, (v) => v.toFixed(2));
  const hs = document.getElementById("sq-h");
  L.slider(hs, (v) => { h = v; draw(); }, (v) => v.toFixed(2));
  L.onTheme.push(draw);
  L.test("added area ÷ h = 2x + h", () => { hs.value = "0.1"; hs.dispatchEvent(new Event("input"));
    return Math.abs(parseFloat(document.getElementById("sq-ratio").textContent) - (2 * x + 0.1)) < 1e-3; });
});

/* ---------- 5. Derivative tracer ---------- */
L.onReady(() => {
  const fig = document.getElementById("w-tracer"), svg = fig.querySelector("svg");
  const F = { sq: [(x) => x * x, (x) => 2 * x, [-1, 6.5], [-5.5, 5.5]], cube: [(x) => x ** 3, (x) => 3 * x * x, [-9, 9], [-1, 19]], sin: [Math.sin, Math.cos, [-1.6, 1.6], [-1.6, 1.6]] };
  const st = { f: "sq", x: -2.5 };
  function draw() {
    svg.innerHTML = ""; svg.setAttribute("viewBox", "0 0 720 560");
    const [f, df, yr, dyr] = F[st.f];
    const top = L.el("svg", { x: 0, y: 0, width: 720, height: 280 }, svg), bot = L.el("svg", { x: 0, y: 280, width: 720, height: 280 }, svg);
    const A = L.plot(top, { xmin: -2.6, xmax: 2.6, ymin: yr[0], ymax: yr[1], h: 280 });
    const B = L.plot(bot, { xmin: -2.6, xmax: 2.6, ymin: dyr[0], ymax: dyr[1], h: 280 });
    A.fn(f, { stroke: C("--blue") });
    const x = st.x, m = df(x);
    A.line(x - 1, f(x) - m, x + 1, f(x) + m, { stroke: C("--accent"), "stroke-width": 2.5 });
    A.dot(x, f(x), 6, { fill: C("--accent") });
    A.text(2.5, yr[1] - (yr[1] - yr[0]) * 0.08, "f(x) with its tangent", { fill: C("--blue"), "text-anchor": "end" });
    B.fn((t) => (t <= x ? df(t) : NaN), { stroke: C("--green") });
    B.line(x, 0, x, m, { stroke: C("--accent"), "stroke-dasharray": "4 4" });
    B.dot(x, m, 6, { fill: C("--accent") });
    B.text(2.5, dyr[1] - (dyr[1] - dyr[0]) * 0.08, "f′(x): height = slope above", { fill: C("--green"), "text-anchor": "end" });
    document.getElementById("tr-m").textContent = m.toFixed(3);
  }
  const xs = document.getElementById("tr-x");
  const run = L.slider(xs, (v) => { st.x = v; draw(); }, (v) => v.toFixed(2));
  document.getElementById("tr-f").onchange = (e) => { st.f = e.target.value; draw(); };
  let anim = null;
  document.getElementById("tr-play").onclick = () => {
    if (anim) cancelAnimationFrame(anim);
    const t0 = performance.now();
    const step = (t) => { const u = Math.min(1, (t - t0) / 4000); xs.value = (-2.5 + 5 * u).toFixed(2); run(); if (u < 1) anim = requestAnimationFrame(step); };
    anim = requestAnimationFrame(step);
  };
  L.onTheme.push(draw);
  L.test("tracer slope matches f′", () => { xs.value = "1.5"; xs.dispatchEvent(new Event("input"));
    return Math.abs(parseFloat(document.getElementById("tr-m").textContent) - 3) < 1e-3; });
});

/* ---------- 6. Floating-point error of the difference quotient ---------- */
L.onReady(() => {
  const fig = document.getElementById("w-float"), svg = fig.querySelector("svg");
  const truth = Math.cos(1), dq = (h) => (Math.sin(1 + h) - Math.sin(1)) / h;
  const pts = []; for (let k = -16; k <= -1 + 1e-9; k += 0.25) { const e = Math.abs(dq(10 ** k) - truth); pts.push([k, Math.log10(Math.max(e, 1e-17))]); }
  let cur = -4;
  function draw() {
    svg.innerHTML = "";
    const P = L.plot(svg, { xmin: -16.5, xmax: -0.5, ymin: -11, ymax: -0.05, h: 380 });
    P.text(-0.7, -10.6, "log₁₀ h →", { "text-anchor": "end" });
    P.text(-16.3, -0.45, "↑ log₁₀ |error|", {});
    let d = ""; pts.forEach(([k, e], i) => (d += (i ? "L" : "M") + P.X(k) + "," + P.Y(e)));
    L.el("path", { d, fill: "none", stroke: C("--blue"), "stroke-width": 2.5 }, P.root);
    pts.forEach(([k, e]) => P.dot(k, e, 3, { fill: C("--blue") }));
    const e = Math.abs(dq(10 ** cur) - truth);
    P.dot(cur, Math.log10(Math.max(e, 1e-17)), 8, { fill: C("--accent") });
    P.text(-8, -10, "best ≈ 10⁻⁸", { fill: C("--green"), "text-anchor": "middle" });
    document.getElementById("fl-val").textContent = dq(10 ** cur).toPrecision(12);
    document.getElementById("fl-true").textContent = truth.toPrecision(12);
    document.getElementById("fl-err").textContent = e.toExponential(2);
  }
  L.slider(document.getElementById("fl-k"), (v) => { cur = v; draw(); }, (v) => v.toFixed(2));
  L.onTheme.push(draw);
  L.test("error is minimal near h = 1e-8 and large at 1e-16", () => {
    const best = pts.reduce((a, b) => (b[1] < a[1] ? b : a));
    return best[0] > -10 && best[0] < -6 && pts[0][1] > -1; });
});
