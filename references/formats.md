# Learning Materials: Formats, Standards, and Delivery

A lesson can be delivered as an interactive website, a textbook-quality PDF, a lecture slide deck, a Jupyter notebook, a standalone simulation, a video or animation, or plain chat. The user chooses. Your job is to make that format exceptional, **without ever giving up teaching depth**: every format carries the complete development (problem → components → derivations → examples → limits → connections), with visuals placed exactly where they help.

## 1. Ask, unless they already said

Before producing a learning artifact, ask which format they want, unless the request or the conversation already makes it clear ("make me a website on…", "slides for…", "a notebook", or an earlier answer in this conversation). Ask once per conversation; reuse the answer for later lessons unless they change it. Quick questions never need a format question; answer in chat.

Use a structured question tool (e.g., AskUserQuestion) when available. Keep it short and name what each option is good for:

| Option | Best when |
|---|---|
| **Interactive HTML lesson** | geometry, transformations, parameters to play with, algorithms to step through |
| **PDF (textbook chapter)** | long-term study and reference, printing, heavy derivations |
| **Slides** | presenting, revising, teaching others; one idea per slide |
| **Jupyter notebook** | learning by computing: experiments, implementations, numerical checks |
| **Standalone simulation** | one concept to explore deeply (e.g., a gradient-descent lab) |
| **Animation / video** | a transformation or process that must be *watched* unfolding |
| **Chat** | a fast, conversational lesson with figures inline |

Multiple formats for one lesson are fine (e.g., HTML plus a PDF for reference). Suggest a different format when it would clearly teach better ("this is mostly about watching a matrix act on space; I'd suggest the interactive HTML").

## 2. Check the toolchain first

```
command -v chromium google-chrome manim ffmpeg tectonic typst pandoc jupyter libreoffice node
python3 -c "import matplotlib, numpy"; python3 -c "import plotly" ; python3 -c "import nbformat"
```

Pick the best path that exists; don't install packages without the user's go-ahead (offer the command). State plainly what you used and what you couldn't render.

## 3. Interactive HTML lesson

**Goal:** the learner feels they are exploring the subject itself, as in an outstanding interactive course, not reading a web page.

**Start from the template** in `templates/html-lesson/`. Copy it to the lesson folder and fill it in:
- `index.html` holds the lesson text, blocks and figures;
- `styles.css` is the design system: paper/ink palette, light and dark themes, a serif reading face, sans UI, labelled teaching blocks;
- `lesson.js` provides the runtime: TOC with scrollspy, progress bar, theme toggle, KaTeX rendering, step-by-step derivations, SVG plotting helpers, draggable handles, self-tests;
- `widgets.js` holds this lesson's interactive figures.

```
lessons/<topic-slug>/
  index.html  styles.css  lesson.js  widgets.js
  assets/  (images, exported diagrams)   animations/  (rendered mp4/webm)   diagrams/  (svg)
```

Keep it **self-contained** with relative paths. Only KaTeX and fonts come from a CDN; they're pinned, and the lesson degrades gracefully without fonts. For offline use, vendor KaTeX into `assets/` (download `katex@0.16.11` dist and repoint the three tags).

**Teaching structure (non-negotiable):** the page contains the *whole* lesson. One `<h2>` per major component, prose that carries the reasoning, then:
- `.block.def` for formal definitions;
- `.block.key` for the one idea to remember;
- `.block.example` for worked examples;
- `.block.warn` for misconceptions;
- `.derivation[data-stepwise]` for derivations, one transformation per row with its reason, revealed step by step;
- `<figure class="widget">` placed exactly where the idea needs it;
- `.check` questions with `<details>` answers at the end.

A beautiful page with shallow text is a failure.

**Interactivity that teaches.** Every widget lets the learner change a cause and watch the effect, and its caption says what to try and what to notice. Patterns worth building:

