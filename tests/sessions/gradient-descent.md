Contrast-detection autofocus, the kind used in many compact cameras and as a fallback in phone cameras, works in a way you can sometimes watch happen. The image goes soft, sharpens, overshoots into blur, and settles back. The camera cannot see "in focus". All it can do is compute a sharpness score from the pixels (roughly, how strongly neighbouring pixels differ), move the lens a little, and compute the score again. Did it go up? Keep going that way. Did it go down? Reverse. The camera has no map of where the best lens position is. At every moment it knows exactly one thing: if I nudge the lens from here, does the picture get better or worse, and how fast?

That is gradient descent, and the question "why does it work?" is really three questions. Why is purely local information (the slope where you are standing) enough to make progress toward a global goal? How big a nudge are you allowed to take? And why does it sometimes crawl, or blow up, instead of converging? Basic calculus answers all three, and you'll see that the second and third answers are the same answer.

### A problem we can actually check

Let's leave the camera and set up a problem where we can compute everything. You're calibrating a spring. You hang 50 g, 100 g, ..., 250 g on it, so the forces are F = 0.49, 0.98, 1.47, 1.96, 2.45 N (using g = 9.8 m/s²), and you measure the extensions. Say, for illustration, you read off x = 2.4, 5.1, 7.3, 9.9, 12.2 cm. Hooke's law says F = k·x, and you want the stiffness k, in N/cm.

The points don't lie exactly on a line (your ruler and your eye aren't perfect), so no single k fits all five. We need a number that says how badly a given k fits, and then we want the k that makes it smallest. The standard choice is the mean squared error:

```
J(k) = (1/n) · Σᵢ (Fᵢ − k·xᵢ)²        n = 5 measurements
```

Here Fᵢ − k·xᵢ is the residual for measurement i: how many newtons the line misses that point by. Squaring makes misses in either direction count as bad, and it makes J a smooth function of k, which is what lets calculus in. J has units of N², and it is a function of one variable, k, because the data are fixed.

I should be honest: this problem has a closed-form answer (set J′(k) = 0 and solve), and we'll use it to check our work. That's exactly why it's a good lab. Gradient descent matters for problems like training a neural network, where J depends on millions of parameters and setting the derivative to zero gives an equation nobody can solve. The algorithm we're about to build doesn't care. It only ever asks the camera's question.

### Why the slope is enough

Suppose your current guess is k, and you're thinking of changing it by a small amount h. What happens to J? This is precisely what the derivative tells you. Zoom in far enough on any smooth curve and it looks like a straight line with slope J′(k), so

```
J(k + h) ≈ J(k) + J′(k)·h                     first-order Taylor expansion around k
```

You want J(k + h) to be smaller than J(k), so you want J′(k)·h to be negative. That means h must have the opposite sign to J′(k). If the slope is positive, increasing k makes things worse, so decrease it, and vice versa. The simplest choice that always gets the sign right is to make h a small multiple of minus the slope:

```
choose  h = −α·J′(k),  with α > 0              step against the slope
J(k − α·J′(k)) ≈ J(k) − α·J′(k)²               substitute h into the Taylor line
               < J(k)   whenever J′(k) ≠ 0     α > 0 and J′(k)² > 0
```

That is the whole update rule, and it has a name now that you've seen why you'd want it: **gradient descent**, with α called the **learning rate** or step size.

```
k_new = k − α·J′(k)
```

Notice two things the derivation gives you for free. First, the step is automatically large when the slope is steep and small when the slope is gentle, so the algorithm slows down by itself as it approaches a flat bottom, where J′ = 0. Second, the only place the argument can stop is where J′(k) = 0. If the slope is not zero, there is a direction that helps, and the rule takes it.

But that "≈" is hiding something, and it's where all the trouble lives. The tangent line is only a good description of J for *small* h. Take a big step and the curve bends away from the line. For a parabola like our J, we can see exactly how much, because the second-order Taylor expansion is not an approximation, it's exact:

```
J(k + h) = J(k) + J′(k)·h + ½·J″·h²            exact for a quadratic; J″ is constant
```

