/* Interactive figures for "How ZIP Makes Files Smaller: Huffman Coding".
   Every widget registers a self-test (L.test) that drives its own controls. */
const C = (v) => L.css(v);
const $ = (id) => document.getElementById(id);
const show = (ch) => (ch === " " ? "␣" : ch === "\n" ? "↵" : ch === "\t" ? "⇥" : ch);
const PALETTE = ["--blue", "--accent", "--green", "--purple", "--amber", "--red"];
const MAXLEN = 240;
/** Phones get a narrower drawing canvas so SVG text stays readable. */
const isNarrow = (fig) => (fig.clientWidth || 900) < 600;
const onResize = (f) => { let t; addEventListener("resize", () => { clearTimeout(t); t = setTimeout(f, 120); }); };

/* ---------- shared maths ---------- */
/** Symbol counts, most frequent first (ties alphabetical). */
function countSyms(text) {
  const m = new Map();
  for (const ch of text) m.set(ch, (m.get(ch) || 0) + 1);
  return [...m].map(([sym, w]) => ({ sym, w })).sort((a, b) => b.w - a.w || (a.sym < b.sym ? -1 : 1));
}
function entropy(items) {
  const n = items.reduce((s, it) => s + it.w, 0);
  return items.reduce((s, it) => (it.w > 0 ? s - (it.w / n) * Math.log2(it.w / n) : s), 0);
}
/** Huffman's algorithm. Ties broken by creation order, so the result is deterministic.
    Returns every intermediate forest (sorted rarest first) so it can be stepped through. */
function huffman(items) {
  let id = 0;
  const leaves = items.slice().sort((a, b) => a.w - b.w || (a.sym < b.sym ? -1 : 1))
    .map((it) => ({ sym: it.sym, w: it.w, id: id++, leaf: true }));
  const key = (a, b) => a.w - b.w || a.id - b.id;
  let forest = leaves.slice().sort(key);
  const states = [forest.slice()], merges = [];
  while (forest.length > 1) {
    const [a, b] = forest.splice(0, 2);
    const n = { w: a.w + b.w, id: id++, left: a, right: b };
    forest.push(n); forest.sort(key);
    merges.push({ a, b, n }); states.push(forest.slice());
  }
  const root = forest[0], codes = new Map();
  const walk = (n, c) => { if (n.leaf) codes.set(n.sym, c || "0"); else { walk(n.left, c + "0"); walk(n.right, c + "1"); } };
  if (root) walk(root, "");
  return { leaves, states, merges, root, codes };
}
const avgLen = (items, codes) => { const n = items.reduce((s, it) => s + it.w, 0); return items.reduce((s, it) => s + it.w * codes.get(it.sym).length, 0) / n; };
/** Build a code tree from a {sym: bits} map. A symbol may sit on an internal node (non-prefix code). */
function treeFromCodes(code) {
  const root = { kids: [null, null], path: "" };
  for (const [sym, bits] of Object.entries(code)) {
    let n = root;
    for (const b of bits) { const i = +b; n.kids[i] = n.kids[i] || { kids: [null, null], path: n.path + b }; n = n.kids[i]; }
    n.sym = sym;
  }
  return root;
}
const kidsOf = (n) => (n.kids ? n.kids : n.leaf ? [null, null] : [n.left, n.right]);
const isLeaf = (n) => !kidsOf(n)[0] && !kidsOf(n)[1];
/** Leaf slots left to right; internal nodes at the midpoint of their children. An empty child takes a slot. */
function layoutTree(root, x0, unit, y0, rowH) {
  let k = 0; const nodes = [];
  const rec = (n, d) => {
    if (!n) return x0 + (k++ + 0.5) * unit;
    let x;
    if (isLeaf(n)) x = x0 + (k++ + 0.5) * unit;
    else { const [l, r] = kidsOf(n); const a = rec(l, d + 1), b = rec(r, d + 1); x = (a + b) / 2; }
    n._x = x; n._y = y0 + d * rowH; n._d = d; nodes.push(n); return x;
  };
  rec(root, 0); return nodes;
}
const slots = (n) => { if (!n) return 1; if (isLeaf(n)) return 1; const [l, r] = kidsOf(n); return slots(l) + slots(r); };
const depthOf = (n) => (!n || isLeaf(n) ? 0 : 1 + Math.max(...kidsOf(n).filter(Boolean).map(depthOf)));

