/* eureka lesson runtime: navigation, math, step-by-step derivations, plotting helpers, self-tests.
   Load AFTER KaTeX (optional) and BEFORE the lesson's own widget code. Exposes window.L. */
(function () {
  "use strict";
  const L = (window.L = {});
  const errBox = () => document.getElementById("__errors");
  L.errors = [];
  const logErr = (msg) => { L.errors.push(String(msg)); const b = errBox(); if (b) b.textContent = JSON.stringify(L.errors); };
  window.addEventListener("error", (e) => logErr(e.message + " @" + (e.filename || "") + ":" + (e.lineno || "")));
  window.addEventListener("unhandledrejection", (e) => logErr("promise: " + (e.reason && e.reason.message || e.reason)));

  /* ---------- theme ---------- */
  const store = { get(k) { try { return localStorage.getItem(k); } catch (_) { return null; } },
                  set(k, v) { try { localStorage.setItem(k, v); } catch (_) {} } };
  const saved = store.get("eureka-theme");
  if (saved) document.documentElement.dataset.theme = saved;
  L.css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  L.onTheme = [];
  function toggleTheme() {
    const cur = document.documentElement.dataset.theme ||
      (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    const next = cur === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next; store.set("eureka-theme", next);
    L.onTheme.forEach((f) => f());
  }

  /* ---------- math ---------- */
  function renderMath() {
    if (!window.renderMathInElement) { logErr("KaTeX not loaded (offline? see README of the lesson)"); return; }
    renderMathInElement(document.body, {
      delimiters: [{ left: "$$", right: "$$", display: true }, { left: "\\[", right: "\\]", display: true },
                   { left: "$", right: "$", display: false }, { left: "\\(", right: "\\)", display: false }],
      throwOnError: false, ignoredClasses: ["no-math"],
    });
    document.querySelectorAll(".katex-error").forEach((el) => logErr("KaTeX error: " + el.title));
  }
  /** Render a TeX string into an element (for dynamic readouts). */
  L.tex = (el, src, display = false) => {
    if (window.katex) katex.render(src, el, { throwOnError: false, displayMode: display });
    else el.textContent = src;
  };

  /* ---------- table of contents + scrollspy + progress ---------- */
  function buildToc() {
    const nav = document.querySelector("nav.toc"); if (!nav) return;
    const list = nav.querySelector("ol");
    const heads = [...document.querySelectorAll("main h2, main h3")];
    heads.forEach((h, i) => {
      if (!h.id) h.id = (h.textContent || "s" + i).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const li = document.createElement("li"); if (h.tagName === "H3") li.className = "sub";
      const a = document.createElement("a"); a.href = "#" + h.id; const c = h.cloneNode(true); c.querySelectorAll(".num, .katex-mathml").forEach((n) => n.remove());
      a.textContent = h.dataset.toc || c.textContent.trim();
      li.appendChild(a); list.appendChild(li);
    });
    nav.querySelector(".toc-title").addEventListener("click", () => nav.classList.toggle("open"));
    const links = new Map([...list.querySelectorAll("a")].map((a) => [a.getAttribute("href").slice(1), a]));
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) {
        links.forEach((a) => a.classList.remove("active"));
        const a = links.get(en.target.id); if (a) a.classList.add("active"); } });
    }, { rootMargin: "-20% 0px -70% 0px" });
    heads.forEach((h) => obs.observe(h));
  }
  function progress() {
    const bar = document.getElementById("progress"); if (!bar) return;
    const upd = () => { const h = document.documentElement; bar.style.width = (100 * h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight)) + "%"; };
    addEventListener("scroll", upd, { passive: true }); upd();
  }

  /* ---------- step-by-step derivations ---------- */
  function stepwise() {
    document.querySelectorAll(".derivation[data-stepwise]").forEach((d) => {
      const steps = [...d.querySelectorAll(".step")]; let shown = 1;
      const ctl = document.createElement("div"); ctl.className = "controls";
      const next = Object.assign(document.createElement("button"), { className: "btn", textContent: "Next step" });
      const all = Object.assign(document.createElement("button"), { className: "btn ghost", textContent: "Show all" });
      const count = document.createElement("span"); count.className = "readout";
      ctl.append(next, all, count); d.appendChild(ctl);
      const upd = () => { steps.forEach((s, i) => s.classList.toggle("hidden", i >= shown));
        count.textContent = `${shown} / ${steps.length}`; next.disabled = all.disabled = shown >= steps.length; };
      next.onclick = () => { shown = Math.min(steps.length, shown + 1); upd(); };
      all.onclick = () => { shown = steps.length; upd(); };
      upd();
    });
  }

  /* ---------- SVG plotting helpers ---------- */
  const NS = "http://www.w3.org/2000/svg";
  L.el = (tag, attrs = {}, parent) => { const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; };
  /** Create a 2-D plot in an <svg> with data coordinates. Returns helpers; call .layer() for redrawable groups. */
  L.plot = (svg, { xmin, xmax, ymin, ymax, w = 720, h = 420, pad = 36, grid = true, equal = false, axes = true, ticks = "axis" }) => {
    // axes: draw the x=0 / y=0 lines. ticks: "axis" (labels along the zero lines) | "edge" (bottom/left frame) | "none"
    svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
    if (equal) { const sx = (w - 2 * pad) / (xmax - xmin), sy = (h - 2 * pad) / (ymax - ymin);
      if (sx > sy) { const c = (xmin + xmax) / 2, half = (w - 2 * pad) / sy / 2; xmin = c - half; xmax = c + half; }
      else { const c = (ymin + ymax) / 2, half = (h - 2 * pad) / sx / 2; ymin = c - half; ymax = c + half; } }
    const X = (x) => pad + (x - xmin) / (xmax - xmin) * (w - 2 * pad);
    const Y = (y) => h - pad - (y - ymin) / (ymax - ymin) * (h - 2 * pad);
    const invX = (px) => xmin + (px - pad) / (w - 2 * pad) * (xmax - xmin);
    const invY = (py) => ymin + (h - pad - py) / (h - 2 * pad) * (ymax - ymin);
    const base = L.el("g", {}, svg);
    // ~1 tick per 70 px horizontally, per 45 px vertically
    const step = (a, b, px) => { const r = (b - a) / Math.max(2, px), p = Math.pow(10, Math.floor(Math.log10(r))); const m = r / p; return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p; };
    const zeroInY = ymin <= 0 && ymax >= 0, zeroInX = xmin <= 0 && xmax >= 0;
    const xLabY = zeroInY && ticks === "axis" ? Math.min(h - pad + 16, Y(0) + 16) : h - pad + 16;   // x labels: under the axis, else at the bottom edge
    const yLabX = zeroInX && ticks === "axis" ? Math.max(pad - 4, X(0) - 6) : pad - 6;               // y labels: left of the axis, else at the left edge
    if (grid) {
      const sx = step(xmin, xmax, (w - 2 * pad) / 70), sy = step(ymin, ymax, (h - 2 * pad) / 45);
      for (let x = Math.ceil(xmin / sx) * sx; x <= xmax + 1e-9; x += sx) {
        L.el("line", { x1: X(x), x2: X(x), y1: Y(ymin), y2: Y(ymax), class: "svg-grid" }, base);
        if (ticks !== "none" && (Math.abs(x) > 1e-9 || !zeroInX || ticks === "edge")) L.el("text", { x: X(x), y: xLabY, "text-anchor": "middle", class: "svg-tick" }, base).textContent = +x.toFixed(6);
      }
      for (let y = Math.ceil(ymin / sy) * sy; y <= ymax + 1e-9; y += sy) {
        L.el("line", { x1: X(xmin), x2: X(xmax), y1: Y(y), y2: Y(y), class: "svg-grid" }, base);
        if (ticks !== "none" && (Math.abs(y) > 1e-9 || !zeroInY || ticks === "edge")) L.el("text", { x: yLabX, y: Y(y) + 4, "text-anchor": "end", class: "svg-tick" }, base).textContent = +y.toFixed(6);
      }
    }
    if (axes && ymin <= 0 && ymax >= 0) L.el("line", { x1: X(xmin), x2: X(xmax), y1: Y(0), y2: Y(0), class: "svg-axis" }, base);
    if (axes && xmin <= 0 && xmax >= 0) L.el("line", { x1: X(0), x2: X(0), y1: Y(ymin), y2: Y(ymax), class: "svg-axis" }, base);
    // everything drawn in data coordinates is clipped to the plot frame
    const clipId = "clip" + Math.random().toString(36).slice(2, 9);
    const defs = svg.querySelector("defs") || L.el("defs", {}, svg);
    L.el("rect", { x: pad, y: pad, width: w - 2 * pad, height: h - 2 * pad }, L.el("clipPath", { id: clipId }, defs));
    const root = L.el("g", { "clip-path": `url(#${clipId})` }, svg);
    const P = { svg, root, X, Y, invX, invY, xmin, xmax, ymin, ymax };
    P.layer = () => { const g = L.el("g", {}, root); g.clear = () => { while (g.firstChild) g.removeChild(g.firstChild); }; return g; };
    P.unclipped = () => { const g = L.el("g", {}, svg); g.clear = () => { while (g.firstChild) g.removeChild(g.firstChild); }; return g; };
    /** Path of y = f(x); breaks at non-finite values. */
    P.fn = (f, attrs = {}, parent = root, n = 400) => { let d = "", pen = false;
      for (let i = 0; i <= n; i++) { const x = xmin + (xmax - xmin) * i / n, y = f(x);
        if (!isFinite(y) || y < ymin - 10 * (ymax - ymin) || y > ymax + 10 * (ymax - ymin)) { pen = false; continue; }
        d += (pen ? "L" : "M") + X(x).toFixed(2) + "," + Y(y).toFixed(2); pen = true; }
      return L.el("path", Object.assign({ d, fill: "none", "stroke-width": 2.5 }, attrs), parent); };
    P.line = (x1, y1, x2, y2, attrs = {}, parent = root) => L.el("line", Object.assign({ x1: X(x1), y1: Y(y1), x2: X(x2), y2: Y(y2), "stroke-width": 2 }, attrs), parent);
    P.dot = (x, y, r = 6, attrs = {}, parent = root) => L.el("circle", Object.assign({ cx: X(x), cy: Y(y), r }, attrs), parent);
    P.text = (x, y, s, attrs = {}, parent = root) => { const t = L.el("text", Object.assign({ x: X(x), y: Y(y), class: "svg-tick" }, attrs), parent); t.textContent = s; return t; };
    P.arrow = (x1, y1, x2, y2, color, parent = root) => {
      const id = "ah" + color.replace(/[^a-z0-9]/gi, "");
      if (!svg.querySelector("#" + id)) { const defs = svg.querySelector("defs") || L.el("defs", {}, svg);
        const m = L.el("marker", { id, viewBox: "0 0 10 10", refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: "auto-start-reverse" }, defs);
        L.el("path", { d: "M0,0 L10,5 L0,10 z", fill: color }, m); }
      return P.line(x1, y1, x2, y2, { stroke: color, "marker-end": `url(#${id})`, "stroke-width": 2.5 }, parent); };
    /** Make an SVG element draggable in data coordinates. onMove(x, y) may return a constrained [x, y]. */
    P.drag = (node, onMove) => { node.classList.add("handle");
      const toData = (ev) => { const pt = svg.createSVGPoint(); pt.x = ev.clientX; pt.y = ev.clientY;
        const p = pt.matrixTransform(svg.getScreenCTM().inverse()); return [invX(p.x), invY(p.y)]; };
      node.addEventListener("pointerdown", (ev) => { node.setPointerCapture(ev.pointerId); ev.preventDefault();
        const mv = (e) => onMove(...toData(e)); const up = () => { node.removeEventListener("pointermove", mv); node.removeEventListener("pointerup", up); };
        node.addEventListener("pointermove", mv); node.addEventListener("pointerup", up); }); };
    return P;
  };

  /** Bind a range input to a callback; mirrors its value into an <output for=...>. */
  L.slider = (input, cb, fmt = (v) => v) => { const out = document.querySelector(`output[for="${input.id}"]`);
    const run = () => { const v = parseFloat(input.value); if (out) out.textContent = fmt(v); cb(v); };
    input.addEventListener("input", run); run(); return run; };
  L.fmt = (v, d = 4) => (Math.abs(v) >= 1e5 || (Math.abs(v) < 1e-3 && v !== 0)) ? v.toExponential(2) : (+v.toFixed(d)).toString();

  /* ---------- self-tests: L.test(name, fn) — fn throws or returns false on failure ---------- */
  const tests = [];
  L.test = (name, fn) => tests.push([name, fn]);
  L.assert = (cond, msg) => { if (!cond) throw new Error(msg || "assertion failed"); };
  function runTests() {
    if (!/[?&]selftest\b/.test(location.search)) return;
    const res = tests.map(([n, f]) => { try { const r = f(); return { name: n, ok: r !== false }; } catch (e) { return { name: n, ok: false, error: String(e.message || e) }; } });
    const de = document.documentElement;
    const over = de.scrollWidth > de.clientWidth + 1;
    const culprits = over ? [...document.querySelectorAll("main *")].filter((e) => !e.closest(".katex-mathml, .katex-display") && e.getBoundingClientRect().right > de.clientWidth + 1)
      .slice(0, 3).map((e) => e.tagName.toLowerCase() + (e.id ? "#" + e.id : "") + (e.className && typeof e.className === "string" ? "." + e.className.split(" ")[0] : "")) : [];
    res.push({ name: `no horizontal page overflow at ${innerWidth}px`, ok: !over, error: over ? "widest: " + culprits.join(", ") : undefined });
    const sizes = [...document.querySelectorAll("figure.widget svg text")].map((e) => e.getBoundingClientRect().height).filter((h) => h > 0).sort((a, b) => a - b);
    const med = sizes.length ? sizes[Math.floor(sizes.length / 2)] : 99;
    res.push({ name: `figure text readable at ${innerWidth}px`, ok: true, warn: med < 9 ? `median SVG label height ${med.toFixed(1)}px: consider a narrow layout or larger labels` : undefined });
    res.push({ name: "math rendered", ok: !document.querySelector(".katex-error") && (!!document.querySelector(".katex") || !/\$/.test(document.querySelector("main")?.textContent || "")) });
    const box = document.getElementById("__selftest"); if (box) box.textContent = JSON.stringify(res);
  }

  /* ---------- boot ---------- */
  document.addEventListener("DOMContentLoaded", () => {
    const tb = document.getElementById("theme-toggle"); if (tb) tb.onclick = toggleTheme;
    try { renderMath(); } catch (e) { logErr(e); }
    buildToc(); progress(); stepwise();
    (L.ready || []).forEach((f) => { try { f(); } catch (e) { logErr(e.stack || e); } });
    setTimeout(runTests, 50);
  });
  /** Register widget setup code to run after the page and math are ready. */
  L.ready = [];
  L.onReady = (f) => L.ready.push(f);
})();
