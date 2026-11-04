# Choosing Real Examples

The example is not decoration; it is where the student first *meets* the concept. A good example lets them discover the idea; a bad one makes them translate an arbitrary story back into math.

## The mechanism test

Before using an example, check three things:

1. **Shared mechanism.** Does the situation actually contain the structure of the concept (the same variables, the same feedback, the same trade-off), or does it just share a mood? Camera focus shares gradient descent's mechanism: one adjustable parameter, a measurable quality, local probing, iterative steps, overshoot if you turn too far. "Learning is like climbing a mountain" shares only a mood.
2. **Recognisability.** Would this student have experienced or seen it? Pick from their world (an engineering student, a programmer, a biologist) when you know it.
3. **Honest limits.** Can you say clearly where it stops matching? If not, you don't understand the mapping well enough to use it.

Then **say the mapping out loud** ("the focus ring position is the parameter θ, the sharpness is −J(θ)…") and **say where it breaks** ("a real autofocus motor probes by actually moving; in machine learning we can compute the slope directly with calculus, without trial moves — that's what makes it scale to millions of parameters").

## Anti-examples (don't default to these)

- "Alice has 3 apples and Bob has 4" for anything beyond arithmetic.
- "Consider a company with 17 employees / five customers with vectors [2, 7, 1]". Arbitrary data teaches nothing about *why*.
- "Imagine a ball rolling down a hill" for every optimisation topic. Use it when it fits (momentum *is* physics), not as a reflex.
- Numbers chosen with no meaning: x = 7, w = 3.2. If you need numbers, give them units and realistic magnitudes.
- Cute but wrong analogies: "electrons flow like water" without saying what pressure, pipes and flow map to and where it breaks; "a neural network is like a brain".

Toy examples are acceptable when the *point* is a computation to follow by hand (a 2×2 matrix, a 3-neuron network). Even then, ground the numbers: a 2×2 matrix that is an actual shear in an image editor beats one with random entries.

## Realistic numbers

Use magnitudes a practitioner would recognise. Some reliable anchors:

- Ethernet MTU 1,500 bytes; typical TCP maximum segment size ~1,460 bytes; round-trip times of a few ms on a LAN, 20–100 ms across a country, 150+ ms between continents.
- Rough latency ladder (orders of magnitude): L1 cache ~1 ns, main memory ~100 ns, SSD read ~100 µs, spinning-disk seek ~10 ms.
- Learning rates for SGD/Adam commonly 1e-4 to 1e-1; float32 carries ~7 significant decimal digits, float64 ~16.
- Database pages are typically 4–16 KB (InnoDB default 16 KB), which is why B-tree nodes hold hundreds of keys and a billion-row index is only ~3–4 levels deep.
- Binary search over a billion sorted items needs about 30 comparisons (2³⁰ ≈ 1.07 × 10⁹).
- A poll of ~1,000 people has a 95% margin of error of about ±3 percentage points (1.96·√(0.25/1000) ≈ 0.031).
- GPS: light travels ~30 cm per nanosecond, so a 1 µs clock error is ~300 m of ranging error; uncorrected relativistic effects on satellite clocks amount to ~38 µs/day.

**If you're not confident of a real-world figure, don't state it as fact.** Say "for illustration, suppose…" and keep it plausible, or compute it from first principles in front of the student. When tools are available, compute numbers by running code.

## Example bank by concept

Each entry: the situation, *why* it carries the mechanism, and where it breaks. These are starting points; choose based on the student and the concept, and vary them.

