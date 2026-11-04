You push a commit, CI runs, and the integration suite goes red. The failing test is one everybody knows is flaky: on code that is definitely fine, it fails now and then because of a timeout or a race in the test harness. Your commit did touch the module it covers. So, did you break something, or is it the flake?

Notice what you actually know here, because the whole of Bayesian probability is just bookkeeping for exactly these pieces. You have some sense, *before looking at CI*, of how often commits like yours break this test. You know how the test behaves in each possible world: if the code is broken, it almost always fails; if the code is fine, it fails only occasionally. And you have one observation: it failed. The question is how to combine those into a single number for "I broke it".

Most people's first move is something like this: "The test only fails spuriously 5% of the time, so there's a 95% chance this failure is real." It sounds airtight, and it is wrong, and seeing exactly why it's wrong is the cure for most of the confusion about priors, likelihoods and posteriors.

### Counting worlds

Let's put numbers on it. For illustration, say that about 10% of commits that touch this module really do break the test (you'd estimate this from your team's history; I'm picking a plausible value, not quoting a statistic). Say that when the code is broken, the test catches it 99% of the time, and when the code is fine, it fails spuriously 5% of the time.

Now imagine 1,000 commits just like yours and follow each one through CI:

```
1,000 commits
├── 100 actually broken (10%)
│     ├──  99 test fails      (99% of 100)
│     └──   1 test passes
└── 900 actually fine (90%)
      ├──  45 test fails      (5% of 900)   ← the flakes
      └── 855 test passes
```

Your commit is one of the ones where the test failed. There are 99 + 45 = 144 such commits, and 99 of them are really broken. So the probability you broke it is 99/144 ≈ 0.69, not 0.95.

Where did the "95%" intuition go wrong? It answered a different question. "The test fails only 5% of the time when the code is fine" is a statement about the *fine* commits: of the 900, 45 fail. But you're not standing among the fine commits; you're standing among the *failing* ones, and the failing ones are a mixture. The 45 flakes look small next to 900, but they look big next to 99, and that comparison is the one that matters. In symbols, the naive answer confused P(fail | fine) with P(fine | fail). These are different numbers, and the gap between them is filled by how common broken commits were to begin with.

That picture is the mental model I want you to keep: **probability is a proportion of a population of possible worlds, and conditioning on evidence means throwing away every world where the evidence didn't happen, then renormalising what's left.** Everything below is that picture written compactly.

### Now the names

You've now used three distinct ingredients, and each has a name.

The **prior** is what you believed about the hypothesis before seeing this particular piece of evidence: P(broken) = 0.10, P(fine) = 0.90. It was the first branching in the tree.

The **likelihood** is how probable the evidence you actually saw is, under each hypothesis: P(fail | broken) = 0.99 and P(fail | fine) = 0.05. It was the second branching, restricted to the branch matching what you observed.

The **posterior** is what you believe after the evidence: P(broken | fail) ≈ 0.69. It is what's left of the tree after you prune away the "test passes" branches.

Here is the point where most people's confusion lives, so slow down. Look at the two likelihood values: 0.99 and 0.05. They add to 1.04. That isn't an error. The likelihood is *not* a probability distribution over hypotheses. Each number is a probability of the *data*, computed in a different world. The way to read it is as a score: "how well did each hypothesis predict what actually happened?" The broken-code hypothesis predicted a failure with near certainty; the fine-code hypothesis found a failure fairly surprising. The likelihood is a function of the hypothesis with the data held fixed, and nothing forces such a function to sum to 1 across hypotheses. If you remember one sentence from today, make it this one: **the prior and the posterior are distributions over hypotheses; the likelihood is a scoring of hypotheses by how well they predicted the data.**

### Deriving Bayes' rule from the tree

The tree computed two things for each hypothesis H: the probability of reaching the leaf "H and the test failed", and then what fraction of all the failing leaves that was. Write D for the data (here, "the test failed"). The product rule of probability says the probability of a joint event can be built in either order:

```
P(H, D) = P(H) · P(D | H)          product rule, branching on H first (the tree we drew)
P(H, D) = P(D) · P(H | D)          product rule, branching on D first
P(D) · P(H | D) = P(H) · P(D | H)  both equal P(H, D)
P(H | D) = P(H) · P(D | H) / P(D)  divide by P(D), assuming P(D) > 0
```

And P(D), the overall probability of seeing a failure, is the sum of all the failing leaves, one per hypothesis:

```
P(D) = Σ_h P(h) · P(D | h)          law of total probability: sum over every hypothesis h
```

So the posterior is "prior times likelihood, renormalised":

```
posterior        prior     likelihood
P(H | D)  =  P(H) · P(D | H)  /  Σ_h P(h) · P(D | h)
                                 └── evidence (a.k.a. marginal likelihood): the normaliser
```

Check it against the counting:

```
P(broken) · P(fail | broken) = 0.10 × 0.99 = 0.099      the 99 out of 1,000
P(fine)   · P(fail | fine)   = 0.90 × 0.05 = 0.045      the 45 out of 1,000
P(fail)                      = 0.099 + 0.045 = 0.144    the 144 out of 1,000
P(broken | fail)             = 0.099 / 0.144 = 0.6875
```

Same answer, of course, because the formula *is* the tree.

There's a second form of the same rule that I find far more useful for thinking, because it splits the roles cleanly. Write Bayes' rule for both hypotheses and divide one by the other; the awkward P(D) cancels:

```
P(broken | D)   P(broken)   P(D | broken)
───────────── = ───────── × ─────────────        divide the two Bayes' rules; P(D) cancels
P(fine | D)     P(fine)     P(D | fine)

posterior odds = prior odds × likelihood ratio
     ?         =   0.1/0.9  ×   0.99/0.05
               =   1 : 9    ×     19.8
               =   2.2 : 1                        → probability 2.2/(1 + 2.2) = 0.6875
```

Now the roles are visible. The prior sets where you start. The likelihood *ratio* is the strength of the evidence, and it is a property of the test alone: a failure multiplies the odds of "broken" by 19.8 no matter who is looking. Two engineers with different priors will disagree about the posterior, but they will agree about how much the evidence moved them. That's also why the naive "95%" was wrong: it treated a likelihood as though it were a posterior, skipping the prior entirely. A likelihood ratio of about 20 is strong evidence, but it can only turn 1:9 odds into about 2:1.

### Today's posterior is tomorrow's prior

You hit "re-run". Before reading on, predict: if it fails again, does your belief go up by about as much as last time, more, or less?

In odds form the update is the same multiplication again, starting from where you ended:

```
after 1st failure:   odds = 2.2                         P(broken) = 0.688
after 2nd failure:   odds = 2.2 × 19.8 = 43.56          P(broken) = 0.978
```

The *odds* got multiplied by the same 19.8, but the probability moved less in absolute terms (from 0.69 to 0.98, rather than from 0.10 to 0.69), because probabilities are squeezed against 1. If instead the re-run passes, the likelihood ratio for a pass is P(pass | broken)/P(pass | fine) = 0.01/0.95 ≈ 0.0105, and the odds become 2.2 × 0.0105 ≈ 0.023, i.e. P(broken) ≈ 0.023. One pass almost exonerates you, because broken code so rarely passes.

This is what "prior" and "posterior" really mean: they are not fixed kinds of object, they are *before* and *after* relative to a particular piece of evidence. The posterior after the first run is literally the prior for the second.

But I slipped in an assumption, and it's worth catching. Multiplying by 19.8 twice treats the two runs as conditionally independent given the state of the code: once you know the code is fine, one flake tells you nothing about whether the next run flakes. In real CI that is often false. If the flake is caused by a slow shared runner or a broken test fixture, it tends to fail again on re-run, so the second failure is much weaker evidence than the first. The arithmetic of Bayes is never wrong; the likelihood you plug into it can be.

### When the hypothesis is a number

So far there were two hypotheses. But look at where "5% flake rate" came from: someone estimated it. The flake rate is itself unknown, so let's be Bayesian about it. Call it θ, the probability that the test fails on a run of known-good code. θ is a real number in [0, 1], so now there's a continuum of hypotheses, one for each value of θ.