The linear term is the benefit of stepping downhill. The quadratic term ½·J″·h² is always positive when the curve bends upward (J″ > 0), and it's the price of ignoring curvature. For tiny h the linear term wins, because h² is much smaller than h. For large h the quadratic term wins, and the step makes things *worse*. So the learning rate isn't a matter of taste; there's a ceiling set by curvature.

### How big a step: the exact answer

For our spring we can make that ceiling exact. Differentiate J term by term:

```
J(k)  = (1/n)·Σ (Fᵢ − k·xᵢ)²
J′(k) = (1/n)·Σ 2·(Fᵢ − k·xᵢ)·(−xᵢ)            chain rule: derivative of (·)² is 2(·), inner derivative −xᵢ
      = −(2/n)·Σ xᵢ·(Fᵢ − k·xᵢ)                 pull out constants
J″    = (2/n)·Σ xᵢ²                              differentiate again; Fᵢ terms vanish
```

J′(k) is a straight-line function of k, and it's zero at the best fit k*. A straight line with slope J″ that passes through zero at k* is just J′(k) = J″·(k − k*). Substitute that into the update and subtract k* from both sides:

```
k_new − k* = k − k* − α·J″·(k − k*)            update rule, J′(k) = J″·(k − k*)
           = (1 − α·J″)·(k − k*)                factor out (k − k*)
```

This line is the heart of the whole subject. Every step multiplies your error by the same factor, r = 1 − α·J″. If |r| < 1 the error shrinks geometrically, and you converge. If |r| > 1 it grows geometrically, and you diverge. The boundary is

```
|1 − α·J″| < 1   ⇔   0 < α < 2/J″
```

