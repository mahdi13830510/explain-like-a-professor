# Teaching Mathematics: Rigorous but Intuitive

The student wants to know how and why an equation was *constructed*, not to be shown a formula and have its parts labelled. A formula is the final, compressed form of an argument; the lesson is the argument.

## Teaching in components

Mathematical operations deserve their own explanations. A topic like "matrix orthogonalization" or "SVD" is a stack of operations and properties, and the student understands the topic only when they understand every layer. Mentioning a layer is not teaching it.

### The component protocol

For each component (an operation, a property, a decomposition, an algorithm step):

1. **The problem**: what question forces this to exist? What can't we do without it?
2. **The picture**: what it does to vectors, space, functions or data. Show it with a visual where one helps (`visuals.md`).
3. **The mechanism**: how it works, step by step, in words.
4. **The formal statement**: definition and notation; every symbol with meaning, type, shape, units.
5. **The derivation**: why the formula is what it is, every meaningful step justified.
6. **A small example**: computed in full, interpreted, then connected back to the general case.
7. **Properties and edge cases**: what's always true, what can go wrong (zero vectors, rank deficiency, ill-conditioning).
8. **The hand-off**: how this component is used by the next one in the chain.

Short components (orthogonality of two vectors) may need only a paragraph and an example; long ones (QR) need the full treatment. What's not allowed is skipping a component the student lacks, or collapsing two different ones into one.

### Component chains: two illustrations

These show the *depth* expected. They're not fixed sequences; adapt the order to the topic and the student.

**Matrix orthogonalization**
1. Vectors as arrows and as lists; length.
2. The inner product: algebraic definition, geometric meaning (|a||b|cos θ, derived from the law of cosines), what it measures (alignment).
3. Orthogonality: inner product zero. Why it's useful: independent directions, no "double counting".
4. Projection of b onto a: derive proj = (aᵀb / aᵀa)·a from "the residual must be orthogonal to a". Visual: the shadow.
5. Removing a component: b − proj, and checking it really is orthogonal to a.
6. Orthogonal vs orthonormal; why normalising is a *separate* step from orthogonalising (direction vs length).
7. Gram–Schmidt, every step, on a real 3×3 example; why the order of vectors matters; why classical Gram–Schmidt loses orthogonality in floating point and modified Gram–Schmidt helps.
8. Orthogonal matrices: QᵀQ = I, preserves lengths and angles, Q⁻¹ = Qᵀ, rotations and reflections.
9. QR decomposition: Gram–Schmidt recorded as a factorisation; why R is upper triangular (each column only uses earlier directions); its uses (least squares without forming AᵀA); Householder as the stable way to compute it.
10. Why we might want an orthogonal matrix *close to* a given matrix rather than any orthonormal basis of its column space. This is where QR stops being the right tool.
11. SVD (as its own chain, below), then the polar decomposition A = (UVᵀ)(VΣVᵀ): an orthogonal factor times a stretch. The polar factor UVᵀ is the *nearest* orthogonal matrix to A in Frobenius norm. Contrast with Q from QR, which depends on column order and isn't nearest.
12. Newton–Schulz: an iteration of matrix polynomials (only matmuls, GPU-friendly) that pushes every singular value toward 1, converging to UVᵀ; why it needs pre-scaling; how many iterations; what an inexact result means.
13. Cost and stability comparison: Gram–Schmidt vs Householder QR vs SVD vs Newton–Schulz.

**SVD**: don't open with A = UΣVᵀ.
1. What a matrix does to space: the unit circle becomes an ellipse (visual).
2. Special directions: which input directions land on the ellipse's axes?
3. Singular values as the axis lengths, i.e. stretch factors.
4. Right singular vectors (input directions) vs left singular vectors (output directions): why we need *two* sets, unlike eigenvectors (input and output spaces differ, even in dimension).
5. The geometric decomposition: rotate (Vᵀ) → stretch (Σ) → rotate (U), animated stage by stage.
6. The derivation: AᵀA is symmetric PSD, so the spectral theorem gives orthonormal eigenvectors V with eigenvalues σᵢ²; define uᵢ = Avᵢ/σᵢ and show they're orthonormal.
7. Connection to eigendecomposition: when they coincide (symmetric PSD), when they differ.
8. A worked 2×2 example by hand, then checked with `np.linalg.svd`.
9. Uses: low-rank approximation (Eckart–Young), pseudoinverse, PCA, conditioning, and the polar factor. Limits: cost O(mn·min(m,n)), sign and rotation ambiguity of the singular vectors.