/** Draw a laid-out tree. opts: color(sym) → css colour, r, font, edgeLabels, weight(n) → label, hl(n) → stroke colour, onLeaf(n). */
function drawTree(g, root, o) {
  const nodes = []; const visit = (n) => { if (!n) return; nodes.push(n); kidsOf(n).forEach(visit); }; visit(root);
  const r = o.r || 14, f = o.font || 14;
  nodes.forEach((n) => kidsOf(n).forEach((c, i) => {
    if (!c) return;
    L.el("line", { x1: n._x, y1: n._y, x2: c._x, y2: c._y, stroke: C("--muted"), "stroke-width": 1.5, "stroke-opacity": 0.7 }, g);
    if (o.edgeLabels !== false) {
      const mx = (n._x + c._x) / 2, my = (n._y + c._y) / 2;
      const t = L.el("text", { x: mx + (i ? 7 : -7), y: my - 3, "text-anchor": i ? "start" : "end", "font-size": Math.max(10, f - 2), fill: C("--muted"), style: "font-family:var(--mono)" }, g);
      t.textContent = i;
    }
  }));
  nodes.forEach((n) => {
    const leafy = n.sym !== undefined, col = leafy ? (o.color ? o.color(n.sym) : C("--blue")) : C("--muted");
    const hl = o.hl ? o.hl(n) : null;
    if (leafy) L.el("circle", { cx: n._x, cy: n._y, r, fill: C("--surface") }, g);
    const c = L.el("circle", { cx: n._x, cy: n._y, r: leafy ? r : r * 0.82, fill: leafy ? col : C("--surface"), "fill-opacity": leafy ? 0.16 : 1,
      stroke: hl || col, "stroke-width": hl ? 3.5 : leafy ? 2 : 1.5 }, g);
    if (leafy) {
      const t = L.el("text", { x: n._x, y: n._y + f * 0.36, "text-anchor": "middle", "font-size": f, "font-weight": 700, fill: C("--ink"), style: "font-family:var(--mono)" }, g);
      t.textContent = show(n.sym);
      if (o.onLeaf) { c.style.cursor = "pointer"; t.style.cursor = "pointer"; c.onclick = t.onclick = () => o.onLeaf(n); }
    } else if (o.weight) {
      const t = L.el("text", { x: n._x, y: n._y + f * 0.32, "text-anchor": "middle", "font-size": f * 0.82, fill: C("--muted"), style: "font-family:var(--sans)" }, g);
      t.textContent = o.weight(n);
    }
    if (leafy && o.below) {
      const t = L.el("text", { x: n._x, y: n._y + r + f + 1, "text-anchor": "middle", "font-size": f * 0.8, fill: C("--muted"), style: "font-family:var(--sans)" }, g);
      t.textContent = o.below(n);
    }
  });
}
const colorMap = (items) => { const m = new Map(); items.forEach((it, i) => m.set(it.sym, C(PALETTE[i % PALETTE.length]))); return m; };

/* ---------- the learner's text, shared by every widget that has an input.txt ---------- */
const Text = {
  v: "mississippi river", subs: [],
  set(v) {
    this.v = v.slice(0, MAXLEN);
    document.querySelectorAll("input.txt").forEach((i) => { if (i.value !== this.v) i.value = this.v; });
    this.subs.forEach((f) => f());
  },
};
L.onReady(() => {
  document.querySelectorAll("input.txt").forEach((i) => { i.maxLength = MAXLEN; i.value = Text.v; i.addEventListener("input", () => Text.set(i.value)); });
  document.querySelectorAll("[data-text]").forEach((b) => (b.onclick = () => Text.set(b.dataset.text)));
  document.querySelectorAll("[data-random]").forEach((b) => (b.onclick = () => {
    const al = "abcdefghijklmnopqrstuvwxyz"; let s = "";
    for (let i = 0; i < 200; i++) s += al[Math.floor(Math.random() * 26)];
    Text.set(s);
  }));
});

/* ---------- 1. Frequency chart ---------- */
L.onReady(() => {
  const fig = $("w-freq"); if (!fig) return;
  const svg = fig.querySelector("svg"); let W = 900; const H = 300;
  function draw() {
    W = isNarrow(fig) ? 460 : 900; svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    svg.innerHTML = "";
    const items = countSyms(Text.v), n = Text.v.length;
    $("fq-n").textContent = n; $("fq-k").textContent = items.length; $("fq-bits").textContent = 8 * n;
    if (!items.length) { L.el("text", { x: W / 2, y: H / 2, "text-anchor": "middle", class: "svg-tick" }, svg).textContent = "Type some text above."; $("fq-top").textContent = "–"; return; }
    $("fq-top").textContent = `“${show(items[0].sym)}” ${(100 * items[0].w / n).toFixed(1)}%`;
    const left = 30, right = 12, base = H - 40, top = 50, k = items.length;
    const slot = (W - left - right) / k, bw = Math.min(54, slot * 0.72), maxw = items[0].w;
    const f = Math.max(9, Math.min(17, slot * 0.6));
    L.el("line", { x1: left, x2: W - right, y1: base, y2: base, class: "svg-axis" }, svg);
    items.forEach((it, i) => {
      const cx = left + slot * (i + 0.5), h = (base - top) * it.w / maxw;
      L.el("rect", { x: cx - bw / 2, y: base - h, width: bw, height: h, rx: 3, fill: C(PALETTE[i % PALETTE.length]), "fill-opacity": 0.8 }, svg);
      const t = L.el("text", { x: cx, y: base + f + 6, "text-anchor": "middle", "font-size": f, "font-weight": 700, fill: C("--ink"), style: "font-family:var(--mono)" }, svg);
      t.textContent = show(it.sym);
      if (slot >= 15) { const c = L.el("text", { x: cx, y: base - h - 6, "text-anchor": "middle", "font-size": Math.min(13, f), fill: C("--muted"), style: "font-family:var(--sans)" }, svg); c.textContent = it.w; }
    });
    L.el("text", { x: left, y: 16, class: "svg-tick" }, svg).textContent = W < 600 ? "counts, most frequent first (␣ = space)" : "count of each symbol, most frequent first (␣ = space)";
  }
  Text.subs.push(draw); draw(); L.onTheme.push(draw); onResize(draw);
  L.test("frequency chart: one bar per distinct symbol", () => {
    const keep = Text.v; Text.set("aab");
    const ok = svg.querySelectorAll("rect").length === 2 && $("fq-k").textContent === "2" && $("fq-bits").textContent === "24";
    Text.set(keep); return ok;
  });
});

