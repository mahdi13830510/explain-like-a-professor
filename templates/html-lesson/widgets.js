/* This lesson's interactive figures. Pattern: one L.onReady block per figure card, plus an L.test that
   proves the interaction really works (run by scripts/check_html.py with ?selftest).
   Helpers: L.* (runtime) and F.* (figure helpers) from lesson.js. Read colours with L.css("--blue") and
   redraw in L.onTheme so the figure follows dark mode. */
L.onReady(() => {
  const { $, set, n, clamp, fire, seg, label, handle } = F;
  const fig = $("w-example"); if (!fig) return;
  const P = L.plot(fig.querySelector(".fig-stage svg"), { xmin: -2, xmax: 2, ymin: -3, ymax: 5, w: 520, h: 520, pad: 30, equal: true });
  const layer = P.layer();
  const FN = { sq: { f: (x, a) => a * x * x, d: (x, a) => 2 * a * x, name: "a·x²" },
               cube: { f: (x, a) => a * x * x * x / 2, d: (x, a) => 1.5 * a * x * x / 1, name: "a·x³/2" } };
  let a = 1, mode = "sq", x0 = 1;
  const h = handle(P, L.css("--blue"), (x) => { x0 = clamp(x, -1.8, 1.8); draw(); return [x0, 0]; });
  const draw = () => {
    const fn = FN[mode], y0 = fn.f(x0, a), m = fn.d(x0, a);
    layer.clear();
    P.fn((x) => fn.f(x, a), { stroke: L.css("--ink"), "stroke-width": 2.5 }, layer);
    P.fn((x) => y0 + m * (x - x0), { stroke: L.css("--amber"), "stroke-width": 2, "stroke-dasharray": "6 4" }, layer);
    P.line(x0, 0, x0, y0, { stroke: L.css("--blue"), "stroke-width": 1.5, "stroke-dasharray": "3 3" }, layer);
    P.dot(x0, y0, 6, { fill: L.css("--blue"), stroke: L.css("--surface"), "stroke-width": 2 }, layer);
    label(P, -1.9, 4.6, "f(x) = " + fn.name, L.css("--ink"), layer);
    h.place(x0, y0, L.css("--blue"));
    set("w-fx", n(y0, 2)); set("w-slope", n(m, 2));
    fig._v = { y0, m };
  };
  L.slider($("w-a"), (v) => { a = v; draw(); }, (v) => v.toFixed(2));
  mode = seg("w-mode", (v) => { mode = v; draw(); });
  draw();
  L.onTheme.push(draw);

  L.test("example figure: slider and toggle change the stat tiles", () => {
    fire($("w-a"), 1); $("w-mode")._pick("sq"); const s1 = fig._v;
    fire($("w-a"), 2); const s2 = fig._v;
    L.assert(Math.abs(s1.y0 - 1) < 1e-9 && Math.abs(s1.m - 2) < 1e-9, "x² at x=1, a=1 should give f=1, f′=2");
    L.assert(Math.abs(s2.y0 - 2) < 1e-9 && Math.abs(s2.m - 4) < 1e-9, "doubling a should double f and f′");
    $("w-mode")._pick("cube"); const s3 = fig._v; fire($("w-a"), 1); $("w-mode")._pick("sq");
    return Math.abs(s3.y0 - 1) < 1e-9 && $("w-fx").textContent === "1.00";
  });
});
