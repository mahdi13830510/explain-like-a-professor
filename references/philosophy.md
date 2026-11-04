# Teaching Philosophy and Methodology

This file is the *why* behind SKILL.md. Read it when designing a lesson on a large or unfamiliar topic and you need to decide the order of ideas.

## What the best explainers have in common

The model here is the craft behind the best technical explainers: 3Blue1Brown, StatQuest, Welch Labs, Reducible, Computerphile. We take the principles, not their phrasing, catchphrases or specific content.

**3Blue1Brown (Grant Sanderson): make the abstract visible, and make it feel discoverable.** The *Essence of Linear Algebra* series treats a matrix as a transformation of space you can watch, so that determinants become area scaling and eigenvectors become directions that stay on their own line, before any computation rules appear. The deeper principle is pacing the lesson as if the viewer is inventing the subject: pose a problem that matters, let a natural attempt run into trouble, and let the concept emerge as the resolution. Notation is introduced as shorthand for a picture the viewer already holds.
→ *For us:* for every concept, find the picture in which the idea is obvious, and order the lesson so the formula arrives as the compact description of that picture.

**StatQuest (Josh Starmer): tiny, complete examples, every step shown.** Statistical and ML methods are taught on a dataset small enough to compute by hand, and every arithmetic step is actually performed. Nothing is "left to the reader". Jargon is introduced only after the thing it names has been done.
→ *For us:* the worked example must be small enough to follow and complete enough to trust. Show the intermediate numbers.

**Welch Labs: narrative and history as motivation.** Ideas are presented as answers to questions people actually struggled with, often following the historical path, including the wrong turns, because the wrong turns explain why the right answer is shaped the way it is.
→ *For us:* when history clarifies *why* a concept has its form (why imaginary numbers were forced on people by cubic equations, why TCP needed congestion control), tell it, accurately. Never invent history.

**Reducible: algorithms from the problem up.** Start with the problem, try the naive solution, measure why it's insufficient, and let each improvement be motivated by a specific deficiency, ending with the clever algorithm (FFT, compression, PageRank) as an inevitable conclusion.
→ *For us:* for algorithms and systems, always show the naive approach and its failure *in numbers* before the real one.

**Computerphile: real systems, real practitioners, real mess.** Explanations sketched by someone who works on the thing, grounded in what actually happens in real computers and real networks, including the hacks and historical accidents.
→ *For us:* connect concepts to the systems the student uses every day, and be honest about engineering trade-offs and ugly corners.

## Depth: StatQuest's completeness, 3Blue1Brown's pictures

The student's explicit standard is to understand a concept well enough to explain it to someone else, derive it, recognise when it applies, and implement it. Two consequences:

- **Component completeness.** Every topic is decomposed into its operations and properties, and each is taught individually (problem, picture, mechanism, formal statement, derivation, example) before they're combined. See the component protocol in `math-teaching.md`.
- **Both intuition and rigor, always linked.** Visualise first, then formalise, then show explicitly which part of the formula is which part of the picture. Intuition is never an excuse to skip the mathematics, and the mathematics never arrives without a picture to hang it on.

## Principles from learning science (used, not lectured about)

- **Concreteness fading.** Concrete situation → schematic/visual model → abstract symbols. Each stage is explicitly linked to the previous one, so the symbols stay anchored to meaning.
- **Worked examples before independent problems.** Novices learn more from studying a complete worked solution than from struggling unaided; as competence grows, fade the support and hand over more of the work.
- **Cognitive load.** One new idea at a time. Don't introduce new notation, a new concept and a tricky algebra step in the same sentence. Park side issues explicitly ("we'll come back to the bias term").
- **Prediction and productive struggle, in small doses.** Asking the student to predict an outcome before revealing it makes the reveal stick. Don't overuse it, and never withhold an explanation they asked for.
- **Misconceptions must be confronted, not just avoided.** If students commonly believe something false (the gradient points to the minimum; a 99%-accurate test means a positive is 99% likely true), name it and show why it fails.
- **Retrieval, spacing, interleaving.** Understanding that is never retrieved fades. See `assessment.md`.
- **Multiple representations, linked.** Geometric, algebraic, numerical, computational, physical. The understanding lives in the links between them: "this term in the formula is that arrow in the picture is this number in the table."

## Designing a lesson: the questions to answer first

Before writing, answer these privately:

1. **What problem does this concept solve?** If you can't say it in one sentence, you aren't ready to teach it.
2. **How do I make the problem itself understandable?** What exactly are we trying to do, what goes wrong without the concept, and what properties must a solution have? That's your opening. A real-world situation helps only if it genuinely shows the mechanism; don't force one.
3. **What is the naive attempt, and how does it fail?** That's your motivation for the real idea.
4. **What is the single key insight?** The sentence the student should remember in ten years.
5. **What picture makes the insight obvious?**
6. **What are the prerequisites, and which might this student lack?**
7. **What does the formalism add that the picture can't?** (Precision, generality, computability.) That's why it's worth the student's effort.
8. **What's the most common misconception?** Plan to confront it.
9. **What small realistic example can be computed in full?**
10. **Where does the idea stop working, and what does that lead to?**

## The order of ideas

Default skeleton for a concept lesson:

1. The actual problem, made concrete: what we want, and what a solution must satisfy (with a real-world situation only if it truly illuminates the mechanism).
2. The question, sharply posed.
3. A natural first attempt (often what the student would try).
4. Why it's insufficient: shown, not asserted.
5. The key insight, as the fix.
6. The picture / mental model.
7. Naming and notation.
8. Derivation of the core relationship.
9. A worked numerical example, interpreted.
10. Real applications, with the mechanism of use.
11. Assumptions, failure modes, extensions, connections.
12. A question that makes the student use it.

For an algorithm, swap in: problem → brute force and its cost → the observation that saves work → the algorithm → trace on a small realistic input → complexity and why → where it's used → when it fails and what replaces it.

## Rigor without intimidation

Rigor means every claim is true as stated and every step is justified. It does not mean opening with ε–δ. The trick is *sequencing*: the precise statement comes after the student has a reason to care and a picture to hang it on. Then you can be completely precise, because the precision now *answers* something. When you simplify, say so explicitly ("this is true for convex functions; in general we only get a local guarantee"), so that nothing the student learns now has to be unlearned later.

## Adapting to the student

- **Signals of a beginner:** asks what a term means, uses everyday words for technical ideas. → More time in stages 1–2, prerequisites taught in place, math introduced gently but still introduced.
- **Signals of an advanced student:** uses notation correctly, asks about edge cases or proofs. → Brief intuition, then precision; spend the effort on derivations, assumptions, connections.
- **Mixed signals are normal** (strong in calculus, new to probability). Pitch each part at the level of *that* part.
- **When a student gets something wrong,** the error tells you which mental model is missing. Rebuild that model; don't just correct the output (see `assessment.md`).
