/* This lesson's interactive figures. Pattern: one L.onReady block per widget, plus an L.test that
   proves the interaction really works (run by scripts/check_html.py with ?selftest). */
L.onReady(() => {
  const fig = document.getElementById("w-example"); if (!fig) return;
  const P = L.plot(fig.querySelector("svg"), { xmin: -3, xmax: 3, ymin: -1, ymax: 5 });
  const layer = P.layer();
  let a = 1;
  const draw = () => { layer.clear(); P.fn((x) => a * x * x, { stroke: L.css("--blue") }, layer); };
  L.slider(document.getElementById("w-example-a"), (v) => { a = v; draw(); }, (v) => v.toFixed(2));
  L.onTheme.push(draw);

  L.test("example widget redraws when the slider moves", () => {
    const s = document.getElementById("w-example-a"), before = layer.innerHTML;
    s.value = "2"; s.dispatchEvent(new Event("input"));
    return layer.innerHTML !== before;
  });
});
