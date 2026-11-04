# professor: a personal AI professor skill

A Claude Skill that makes Claude teach technical subjects the way an exceptional human professor does. It combines StatQuest-level step-by-step depth with 3Blue1Brown-style geometric intuition. It starts from the actual problem, teaches every component (each operation, symbol and derivation step) individually before combining them, uses real visuals (matplotlib plots, Manim animations, Graphviz/Mermaid/Excalidraw diagrams), and splits big topics into complete parts instead of compressing them. The teaching philosophy draws on 3Blue1Brown, StatQuest, Welch Labs, Reducible and Computerphile, and on learning-science research (concreteness fading, worked examples, retrieval practice, spacing).

## Layout

```
professor/
├── SKILL.md                      core instructions (always loaded when the skill triggers)
├── references/                   loaded on demand (progressive disclosure)
│   ├── voice.md                  how to sound like a teacher; AI patterns to avoid
│   ├── visuals.md                choosing, generating and verifying plots, animations, diagrams
│   ├── philosophy.md             teaching methodology, lesson design, ordering ideas
│   ├── examples-guide.md         choosing real, mechanism-matched examples; example bank
│   ├── math-teaching.md          equation protocol, derivations, shapes, pictures per area
│   ├── technical-subjects.md     algorithms, systems, networks, DBs, ML, physics, stats
│   ├── research-papers.md        teaching (not summarising) a paper; claim labelling
│   ├── implementation.md         theory → code that mirrors the math
│   ├── assessment.md             checks, mistake repair, retention, practice sets
│   └── modes.md                  output shapes for each teaching mode
├── examples/                     style-calibration sessions
└── tests/                        rubric, five generated test lessons, evaluation report
```

## Modes

These are picked automatically from your wording; you can also name one ("notebook mode", "just the math").

| Mode | Say something like |
|---|---|
| Deep (default) | "teach me…", "explain…", "help me understand…" |
| Intuitive | "give me the intuition", "big picture", "no math" |
| Mathematical | "derive", "prove", "formally" |
| Notebook | "notes for my notebook", "write this up" |
| Research | share a paper / arXiv link |
| Implementation | "implement from scratch", "code it" |
| Exam | "exam revision", "practice problems", "test me" |
| Quick | short factual questions |

## Installation

### Claude Code

Personal skill (available in every project), which is where it is installed now:

```
~/.claude/skills/professor/SKILL.md
```

To share it with a project team, copy the folder to `<project>/.claude/skills/professor/` and commit it.

Claude Code discovers skills at startup. In a new session, either just ask to learn something ("teach me Kalman filters") and the skill activates from its description, or invoke it explicitly with `/professor <topic>`.

If another installed skill competes for teaching requests (for example `gentle-teaching`, which deliberately withholds answers), Claude may pick either. Name the skill ("use professor") or remove the competing one if you want this behaviour every time.

### Claude.ai (web / desktop / mobile)

1. Enable code execution: **Settings → Capabilities → Code execution and file creation** (Skills require it).
2. Go to **Settings → Capabilities → Skills → Upload skill** and upload `professor-skill.zip` (the zip contains the `professor/` folder with SKILL.md at its top level; `tests/` is excluded to keep it light).
3. Make sure the skill is toggled on. It then activates automatically when you ask to learn something.

On Claude.ai, LaTeX renders, and the skill switches its math formatting to `$…$` accordingly.

To rebuild the zip after editing:

```
cd ~/.claude/skills && zip -r ~/professor-skill.zip professor -x 'professor/tests/*'
```

### Claude API / Agent SDK

Upload the same folder through the Skills API (`/v1/skills`) or place it in `.claude/skills/` for the Agent SDK; the format is identical.

## Testing

`tests/rubric.md` defines a 10-criterion rubric and five test prompts (gradient descent, eigenvectors, backpropagation, TCP congestion control, Bayesian probability). `tests/sessions/` holds the lessons produced by fresh Claude instances that had only this skill; `tests/evaluation.md` records the scores, the problems found, and the revisions made to the skill in response.
