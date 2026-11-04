# Evaluation Rubric

Each test lesson is scored 1–5 on each criterion. A lesson passes when no criterion is below 4 and there is no factual error. Any fabricated fact, wrong equation, or skipped non-trivial derivation step is an automatic fail for that lesson.

| # | Criterion | 5 looks like | 1 looks like |
|---|---|---|---|
| 1 | **Problem-first opening** | Makes the actual problem understandable (what we want, why naive fails, what a solution needs) before any solution; real-world story only if it truly helps | Opens with a definition, or a forced story that doesn't carry the mechanism |
| 2 | **Example connected to mechanism** | The opening example shares the concept's actual structure; mapping stated; limits of the analogy stated | Decorative analogy; mapping never made; analogy oversold |
| 3 | **Natural development** | Each paragraph answers the previous one's question; ideas appear when needed | Disconnected sections; facts in arbitrary order |
| 4 | **Understandable intuition** | A reader could picture the mechanism before seeing equations | Intuition is asserted ("it's like…") rather than built |
| 5 | **Equations at the right time** | Notation arrives after the idea; every symbol defined with shape/units | Formula dumped early; undefined symbols |
| 6 | **Complete mathematical steps** | Every transformation justified; a student can reproduce each line | "After some algebra", "it can be shown", skipped steps |
| 7 | **Progression to advanced** | Moves from accessible to assumptions, failure modes, extensions | Stays shallow or jumps straight to advanced |
| 8 | **Sounds like a teacher** | Connected prose, guiding questions, honest asides, confronts misconceptions | Encyclopedic tone; bullet soup; header per paragraph |
| 9 | **No generic AI patterns/examples** | No throat-clearing, no recap, no Alice/apples, numbers have meaning | "Let's dive in", "In summary", arbitrary toy data |
| 10 | **Accuracy and honesty** | All facts correct; illustrative numbers flagged; uncertainty stated | Fabricated stats/history; subtle errors |
| 11 | **Component completeness** | Every operation and prerequisite the student lacks is taught individually (problem, picture, mechanism, formal statement, derivation, example); none merely named; distinct techniques contrasted | Operations name-dropped ("orthogonalize via Newton–Schulz"); several ideas compressed into one paragraph |
| 12 | **Visuals that teach** | Real plots, animations or diagrams generated and verified (or honestly provided as source), each showing something the text can't | No visuals where geometry or motion is central; ASCII art standing in for diagrams; decorative or nonexistent figures |
| 13 | **Mastery reached** | A student could explain, derive, apply, implement, and state limits; or the lesson says which part comes next | Definition + intuition + one example presented as complete |

Also check: a worked example with realistic numbers that is computed fully and interpreted; ends pointing forward with good check questions (not "Does that make sense?").

## Test prompts

1. "Teach me gradient descent. I know basic calculus but I've never really understood why it works."
2. "I can compute eigenvalues and eigenvectors mechanically, but I don't understand what they *are*. Help me understand them."
3. "Explain backpropagation to me properly. I want to understand the math, not just the idea."
4. "How does TCP congestion control work? Teach me."
5. "Teach me Bayesian probability. I keep getting confused about priors, likelihoods and posteriors."

## How to re-run

From Claude Code, for each prompt: start a fresh session (or a fresh subagent), let the `professor` skill load, give the prompt, save the response to `tests/sessions/<topic>.md`, and score it against this rubric. The subagent must not read `tests/`.
