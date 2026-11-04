Take a small handwritten-digit classifier: 784 pixel inputs, one hidden layer of 100 units, 10 outputs. Count its parameters. There are 784·100 weights plus 100 biases going into the hidden layer, and 100·10 weights plus 10 biases going into the output, so 79,510 numbers in total. Each training step needs one thing: for the current image, if I nudged *this* parameter a little, how much would the loss change? You need that answer for all 79,510 parameters before you can take a single gradient step.

The obvious way to get it is to actually do the nudging. Run the network and record the loss, bump one weight by a small h, run it again, and divide the change in loss by h. That costs one extra forward pass per parameter. A forward pass through this network is about 79,400 multiply-adds (one per weight), so one gradient costs roughly 79,511 × 79,400 ≈ 6.3 × 10⁹ multiply-adds, for one example. For a network with a hundred million parameters you'd be at around 10¹⁶ per example per step. Nobody could train anything that way. (It's also inaccurate, which we'll measure later.)

What makes the nudging so wasteful is the key to the whole idea. Take a weight in the first layer, say the one connecting pixel 300 to hidden unit 17. That weight can affect the loss in only one way: by changing the value of hidden unit 17. The same is true of all 784 weights coming into unit 17. Each changes unit 17 a little, and from there the change flows through the rest of the network in exactly the same way, whichever weight started it. So if you knew one number, *how much the loss changes per unit change in hidden unit 17*, you could get all 784 of those weight derivatives with one multiplication each. The nudging method works out that downstream sensitivity 784 separate times and never notices it's the same quantity.

Backpropagation is that observation applied systematically. For every intermediate quantity in the network, you compute how much the loss cares about it, and you compute those sensitivities starting at the loss and working backward, because each one is built from the ones downstream of it. The rest of this lesson makes "built from" precise, derives the four equations that do the work in a standard network, runs them on real numbers, and checks them.

### The one rule everything rests on

You know the single-variable chain rule. The version backprop needs is the one where an input reaches the output along several paths, and it's worth deriving, because the sum it contains is the engine of the algorithm.

Suppose a scalar L depends on a number u only through intermediate values v₁, …, v_k: u feeds into each vⱼ, and the vⱼ feed into L. Nudge u by a small ε and follow the effect:

```
Δvⱼ ≈ (∂vⱼ/∂u)·ε                          first-order Taylor expansion of each vⱼ in u
ΔL  ≈ Σⱼ (∂L/∂vⱼ)·Δvⱼ                     first-order Taylor expansion of L in (v₁,…,v_k)
    ≈ Σⱼ (∂L/∂vⱼ)(∂vⱼ/∂u)·ε               substitute the first line into the second
∂L/∂u = Σⱼ (∂L/∂vⱼ)(∂vⱼ/∂u)               divide by ε and let ε → 0
```