Suppose you run the test 40 times on a commit everyone agrees is good, and it fails k = 3 times. What do you now believe about θ?

Same three ingredients. The likelihood is how probable "3 failures in 40" is under each value of θ. If runs are independent with failure probability θ, the number of failures is binomial:

```
P(D | θ) = C(40, 3) · θ³ · (1 − θ)³⁷          binomial: choose which 3 runs fail, each fails w.p. θ
```

Before going continuous, let's do it on a coarse grid of five candidate flake rates so you can see every number. Take a flat prior, 0.2 on each:

```
θ       prior    likelihood P(D|θ)   prior × likelihood   posterior
0.02    0.2      0.0374              0.00749              0.071
0.05    0.2      0.1851              0.03702              0.353
0.10    0.2      0.2003              0.04006              0.382
0.15    0.2      0.0816              0.01631              0.155
0.20    0.2      0.0205              0.00410              0.039
        ───      ──────              ───────              ─────
sum     1.0      0.5250              0.10500  = P(D)      1.000
```

Look at the likelihood column: it sums to 0.525. That's the same lesson as the 0.99 + 0.05 = 1.04 earlier, now impossible to miss. The likelihood is a column of scores, not a distribution. The posterior column is the one that sums to 1, and it does so only because we divided by P(D) = 0.105.

Notice also that the likelihood peaks between 0.05 and 0.10. Its exact peak, over all θ, is at θ = 3/40 = 0.075: that's the **maximum likelihood estimate**, the value that best predicted the data. With a flat prior, the posterior just inherits the shape of the likelihood. Now change the prior: suppose your team's experience says flaky tests are usually only mildly flaky, so you put prior weights 0.40, 0.30, 0.15, 0.10, 0.05 on the five values. The same likelihood column now gives posteriors 0.136, 0.506, 0.274, 0.074, 0.009. Same evidence, different starting point, different conclusion, and the formula tells you exactly how they combine.

### The continuous version, and why the Beta distribution shows up

Shrink the grid spacing to zero. The prior becomes a density p(θ), the sum in P(D) becomes an integral, and Bayes' rule reads

```
p(θ | D) = p(θ) · P(D | θ) / ∫₀¹ p(θ′) · P(D | θ′) dθ′
```

The integral in the denominator is usually the hard part in practice, which is why so much of Bayesian computation (MCMC, variational inference) exists. For this problem there's a shortcut. Suppose the prior has the form

```
p(θ) ∝ θ^(α−1) · (1 − θ)^(β−1)          Beta(α, β) density, α, β > 0
```

Beta(1, 1) is the flat prior. Then

```
p(θ | D) ∝ p(θ) · P(D | θ)                                      Bayes, dropping the constant P(D)
         ∝ θ^(α−1)(1 − θ)^(β−1) · θ^k (1 − θ)^(n−k)              substitute prior and binomial likelihood;
                                                                 C(n, k) doesn't depend on θ, so drop it
         = θ^(α+k−1) · (1 − θ)^(β+n−k−1)                          add exponents with the same base
```

That's the shape of a Beta(α + k, β + n − k) density. Since a density must integrate to 1, the normalising constant is forced, and we never had to compute the integral by hand. A prior that stays in the same family after updating is called **conjugate** to the likelihood. The update rule also hands you an interpretation of the prior: α − 1 and β − 1 act like failures and passes you'd "already seen" before running anything.

With the flat prior Beta(1, 1), n = 40 and k = 3, the posterior is Beta(4, 38). Numerically (computed, rounded to 3 figures):

```
posterior mode (MAP)        (α+k−1)/(α+β+n−2) = 3/40  = 0.075   equals the MLE under a flat prior
posterior mean              (α+k)/(α+β+n)     = 4/42  = 0.095
95% credible interval       0.027 to 0.199
P(θ > 0.10 | D)             0.40
```

Read that interval honestly: after 40 runs, the flake rate could plausibly be anything from about 3% to 20%. Forty runs with three failures just doesn't pin it down, and the posterior tells you so directly. Also, "95% credible interval" means exactly what people wrongly think a confidence interval means: given the model and prior, there's a 95% probability θ lies in it.