/* ---------- 2. Ambiguity: enumerate every way to decode a bitstring ---------- */
const BAD = { e: "0", t: "1", a: "01", n: "10" };          // Morse letters E · T − A ·− N −· with dot = 0, dash = 1
const GOOD = { e: "0", t: "10", a: "110", n: "111" };
const SYMCOL = { e: "--blue", t: "--accent", a: "--green", n: "--purple" };
function parses(bits, code, cap = 64) {
  const out = [], ent = Object.entries(code);
  const rec = (i, acc) => {
    if (out.length >= cap) return;
    if (i === bits.length) { out.push(acc.slice()); return; }
    for (const [s, c] of ent) if (bits.startsWith(c, i)) { acc.push([s, c]); rec(i + c.length, acc); acc.pop(); }
  };
  rec(0, []); return out;
}
L.onReady(() => {
  const fig = $("w-ambig"); if (!fig) return;
  const inp = $("am-bits"), list = $("am-list"), svg = fig.querySelector("svg");
  let mode = "bad";
  function drawTreeSmall(code) {
    svg.innerHTML = ""; svg.setAttribute("viewBox", "0 0 300 210");
    const root = treeFromCodes(code), s = slots(root), unit = Math.min(66, 280 / s);
    layoutTree(root, (300 - unit * s) / 2, unit, 24, 52);
    drawTree(svg, root, { r: 14, font: 15, color: (sym) => C(SYMCOL[sym]),
      hl: (n) => (n.sym !== undefined && !isLeaf(n) ? C("--red") : null) });
  }
  function draw() {
    const code = mode === "bad" ? BAD : GOOD;
    inp.value = inp.value.replace(/[^01]/g, "").slice(0, 20);
    $("am-table").innerHTML = Object.entries(code).map(([s, c]) => `<span class="cw" style="--c:var(${SYMCOL[s]})"><b>${s}</b> = <code>${c}</code></span>`).join("");
    const ps = parses(inp.value, code);
    list.innerHTML = "";
    ps.forEach((p) => {
      const row = document.createElement("div"); row.className = "parse";
      p.forEach(([s, c]) => { const ch = document.createElement("span"); ch.className = "chip"; ch.style.setProperty("--c", `var(${SYMCOL[s]})`);
        ch.innerHTML = `<b>${s}</b><i>${c}</i>`; row.appendChild(ch); });
      const word = document.createElement("span"); word.className = "word"; word.textContent = "→ “" + p.map((x) => x[0]).join("") + "”";
      row.appendChild(word); list.appendChild(row);
    });
    const n = ps.length, out = $("am-count");
    out.textContent = n === 0 ? "no valid decoding: bits left over" : n === 1 ? "exactly 1 decoding" : `${n}${n >= 64 ? "+" : ""} different decodings`;
    out.style.color = n === 1 ? C("--green") : C("--red");
    drawTreeSmall(code);
  }
  inp.addEventListener("input", draw);
  fig.querySelectorAll("input[name=am-mode]").forEach((r) => r.addEventListener("change", () => { mode = r.value; draw(); }));
  draw(); L.onTheme.push(draw);
  L.test("ambiguity: 0110 has 4 decodings with the Morse-like code, 1 with the prefix code", () => {
    inp.value = "0110"; mode = "bad"; draw(); const a = list.children.length;
    mode = "good"; draw(); const b = list.children.length; mode = "bad"; draw();
    return a === 4 && b === 1 && parses("0110", GOOD)[0].map((x) => x[0]).join("") === "ea";
  });
});