Why a sum and not something more complicated? At first order, small effects arriving along different paths simply add up. Any interaction between paths is of order ε² and disappears in the limit. (This assumes L is differentiable as a function of the vⱼ jointly, which holds for everything below except a few kinks I'll come back to.)

Now look at what the last line says about *what you need to know*. To find how much L cares about u, you need two things: how much L cares about each of u's **immediate consumers**, and how strongly each consumer depends on u locally. You don't need anything else about the rest of the computation. That's a recursion. The loss's sensitivity to itself is ∂L/∂L = 1. The quantities that feed directly into L get their sensitivities from that 1. The quantities feeding into *those* get theirs from them, and so on back to the parameters. If you visit the computation's steps in reverse order, every quantity's consumers have already been handled by the time you reach it. That's the whole reason the algorithm runs backward. Each intermediate value is visited once and each connection is used once, so the cost is proportional to the cost of the forward pass, not to the number of parameters.

It also explains why backward is the right direction for *training*. You could run the chain rule forward instead, carrying "how much does everything depend on parameter w" from the input to the output. But that answers the question for one input parameter per pass, which is just an exact version of the nudging method. Going forward costs one pass per *input*; going backward costs one pass per *output*. A loss function has 79,510 inputs and one output, so backward wins by a factor of tens of thousands. In the automatic-differentiation literature these are called forward mode and reverse mode, and the per-quantity sensitivity ∂L/∂u is called the **adjoint** of u. Backpropagation is reverse mode applied to a neural network.

### Setting up the network

Now the precise version. A fully connected network with N layers computes:

```
a⁽⁰⁾ = x                              x ∈ ℝ^{d₀}                        the input
z⁽ˡ⁾ = W⁽ˡ⁾ a⁽ˡ⁻¹⁾ + b⁽ˡ⁾              W⁽ˡ⁾ ∈ ℝ^{dₗ×dₗ₋₁},  b⁽ˡ⁾ ∈ ℝ^{dₗ}     pre-activation of layer l
a⁽ˡ⁾ = φ(z⁽ˡ⁾)                         applied elementwise, l = 1,…,N−1   activation
p    = softmax(z⁽ᴺ⁾),  pₖ = e^{zₖ} / Σⱼ e^{zⱼ}                            predicted class probabilities
L    = −Σₖ yₖ log pₖ                    y ∈ ℝ^{d_N}, one-hot              cross-entropy loss
```

Vectors are columns. For the digit classifier, d₀ = 784, d₁ = 100, d₂ = 10 and N = 2. I'm using N for the depth because L is taken by the loss.

The quantity we'll propagate is the sensitivity of the loss to each pre-activation:

```
δ⁽ˡ⁾ = ∂L/∂z⁽ˡ⁾  ∈ ℝ^{dₗ}             entry i: how much L changes per unit change in z⁽ˡ⁾ᵢ
```

The convention throughout is that a gradient has the same shape as the thing it's a gradient with respect to. δ⁽ˡ⁾ᵢ is exactly the "how much does the loss care about unit 17" number from the opening. (I'm using pre-activations z rather than activations a because it makes the weight-gradient formula cleanest. Using a also works; you just shift where the φ′ appears.)

We need four results: the sensitivity at the output, the parameter gradients given a layer's δ, how δ passes backward through a weight matrix, and how it passes backward through the activation function.

### 1. The output layer

Start at the end, where the loss meets the last pre-activations z = z⁽ᴺ⁾ (the logits). Softmax looks messy, so take its log first:

```
log pₖ = zₖ − log Σⱼ e^{zⱼ}                     definition of softmax, take log
∂(log pₖ)/∂zᵢ = 1[k=i] − e^{zᵢ} / Σⱼ e^{zⱼ}      differentiate; d/dzᵢ of log Σⱼ e^{zⱼ} is e^{zᵢ}/Σⱼ e^{zⱼ}
              = 1[k=i] − pᵢ                     recognise the softmax
∂L/∂zᵢ = −Σₖ yₖ (1[k=i] − pᵢ)                   L = −Σₖ yₖ log pₖ, linearity of differentiation
       = −yᵢ + pᵢ Σₖ yₖ                         the indicator keeps only k = i
       = pᵢ − yᵢ                                Σₖ yₖ = 1 because y is one-hot
```

So

```
δ⁽ᴺ⁾ = p − y
```

All the exponentials cancel, and what's left is "what you predicted minus what was true". If the network puts probability 0.3 on the correct class, that logit's sensitivity is 0.3 − 1 = −0.7: raising it lowers the loss. Each wrong class's sensitivity equals the probability you wrongly gave it. This cancellation is one reason softmax and cross-entropy are almost always used together, and why frameworks fuse them into one operation that takes raw logits (PyTorch's `CrossEntropyLoss` does this). The fused version is also numerically safer than computing log(softmax) in two steps.

### 2. Parameter gradients from δ

