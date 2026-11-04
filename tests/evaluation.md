# Evaluation Report

Method: each lesson was written by a fresh Claude instance (Opus) that had only the skill files (no access to `tests/` or to this design conversation), acting on a realistic student prompt in a Claude Code terminal. Each instance also reported which skill files it loaded and what in the skill confused or misled it. Lessons were scored against `rubric.md`, and every load-bearing fact and number was spot-checked independently.

## Round 1: the five required subjects

| Lesson | Opening situation | Words | Files loaded | Real opening | Mechanism-linked example | Natural development | Intuition | Equation timing | Complete steps | Progression | Teacher voice | No AI patterns | Accuracy | Result |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Gradient descent | Contrast-detect autofocus → spring calibration fit | ~3,000 | 9 | 5 | 5 | 5 | 5 | 5 | 5 | 5 | 5 | 5 | 5 | Pass |
| Eigenvectors | Two-zone bike-share fleet converging to 600/400 | ~2,600 | 8 | 5 | 5 | 5 | 5 | 5 | 5 | 5 | 5 | 5 | 4 | Pass |
| Backpropagation | Cost of nudging 79,510 weights (6.3×10⁹ ops/example) | ~3,300 | 10 | 5 | 5 | 5 | 5 | 5 | 5 | 5 | 4 | 5 | 5 | Pass |
| TCP congestion control | Cross-country transfer through an unknown bottleneck | ~3,700 | 10 | 5 | 5 | 5 | 5 | 5 | 5 | 5 | 4 | 4 | 5 | Pass |
| Bayesian probability | Flaky CI test: did I break it? | ~3,000 | 9 | 5 | 5 | 5 | 5 | 5 | 5 | 5 | 5 | 5 | 5 | Pass |

Highlights. Each lesson discovers the concept before naming it: the bike table halves its gap daily before "eigenvalue 0.5" is said; prior, likelihood and posterior are named only after the 1,000-commit tree. All five confront the central misconception with numbers: the gradient doesn't point at the minimum, shown with a step that moves the intercept the wrong way; P(fail|fine) ≠ P(fine|fail); likelihoods summing to 1.04 and 0.525. All numbers came from executed Python. Every lesson states where its analogy breaks and ends with diagnostic exercises, never a recap.

Defects found:
- Eigenvectors: the vibration example writes ẍ = −Kx, silently assuming unit masses (in general Mẍ = −Kx, a generalized eigenproblem). Minor, but it's an unflagged simplification.
- TCP: the per-RTT slow-start loss bookkeeping is simplified (the text did say "coarse"); the ASCII phase-plane diagram is rough; 3,700 words exceeds the length target, mostly from touring CUBIC, BBR, ECN, DCTCP and QUIC.
- All: 7–8 `###` headers each, and 8–10 reference files loaded per request.

Skill problems the test instances surfaced (all reported independently by several instances):
1. `examples/README.md` pointed to `tests/sessions/`, an answer-key leak.
2. Skill text pre-solved test topics: camera autofocus and the Taylor block (gradient descent), the rain-forecast rewrite (Bayes), the "Markov chain / shear" hint (eigenvectors), and the Jacobson story plus RTT question (TCP). Lessons partly measured copying, not generalization.
3. Header rule contradiction: voice.md said "few or none", but the calibration example used six.
4. Reading load: the reference table's triggers all fired at once.
5. Length drift toward and past the 3,500-word ceiling, driven by breadth (variants, applications).
6. Missing guidance: centring on a confusion the student names; combining modes ("explain, with the math"); the concept's own real problem counting as the "situation" for advanced students; avoiding callbacks to skill examples the student never saw; stating simulation simplifications.

## Revisions made

- Removed the tests pointer from `examples/README.md`.
- Replaced every test-topic illustration in `voice.md`, `math-teaching.md` and `assessment.md` with held-out topics (B-tree indexes, Fourier, entropy/Morse code, variance of the mean, determinants). The example bank in `examples-guide.md` keeps its entries, since they're meant as anchors.
- SKILL.md: added a "what the student is actually asking" step (centre on the stated confusion); mode combination; real-problem openings for advanced students; a length rule (1,500–3,000 words, depth over breadth, no variant tours); a signpost rule (3–6 short `###` signposts in a long lesson, none in short ones), aligned in voice.md and modes.md; a typical reading load (voice + one domain file + optional examples guide); fact-checking and simulation-disclosure rules; a note that skill examples must never be referenced to the student; scope of rules for Quick/Notebook/Exam modes; a full equation protocol for central equations only; self-checks for exercise correctness and garbled sentences.

## Round 2: held-out topics after revision

| Lesson | Tests | Words | Files loaded | Result |
|---|---|---|---|---|
| KL divergence ("why asymmetric, why used for training") | stated-confusion focus, length, reading load | 2,177 | 3 | Pass: both questions answered as the lesson's spine; forecaster-grading opening; Jensen proof; mode-covering vs mode-seeking computed (σ = √10, KL ≈ log 2); forward KL = MLE derived |
| RSA ("why secure, why decryption works") | held-out math/CS topic, honesty about assumptions | 2,844 | 3 | Pass: full Fermat and CRT-style correctness proof including m sharing a factor with n; 61×53 example with extended Euclid; "factoring is unproven hard" and "RSA problem ≠ factoring" stated plainly |
| Softmax max-subtraction (quick question) | quick mode | 199 | 3 | Pass: answer in the first sentence, one equation, one real example ([1000, 999] → NaN), offer to go deeper. Slightly long; led to a clarification that brevity wins in quick mode |

Round 2 showed the revisions working: lessons got shorter and more focused, file loading dropped from 8–10 files to 3, signposts stayed within 3–6, and quality held on topics the skill text never mentions. The remaining notes (bullets for genuinely parallel lists, how far to verify well-known facts) are judgment calls the skill now addresses sufficiently.

## Re-running

See `rubric.md`. Use topics not mentioned anywhere in `SKILL.md`, `references/` or `examples/`, so the test measures generalization.
