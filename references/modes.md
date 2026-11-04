# Teaching Modes: Output Shapes

The mode is chosen from the user's wording (see the table in SKILL.md). Modes can be combined ("intuitive, but show me the key equation") and can switch mid-conversation. If the user explicitly names a mode, use it. Name the mode only if it helps the user ("Here's the notebook version:"); otherwise just teach.

## Deep mode (default for "teach me / explain / help me understand")

The full arc from SKILL.md: situation → conceptual model → formal foundations → derivation → worked example → applications → advanced understanding → a question to try. Flowing prose with equations woven in; derivations in their own blocks; a few short signposts at major turns in a long lesson, none in a short one. For big topics, teach the core arc completely, then sketch the advanced territory and offer to continue.

## Intuitive mode

Situation, mental model, pictures, consequences. Equations appear only if they *are* the intuition (e.g., "error shrinks like 1/√n" is intuition). Still precise: an intuitive explanation must not be wrong. Close with one sentence about what the formal treatment would add, and offer it.

## Mathematical mode

A short motivating paragraph (two to four sentences: what problem, what we're about to prove/derive). Then:
- Definitions and notation, with domains, shapes and assumptions.
- Statements (proposition/theorem) precisely.
- Derivations/proofs with every step justified; hypotheses pointed to when used.
- A worked calculation.
- Remarks: what fails without each assumption, generalisations.
Headings and numbered results are appropriate here.

## Notebook mode

Notes the student can copy into a notebook or Obsidian. Dense, organised, precise, no conversational padding, but still in the right *order* (motivation before definition). Typical layout:

```
# Topic
**Problem / motivation**: 1–3 sentences.
**Key idea**: one sentence.
**Definitions & notation**: symbol, meaning, shape/units.
**Main results**: boxed or bold equations, each with a one-line meaning.
**Derivation**: numbered steps with reasons.
**Worked example**: compact, with numbers.
**Assumptions / limitations**
**Connections**: related concepts, applications.
**Common mistakes**
```

Use LaTeX if the user's notes app renders it or they ask; otherwise Unicode math. Diagrams as ASCII if useful.

## Research mode

Follow `research-papers.md`. Prose for the teaching parts; structured sections are fine for a long paper. Claim labelling is mandatory.

## Implementation mode

Follow `implementation.md`: brief theory → hand-sized example → incremental code mapped to math → run → break it → complexity → library equivalent.

## Exam mode

Structured revision:
1. **What you must know**: the core ideas in a few tight sentences each (not a glossary).
2. **Must-know derivations**: written out, each step justified, with the "trick" in each one highlighted.
3. **Typical question types** and how to recognise which tool applies.
4. **Practice problems** in three tiers (see `assessment.md`), solutions after.
5. **Classic mistakes** examiners look for.
Lists and headings are appropriate here; this mode is for efficient review.

## Quick mode

Answer the question directly in the first sentence. Add the minimum context that makes the answer *understood* rather than just stated (often one sentence of "why"). Typically 2–6 sentences, possibly one equation or a tiny example. Offer to go deeper only if natural; don't append a lesson. Example:

> **Q:** Why do we divide by n − 1 in sample variance?
> **A:** Because the deviations are measured from the sample mean, which is pulled toward the data, so they're systematically a bit too small; dividing by n − 1 instead of n exactly corrects that bias in expectation (E[s²] = σ²). Intuitively, once you know the mean, only n − 1 of the deviations are free; the last one is forced to make them sum to zero. Want the two-line proof?

## Switching modes mid-conversation

If the student says "slower", "I'm lost", "too abstract" → shift toward intuitive/deep with more grounding and a new example. If they say "skip the intuition", "just the math" → mathematical. "Summarise this for my notes" → notebook version of what was just taught, not a new lesson.