Take any layer and drop the superscripts: z = z⁽ˡ⁾, W = W⁽ˡ⁾, b = b⁽ˡ⁾, a = a⁽ˡ⁻¹⁾ (the layer's input), δ = δ⁽ˡ⁾. Written entry by entry, zᵢ = Σⱼ Wᵢⱼ aⱼ + bᵢ.

```
∂L/∂Wᵢⱼ = Σₖ (∂L/∂zₖ)(∂zₖ/∂Wᵢⱼ)          multi-path chain rule; Wᵢⱼ reaches L only through the z's
∂zₖ/∂Wᵢⱼ = 1[k=i] · aⱼ                    Wᵢⱼ appears only in zᵢ, where it multiplies aⱼ
∂L/∂Wᵢⱼ = δᵢ aⱼ                           the sum collapses to the single term k = i
∂L/∂W  = δ aᵀ                             collect all entries: an outer product
∂L/∂b  = δ                                ∂zₖ/∂bᵢ = 1[k=i]
```

Check the shapes: (dₗ × 1)(1 × dₗ₋₁) = dₗ × dₗ₋₁, which is the shape of W, as it must be. This is the opening observation written as an equation. Row i of the weight gradient is one number, δᵢ (unit i's sensitivity), times the whole input vector a. All the weights going into unit i share that sensitivity, and each is scaled by the input it multiplies. One consequence is worth noticing now, because you'll see it in the numbers: if an input aⱼ is zero for this example, every weight that multiplies it gets zero gradient. That weight had no influence on this example's loss, so the example has nothing to say about it.

### 3. Passing back through the weights

To continue the recursion we need δ for the previous layer, and the first step is the sensitivity of the layer's *input* a. Here the multi-path sum really matters, because each aⱼ feeds every unit in the layer:

```
∂L/∂aⱼ = Σᵢ (∂L/∂zᵢ)(∂zᵢ/∂aⱼ)            aⱼ feeds every zᵢ; sum over all dₗ paths
       = Σᵢ δᵢ Wᵢⱼ                        ∂zᵢ/∂aⱼ = Wᵢⱼ
∂L/∂a  = Wᵀ δ                             Σᵢ Wᵢⱼ δᵢ is the j-th entry of Wᵀδ
```

You can see why the transpose appears just from the shapes: δ has dₗ entries, the answer needs dₗ₋₁, and Wᵀ (dₗ₋₁ × dₗ) is the only way to get there. The picture is more satisfying, though. In the forward pass, weight Wᵢⱼ carries signal from input j to unit i. In the backward pass the *same* weight carries sensitivity from unit i back to input j. The wiring is the same and the arrows are reversed, and reversing the wiring of a linear map is exactly what the transpose does.

### 4. Passing back through the activation

The last step goes from ∂L/∂a⁽ˡ⁻¹⁾ to δ⁽ˡ⁻¹⁾ = ∂L/∂z⁽ˡ⁻¹⁾. Since φ acts elementwise, aⱼ depends on zⱼ alone, so the multi-path sum has only one term: ∂L/∂zⱼ = (∂L/∂aⱼ)·φ′(zⱼ). In vector form that's an elementwise product ⊙. Putting the pieces together gives the backprop equations:

```
δ⁽ᴺ⁾   = p − y                                     (output, softmax + cross-entropy)
∂L/∂W⁽ˡ⁾ = δ⁽ˡ⁾ a⁽ˡ⁻¹⁾ᵀ ,   ∂L/∂b⁽ˡ⁾ = δ⁽ˡ⁾          (parameter gradients)
δ⁽ˡ⁻¹⁾ = (W⁽ˡ⁾ᵀ δ⁽ˡ⁾) ⊙ φ′(z⁽ˡ⁻¹⁾)                 (recursion, l = N, …, 2)
```

The algorithm follows directly. Run the forward pass and **store** every z⁽ˡ⁾ and a⁽ˡ⁾. Set δ⁽ᴺ⁾ = p − y. Then for l = N down to 1, write out the parameter gradients for layer l and, if l > 1, compute δ⁽ˡ⁻¹⁾.

Now count the cost. Wᵀδ is a matrix-vector product the same size as the forward Wa, and δaᵀ needs one multiply per weight. So the backward pass costs about twice the forward pass, and a full gradient costs about three forward passes. For the digit classifier that's about 2.4 × 10⁵ multiply-adds against 6.3 × 10⁹ for nudging, roughly 26,000 times cheaper. In general the saving is a factor of about P/3 for P parameters. The result is also *exact* (up to floating-point rounding). Backprop isn't an approximation to the gradient. It is the chain rule, organized so that no sensitivity is ever computed twice. What it costs you is memory: the backward pass needs the stored activations, so they all have to be kept until it runs.

### Running it on real numbers

Let's run one full step by hand on the smallest problem that actually needs a hidden layer: XOR. The input is x = (1, 0), meaning exactly one input is on, so the correct output is class 1 ("true"), and y = (0, 1). The network is 2 → 2 → 2 with tanh hidden units (φ = tanh, φ′(z) = 1 − tanh²z) and a softmax output. The weights are a small initialization of about the scale a random init would give you. There's nothing special about them:

```
W⁽¹⁾ = ┌ 0.5  −0.4 ┐   b⁽¹⁾ = ┌  0.1 ┐        W⁽²⁾ = ┌  0.7  −0.6 ┐   b⁽²⁾ = ┌ 0 ┐
       └ 0.3   0.8 ┘          └ −0.1 ┘               └ −0.2   0.9 ┘          └ 0 ┘
```

Before reading the backward numbers, predict two things. Which entries of ∂L/∂W⁽¹⁾ will be exactly zero? And will hidden unit 2's δ be positive or negative? (Hint: look at which output unit hidden unit 2 feeds most strongly.)

Forward pass (computed in float64, rounded to 4 figures):

```
z⁽¹⁾ = W⁽¹⁾x + b⁽¹⁾ = (0.5 + 0.1,  0.3 − 0.1)          = (0.6000, 0.2000)
a⁽¹⁾ = tanh(z⁽¹⁾)                                       = (0.5370, 0.1974)
z⁽²⁾ = W⁽²⁾a⁽¹⁾ = (0.7·0.5370 − 0.6·0.1974,
                  −0.2·0.5370 + 0.9·0.1974)             = (0.2575, 0.0702)
p    = softmax(z⁽²⁾)                                    = (0.5467, 0.4533)
L    = −log p₂ = −log 0.4533                            = 0.7912
```

The network leans slightly toward the wrong answer. Now the backward pass:

```
δ⁽²⁾     = p − y                     = (0.5467, −0.5467)
∂L/∂W⁽²⁾ = δ⁽²⁾ a⁽¹⁾ᵀ                 = ┌  0.2936   0.1079 ┐
                                       └ −0.2936  −0.1079 ┘
∂L/∂b⁽²⁾ = δ⁽²⁾                      = (0.5467, −0.5467)
W⁽²⁾ᵀδ⁽²⁾ = ( 0.7·0.5467 + (−0.2)(−0.5467),
             −0.6·0.5467 +   0.9 (−0.5467) )  = (0.4920, −0.8200)
φ′(z⁽¹⁾) = 1 − a⁽¹⁾²                  = (0.7116, 0.9610)
δ⁽¹⁾     = (0.4920·0.7116, −0.8200·0.9610)   = (0.3501, −0.7881)
∂L/∂W⁽¹⁾ = δ⁽¹⁾ xᵀ                    = ┌  0.3501   0 ┐
                                       └ −0.7881   0 ┘
∂L/∂b⁽¹⁾ = δ⁽¹⁾                       = (0.3501, −0.7881)
```

Read these as sentences. The output δ says to lower logit 1 and raise logit 2. Hidden unit 2 has the largest sensitivity, −0.788, and it's negative because unit 2 feeds the correct class's logit with weight 0.9 and the wrong one with −0.6, so increasing it is the best single move available. Unit 1 feeds the wrong class more strongly, so its sensitivity is positive. The whole second column of ∂L/∂W⁽¹⁾ is zero because x₂ = 0: those weights had no influence on this example, as the outer-product formula predicted.

Never trust a hand-derived backward pass until you've checked it, so here are two checks. The first is a **gradient check**: compute every derivative by central differences, (L(θ + h) − L(θ − h))/2h with h = 10⁻⁵ in float64, and compare. All 12 parameter gradients agree with the backprop values to within 1.6 × 10⁻¹¹. The check uses float64 and central differences for a good reason. Here's the one-sided nudge in float32 for the entry ∂L/∂W⁽²⁾₂₁ = −0.2936:

```
  h        float32 one-sided estimate     |error|
 1e-1          −0.2900                    3.6e-3     truncation error (curvature) dominates
 1e-2          −0.2932                    3.5e-4
 1e-3          −0.2935                    1.0e-4     best achievable
 1e-4          −0.2939                    2.5e-4     rounding error starts to dominate
 1e-5          −0.2980                    4.4e-3     L(θ+h) − L(θ) loses most of its digits
```

Shrinking h reduces the error from curvature but magnifies the error from rounding, because you're subtracting two nearly equal float32 numbers that carry only about 7 significant digits. The best you can do is an error of about 10⁻⁴, a relative error near 0.04%. So the nudging method from the opening isn't just 26,000 times slower. It's also less accurate than backprop, which has no h at all.

The second check is a step of gradient descent. Take θ ← θ − α∇L with α = 0.1. The loss falls from 0.7912 to 0.5878, and the probability of the correct class rises from 0.4533 to 0.5555. The first-order prediction for the change is −α‖∇L‖² = −0.1 × 2.2807 = −0.228, and the actual change is −0.203. The gap comes from curvature, the second-order term the gradient knows nothing about. With α = 0.5 the linear prediction would be −1.14, which would take the loss *below zero*, which is impossible for cross-entropy. The actual change is −0.61. The gradient is a local statement, and backprop computes that local statement exactly. Choosing how far to trust it is the optimizer's job, not backprop's.

### Where it actually runs

Nobody writes these four equations out for each new architecture any more, but every autodiff system (PyTorch's autograd, JAX, TensorFlow) is doing exactly what we just did, at the level of individual operations rather than whole layers. During the forward pass the framework records a graph of operations and keeps the tensors each one will need. Each operation knows its own **vector-Jacobian product**: given the sensitivity of the loss to its output, it returns the sensitivities for its inputs. Derivation 3 is the vector-Jacobian product for a matrix multiply (multiply by Wᵀ), and derivation 4 is the one for an elementwise function (multiply by φ′). When a tensor is used in two places, as with weights shared across time steps in a recurrent net or the skip path in a residual block, the framework adds the two sensitivities flowing back into it. That's the Σ in the multi-path chain rule, and nothing more. Calling `loss.backward()` walks the recorded graph in reverse order.

The memory cost we noted is a real engineering constraint. For large models, the activations stored for the backward pass often use more memory than the weights do. **Gradient checkpointing** (or activation recomputation) is the standard trade: store only some layers' activations and recompute the rest during the backward pass, paying extra compute to save memory.

The same reverse-mode idea runs well outside machine learning, under the name **adjoint method**, wherever one scalar objective depends on a huge number of inputs. Examples are aerodynamic shape optimization (drag as a function of thousands of surface-shape parameters) and variational data assimilation in weather forecasting (how well a forecast fits observations, as a function of the entire initial atmospheric state). The history is a bit tangled, and here is the accurate version. Reverse-mode differentiation of general computations was described by Seppo Linnainmaa in 1970. Paul Werbos proposed applying it to neural networks in his 1974 thesis. Rumelhart, Hinton and Williams's 1986 *Nature* paper is what made it the standard way to train multilayer networks.

### Where it needs care

Three things to keep straight.

**Backprop is not the learning algorithm.** It computes ∇L, and only that. SGD, Adam and other optimizers decide what to do with it. "Training with backprop" really means "training with gradients that backprop computed."

**Gradients are products of many factors, and long products are unstable.** Unroll the recursion and you get δ⁽ˡ⁾ = diag(φ′(z⁽ˡ⁾)) W⁽ˡ⁺¹⁾ᵀ ⋯ diag(φ′(z⁽ᴺ⁻¹⁾)) W⁽ᴺ⁾ᵀ δ⁽ᴺ⁾. Every layer you pass through multiplies by another matrix. With sigmoid activations φ′ is never more than 1/4, so ten sigmoid layers contribute a factor of up to 0.25¹⁰ ≈ 9.5 × 10⁻⁷ from the derivatives alone. The weights can offset or amplify this, but nothing *guarantees* they will. This is the vanishing (or, with large weights, exploding) gradient problem. It's a property of the network the gradient flows through, not a bug in backprop, and it is much of the reason ReLU activations, careful initialization schemes, normalization layers and residual connections exist.

**Kinks.** ReLU has no derivative at z = 0. Frameworks just pick a value there (typically 0) and carry on, so strictly speaking what gets computed at such points is not a gradient. In practice pre-activations land exactly on 0 rarely enough that this almost never matters, but it's why "backprop computes the exact gradient" carries the qualifier "wherever the gradient exists."

Two problems to try, if you want to test whether the machinery is really yours:

1. **Mini-batches.** Stack n examples as rows: A ∈ ℝ^{n×dₗ₋₁} holds the layer inputs, Z = A Wᵀ + 1bᵀ ∈ ℝ^{n×dₗ}, and the loss is the average of the n per-example losses. Let Δ ∈ ℝ^{n×dₗ} be ∂L/∂Z. Derive ∂L/∂W and ∂L/∂b in terms of Δ and A. Use the shapes to decide where the transposes go, then explain in one sentence what the sum over the batch dimension *means*.
2. **Residual blocks.** A block computes y = x + f(x), where f has Jacobian J_f. Derive ∂L/∂x in terms of ∂L/∂y and J_f. Then predict what happens to the vanishing-gradient product from above when you stack 50 such blocks instead of 50 plain layers, and say which term in your answer is responsible.