/* ---------- 3. Decoding = walking the tree ---------- */
L.onReady(() => {
  const fig = $("w-walk"); if (!fig) return;
  const svg = fig.querySelector("svg"), inp = $("wk-word");
  const root = treeFromCodes(GOOD);
  const st = { bits: "", pos: 0, node: root, out: "", trail: [] };
  let timer = null;
  function reset() {
    inp.value = inp.value.toLowerCase().replace(/[^aent]/g, "").slice(0, 14);
    st.bits = [...inp.value].map((c) => GOOD[c]).join(""); st.pos = 0; st.node = root; st.out = ""; st.trail = [root]; stop(); draw();
  }
  function step() {
    if (st.pos >= st.bits.length) return false;
    if (isLeaf(st.node)) { st.node = root; st.trail = [root]; }
    const b = +st.bits[st.pos++]; st.node = st.node.kids[b]; st.trail.push(st.node);
    if (isLeaf(st.node)) st.out += st.node.sym;
    draw(); return true;
  }
  function stop() { if (timer) clearInterval(timer); timer = null; $("wk-play").textContent = "▶ Play"; }
  function draw() {
    const nar = isNarrow(fig), VW = nar ? 440 : 720;
    svg.innerHTML = ""; svg.setAttribute("viewBox", `0 0 ${VW} 380`);
    layoutTree(root, nar ? 20 : 160, 100, 36, 62);
    const on = new Set(st.trail);
    // highlight the path taken for the current symbol
    st.trail.forEach((n, i) => { if (i) { const p = st.trail[i - 1]; L.el("line", { x1: p._x, y1: p._y, x2: n._x, y2: n._y, stroke: C("--accent"), "stroke-width": 7, "stroke-linecap": "round", "stroke-opacity": 0.35 }, svg); } });
    drawTree(svg, root, { r: 17, font: 17, color: (s) => C(SYMCOL[s]), hl: (n) => (n === st.node ? C("--accent") : on.has(n) ? C("--amber") : null) });
    if (!nar) { L.el("text", { x: 40, y: 50, class: "svg-tick", "font-size": 13 }, svg).textContent = "start at the root,";
      L.el("text", { x: 40, y: 68, class: "svg-tick", "font-size": 13 }, svg).textContent = "0 = left, 1 = right"; }
    // bit tape
    const n = st.bits.length, cw = Math.min(26, (VW - 30) / Math.max(1, n)), x0 = (VW - cw * n) / 2, ty = 300;
    for (let i = 0; i < n; i++) {
      const done = i < st.pos, cur = i === st.pos - 1;
      L.el("rect", { x: x0 + i * cw + 1, y: ty, width: cw - 2, height: 30, rx: 4, fill: cur ? C("--accent") : C("--code-bg"), "fill-opacity": cur ? 0.25 : 1, stroke: cur ? C("--accent") : C("--rule") }, svg);
      const t = L.el("text", { x: x0 + (i + 0.5) * cw, y: ty + 21, "text-anchor": "middle", "font-size": Math.min(16, cw * 0.7), style: "font-family:var(--mono)", fill: done ? C("--ink") : C("--muted"), "font-weight": done ? 700 : 400 }, svg);
      t.textContent = st.bits[i];
    }
    L.el("text", { x: VW / 2, y: ty + 60, "text-anchor": "middle", class: "svg-tick", "font-size": 13 }, svg).textContent = n ? "the encoded message, read left to right" : "type a word using only a, e, n, t";
    $("wk-out").textContent = st.out || "–";
    $("wk-pos").textContent = `${st.pos} / ${n}`;
  }
  $("wk-step").onclick = () => { stop(); step(); };
  $("wk-reset").onclick = reset;
  $("wk-play").onclick = () => {
    if (timer) return stop();
    if (st.pos >= st.bits.length) reset();
    $("wk-play").textContent = "❚❚ Pause";
    timer = setInterval(() => { if (!step()) stop(); }, 550);
  };
  inp.addEventListener("input", reset);
  reset(); L.onTheme.push(draw); onResize(draw);
  L.test("tree walk decodes the encoded word back exactly", () => {
    inp.value = "antenna"; reset(); while (step()); const ok = st.out === "antenna" && st.bits === "110111100111111110";
    reset(); return ok;
  });
});

