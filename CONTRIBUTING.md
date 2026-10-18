# Contributing to Rova

Three people, each working with their own AI agent (Claude Code, Codex, or Copilot), build in parallel. The agents never talk to each other directly. They coordinate through this repository:

- **Shared memory:** `PROJECT_CONTEXT.md`, `STATUS.md`, `DECISIONS.md`. Every agent reads these first.
- **Shared contracts:** `docs/INTEGRATION_CONTRACTS.md`, later `lib/types.ts`. These are the agreed boundaries between roles.
- **Messages between roles:** pull-request descriptions and handoff notes under `docs/workstreams/`. Use the template below so the next agent can pick up the work.

## Start in five minutes

1. Read `PROJECT_CONTEXT.md` and `STATUS.md`.
2. Choose an unclaimed role below and tell the team. The integration owner records it in `STATUS.md`.
3. Read your role guide under `docs/workstreams/`.
4. Create your role's branch from the latest `main`.
5. Build against the shared contracts and fixtures, even if the other roles aren't ready yet.
6. Open a small pull request before the next checkpoint (`docs/TEAM_WORKFLOW.md`).

## Choose a role

| Role | Mission | Branch | Guide |
| --- | --- | --- | --- |
| Person A — Student tutor and agent | Student view and the tutor loop: hint ladder, guardrails, safety screen, citations, code math checks, explain-it-back | `feat/student-tutor` | [`PERSON_A_STUDENT_TUTOR.md`](docs/workstreams/PERSON_A_STUDENT_TUTOR.md) |
| Person B — Data, rules, and integration | Shared types, seed data, skill map, learner memory, detection rules, root-cause trace, alerts and re-checks, app shell, deploy | `feat/data-rules` | [`PERSON_B_DATA_RULES.md`](docs/workstreams/PERSON_B_DATA_RULES.md) |
| Person C — Teacher and parent views | Teacher inbox, class heatmap, loop tracker, review queue, parent text and weekly card, simulated class and time jump | `feat/adult-views` | [`PERSON_C_TEACHER_PARENT.md`](docs/workstreams/PERSON_C_TEACHER_PARENT.md) |

Person B is the default integration owner because rules and data connect the student side to the adult side. The team can name a different owner in `STATUS.md` before coding starts. The pitch work (interviews, slides, rehearsal) is shared by the humans and is not a code role.

## Shared contracts

```text
Person A (student)                 Person B (data + rules)                Person C (adults)

tutor turn ──▶ Event ──────────▶ detection rules ──▶ trace ──▶ Alert ──────▶ teacher inbox
check_answer        learner profile ◀── profile updates           ParentMessage ──▶ parent view
                    schedule_recheck ──▶ verify ──▶ Alert.status ──▶ loop tracker
```

- Person A writes `Event`s and reads the learner profile. It never creates alerts directly.
- Person B owns all state transitions: profile updates, rules firing, alert lifecycle (open → acted → verified | escalated).
- Person C reads `Alert`s, `SkillState`s, and `ParentMessage`s, and sends teacher actions (Done / Snooze / Different strategy) back through B's functions.
- Only the integration owner changes shared contracts. Propose a change before you depend on it.

Until upstream code exists:

- Person A uses a hard-coded Maya profile and logs events to the console or to a fixture array.
- Person B tests rules against scripted event sequences under `fixtures/`.
- Person C renders hard-coded `Alert` and `ParentMessage` fixtures.

## File ownership

| Area | Owner |
| --- | --- |
| `app/student/`, `components/student/`, `lib/tutor/`, `lib/math/`, `app/api/tutor/`, `content/` (lesson sources), `eval/` (tutor test set) | Person A |
| `lib/data/`, `lib/rules/`, `fixtures/`, `app/api/events/`, `app/api/alerts/` | Person B |
| `app/teacher/`, `app/parent/`, `components/teacher/`, `components/parent/`, `lib/messages/`; since D-008 also `app/globals.css` (design tokens), `app/layout.tsx` (fonts), `app/page.tsx` (home), `components/ui/` | Person C |
| `lib/types.ts`, `lib/llm.ts`, `package.json`, config files | Integration owner |
| `STATUS.md`, accepted entries in `DECISIONS.md` | Integration owner, after the team agrees |