| Concept | Widget |
|---|---|
| derivative / limit | drag a point; a slider shrinks h; the secant visibly becomes the tangent; a table of difference quotients updates live |
| projection, Gram–Schmidt | drag two vectors; projection, residual and right angle update; step through Gram–Schmidt one subtraction at a time |
| matrix as transformation | edit the 2×2 entries or drag the basis vectors; the grid and a shape transform, animated from identity |
| eigenvectors | rotate a probe vector; highlight when Av ∥ v; show the eigen-directions |
| SVD | sliders for σ₁, σ₂ and the two angles; watch circle → rotate → stretch → rotate |
| gradient descent | contour plot; set start point and learning rate; animate iterates; show divergence past 2/λ_max |
| distributions | parameter sliders reshape the density; sample and histogram live |
| algorithms | step / play / reset through every operation, with the state table updating |

**Plot helper options.** `L.plot(svg, {xmin, xmax, ymin, ymax, w, h, equal, grid, axes, ticks})`:
- `equal: true` gives true aspect ratio for geometry;
- `axes: false` hides the zero lines, for scale drawings;
- `ticks: "edge"` puts tick labels on the frame instead of the zero lines, useful when curves cross the axis;
- `ticks: "none"` removes tick labels.

Everything drawn with `P.fn/line/dot/text/arrow` or inside `P.layer()` is clipped to the frame; use `P.unclipped()` for labels outside it. Tick labels have a halo, so grid lines never cut through them. An explicit `fill` attribute on text overrides the theme colour.

**Libraries.** Use whatever explains best:
- the template's SVG helpers for most 2-D math;
- Canvas for many points or particles;
- D3 for data-driven figures;
- Plotly for interactive 3-D surfaces and quick rich plots;
- Three.js for 3-D geometry (3-D transformations, surfaces, loss landscapes);
- rough.js for Excalidraw-style hand-drawn diagrams rendered in the page (Excalidraw itself is built on rough.js);
- Mermaid for flowcharts.

Pin exact versions from a CDN (cdn.jsdelivr.net/npm/pkg@x.y.z).

**Animations.** Show transformations *progressively* (identity → final, with easing, a replay button), not just the end state. Use `requestAnimationFrame` with `t ∈ [0,1]` interpolation, and respect `prefers-reduced-motion`. Embed rendered Manim output as `<video controls loop muted playsinline>`, only when it was actually rendered.

**Design rules.**
- Use the template's tokens; one accent colour; colour has meaning (keep "vector a = blue" consistent across text and figures).
- Generous whitespace, a ~70-character reading measure, wide figures.
- No gradients, glassmorphism, emoji headings, card grids, or decorative animation.
- Every figure must read in both themes: get colours from CSS variables (`L.css("--blue")`) and redraw via `L.onTheme`.
- Responsive: figures scale through their SVG viewBox; controls wrap; no horizontal page scroll.

**Verify before delivering.** Run the checker, read the screenshots, and fix what's wrong:

```
python3 <skill>/scripts/check_html.py lessons/<slug>/index.html
```

The checker loads the page in headless Chromium at desktop and narrow widths and reports:
- missing local assets;
- JavaScript errors;
- KaTeX errors and how many expressions rendered;
- every widget self-test (each widget registers `L.test(...)`, which drives its own control and asserts that the figure changed);
- horizontal overflow.

It also saves screenshots. Look at them (Read the PNG) for overlapping labels, unreadable colours and broken layout. If no browser is available, say the lesson is untested in a browser.

**Deliver** the folder path and how to open it (`xdg-open`/`open` `index.html`). If an Artifact/publishing tool is available, offer to publish it; if the user hosts on GitHub Pages, the folder works as-is.

## 4. PDF: a textbook chapter

Not a transcript. Use the structure of a good textbook chapter: title, learning goals, sections per component, numbered definitions, theorems and equations, full derivations, figures with captions, worked examples, algorithm boxes or pseudocode, a summary of assumptions and limits, exercises with solutions at the end, page numbers, headers.