/* ---------- 4. Huffman builder, one merge at a time ---------- */
L.onReady(() => {
  const fig = $("w-huff"); if (!fig) return;
  const svg = fig.querySelector("svg"), msg = $("hf-msg"), chips = $("hf-codes");
  let H = null, k = 0, timer = null, colors = new Map();
  function rebuild() { stop(); const items = countSyms(Text.v); colors = colorMap(items); H = huffman(items); k = 0; draw(); }
  function stop() { if (timer) clearInterval(timer); timer = null; $("hf-play").textContent = "▶ Play"; }
  function draw() {
    svg.innerHTML = "";
    const forest = H.states[k] || [], N = H.leaves.length;
    if (!N) { svg.setAttribute("viewBox", "0 0 900 120"); L.el("text", { x: 450, y: 60, "text-anchor": "middle", class: "svg-tick" }, svg).textContent = "Type some text above."; chips.innerHTML = ""; msg.textContent = ""; return; }
    const W = isNarrow(fig) ? 460 : 900, unit = Math.min(74, (W - 20) / N), maxD = depthOf(H.root);
    const rowH = Math.max(34, Math.min(64, 440 / Math.max(1, maxD)));
    const f = Math.max(9, Math.min(16, unit * 0.42)), r = Math.max(7, Math.min(16, unit * 0.36));
    const Hh = 46 + maxD * rowH + r + f + 26;
    svg.setAttribute("viewBox", `0 0 ${W} ${Hh}`);
    let x = (W - unit * N) / 2;
    const next = k < H.merges.length ? new Set([forest[0], forest[1]]) : new Set();
    const made = k > 0 ? H.merges[k - 1].n : null;
    forest.forEach((t, i) => {
      const s = slots(t);
      const g = L.el("g", {}, svg);
      if (next.has(t)) L.el("rect", { x: x + 3, y: 46 - r - 8, width: s * unit - 6, height: depthOf(t) * rowH + 2 * r + f + 16, rx: 10, fill: C("--accent"), "fill-opacity": 0.07, stroke: C("--accent"), "stroke-dasharray": "5 4", "stroke-width": 1.5 }, g);
      layoutTree(t, x, unit, 46, rowH);
      drawTree(g, t, { r, font: f, color: (sym) => colors.get(sym), weight: (n) => n.w, below: (n) => n.w, edgeLabels: unit >= 24,
        hl: (n) => (n === made ? C("--green") : null) });
      x += s * unit;
    });
    if (next.size && W > 600) L.el("text", { x: 10, y: Hh - 4, class: "svg-tick", "font-size": 12 }, svg).textContent = "dashed boxes: the two lightest trees, merged next";
    // codes so far: each merge prepends one bit to every symbol inside the two merged trees
    const sofar = new Map();
    forest.forEach((t) => { const w = (n, c) => { if (n.leaf) sofar.set(n.sym, c); else { w(n.left, c + "0"); w(n.right, c + "1"); } }; w(t, ""); });
    const items = countSyms(Text.v);
    chips.innerHTML = items.map((it) => { const c = sofar.get(it.sym) || ""; return `<span class="cw" style="--c:${colors.get(it.sym)}"><b>${show(it.sym)}</b><small>×${it.w}</small> <code>${c ? c : "·"}</code></span>`; }).join("");
    const K = H.merges.length;
    $("hf-pos").textContent = `merge ${k} of ${K}`;
    if (k === 0) msg.textContent = N === 1 ? "Only one distinct symbol: it gets the 1-bit code 0 by convention." : `Start: ${N} one-node trees, one per symbol, weighted by count. Lightest first.`;
    else { const m = H.merges[k - 1], syms = (t) => (t.leaf ? [show(t.sym)] : [...syms(t.left), ...syms(t.right)]),
      nm = (t) => (t.leaf ? `“${show(t.sym)}”` : syms(t).length <= 5 ? `{${syms(t).join(",")}}` : "a tree") + ` (${t.w})`;
      msg.textContent = `Merged ${nm(m.a)} and ${nm(m.b)} into one tree of weight ${m.n.w}.` + (k === K ? ` Done. Total bits = sum of all merge weights = ${H.merges.reduce((s, q) => s + q.n.w, 0)}.` : ""); }
    $("hf-step").disabled = k >= K;
  }
  const step = () => { if (k < H.merges.length) { k++; draw(); return true; } return false; };
  $("hf-step").onclick = () => { stop(); step(); };
  $("hf-back").onclick = () => { stop(); if (k > 0) { k--; draw(); } };
  $("hf-reset").onclick = () => { stop(); k = 0; draw(); };
  $("hf-play").onclick = () => {
    if (timer) return stop();
    if (k >= H.merges.length) k = 0;
    $("hf-play").textContent = "❚❚ Pause";
    timer = setInterval(() => { if (!step()) stop(); }, 900);
  };
  Text.subs.push(rebuild); rebuild(); L.onTheme.push(draw); onResize(draw);
  L.test("huffman: mississippi river → 7 merges, 46 bits = sum of merge weights", () => {
    const keep = Text.v; Text.set("mississippi river");
    while (step());
    const sumW = H.merges.reduce((s, m) => s + m.n.w, 0), items = countSyms(Text.v);
    const bits = items.reduce((s, it) => s + it.w * H.codes.get(it.sym).length, 0);
    const ok = H.merges.length === 7 && sumW === 46 && bits === 46 && /Done/.test(msg.textContent);
    Text.set(keep); return ok;
  });
});