The same standard applies to derivatives, gradients, Jacobians, Hessians, eigen-decompositions, norms, matrix multiplication, optimization, probability and estimators.

## The equation protocol

For every equation that matters in a lesson:

1. **Motivating problem.** What were we trying to compute or guarantee when we needed this?
2. **Intuition first.** What should the answer *look like*? Which way should it move when an input changes? Sometimes have the student guess the form.
3. **Define every symbol** at first use: what it means, its type (scalar, vector, matrix, function, random variable), its **shape** and its **units** when physical.
4. **Plain language.** Say what the whole equation claims in one ordinary sentence.
5. **Why this structure?** Why a sum and not a product? Why squared? Why the minus sign? Why divide by n − 1? Every feature of a formula has a reason; give it. If the formula combines several operations (a transpose, a normalisation, a sum over an axis), explain the role of each one individually.
6. **Derive it** from things the student already accepts.
7. **Name the rule** behind every transformation (chain rule, linearity of expectation, distributing the transpose, completing the square, the product rule, etc.).
8. **Never skip algebra that a student could get stuck on.** "After some algebra" and "after simplification" are banned when the simplification matters. Trivial arithmetic can be combined; any step involving a rule, a substitution, or a cancellation gets its own line.
9. **Sensitivity.** What happens to the output when each input grows, shrinks, or hits zero? This is often the fastest route to intuition.
10. **Numerical check** with meaningful numbers: plug in, compute, and interpret the result in the language of the original problem.
11. **Sanity checks**: units balance, limiting cases (what if n → ∞? if the noise → 0?), symmetry, sign.
12. **Assumptions and limits**: where does the derivation use independence, linearity, differentiability, convexity, small-angle approximation…? What breaks if it fails?
13. **Connections**: to the previous components and to where it's used.

## Formatting derivations

Each line is one transformation, with its justification on the right. In a terminal (no LaTeX rendering), use a fenced block:

```
Var(x̄) = Var((1/n)·Σᵢ xᵢ)                    definition of the sample mean
       = (1/n²)·Var(Σᵢ xᵢ)                   Var(cX) = c²·Var(X)
       = (1/n²)·Σᵢ Var(xᵢ)                   variances add for independent terms
       = (1/n²)·n·σ²                          each xᵢ has variance σ²
       = σ²/n
```

Then say in a sentence what the derivation showed ("averaging n readings shrinks the spread by √n, so a 4× bigger sample halves the error"), and which line used an assumption (line 3 needs independence; with correlated readings, such as hourly temperatures from the same sensor, the error shrinks more slowly).

Where LaTeX renders, use `$$\begin{aligned} … &= … && \text{(reason)} \end{aligned}$$`.

## Shapes and dimensions

Shape-tracking is the single most useful habit for linear algebra and deep learning. When matrices or tensors appear:

- State every shape: `X ∈ ℝ^{n×d}` (n examples as rows, d features), `w ∈ ℝ^{d}`, `y ∈ ℝ^{n}`.
- Check each product: `(n×d)(d×1) → (n×1)`.
- Explain *why* a transpose appears by shapes: in ∇_w = (2/n)·Xᵀ(Xw − y), the residual is n×1 and the gradient must be d×1, so the only way to combine them is Xᵀ (d×n) times the residual.
- Explain which axis is summed over and what that sum *means* (summing over examples = averaging evidence; summing over features = combining measurements).

For physics: carry units through every line; a units mismatch is the fastest error detector there is.

## Numerical experiments

The most convincing picture is often a table of numbers evolving. Show 3–6 iterations of an algorithm, or a function evaluated at several inputs, so the student watches the behaviour rather than being told about it. If you have code execution, run the experiment and report real numbers; don't hand-compute long decimals. Round sensibly (3–4 significant figures) and say so.

## The pictures that make each area click

**Linear algebra.** Vectors as arrows and as lists, and the translation between them. A matrix is a transformation, and its columns are where the basis vectors land. Matrix multiplication is composition (apply right first). The determinant is the volume scaling factor, sign = orientation flip. Rank is the dimension of the output space; the null space is what gets crushed to zero. Eigenvectors are directions left on their own span; eigenvalues are the stretch factors. Dot product: projection times length, which is also "how aligned". Inverse: undoing the transformation, impossible exactly when something was flattened. SVD: every matrix is rotate → stretch along axes → rotate. Symmetric matrices: stretching along perpendicular axes (spectral theorem).

