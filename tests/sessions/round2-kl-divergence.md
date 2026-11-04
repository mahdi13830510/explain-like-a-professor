Suppose you have to grade a weather forecaster. Every evening she gives probabilities for tomorrow: dry, drizzle, storm. The catch is that you never get to see the *true* probabilities of tomorrow's weather. You only see what actually happens, one day at a time. So how do you score a probability forecast against a world you can only sample?

The obvious first try is to compare her numbers with the true ones, something like Σ |p − q|. That fails right away, because you don't have p. You have outcomes. So the score has to be something you can compute from *her forecast for the outcome that actually happened*. The natural choice is surprise: if she gave the actual weather probability q, charge her −log q. A forecast of 0.9 for what happened costs 0.105 nats; a forecast of 0.0001 costs 9.21 nats. Average over many days and you get her long-run score:

```
average surprise  =  E_{x~P}[ −log Q(x) ]  =  −Σₓ P(x)·log Q(x)
```

Here P is the true distribution over the three outcomes (it decides which days actually show up), Q is her forecast distribution, and the expectation is under P because P is generating the days. This quantity is the **cross-entropy** H(P, Q).

But it can't be the whole story. Weather is genuinely random, so even a forecaster who knows P exactly will be surprised on some days. Her score would be −Σ P log P, the **entropy** H(P), and no forecaster can beat it (we'll prove that in a moment). The fair grade is not raw surprise but *excess* surprise, how much worse she does than someone who knows the truth:

```
D(P‖Q) = H(P, Q) − H(P)
       = −Σₓ P(x)·log Q(x) + Σₓ P(x)·log P(x)       definitions of H(P,Q) and H(P)
       = Σₓ P(x)·[log P(x) − log Q(x)]              collect terms under one sum
       = Σₓ P(x)·log( P(x) / Q(x) )                 log a − log b = log(a/b)
```

That is the KL divergence. Read it as: *the expected extra surprise, per observation, from believing Q when the world is P.* In coding language (with log base 2) it is the number of extra bits per symbol you pay for compressing data from P using a code built for Q. Everything about the asymmetry is already sitting in this sentence, so hold on to it.

### Why it is never negative

Before the asymmetry, check the claim that nobody beats the truth. We need D(P‖Q) ≥ 0, with equality only when Q = P.

```
−D(P‖Q) = Σₓ P(x)·log( Q(x)/P(x) )                  flip the ratio, negate
        ≤ log Σₓ P(x)·( Q(x)/P(x) )                 Jensen: E[log Y] ≤ log E[Y], log is concave
        = log Σₓ Q(x)                               P(x) cancels (sum over x with P(x) > 0)
        ≤ log 1 = 0                                 Q is a distribution
```

So D(P‖Q) ≥ 0. Jensen's inequality is tight only when Q(x)/P(x) is the same constant for every x, and since both sum to 1 that constant is 1, so Q = P. Notice which line did the work: the average is taken over P's outcomes, weighted by P. That's the seed of the asymmetry.

### Why the order matters

Look at the formula again: D(P‖Q) = E_{x~P}[ log P(x)/Q(x) ]. The two distributions play completely different roles. **P chooses which days get graded; Q only gets graded.** Swap them and you're asking a different question: "if the world were Q, how bad would P be as a forecaster?" There's no reason those two questions should have the same answer, and in general they don't.

Here's a concrete case (numbers chosen for illustration). The true climate is P = (dry 0.70, drizzle 0.25, storm 0.05). Our forecaster is overconfident about storms: Q = (0.70, 0.2999, 0.0001). Computing each term of the sum (natural logs, run in Python, rounded to 3–4 figures):

```
outcome    P       Q        P·log(P/Q)     Q·log(Q/P)
dry       0.70    0.70        0.0000         0.0000
drizzle   0.25    0.2999     −0.0455         0.0546
storm     0.05    0.0001     +0.3107        −0.0006
                            ─────────      ─────────
                  D(P‖Q) =    0.265    D(Q‖P) = 0.054
```