/* ---------- 5. Exchange argument: swap leaves on a fixed tree shape ---------- */
L.onReady(() => {
  const fig = $("w-swap"); if (!fig) return;
  const svg = fig.querySelector("svg");
  const items = countSyms("mississippi river"), colors = colorMap(items), cnt = new Map(items.map((it) => [it.sym, it.w]));
  const shape = huffman(items).root;
  const leaves = []; const coll = (n) => { if (n.leaf) leaves.push(n); else { coll(n.left); coll(n.right); } }; coll(shape);
  let sel = null;
  layoutTree(shape, 0, 0, 0, 1); // sets _d
  const total = () => leaves.reduce((s, l) => s + cnt.get(l.sym) * l._d, 0);
  function assign(order) { const byDepth = leaves.slice().sort((a, b) => a._d - b._d || a._x - b._x); byDepth.forEach((l, i) => (l.sym = order[i])); }
  const best = () => assign(items.map((it) => it.sym));            // most frequent → shallowest
  const worst = () => assign(items.map((it) => it.sym).reverse());  // most frequent → deepest
  function draw() {
    const nar = isNarrow(fig), VW = nar ? 440 : 720;
    svg.innerHTML = ""; svg.setAttribute("viewBox", `0 0 ${VW} 330`);
    layoutTree(shape, nar ? 30 : 40, nar ? 51 : 80, 36, 62);
    for (let d = 1; d <= 4; d++) {
      L.el("text", { x: nar ? 2 : 14, y: 36 + d * 62 + 5, class: "svg-tick", "font-size": 12 }, svg).textContent = nar ? `${d}` : `${d} bit${d > 1 ? "s" : ""}`;
    }
    drawTree(svg, shape, { r: 17, font: 16, color: (s) => colors.get(s), below: (n) => "×" + cnt.get(n.sym),
      hl: (n) => (n === sel ? C("--accent") : null), onLeaf: (n) => {
        if (!sel) sel = n; else if (sel === n) sel = null; else { const t = sel.sym; sel.sym = n.sym; n.sym = t; sel = null; }
        draw(); } });
    const T = total();
    $("sw-total").textContent = T;
    $("sw-avg").textContent = (T / 17).toFixed(3);
    const v = $("sw-verdict");
    v.textContent = T === 46 ? "optimal: matches Huffman" : `${T - 46} bits worse than Huffman`;
    v.style.color = T === 46 ? C("--green") : C("--red");
  }
  $("sw-worst").onclick = () => { sel = null; worst(); draw(); };
  $("sw-best").onclick = () => { sel = null; best(); draw(); };
  worst(); draw(); L.onTheme.push(draw); onResize(draw);
  L.test("exchange: worst labelling 62 bits, sorted labelling 46 bits, a swap changes the total", () => {
    worst(); draw(); const a = total();
    const deep = leaves.find((l) => l.sym === "i"), shallow = leaves.find((l) => l._d === 2);
    const t = deep.sym; deep.sym = shallow.sym; shallow.sym = t; draw(); const b = total();
    best(); draw(); const c = total();
    worst(); draw();
    return a === 62 && b < a && c === 46;
  });
});

/* ---------- 6. Encoder: the coloured bitstring, total bits, bits/symbol vs entropy ---------- */
L.onReady(() => {
  const fig = $("w-enc"); if (!fig) return;
  const box = $("en-bits");
  let last = { bits: "", codes: new Map() };
  function draw() {
    const text = Text.v, items = countSyms(text), n = text.length;
    if (!n) { box.innerHTML = "<span class='muted'>Type some text above.</span>"; return; }
    const colors = colorMap(items), { codes } = huffman(items);
    box.innerHTML = [...text].map((ch) => `<span class="chip" style="--c:${colors.get(ch)}"><b>${ch === " " ? "␣" : ch.replace(/[&<>]/g, (x) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[x]))}</b><i>${codes.get(ch)}</i></span>`).join("");
    const bits = [...text].map((ch) => codes.get(ch)).join("");
    last = { bits, codes };
    const Hs = entropy(items), fixed = Math.max(1, Math.ceil(Math.log2(items.length)));
    $("en-huff").textContent = bits.length; $("en-raw").textContent = 8 * n;
    $("en-bps").textContent = (bits.length / n).toFixed(3); $("en-H").textContent = Hs.toFixed(3);
    $("en-ratio").textContent = (100 * bits.length / (8 * n)).toFixed(1) + "%";
    const bar = (id, v) => ($(id).style.width = (100 * v / (8 * n)).toFixed(2) + "%");
    bar("en-bar-raw", 8 * n); bar("en-bar-fixed", fixed * n); bar("en-bar-huff", bits.length); bar("en-bar-H", Hs * n);
    $("en-lab-fixed").textContent = `fixed ${fixed}-bit code: ${fixed * n}`; $("en-lab-H").textContent = `entropy floor H·n: ${(Hs * n).toFixed(1)}`;
  }
  Text.subs.push(draw); draw(); L.onTheme.push(draw);
  L.test("encoder: bitstring decodes back to the text; H ≤ bits/symbol < H + 1", () => {
    const keep = Text.v; Text.set("mississippi river");
    const inv = new Map([...last.codes].map(([s, c]) => [c, s])); let out = "", cur = "";
    for (const b of last.bits) { cur += b; if (inv.has(cur)) { out += inv.get(cur); cur = ""; } }
    const bps = last.bits.length / 17, Hs = entropy(countSyms(Text.v));
    const ok = out === "mississippi river" && last.bits.length === 46 && $("en-raw").textContent === "136" && bps >= Hs && bps < Hs + 1;
    Text.set(keep); return ok;
  });
});