Toolchains, in order of preference:
1. **Typst** (`typst compile`): fast, beautiful math, easy layout. Write a small template: page size, numbering, a serif body font, theorem and definition boxes.
2. **LaTeX** via `tectonic` (self-installing) or `pdflatex`/`xelatex`: the classic textbook look; use `amsmath`, `amsthm`, `tcolorbox` for blocks, `algorithm2e` or `algorithmic`.
3. **HTML → PDF**: build print CSS for an HTML lesson and print with headless Chromium (`chromium --headless --print-to-pdf=out.pdf --no-pdf-header-footer file://…`). Interactive widgets need static fallbacks.
4. `pandoc` from Markdown with a LaTeX or Typst engine, for simpler documents.

Figures come from matplotlib (vector PDF/SVG), Graphviz or TikZ. Verify:
- the PDF exists and its page count is sensible;
- render one or two pages to PNG (`pdftoppm`, or `typst compile --format png`) and look at them for overfull lines, broken math and misplaced figures.

## 5. Slides: a university lecture

A complete, coherent lesson, understandable without a speaker, not bullet summaries.
- One idea per slide.
- Diagrams and equations dominate the slide; text is minimal but complete sentences.
- Build-ups reveal derivations progressively, one step per click or one per slide.
- Consistent layout grid and typography.
- Section divider slides follow the component chain.
- Speaker notes carry the full explanation when the slide is visual.

Toolchains:
- `.pptx`: use a pptx skill if installed (e.g., `anthropic-skills:pptx`), or `python-pptx`.
- PDF slides: Typst (touying/polylux) or LaTeX Beamer (metropolis theme), or HTML slides (reveal.js, pinned) printed to PDF.
- Rendered math: put equations into slides as rendered images or native math (Beamer/Typst), never raw `$…$`.

Verify by rendering slides to images and viewing several, including the densest one.

## 6. Jupyter notebook: a computational laboratory

The notebook is the lesson. Markdown cells carry the full explanation and derivations (LaTeX math renders in Jupyter); code cells are short, each doing one thing, mirroring the math with shape comments; experiments end with a plot and a markdown interpretation; exercises have solution cells that are hidden or placed at the end.

- Build it with `nbformat` if available. Otherwise write the `.ipynb` JSON directly: nbformat 4, cells with `cell_type`, `source`, `metadata`, and `outputs: []`.
- Verify it **runs top to bottom**: `jupyter nbconvert --to notebook --execute`, or, without Jupyter, extract the code cells in order into a script and run it with `python3`, which catches errors and missing imports.
- Pin a seed so the outputs match the text.
- List requirements in the first cell.

## 7. Standalone simulation

A single-page tool for exploring one concept deeply, e.g., "Gradient Descent Lab". Use the HTML template's runtime. It's a full-screen figure with:
- a control panel;
- presets ("try: learning rate just above 2/λ_max");
- a short "what you're seeing" explanation beside it;
- a link back to the lesson.

Verify it with the same checker.

## 8. Animation / video

- **Manim** (if installed): one scene per idea, 5–20 s each, captions or narration notes. Render with `manim -qm`, check frames, and deliver the mp4 plus the source.
- **Without Manim**: matplotlib `FuncAnimation` → mp4 with `ffmpeg`, or an in-browser animation in the HTML runtime. Export frames to verify.
- Never present an unrendered scene as a video. If only source exists, say so and give the render command.

## 9. Quality bar and delivery checklist

- [ ] Every file exists; paths are relative; no missing assets.
- [ ] Math renders (checker or rendered page images); no raw `$…$` visible.
- [ ] Every interactive component was exercised (self-tests) and every animation plays.
- [ ] Layout checked at desktop and narrow widths, or rendered pages viewed.
- [ ] The teaching is complete: problem, components, derivations, examples, limits, connections.
- [ ] You looked at the output yourself (screenshots or page renders) before saying it's done.
- [ ] Delivered with the path, how to open it, and anything not rendered stated plainly.

**Standard:** an HTML lesson feels like an outstanding interactive course; a PDF like a published textbook chapter; slides like a carefully designed university lecture; a notebook like a complete computational lab.