D(P‖Q) is about five times larger than D(Q‖P), and almost all of it comes from one row. In the world P, storms happen on 5% of days, and on each of those days the forecaster who said 0.0001 pays −log 0.0001 = 9.21 nats of surprise, against 3.00 nats for someone who knew the true 0.05. Five percent of days times a 6.2-nat penalty dominates everything else. (Individual terms can be negative, like the drizzle row; only the total is guaranteed ≥ 0.)

Now run it the other way. In the world Q, storms essentially never happen, so the storm row has weight 0.0001 and contributes nothing. P's "mistake" in that world is that she wasted 5% of her probability on storms that never come, which costs her a little on every other day, but only a little: probability spent where nothing happens is cheap, because you lose it at a modest rate everywhere instead of paying −log(tiny) on the days that matter.

That's the whole asymmetry in one rule. The function −log q is gentle near q = 1 and explodes as q → 0. So D(P‖Q) **severely punishes Q for being near zero where P has mass**, and barely punishes Q for putting mass where P has none. In the limit it is literally infinite: if P(x) > 0 and Q(x) = 0 for some x, D(P‖Q) = ∞, while D(Q‖P) can be perfectly finite.

### The picture: covering versus seeking

The rule becomes vivid when Q isn't flexible enough to match P. Take a true density P that is a 50/50 mixture of two Gaussians, one centred at −3 and one at +3, each with standard deviation 1. Draw it: two separate bumps with a valley near zero, where P(0) ≈ 0.0044. Now force Q to be a *single* Gaussian N(μ, σ²) and ask which one is "closest" to P. You get two different answers depending on which direction you minimise. I found both numerically, by grid search over μ and σ with the integrals done on a fine grid:

```
              minimise D(P‖Q)               minimise D(Q‖P)
P:        ▁▃█▃▁       ▁▃█▃▁             ▁▃█▃▁       ▁▃█▃▁
Q:     ▁▂▃▄▅▆▆▆▆▆▆▆▆▆▆▆▅▄▃▂▁                       ▁▃█▃▁
         −3     0     +3               −3     0     +3

  best Q:   μ = 0,  σ ≈ 3.16                μ = 3,  σ ≈ 1.02  (or the mirror at −3)
  D(P‖Q):   0.462                            7.96
  D(Q‖P):   0.937                            0.689  (≈ log 2)
```

Minimising D(P‖Q) produces a fat Gaussian centred in the valley, covering *both* bumps. It has to: wherever P has mass, Q must not be small, or the penalty explodes. The price is that Q puts a lot of mass in the valley where P has almost none (Q(0) ≈ 0.126, about 28 times P(0)), but the forward direction barely charges for that. This behaviour is called **mode-covering** (or "mean-seeking"). In fact σ came out at √10 ≈ 3.162, exactly the standard deviation of the mixture: for a Gaussian Q, minimising D(P‖Q) just matches the mean and variance of P.

Minimising D(Q‖P) does the opposite. Now Q chooses where the grading happens, so Q is only penalised for placing mass where P is small. The safest move is to sit squarely on one bump and ignore the other entirely. The second bump costs nothing, because Q never visits it. This is **mode-seeking**. The leftover divergence, about 0.689, is almost exactly log 2 ≈ 0.693, and that number has a meaning: on its bump, P's density is half of what a single Gaussian would have there (the other half of P's mass lives on the far bump), so Q is charged log(1/0.5) per sample.

Neither answer is "wrong". They are answers to different questions, and which question you want depends on what the model is for.

### Why training uses it (and you already do)

Now the second half of your question. In training, P is the data distribution (the true distribution of images, sentences, next tokens) and Q_θ is the model with parameters θ. We want Q_θ close to P, but we have the forecaster's problem exactly: we can't evaluate P(x) for any x. All we have is a dataset x₁, …, x_N of samples from it. Write out D(P‖Q_θ) and look at which pieces depend on θ:

```
D(P‖Q_θ) = Σₓ P(x)·log P(x) − Σₓ P(x)·log Q_θ(x)          split the log of the ratio
         = −H(P) + E_{x~P}[ −log Q_θ(x) ]                   definitions
         = constant + E_{x~P}[ −log Q_θ(x) ]                H(P) doesn't depend on θ
         ≈ constant + (1/N)·Σᵢ −log Q_θ(xᵢ)                 replace E_P by the average over samples
```