/* ---------- 7. Skew: from uniform to very lopsided ---------- */
L.onReady(() => {
  const fig = $("w-skew"); if (!fig) return;
  const svg = fig.querySelector("svg"), syms = "ABCDEFGH".split("");
  const dist = (s) => { const r = 1 - 0.95 * s; const w = syms.map((_, i) => Math.pow(r, i)); const z = w.reduce((a, b) => a + b, 0); return syms.map((sym, i) => ({ sym, w: w[i] / z })); };
  const stats = (s) => { const it = dist(s), h = huffman(it); return { it, codes: h.codes, H: entropy(it), L: avgLen(it, h.codes) }; };
  const curve = []; for (let i = 0; i <= 100; i++) { const q = stats(i / 100); curve.push([i / 100, q.H, q.L]); }
  let s = 0;
  function draw() {
    const nar = isNarrow(fig), VW = nar ? 440 : 720;
    svg.innerHTML = ""; svg.setAttribute("viewBox", `0 0 ${VW} 600`);
    const top = L.el("svg", { x: 0, y: 0, width: VW, height: 270 }, svg), bot = L.el("svg", { x: 0, y: 270, width: VW, height: 330 }, svg);
    top.setAttribute("viewBox", `0 0 ${VW} 270`); bot.setAttribute("viewBox", `0 0 ${VW} 330`);
    const q = stats(s);
    // top: probabilities with Huffman code lengths
    const base = 220, slot = (VW - 80) / 8, bw = Math.min(48, slot * 0.72), pmax = Math.max(...q.it.map((it) => it.w)), hmax = 150 / pmax;
    L.el("line", { x1: 40, x2: VW - 40, y1: base, y2: base, class: "svg-axis" }, top);
    L.el("text", { x: 40, y: 20, class: "svg-tick", "font-size": 13 }, top).textContent = nar ? "probabilities, with Huffman code lengths" : "probability of each of 8 symbols (bars scaled to the largest), with its Huffman code length";
    q.it.forEach((it, i) => {
      const cx = 40 + slot * (i + 0.5), h = hmax * it.w;
      L.el("rect", { x: cx - bw / 2, y: base - h, width: bw, height: Math.max(h, 0.5), rx: 3, fill: C("--blue"), "fill-opacity": 0.75 }, top);
      L.el("text", { x: cx, y: base + 20, "text-anchor": "middle", "font-size": 15, "font-weight": 700, style: "font-family:var(--mono)", fill: C("--ink") }, top).textContent = it.sym;
      L.el("text", { x: cx, y: base - h - 22, "text-anchor": "middle", "font-size": nar ? 11 : 12, fill: C("--muted"), style: "font-family:var(--sans)" }, top).textContent = nar ? (it.w >= 0.01 ? it.w.toFixed(2).slice(1) : "<.01") : it.w >= 0.001 ? it.w.toFixed(3) : "<0.001";
      L.el("text", { x: cx, y: base - h - 6, "text-anchor": "middle", "font-size": 13, "font-weight": 700, fill: C("--accent"), style: "font-family:var(--sans)" }, top).textContent = nar ? `${q.codes.get(it.sym).length}b` : `${q.codes.get(it.sym).length} bit${q.codes.get(it.sym).length > 1 ? "s" : ""}`;
    });
    // bottom: H and L across the whole range of skew
    const P = L.plot(bot, { xmin: 0, xmax: 1, ymin: 0, ymax: 3.4, w: VW, h: 330, pad: 44 });
    const path = (idx, col, dash) => { let d = ""; curve.forEach((c, i) => (d += (i ? "L" : "M") + P.X(c[0]).toFixed(1) + "," + P.Y(c[idx]).toFixed(1))); L.el("path", { d, fill: "none", stroke: col, "stroke-width": 2.5, "stroke-dasharray": dash || "" }, P.root); };
    P.line(0, 3, 1, 3, { stroke: C("--muted"), "stroke-dasharray": "6 5" });
    path(2, C("--accent")); path(1, C("--blue"));
    P.line(s, 0, s, 3.4, { stroke: C("--ink"), "stroke-width": 1, "stroke-opacity": 0.5 });
    P.dot(s, q.H, 5, { fill: C("--blue") }); P.dot(s, q.L, 9, { fill: "none", stroke: C("--accent"), "stroke-width": 2.5 });
    const lab = P.unclipped();
    P.text(0.99, 3.1, "fixed 3-bit code", { "text-anchor": "end" }, lab);
    P.text(0.02, 0.15, "skew →", {}, lab);
    // legend in the empty upper-right region, drawn over the marker line
    const lx = P.X(nar ? 0.5 : 0.66), ly = P.Y(2.6), lw = nar ? 170 : 200;
    L.el("rect", { x: lx - 10, y: ly - 18, width: lw, height: 50, rx: 6, fill: C("--surface"), "fill-opacity": 0.92, stroke: C("--rule") }, lab);
    [["Huffman bits/symbol", "--accent"], ["entropy H", "--blue"]].forEach(([t, c], i) => {
      L.el("line", { x1: lx, x2: lx + 22, y1: ly - 4 + i * 22, y2: ly - 4 + i * 22, stroke: C(c), "stroke-width": 3 }, lab);
      L.el("text", { x: lx + 30, y: ly + 1 + i * 22, class: "svg-tick", style: `fill:${C(c)};font-weight:600` }, lab).textContent = t;
    });
    L.el("text", { x: 6, y: 30, class: "svg-tick", "font-size": 12 }, bot).textContent = "bits per symbol";
    $("sk-H").textContent = q.H.toFixed(3); $("sk-L").textContent = q.L.toFixed(3);
    $("sk-save").textContent = (100 * (1 - q.L / 3)).toFixed(1) + "%";
    $("sk-gap").textContent = (q.L - q.H).toFixed(3);
  }
  const sl = $("sk-s");
  L.slider(sl, (v) => { s = v; draw(); }, (v) => v.toFixed(2));
  L.onTheme.push(draw); onResize(draw);
  L.test("skew: uniform gives L = H = 3; very skewed keeps H ≤ L < H + 1 with a visible gap", () => {
    sl.value = "0"; sl.dispatchEvent(new Event("input")); const a = +$("sk-L").textContent, b = +$("sk-H").textContent;
    sl.value = "1"; sl.dispatchEvent(new Event("input")); const c = +$("sk-L").textContent, d = +$("sk-H").textContent;
    sl.value = "0.5"; sl.dispatchEvent(new Event("input"));
    return a === 3 && b === 3 && c >= d && c < d + 1 && c - d > 0.3 && curve.every(([, H, Lh]) => Lh >= H - 1e-9 && Lh < H + 1);
  });
});