### Calculus and optimisation
- **Derivative**: a car's speedometer vs. average speed for a whole trip (the instantaneous rate as the limit of averages over shorter intervals). Breaks: speed is a derivative in time; many derivatives are with respect to non-time variables.
- **Integral**: a water meter or a phone battery's charge counter accumulating a flow rate over time; distance from a log of speeds. Accumulation of rate × small interval is the definition.
- **Gradient descent**: contrast-detection autofocus in cameras literally hill-climbs a sharpness score by moving the lens; tuning an oven or a thermostat by trial. Breaks: real ML computes the slope analytically instead of probing, in millions of dimensions.
- **Learning rate too large**: adjusting a shower whose temperature responds with a delay leads you to overshoot back and forth. (Honest caveat: the shower's oscillation comes from *delay*; the gradient-descent oscillation comes from *step size relative to curvature*. Both are overshoot, with different causes, so say so.)
- **Convexity**: least-squares fitting of a line has one bowl-shaped error surface; a neural network's loss does not. Why one is guaranteed and the other isn't.
- **Constrained optimisation / Lagrange multipliers**: maximum area enclosed by a fixed length of fence; allocating a fixed compute budget between model size and data; the multiplier as the "price" of loosening the constraint by one unit.

### Exponentials and logarithms
- Compound interest and doubling time (rule of 72: 72/7 ≈ 10 years at 7%).
- Bacterial or epidemic growth before saturation.
- Logs as "how many times you multiplied": decibels (each +10 dB is ×10 in power), pH, earthquake magnitude (each unit ≈ 10× amplitude, ~32× energy), binary-search steps, the depth of a balanced tree.
- Log-likelihoods: multiplying thousands of probabilities underflows float64; summing their logs doesn't.

### Linear algebra
- **Matrix as transformation**: scale/rotate/shear tools in an image editor or game engine moving every pixel coordinate.
- **Determinant**: how much the transformation scales area (a 2× zoom scales area by 4); zero means space gets flattened, so the operation can't be undone.
- **Eigenvectors**: directions that a transformation only stretches. A shear in a photo editor leaves horizontal lines horizontal. PageRank's ranking is the eigenvector (eigenvalue 1) of the web's link-following matrix. Normal modes of a vibrating guitar string or bridge. Principal axes of a spinning book (stable about two axes, wobbly about the intermediate one). PCA directions of a dataset.
- **Dot product**: projection or "shadow"; work = force · displacement (pushing a stroller at an angle); cosine similarity between document or embedding vectors in search and recommendation.
- **Least squares / projection**: fitting a calibration line to noisy sensor readings; GPS solving for position from more satellites than unknowns.
- **SVD / low rank**: compressing an image by keeping the top singular values; matrix factorisation for recommendations (prominent in the Netflix Prize era).
- **Change of basis**: the same colour in RGB vs. YUV; the same signal in time vs. frequency.

### Probability and statistics
- **Bayes**: medical screening tests (a positive from a test with a low false-positive rate can still be more likely false than true when the condition is rare); spam filters; updating a weather forecast on what you see.
- **Conditional independence / naive Bayes**: words in an email treated as independent given spam/not-spam. Wrong, yet useful; explain why.
- **Law of large numbers**: insurers pooling risk; casinos; Monte Carlo estimates converging.
- **Central limit theorem / standard error**: the poll margin of error shrinking as 1/√n (so 4× the sample halves the error).
- **Variance**: manufacturing tolerances; noise in repeated sensor readings.
- **Hypothesis testing / A/B tests**: did the new checkout button change conversion, or is that noise?
- **Regression to the mean**: the "Sports Illustrated cover jinx"; a student's best exam score tends to be followed by a lower one.
- **Survivorship bias**: the classic WWII bomber-armour reasoning (Abraham Wald) — tell it accurately.

### Information theory
- **Entropy**: twenty questions, where each yes/no question at best halves the possibilities; Morse code gives E (the most common English letter) the shortest code; ZIP compression works because text is redundant.
- **Cross-entropy / KL**: the extra bits paid for encoding data with a code designed for the wrong distribution, which is exactly the classification loss.

### Numerical methods
- **Floating point**: 0.1 + 0.2 ≠ 0.3 in binary floating point; catastrophic cancellation when subtracting nearly equal numbers.
- **Accumulated error**: the 1991 Patriot missile timing failure (0.1 s is not exactly representable in binary; the truncation error grew over ~100 hours of uptime to roughly a third of a second).
- **Overflow**: the 1996 Ariane 5 failure from converting a 64-bit float to a 16-bit integer.
- **Iterative solvers / Newton's method**: how a calculator computes square roots; why convergence doubles correct digits per step.

### Algorithms and data structures
- **Big-O**: finding a name in a printed phone book (binary search) vs. an unsorted stack of business cards.
- **Hashing**: Python dicts, DNS caches, deduplicating uploaded files by content hash.
- **Graphs / shortest path**: route planners; network routing protocols (OSPF uses Dijkstra).
- **Dynamic programming**: edit distance in spell checkers and `diff`; sequence alignment in bioinformatics.
- **Trees**: file systems; B-trees in database indexes; tries in autocomplete.

### Systems
- **Scheduling**: a laptop playing music while compiling, with the audio never stuttering; priority inversion on Mars Pathfinder (1997).
- **Virtual memory**: every process believing it owns the address space; the system crawling when RAM is full and pages swap to disk.
- **Caching and locality**: why iterating a 2-D array row by row can be several times faster than column by column in C.
- **Deadlock**: gridlocked intersection where every car waits for the one ahead; maps cleanly onto the four Coffman conditions.
- **Queueing**: supermarket lines and web servers; waiting time explodes as utilisation approaches 100% (in the M/M/1 model, mean time in system ∝ 1/(1−ρ)).
- **Congestion control**: the Internet's 1986 congestion collapses and Van Jacobson's 1988 algorithms; highway on-ramp metering lights as the analogy (breaks: cars don't get dropped and retransmitted).
- **Consistency / CAP**: two bank branches unable to talk during a network partition — keep serving and risk inconsistency, or refuse.
- **Clocks in distributed systems**: why "which write happened first" is hard; Google Spanner's use of GPS and atomic clocks to bound uncertainty.
- **Database indexes**: a book index vs. reading every page; why a B-tree, not a binary tree, because disks and SSDs read whole pages.
- **Transactions**: two people booking the last airline seat at the same moment.
- **Compilers**: constant folding, dead code elimination; register allocation as graph colouring.

### Machine learning
- **Classification**: spam filtering; medical image triage.
- **Recommendation**: implicit feedback (watch time, skips), cold start for new users.
- **Image recognition / CNNs**: edge-detection kernels; why the same filter slides everywhere (a cat is a cat in any corner).
- **Speech recognition**: variable-length audio to variable-length text; why alignment is hard.
- **Autonomous driving perception**: rare events (a mattress on the highway), distribution shift between sunny training data and night rain.
- **Overfitting**: memorising past exam answers vs. understanding the subject; a polynomial threading every noisy data point.
- **Attention**: a soft version of a dictionary/database lookup: query matched against keys, returning a weighted blend of values.
- **Backpropagation / chain rule**: gears in a gearbox, whose ratios multiply; sensitivity analysis in a spreadsheet traced backward from the final cell.

### Physics and engineering
- **Harmonic oscillator**: car suspension, building sway, the tuned mass damper in Taipei 101; a quartz watch crystal.
- **Resonance**: pushing a child on a swing at the right moment. (Accuracy note: the 1940 Tacoma Narrows collapse is usually attributed to aeroelastic flutter, not simple resonance. Don't repeat the myth.)
- **Exponential decay / RC circuits**: a camera flash capacitor charging; coffee cooling (Newton's law of cooling).
- **Heat equation / diffusion**: heat through a wall; insulation R-values.
- **Sensor fusion / Kalman filter**: a phone combining GPS (accurate but slow, noisy) with accelerometers (fast but drifting); the Apollo guidance computer used Kalman filtering.
- **Feedback control**: cruise control, PID loops in drones, the shower again.
- **Signals / Fourier**: an audio equaliser; JPEG's discrete cosine transform; noise-cancelling headphones.

## When the concept is inherently abstract

Some ideas (group axioms, measure, compactness, Turing completeness) don't have an everyday twin. Then build the concrete example from the concept's *own* behaviour: the symmetries of a square for groups; trying to assign "length" to every subset of the line for measure; a sequence wandering in (0,1) that converges to a point outside the set for (non-)compactness; a short program that interprets other programs for universality. Concrete means "something specific you can compute and look at", not necessarily "something from daily life".

## Variety

Track which anchors you've used in a conversation and don't reuse the same one for unrelated concepts. If the student is an engineer, lean on physical systems; a programmer, on software they've used; a biologist, on biological processes, provided the mechanism really matches.