The unknown part, H(P), separates out as a constant that the gradient never sees. What remains is the average negative log-likelihood of the data under the model, which you can compute and differentiate. So

```
argmin_θ D(P‖Q_θ)  =  argmin_θ cross-entropy  =  argmax_θ Σᵢ log Q_θ(xᵢ)   (maximum likelihood)
```

This is the real reason KL is everywhere: **cross-entropy loss is forward KL with an unknowable constant dropped**, and maximum likelihood is the same thing again. When a language model is trained with next-token cross-entropy, at each position P is the true distribution of the next token given the context, Q_θ is the softmax output, and the loss is D(P‖Q_θ) up to that constant. The constant H(P) is why the loss of a perfect model still isn't zero: it's the irreducible randomness of the text.

It also explains why this particular divergence, and this particular direction, is the default. You need an objective that can be estimated from samples of P without ever evaluating P's density. Forward KL is exactly that: P appears only as the distribution you average over, and in the log ratio it splits off as a constant. A symmetric alternative like the Jensen–Shannon divergence needs the density ratio P(x)/Q(x) at sample points, which you don't have; GANs get around that by training a second network, the discriminator, to estimate it, at the cost of a much more delicate optimisation. And the mode-covering behaviour from the picture shows up here too: a model trained by maximum likelihood is pushed hard to give non-negligible probability to everything in the training data, so it tends to spread mass and hedge rather than drop rare cases.

The reverse direction appears when the situation is flipped: you *can* evaluate the target density (at least up to a constant) but you *can't* sample from it, and Q is the thing you can sample. Two places you'll meet it:

- **Variational inference.** The posterior p(z | x) is known only up to the normaliser p(x). You pick a tractable q(z) and minimise D(q‖p(·|x)). Expanding it, D(q‖p(·|x)) = log p(x) − ELBO(q), and log p(x) doesn't depend on q, so maximising the ELBO is minimising reverse KL. The expectation is under q, which you can sample. This is also why variational posteriors are well known to be *overconfident*: reverse KL is mode-seeking, so q tends to underestimate the posterior's spread.
- **RL fine-tuning of language models.** In RLHF-style training, a penalty β·D(π_θ‖π_ref) keeps the policy π_θ from drifting too far from a reference model. The text is sampled from π_θ, so the natural, cheap estimate is the expectation under π_θ, which is the reverse direction relative to the reference.

So the rule for choosing a direction is mostly practical: the distribution you can **sample** goes in the first slot, because that's what the expectation is over.

### Where it stops behaving

KL is not a distance. It isn't symmetric, as you've seen, and it doesn't satisfy the triangle inequality, so intuitions like "A is close to B and B is close to C, so A is close to C" don't carry over. It's also infinite whenever the first distribution has support the second one lacks. That's harmless for a softmax model, which never outputs an exact zero, but it is a real problem when two distributions live on non-overlapping sets (for instance, two distributions concentrated on different low-dimensional surfaces in a high-dimensional space). That failure was one motivation for the Wasserstein distance in WGANs. And the entire derivation of "why we train with it" leaned on one step, swapping E_P for a sample average, which is only as good as your dataset is representative of P.

Two things to try:

1. A language model assigns probability 10⁻⁹ to a token that, in reality, appears in a given context 0.1% of the time. Compute that token's contribution P·log(P/Q) to the forward KL in nats. Now apply label smoothing with ε = 0.1 over a 50,000-token vocabulary, which (roughly) keeps every probability at or above ε/V. What's the largest that contribution can now be, and in which direction of KL is this protection actually needed?
2. Prove what the numerics suggested: if Q is restricted to Gaussians N(μ, σ²) and P is any distribution with mean m and variance s², then minimising D(P‖Q) gives μ = m and σ² = s². (Hint: write −log Q(x) explicitly, take the expectation under P, and notice that only the first two moments of P survive.) Then explain in one sentence why the reverse direction has no such clean answer for the two-bump P.