And here is what happens to the dependence on the prior as data accumulates. Compare the flat prior with an informed one, Beta(2, 30), whose mean is 0.0625 (the "flaky tests are usually mild" belief), using the same 7.5% failure rate at two sample sizes:

```
data              prior           posterior mean    95% credible interval
3 / 40 fail       Beta(1, 1)      0.095             0.027 – 0.199
3 / 40 fail       Beta(2, 30)     0.069             0.023 – 0.138
30 / 400 fail     Beta(1, 1)      0.077             0.053 – 0.105
30 / 400 fail     Beta(2, 30)     0.074             0.051 – 0.101
```

At 40 runs the prior matters a lot; at 400 the two analysts nearly agree. That's the general pattern: the likelihood term has a factor for every observation, while the prior appears once, so with enough well-behaved data the likelihood dominates. When data is scarce, the prior matters, and that's not a flaw. It's the method being honest that with little data your conclusion *should* depend on what you knew beforehand.

### Where this machinery runs

The same three-piece structure, with different hypothesis spaces and likelihoods, sits inside a lot of systems you'll meet.

A **naive Bayes spam filter** has two hypotheses (spam, ham), a prior from the fraction of mail that's spam, and a likelihood built by multiplying per-word probabilities, which assumes words are conditionally independent given the class. That assumption is badly false (the words "Nigerian" and "prince" are not independent), yet the classifier often works, because ranking messages by posterior odds can be right even when the probabilities themselves are miscalibrated.

A **Kalman filter**, the thing fusing GPS and accelerometer readings in a phone, is Bayes' rule with Gaussians. The predicted state is the prior, the sensor reading's noise model is the likelihood, and because a Gaussian times a Gaussian is Gaussian (conjugacy again), the posterior is computed in closed form at every time step and becomes the next step's prior.

**Regularisation in machine learning** is a prior in disguise. Take logs of Bayes' rule: −log p(w | D) = −log P(D | w) − log p(w) + const. If the prior on the weights is Gaussian, w ~ N(0, τ²I), then −log p(w) = ‖w‖²/(2τ²) + const, and finding the most probable weights (the MAP estimate) is exactly minimising the usual loss plus an L2 penalty with strength 1/(2τ²). Ridge regression and weight decay are MAP estimation under a Gaussian prior; an L1 penalty corresponds to a Laplace prior.

**Bayesian A/B testing** is our flaky-test problem with "converted" instead of "failed": a Beta posterior on each variant's conversion rate, and the question "what's P(θ_B > θ_A | data)?" answered directly.

### Where it needs care

A few edges, briefly, each of which could be its own lesson.

A prior of exactly zero can never be revived. The posterior is prior × likelihood, so if P(H) = 0, no amount of evidence moves it. Put small but non-zero mass on anything you aren't logically certain is impossible.

"Flat" is not the same as "uninformative". A uniform prior on θ is *not* uniform on the log-odds log(θ/(1−θ)); it piles up mass near log-odds 0. Which parameterisation you call flat is a choice, and with little data it shows in the answer. Jeffreys priors are one systematic response to this.

The likelihood is a model, and it can be wrong. We assumed independent runs with a constant θ. If the flake rate drifts as the CI infrastructure changes, or failures cluster, the posterior will be confidently wrong, and narrow intervals will hide it. Posterior predictive checks (simulate fake data from the posterior and compare it to the real data) are how you catch this.

And the normaliser P(D), which we cheerfully divided out, is itself the score for comparing *models* rather than parameter values. That's Bayesian model comparison, and unlike parameter estimation it stays sensitive to the prior no matter how much data you have, which is a story for another session.

Two things to try. First, a quick one: in the CI story, suppose your team gets more careful and only 2% of commits to this module break the test, with the same 99% and 5%. Before computing, guess whether a single failure should now make you more or less than 50% sure you broke something, then work it out with the odds form. Second, a deeper one: with the Beta(1, 1) prior and 3 failures in 40 runs, you then run the test 10 more times and see no failures. Write down the new posterior without recomputing anything from scratch, and explain in a sentence why it doesn't matter whether you update on all 50 runs at once or on the 40 and then the 10.