and the single best choice, α = 1/J″, gives r = 0: one step lands exactly on the minimum. (That special step, dividing the slope by the curvature, is Newton's method. Hold that thought.)

Now real numbers. With our data, Σxᵢ² = 331.91 cm², so J″ = (2/5)·331.91 = 132.76 (units of cm², since J is in N² and k in N/cm), the ceiling is 2/J″ ≈ 0.0151, and the ideal step is 1/J″ ≈ 0.0075. The best-fit stiffness is k* ≈ 0.1994 N/cm (about 19.9 N/m). Starting from k = 0, here is what three learning rates do. I ran these rather than computing by hand; numbers are rounded to 4–5 figures.

```
         α = 0.002 (r = 0.73)      α = 0.007 (r = 0.07)      α = 0.0155 (r = −1.06)
 step    k        J                k        J                k         J
   0     0.0000   2.641            0.0000   2.641            0.0000    2.641
   1     0.0530   1.425            0.1854   0.01362          0.4104    2.955
   2     0.0919   0.7689           0.1985   0.000506        −0.0237    3.307
   3     0.1204   0.4150           0.1994   0.000440         0.4356    3.701
   6     0.1681   0.06552          0.1994   0.000440        −0.0800    5.186
```

Before reading on, look at the right-hand column and predict what you'd see on a plot of J against step number. It goes *up*, and k flips from one side of the answer to the other with a slightly larger swing each time. That's the overshoot you saw in the autofocus, and now you know exactly why: the step was so long that it jumped over the bottom of the bowl and landed higher up the opposite wall. The factor r = −1.06 says "flip sides, and end up 6% further away". In the left column, r = 0.73 means each step removes only 27% of the remaining error. That's safe but slow. The middle column removes 93% per step, and the loss stops changing after three steps.

So the answer to "how big a step?" is: compared to the curvature. α has units (here, the inverse of J″'s units), and that's why no learning rate is universally good. If you had measured extension in metres instead of centimetres, every xᵢ would be 100× smaller, J″ would be 10,000× smaller, and the safe α would be 10,000× larger. Same physics, same data, completely different learning rate.

### More than one knob

Real problems have many parameters, θ = (θ₁, ..., θ_d). Now "which way is downhill?" has infinitely many possible answers, because you can step in any direction in d-dimensional space. The calculus is the same, though. If you move by a small vector h,

```
J(θ + h) ≈ J(θ) + Σⱼ (∂J/∂θⱼ)·hⱼ               first-order Taylor in d variables
         = J(θ) + ∇J(θ) · h                     collect the partials into a vector: the gradient
```

Here ∇J(θ) is the **gradient**: the d-vector of partial derivatives, each one saying how sensitive J is to its own knob. Among all steps h of the same small length ε, which one decreases J the most? We want the dot product ∇J·h to be as negative as possible. A dot product is |∇J|·|h|·cos(angle), so with |h| fixed it's most negative when the angle is 180°, when h points exactly opposite to ∇J:

```
∇J · h ≥ −|∇J|·|h|                              Cauchy–Schwarz inequality
equality when h = −ε·∇J/|∇J|                     h antiparallel to the gradient
```

So −∇J is the direction of steepest local descent, and the update is the same rule in vector form:

```
θ_new = θ − α·∇J(θ)              θ, ∇J ∈ ℝᵈ,  α > 0 a scalar
```

and the same argument shows it decreases J for small enough α: J(θ − α∇J) ≈ J(θ) − α·|∇J|².

Here is the misconception worth confronting directly. It is very natural to think the negative gradient points *toward the minimum*. It doesn't. It points in the direction of steepest descent *right here*, which is perpendicular to the contour line you're standing on. Picture a contour map of a long, narrow valley (elongated ellipses). From most points on the valley's side, the steepest way down goes almost straight across the valley floor, not along it toward the lowest point. Only if the contours are perfect circles does "steepest downhill" coincide with "straight at the minimum".

### Watching it struggle

Let's make that concrete with the spring. Fit a line with an intercept, F = k·x + b, because maybe the spring hangs slightly stretched before any mass is added. Now θ = (k, b), two knobs. The curvature is no longer one number. It's the 2×2 matrix of second derivatives, the Hessian:

```
J(k, b) = (1/n)·Σ (Fᵢ − k·xᵢ − b)²

H = (2/n)·│ Σxᵢ²  Σxᵢ │  =  │ 132.76  14.76 │
          │ Σxᵢ   n   │     │  14.76   2.00 │
```

The Hessian has two eigenvalues, the curvatures along the valley's two principal directions: λ_max ≈ 134.4 and λ_min ≈ 0.355. So the bowl is about 380 times more sharply curved across the valley than along it. Their ratio κ = λ_max/λ_min ≈ 379 is the **condition number**.

The one-dimensional story now applies separately along each principal direction. The error along each one gets multiplied every step by its own factor, 1 − α·λ. To avoid blowing up along the steep direction, you need α < 2/λ_max ≈ 0.0149. But along the shallow direction, the factor is then at best 1 − 2·λ_min/λ_max, roughly 1 − 2/κ, which here is about 0.995. The steep direction sets the speed limit, and the shallow direction is stuck obeying it. That's why the number of steps you need grows roughly in proportion to κ.

Here's the run with α = 1/λ_max ≈ 0.0074, starting from (0, 0). The best fit is k* ≈ 0.2006 N/cm, b* ≈ −0.0108 N, with minimum J ≈ 0.000419.

```
 step      k        b          J
    0    0.0000   +0.0000    2.6411
    1    0.1970   +0.0219    0.000610
    2    0.1970   +0.0218    0.000609
   10    0.1971   +0.0211    0.000601
  100    0.1978   +0.0144    0.000532
  500    0.1997   −0.0020    0.000433
 1000    0.2004   −0.0084    0.000420
 2000    0.2006   −0.0106    0.000419
```

Look at step 1, because this is the misconception in action. At (0, 0) the negative gradient is (26.48, 2.94): it says "increase k a lot, and increase b a little". But the best b is *negative*. The steepest downhill direction pointed partly away from the answer. After one step the loss has dropped by 99.98%, and a training-curve plot would look finished. The intercept, though, is on the wrong side of zero and creeps back at about a quarter of a percent of the remaining distance per step. It takes around 2,000 steps to pin it down. The loss barely moves the whole time, because along that shallow direction the bowl is so flat that being wrong costs almost nothing.

What made the valley so lopsided? All the extensions are between 2.4 and 12.2 cm, far from x = 0. So changing the slope k and changing the intercept b do almost the same thing to the predictions near the data: both raise the line in the region you measured. The two knobs are nearly redundant, and the valley stretches along the direction where you trade one for the other. Shift the data so x is measured relative to its mean (7.38 cm), and the coupling term Σxᵢ disappears:

```
x̃ᵢ = xᵢ − 7.38      H = │ 23.84  0    │      eigenvalues 23.84 and 2.00,  κ ≈ 11.9
                         │  0     2.00 │
```

The same algorithm with α = 1/23.84 reaches the same fitted line (same slope 0.2006, now with intercept 1.47 N, the force at the average extension) in about 110 steps instead of about 2,200, to the same tolerance of 10⁻⁴ in the parameters. Nothing about the problem changed except the coordinates. The valley got rounder.

You can also see the other failure. Push α up to 1.9/λ_max, just under the ceiling, and the steep direction rattles from wall to wall: k goes 0 → 0.374 → 0.038 → 0.341 → 0.068 → 0.313, flipping sides each step and closing in only slowly. That zigzag is the classic picture of gradient descent in a narrow valley.

### Where this runs

Essentially every neural network you've heard of is trained by some descendant of that update line. The parameters θ are the weights, often millions or billions of them, J is a loss such as cross-entropy averaged over training examples, and ∇J comes from backpropagation, which is the chain rule organised to compute all the partial derivatives in roughly the cost of one extra pass through the network. Two modifications are nearly universal. First, the gradient is estimated from a random minibatch of examples rather than the whole dataset (stochastic gradient descent), trading exactness for many more, cheaper steps. Second, the conditioning problem you just watched is attacked from several angles. Input features are standardised (the centering trick, plus dividing by the spread), momentum methods accumulate velocity along the shallow direction so it stops crawling, and optimisers like Adam rescale each coordinate by a running estimate of its gradient magnitude, which partly compensates when different parameters live on very different scales. Learning-rate warm-up and decay schedules are, in part, ways of managing the "α versus curvature" ceiling as the curvature changes during training.

The same loop also fits logistic regression in statistics packages, solves very large least-squares problems where forming and inverting the Hessian is too expensive, and does image reconstruction in tomography, where the unknowns are millions of pixel values.

### Where the guarantee stops

Everything we derived holds cleanly for a bowl: a convex function, which has one bottom and no false ones. The general version of the safety condition is that if the curvature in every direction is at most L (formally, ∇J is L-Lipschitz), then any α ≤ 1/L guarantees J(θ − α∇J) ≤ J(θ) − (α/2)·|∇J|², with no Taylor "≈" anywhere. That is the same parabola argument, with J″ replaced by its worst case.

What gradient descent never promises is the *global* minimum of a non-convex function. It only knows the local slope, so it stops wherever the slope is zero: a local minimum, or in principle a saddle point (downhill in some directions, uphill in others), though with noisy gradients and generic starting points it tends to slide off saddles eventually, sometimes after a long, flat stall. Neural network losses are badly non-convex, yet training works remarkably well in practice. Why this is so is still an active research question, not a settled theorem, so be wary of anyone who explains it too confidently.

And the autofocus analogy breaks in an important place. The camera has to *physically try* a lens position to learn the slope, one probe at a time. In machine learning we compute the gradient exactly, analytically, for all parameters at once. If you had to estimate a million partial derivatives by nudging each weight and re-running the network, you'd need a million forward passes per step, and deep learning would not be practical. The calculus is what lets the camera's strategy scale.

### Try this

1. Our 1-D spring problem had J″ = 132.76. Suppose you'd recorded the same five forces but extensions in millimetres instead. Without running anything, what is the new ceiling on α, and how many steps would α = 1/J″ take to converge? Then explain in a sentence why the answer to the second part doesn't depend on units at all.

2. The update k_new − k* = (1 − αJ″)(k − k*) suggests a "perfect" step α = 1/J″. In d dimensions the analogue is θ_new = θ − H⁻¹∇J. Using the two Hessians above, explain why this one step would fix the uncentered problem just as well as centering did, and then why nobody does this for a network with 10⁸ parameters. (Hint: what is the size of H?)

If you want to keep pulling the thread, the natural next stop is momentum: one extra line in the update that turns the 2,000-step crawl into something much faster, and the place where the ball-rolling-downhill picture finally becomes the right one.