**Calculus.** Derivative = sensitivity: the ratio of a tiny output change to a tiny input change, i.e. the slope of the zoomed-in graph. The chain rule multiplies sensitivities through a pipeline. The integral is accumulation of tiny pieces, and the fundamental theorem says accumulation and rate undo each other. Taylor series: approximating a function locally by matching its value, slope, curvature…

**Multivariable calculus.** The gradient is the direction of steepest increase, perpendicular to level sets (contour lines on a hiking map). The Jacobian is the best local linear approximation of a map, a matrix that changes from point to point. The Hessian is curvature in every direction, and its eigenvalues are the curvatures along principal directions. A saddle point is uphill in one direction and downhill in another.

**Probability and statistics.** Probability as proportion of a population of possible worlds; conditioning means zooming into the sub-population where the evidence holds. Expectation is a long-run average and a balance point. Variance is the expected squared distance from that balance point. Distributions as shapes of uncertainty. Likelihood: how well each hypothesis predicted what actually happened (a function of parameters, not a probability over them). The CLT says sums of many small independent effects look Gaussian.

**Optimisation.** Loss landscapes and contour plots; convex = one valley, with no false bottoms. Constraints as walls; at a constrained optimum the objective's gradient is a combination of the constraint gradients (Lagrange/KKT). Conditioning: long narrow valleys make gradient descent zigzag (eigenvalues of the Hessian far apart).

**Real analysis.** ε–δ as a game: you give a tolerance, I must find how close is close enough. Convergence as "eventually trapped in every band". Completeness as "no holes in the line" (√2 is missing from the rationals). Compactness as "every sequence has a sub-sequence that settles somewhere inside".

**Norms and inner products.** Different norms = different shapes of the unit "circle" (L1 diamond, L2 circle, L∞ square), which explains why L1 regularisation produces sparse solutions (corners touch axes). An inner product is a way of measuring angles and lengths; changing it changes geometry.

**Convex analysis.** Chord above the graph; local minimum = global minimum; supporting hyperplanes; duality as bounding the best you can do from the other side.

**Information theory.** Entropy = average number of yes/no questions needed with the best strategy; surprise = −log p; KL divergence = extra cost of using the wrong model; mutual information = how many questions knowing X saves you about Y.

**Matrix decompositions.** LU = Gaussian elimination recorded; QR = Gram–Schmidt recorded (orthonormalising); eigendecomposition = choosing a basis where the transformation is pure stretching; Cholesky = "square root" of a positive-definite matrix (used to sample correlated Gaussians); SVD as above.

**Numerical methods.** Floating point as scientific notation with a fixed number of bits; condition number as "how much input error gets amplified"; stability as whether an algorithm adds its own amplification on top.

**Discrete mathematics.** Induction as dominoes, but stress what the inductive step really requires. Counting as constructing objects by a sequence of choices (and noticing over-counting). Graphs as relations you can draw. Proof by contradiction and the pigeonhole principle as tools for showing something must exist.

## Common misconceptions to confront

- The gradient points to the minimum. (It points to steepest *local* ascent; its negative isn't aimed at the minimum unless the contours are circles.)
- Matrix multiplication is commutative / AB means "apply A first".
- A singular matrix "has no eigenvalues" (it has eigenvalue 0).
- Correlation of zero means independence.
- P(A|B) = P(B|A) (the prosecutor's fallacy).
- The likelihood is the probability of the parameters.
- A p-value is the probability that the null hypothesis is true.
- dy/dx is a fraction you can always cancel. (The chain rule makes it *look* that way; say when the notation is honest and when it's a convenience.)
- Larger learning rate = faster convergence.
- Floating-point arithmetic is associative.

## Levels of rigor

Match rigor to the request and say what level you're at:
- **Intuitive**: correct statements, informal justification, pictures.
- **Standard**: full derivations under stated assumptions (the default for deep mode).
- **Formal**: definitions, theorems, proofs with every hypothesis used and pointed to (mathematical mode, or when the student asks "prove").

Never present an informal argument as a proof. When you simplify, mark it: "this argument assumes the function is twice differentiable; the general statement needs more care."
