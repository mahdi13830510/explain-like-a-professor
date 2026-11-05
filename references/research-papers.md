# Teaching a Research Paper

The goal is that the student could explain the paper to a colleague, reproduce its central derivation, and judge its claims, not that they've read a summary.

## Before teaching: get the actual paper

- If the user gives a PDF, a file path, an arXiv ID or a URL, **read the paper itself** (tools: Read for PDFs, WebFetch, or a paper-reading skill such as `read-arxiv-paper`/`huggingface-papers` if installed). Read the method section, the main theorem statements, the experiment tables and the limitations section, not just the abstract.
- If the user only names a paper and you can't access it, say so. Teach the parts you are confident about from well-established knowledge, mark them as recalled rather than read, and do not quote numbers, table entries or claims you haven't seen.
- **Never invent** results, numbers, equations, author statements, or citations. If you aren't sure whether the paper reports something, say "I'd need to check the paper for that."

## Labelling claims

Throughout the lesson, make the epistemic status visible. Use plain phrases, not a rigid tag system:

- **Established background**: "It's standard that…", widely accepted, textbook-level.
- **Theoretical result**: "The paper proves (Theorem 2) that, assuming A and B, …"; state the assumptions.
- **Experimental observation**: "On ImageNet they report 76.1% top-1 vs. 75.3% for the baseline (Table 3)." Include where it's from.
- **Author claim / interpretation**: "The authors argue this is because…": a hypothesis, not a demonstrated fact.
- **Your interpretation**: "My reading is…" / "One concern I'd raise…".
- **Formal guarantee vs. intuition**: "Theorem 3 guarantees X under A1–A2" is different from "the authors explain this as Y (Section 5.2 discussion)". Keep the two apart.

**Cite the exact location.** Every important claim about the paper names its source: Theorem 2, Lemma 12, Eq. (3), Algorithm 1 line 9, Section 7.2, Figure 2, Appendix D. If you can't point to one, the claim is either background, your interpretation, or something you need to check.

**Never attribute your interpretation to the authors.** If the paper doesn't say it, it's yours: label it as such, even when it seems obvious. Equally, when the paper *does* say something, quote or closely paraphrase it rather than restating it in stronger terms than the paper uses.

**Fill gaps visibly.** If the paper's proof skips a step, write it out and say "the paper skips this; here is the step." If a typeset formula is ambiguous (garbled extraction, undefined symbol), say so and state which reading you use and why.

## The researcher's perspective (end of every major section)

After each major section of a paper lesson, add a short "researcher's view" that covers:

- **Why it matters for the paper**: which theorem, algorithm step or experiment depends on this concept.
- **What if an assumption is violated**: which assumption is load-bearing, and a concrete case where it fails (a counterexample or a regime: heavy-tailed noise, non-smooth losses, partial participation, ill-conditioned matrices), plus what goes wrong.
- **Remaining limitations**: what the result doesn't cover (constants, last-iterate behaviour, layer-wise structure, scale of experiments).
- **Connections**: to other optimization / federated / learning methods (the same trick in SCAFFOLD, normalized SGD, Frank–Wolfe, error feedback…), and what follow-up work this suggests.

The goal is a student who can reproduce the paper's reasoning and critically evaluate the contribution, not just repeat it.

## The teaching sequence

1. **The research problem** in concrete terms: what someone was trying to do, and what failed.
2. **Why it matters**: who suffers from the problem; what would be unlocked.
3. **Prerequisites.** Map the component chain the paper rests on (e.g., for an optimizer paper: SVD → polar factor → Newton–Schulz → the optimizer → the federated setting → control variates). Check it against what the student has shown they know. Teach every missing component *fully*, with the component protocol in `math-teaching.md`, before the paper's own contribution. A paper lesson that name-drops its prerequisites in one sentence each has failed. If the prerequisites are substantial, make them Part 1 and the paper Part 2.
4. **Prior work and its limitation**: the specific gap this paper targets. Be fair to prior work.
5. **The central idea, intuitively.** One paragraph a smart non-specialist could follow. What's the one observation the whole paper rests on?
6. **The method, step by step.** Follow data/tensors through the pipeline with shapes; use a small concrete instance.
7. **Key equations, derived.** Not just restated: show where each comes from, what each term does, and why it's shaped that way. If the paper skips steps, fill them in and say you did.
8. **Assumptions and guarantees.** What must hold for the theory to apply? Do the experiments satisfy those assumptions?
9. **Experiments and results.** What was measured, against which baselines, on what data, with what variance. Are the comparisons fair (tuning budget, model size, compute)? Read the numbers critically: effect sizes, error bars, number of seeds.
10. **Ablations.** What each ablation removes and what the change tells us about *which part* of the method matters. Note missing ablations that would have been informative.
11. **Weaknesses and limitations**, both stated by the authors and ones you notice: scope of evaluation, confounds, compute cost, reproducibility, whether conclusions exceed evidence.
12. **Extensions.** Open questions, natural next experiments, connections to other work, and what you would try if you were writing the follow-up.

Close with a check that requires real understanding: "If you removed component X, what would you predict happens to metric Y, and why?" or "Derive equation (4) from (2) yourself."

## Reading figures and tables with the student

Say what's on each axis, what each line/row is, what a "good" result looks like, and what the eye should be drawn to. Point out scale tricks (truncated y-axes, log scales).

## Depth control

A paper lesson is usually multi-part. Give the roadmap first (prerequisite components → the problem the paper attacks → its method → theory → experiments → critique), teach each part at full depth, and continue across turns. Never compress the prerequisites to reach the paper faster.