/* ---------- 8. LZ77 back-references, the other half of DEFLATE ---------- */
function lz77(s, minLen = 3, maxLen = 258, win = 32768) {
  const out = []; let i = 0;
  while (i < s.length) {
    let bl = 0, bd = 0;
    for (let j = Math.max(0, i - win); j < i; j++) {
      let l = 0; while (l < maxLen && i + l < s.length && s[j + l] === s[i + l]) l++;
      if (l > bl || (l === bl && l > 0 && i - j < bd)) { bl = l; bd = i - j; }
    }
    if (bl >= minLen) { out.push({ d: bd, len: bl, at: i }); i += bl; } else { out.push({ lit: s[i], at: i }); i++; }
  }
  return out;
}
function unlz(tokens) { let s = ""; for (const t of tokens) { if (t.lit !== undefined) s += t.lit; else for (let k = 0; k < t.len; k++) s += s[s.length - t.d]; } return s; }
L.onReady(() => {
  const fig = $("w-lz"); if (!fig) return;
  const inp = $("lz-text"), strip = $("lz-strip"), toks = $("lz-toks");
  let T = [], sel = -1;
  const esc = (ch) => (ch === " " ? "␣" : ch.replace(/[&<>]/g, (x) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[x])));
  function run() { inp.value = inp.value.slice(0, MAXLEN); T = lz77(inp.value); sel = T.findIndex((t) => t.d); draw(); }
  function draw() {
    const s = inp.value, t = T[sel];
    const src = t && t.d ? [t.at - t.d, t.at - t.d + t.len] : null, dst = t && t.d ? [t.at, t.at + t.len] : null;
    const inMatch = new Set(); T.forEach((q) => { if (q.d) for (let k = q.at; k < q.at + q.len; k++) inMatch.add(k); });
    strip.innerHTML = [...s].map((ch, i) => {
      const cls = [inMatch.has(i) ? "m" : "", src && i >= src[0] && i < src[1] ? "src" : "", dst && i >= dst[0] && i < dst[1] ? "dst" : ""].join(" ");
      return `<span class="${cls}">${esc(ch)}</span>`;
    }).join("");
    toks.innerHTML = T.map((q, i) => q.d
      ? `<button class="tok ref${i === sel ? " sel" : ""}" data-i="${i}">↶ ${q.d}, ${q.len}</button>`
      : `<span class="tok lit">${esc(q.lit)}</span>`).join("");
    toks.querySelectorAll("button.tok").forEach((b) => (b.onclick = () => { sel = +b.dataset.i; draw(); }));
    const nl = T.filter((q) => !q.d).length, nm = T.length - nl;
    $("lz-n").textContent = s.length; $("lz-lit").textContent = nl; $("lz-ref").textContent = nm;
    $("lz-sel").textContent = t && t.d ? `go back ${t.d}, copy ${t.len} → “${s.slice(t.at, t.at + t.len)}”` + (t.len > t.d ? " (overlaps itself: copies what it is still writing)" : "") : "no back-references found";
  }
  inp.addEventListener("input", run);
  fig.querySelectorAll("[data-lz]").forEach((b) => (b.onclick = () => { inp.value = b.dataset.lz; run(); }));
  run(); L.onTheme.push(draw);
  L.test("LZ77: tokens decode to the input; 'abcabcabcabc' uses one overlapping copy", () => {
    const keep = inp.value; inp.value = "abcabcabcabc"; run();
    const ok = unlz(T) === "abcabcabcabc" && T.length === 4 && T[3].d === 3 && T[3].len === 9 && /overlaps/.test($("lz-sel").textContent);
    inp.value = keep; run(); return ok && unlz(T) === keep;
  });
});

