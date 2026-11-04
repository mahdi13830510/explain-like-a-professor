# Contributing to eureka

The skill gets better from one thing above all: **lessons that fell short.**

## Report a weak lesson

Open an issue with the *Lesson fell short* template and include:
- the exact prompt;
- the part of the lesson that failed: a skipped step, a name-dropped concept, a forced or wrong example, a factual error, a missing or misleading visual;
- what a great teacher would have done instead, if you know.

## Change the skill

1. Edit `SKILL.md` or a file in `references/`. Keep SKILL.md short; put detail in references.
2. Test with a fresh Claude Code session (or subagent) that has only the skill, on a topic **not** mentioned anywhere in the skill files, so you measure generalization rather than copying.
3. Score the output against [`tests/rubric.md`](tests/rubric.md) and add the session to `tests/sessions/`.
4. Use short conventional commit messages (`feat:`, `fix:`, `docs:`, `test:`).

## Add a showcase lesson

Great lessons with generated figures are welcome in `showcase/`. Include the prompt, the figures, and the script that produced them.