Don't reformat or refactor someone else's area during feature work. If a shared file has to change, isolate it in a small commit and tell the owner.

## Branches

```bash
git switch main
git pull --ff-only

# Pick exactly one:
git switch -c feat/student-tutor
git switch -c feat/data-rules
git switch -c feat/adult-views
```

Before you ask for a merge:

```bash
git fetch origin
git merge origin/main
npm run test
npm run build
git push
```

If the app hasn't been initialized yet, record build/test as unavailable. Don't claim they passed.

## Check your boundary before every commit

```bash
git status --short
git diff --name-only origin/main...HEAD
```

Every changed file should belong to your workstream. If a shared or teammate-owned file shows up, restore it or coordinate first. AI-generated edits do not override file ownership.

## Pull-request handoff

```markdown
## Role
Person A | Person B | Person C

## Outcome
What now works.

## Contract impact
None, or the exact shared type/function that changed.

## Verification
Commands and manual flows actually run.

## Known limitations
What is intentionally incomplete, simulated, or unreliable.

## Integration notes
What the next person must connect, configure, or avoid.
```

## Start your AI agent in your role

Paste one of these into Claude Code or Codex from the repository root. In VS Code with Copilot, run `/rova-person-a`, `/rova-person-b`, or `/rova-person-c` (from `.github/prompts/`).

### Person A prompt

```text
Use maintaining-rova-context. I am Person A — Student Tutor and Agent. Read PROJECT_CONTEXT.md, STATUS.md, CONTRIBUTING.md, docs/INTEGRATION_CONTRACTS.md, and docs/workstreams/PERSON_A_STUDENT_TUTOR.md. Inspect the repository, identify the next uncompleted Person A task, and implement it only within Person A's owned files. Use the shared contracts without changing them. If a shared contract or shared file must change, stop and describe the change for the integration owner. Verify the work you complete and give me a PR-ready handoff using the repository template.
```

### Person B prompt

```text
Use maintaining-rova-context. I am Person B — Data, Rules, and Integration owner. Read PROJECT_CONTEXT.md, STATUS.md, CONTRIBUTING.md, docs/INTEGRATION_CONTRACTS.md, and docs/workstreams/PERSON_B_DATA_RULES.md. Inspect the repository, identify the next uncompleted Person B task, and implement it only within Person B's owned files plus integration-owner files when required. Keep shared changes isolated and explain them. Do not implement Person A tutor internals or Person C view internals. Verify the work you complete and give me a PR-ready handoff using the repository template.
```

### Person C prompt

```text
Use maintaining-rova-context. I am Person C — Teacher and Parent Views. Read PROJECT_CONTEXT.md, STATUS.md, CONTRIBUTING.md, docs/INTEGRATION_CONTRACTS.md, and docs/workstreams/PERSON_C_TEACHER_PARENT.md. Inspect the repository, identify the next uncompleted Person C task, and implement it only within Person C's owned files. Consume Alert, SkillState, and ParentMessage fixtures and do not read tutor internals. If a shared contract or shared file must change, stop and describe the change for the integration owner. Verify the work you complete and give me a PR-ready handoff using the repository template.
```

Before accepting an agent's edits, the human must run the boundary check and review the diff.

## Ground rules

- Protect the demo path in README section 8.
- Don't expand scope without team agreement.
- Never commit API keys, `.env*` files, real student data, or `node_modules`.
- Never claim a feature works or a test passed unless you verified it.
- Feature freeze Saturday night (see `docs/TEAM_WORKFLOW.md`). After that: test set, polish, backup video.
