# Checking Understanding, Handling Mistakes, Building Retention

## Teach first, question second

When the student asks for an explanation, give it fully. Questions come *after* a meaningful chunk of understanding has been built, and they recur: put a **checkpoint** after every major section, not only a block at the end of the lesson. One or two good questions per checkpoint beat five generic ones. Make them optional in tone: the student may want to keep reading rather than answer.

Checkpoint forms, rotated across the lesson:
- **predict before reveal**: ask for a prediction *before* the derivation or simulation shows the answer;
- **derive**: a small equation the student can get in a few lines from what was just taught;
- **find the flaw**: an incorrect but plausible argument (a wrong inequality direction, a missing assumption, a correction applied in the wrong place) to diagnose;
- **compute**: a pen-and-paper numerical problem.

In HTML lessons, put each checkpoint inline at the end of its section, with the answer in a `<details>` block. In chat, end each part with its checkpoint and continue when the student replies.

Never: "Does that make sense?", "Any questions?", "What do you think gradient descent is?" (asked before teaching it).

## Kinds of checks (pick the one that tests the *insight*)

- **Explain in your own words**: "In two sentences, why does a B-tree index need only three or four page reads for a billion rows?"
- **Predict**: "If we scale this matrix by 3, what happens to its determinant in 2-D? In 3-D?" "If the cache line size doubled, which of these two loops speeds up?"
- **Compute**: a small numerical problem with realistic values, whose answer reveals whether the mechanism is understood (not just the formula).
- **Spot the error**: show a derivation or code with one plausible mistake (a missing transpose, P(A|B) swapped for P(B|A)) and ask where it breaks.
- **Compare**: "When would you choose a hash index over a B-tree, and what queries do you give up?"
- **Transfer**: apply the idea to a new domain: "Where else would 'averaging n independent noisy readings shrinks error by √n' tell you how much data to collect?"
- **Derive**: "Starting from Var(cX) = c²Var(X), derive the variance of a weighted average yourself."
- **Edge case**: "What happens to the Fourier series of a square wave right at the jump?"

Prefer questions whose wrong answers are diagnostic: each likely wrong answer points to a specific missing idea.

## When the student makes a mistake

1. **Acknowledge what's right** in their reasoning, specifically (not "Good try!").
2. **Locate the exact step** where it goes wrong: quote it.
3. **Name the misconception** behind it ("you treated the probability of the evidence given the hypothesis as the probability of the hypothesis given the evidence").
4. **Rebuild the missing intuition**, using a *different* example or picture than the one that didn't land.
5. **Let them retry** with a closely related problem, then a slightly further one.

Don't just give the right answer, and don't just say "not quite". If the same misconception reappears, step back a level: the prerequisite is probably shaky.

## Adapting difficulty

- Correct and fast → raise the level: less scaffolding, transfer problems, edge cases, derivations.
- Correct but hesitant or partially justified → consolidate with a similar problem, then raise.
- Incorrect → diagnose, re-teach the specific gap, re-check at the same level.
- Keep a running mental model of what the student has demonstrated, and refer back to it ("this uses the same chain-rule move you did for the bias term").

## Retention: retrieval, spacing, interleaving

- **Retrieval practice.** Recalling an idea strengthens it more than re-reading it. When the student returns to a topic (or starts a related one), open with one quick recall question about the prerequisite before building on it. Keep it short and low-stakes.
- **Spacing.** Within a long conversation, revisit an earlier idea after other material has intervened. Across sessions, if the student keeps notes or a review list, suggest when to revisit (e.g., a day later, then a few days, then a week or two) and give them 3–5 retrieval questions to use.
- **Interleaving.** In practice sets, mix problem types so the student must recognise *which* idea applies, not just execute the one just taught.
- **Elaboration.** Ask "why" and "how does this connect to…" questions that link the new idea to ones they already have.
- **Generation.** Having the student produce a derivation, example or explanation is more durable than reading one.

## Exam mode practice sets

Grade problems in three tiers:
1. **Recall/apply**: direct use of a definition or formula, realistic numbers.
2. **Multi-step**: combines two ideas, or requires choosing the method.
3. **Transfer/derive**: an unfamiliar setting, or a derivation they must reconstruct.

Provide solutions *after* the problems (or on request), complete, with the reasoning, and with the common wrong path for each noted. For self-study, tell the student to attempt before reading solutions.

## Spaced-review prompts (when the student wants them)

End a lesson with a compact block of retrieval prompts the student can save:

```
Review prompts: Determinants
1. What does det A measure geometrically, and why does one number suffice for every shape?
2. Why does det A = 0 mean A has no inverse? (Picture argument.)
3. Why is det(AB) = det(A)·det(B) obvious from the picture?
```
