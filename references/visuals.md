# Visuals: Making the Idea Visible

A good visual shows something the text can't: motion, shape, the relationship between many numbers at once. Choose the visual from the concept, generate it for real when the tools exist, check it, and refer to it precisely in the prose ("in the second panel, notice the blue arrow never leaves its line").

## Choosing the visual

| What you're explaining | Best visual | Why |
|---|---|---|
| A transformation of space (matrix, rotation, shear, projection) | Manim animation of a grid and vectors being transformed | the idea *is* the motion |
| A decomposition (SVD, polar, QR, eigen) | Manim: show the stages (rotate → stretch → rotate) one at a time | each factor is a separate motion |
| Removing a component, Gram–Schmidt | Manim: the vector, its projection's shadow, the subtraction | the student watches orthogonality being created |
| Optimization trajectories, contour plots | matplotlib contours + paths (several methods on one plot) | comparison at a glance |
| Convergence, error vs iteration, scaling laws | matplotlib line plots (log scale where appropriate) | numerical behaviour |
| Distributions, Bayes updates, sampling | matplotlib histograms/densities, before/after panels | shape of uncertainty |
| A matrix's structure (sparsity, conditioning, attention weights) | matplotlib `imshow` heatmap with colourbar | many numbers at once |
| Algorithm stages, pipelines, protocols | Graphviz / Mermaid flowchart or sequence diagram | structure and order |
| Client drift / heterogeneity in federated learning | 2-D contour plot with each client's local optimum and the local trajectories drifting toward them, plus the averaged iterate | the bias is a geometric pull you can see |
| Polar decomposition, orthogonalization of a matrix | the unit circle → ellipse under A, then the same circle under UVᵀ (singular values set to 1) | what orthogonalization keeps and throws away |
| Architectures, system design, conceptual maps | Excalidraw (hand-drawn style) or Graphviz | relationships between parts |

Don't make a visual that repeats the text. Don't use ASCII art for geometry, architectures or flows; use a real diagram. Plain-text *tables of numbers* and matrices written out in code blocks are fine.

## Check the environment first

```
command -v manim manimgl dot mmdc; python3 -c "import matplotlib, numpy; print('ok')"
```

- If Manim **is** installed and a Manim skill (`manimce-best-practices`, `manim-composer`, `3b1b-style-animation`) exists, load it before writing a scene.
- If Manim is **not** installed, don't load Manim skills just to write unrenderable code. Render the motion as static staged panels (matplotlib small multiples, one panel per stage of the transformation) and, optionally, attach a short Manim scene as source, clearly labelled as unrendered.
- If a library is missing, don't install packages without the user's go-ahead. Offer the one-line install command, and meanwhile provide the source.
- Save outputs in the scratchpad or a `lesson-visuals/` folder the user can find, and give the full path.

## Generate → verify → reference

1. Write the script, with the data and parameters taken from the lesson's actual example (the same matrix, the same numbers).
2. Run it.
3. **Look at the output** (Read the PNG; for Manim, render a still with `-s` or check a frame) and fix anything misleading: labels, scales, overlapping text, colours that don't distinguish.
4. In the lesson, say what to look at and what it shows.

If you cannot render, write: "Here's a Manim scene for this. I haven't rendered it here (Manim isn't installed); run `manim -pql scene.py ProjectionScene`." Never describe a visual as if it was shown when it wasn't.

## Conventions

- One idea per figure; several panels only for before/after or method comparisons.
- Label axes with quantities *and units*; title states what the figure shows, not its type.
- Consistent colour roles across a lesson (e.g., original vector = blue, projection = orange, residual = green). Say them in the prose.
- Use colour-blind-safe palettes (matplotlib `tab10`, viridis); don't encode meaning by red/green alone.
- Equal aspect ratio for geometry (`ax.set_aspect('equal')`) so right angles look right.
- Log scales for errors and convergence; say so in the text.
- Keep animations short (5–20 s per idea) and slow enough to follow; pause on the key frame.

## Templates

**matplotlib: a vector projection (static)**

```python
import numpy as np, matplotlib.pyplot as plt
a = np.array([3.0, 1.0]); b = np.array([1.0, 2.0])
proj = (a @ b) / (a @ a) * a          # projection of b onto a
res = b - proj                         # the component orthogonal to a
fig, ax = plt.subplots(figsize=(5, 5))
for v, c, lab in [(a, 'tab:blue', 'a'), (b, 'tab:purple', 'b'), (proj, 'tab:orange', 'proj_a(b)')]:
    ax.quiver(0, 0, *v, angles='xy', scale_units='xy', scale=1, color=c, label=lab)
ax.quiver(*proj, *res, angles='xy', scale_units='xy', scale=1, color='tab:green', label='b − proj')
ax.set_xlim(-0.5, 3.5); ax.set_ylim(-0.5, 3.5); ax.set_aspect('equal'); ax.grid(alpha=.3); ax.legend()
ax.set_title('Removing the part of b that lies along a'); fig.savefig('projection.png', dpi=150, bbox_inches='tight')
```

**Manim (Community Edition): a matrix transforming the plane**

```python
from manim import *
class Shear(LinearTransformationScene):
    def __init__(self, **kw):
        super().__init__(show_coordinates=True, leave_ghost_vectors=True, **kw)
    def construct(self):
        v = self.add_vector([1, 1], color=YELLOW)
        self.wait()
        self.apply_matrix([[1, 1], [0, 1]])   # shear: i stays, j leans right
        self.wait(2)
# render: manim -pql shear.py Shear
```

**Graphviz: algorithm stages**

```
digraph G { rankdir=LR; node [shape=box, style=rounded];
  grad [label="gradient G"]; mom [label="momentum M ← βM + G"];
  ns [label="Newton–Schulz\n(≈ polar factor UVᵀ)"]; step [label="W ← W − η·O"];
  grad -> mom -> ns -> step; }
# render: dot -Tpng stages.dot -o stages.png
```

**Mermaid** (renders on GitHub, Obsidian, many markdown viewers): ` ```mermaid ` + `flowchart LR` / `sequenceDiagram`.

**Excalidraw**: write a `.excalidraw` JSON file (`{"type":"excalidraw","version":2,"elements":[…]}` with `rectangle`, `arrow`, `text` elements). The user opens it at excalidraw.com or in Obsidian's Excalidraw plugin. Best for conceptual maps and architectures that benefit from a sketch feel.

## In claude.ai (no local tools)

Use the analysis tool or code execution to render matplotlib figures, or an HTML/SVG artifact for interactive or diagrammatic visuals. If none is available, give the source and describe the figure precisely enough to sketch.
