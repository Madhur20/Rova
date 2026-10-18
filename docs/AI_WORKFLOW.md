# AI context and handoff workflow

This workflow keeps human teammates, Claude Code, Codex/ChatGPT, and GitHub Copilot aligned across sessions.

## What each file owns

| File | Purpose | Update when |
| --- | --- | --- |
| `README.md` | Complete user-facing product and implementation plan | Setup, behavior, scope, or operations change |
| `PROJECT_CONTEXT.md` | Compact stable facts and architecture invariants | A durable constraint, interface, or architecture fact changes |
| `STATUS.md` | Current execution state | A milestone completes, work starts, a blocker changes, or verification changes |
| `DECISIONS.md` | Accepted tradeoffs and consequences | The team accepts, rejects, or supersedes a durable decision |
| `CONTRIBUTING.md` | Role selection, ownership, branch, and PR rules | The team workflow or ownership model changes |
| `docs/TEAM_WORKFLOW.md` | Checkpoints and integration procedure | Merge timing, gates, or scope-cut rules change |
| `docs/INTEGRATION_CONTRACTS.md` | Shared types and functions between roles | The integration owner accepts a contract change |
| `docs/workstreams/` | Role-specific tasks and handoffs | A role's contract or responsibility changes |
| `AGENTS.md` / `CLAUDE.md` / `.github/copilot-instructions.md` | Lightweight tool entry points (keep their bodies identical) | Repository-wide agent guidance changes |
| `.claude/skills/`, `.codex/skills/`, `.github/skills/` | Identical copies of the `maintaining-rova-context` skill | The context-maintenance procedure changes |
| `.github/prompts/rova-person-{a,b,c}.prompt.md` | Copilot role prompts, same text as `CONTRIBUTING.md` | A role prompt in `CONTRIBUTING.md` changes |

Do not duplicate the full README into context files.

## Beginning a task

1. Inspect the requested area and current repository state.
2. For material work, read `PROJECT_CONTEXT.md` and `STATUS.md`.
3. Read relevant decisions if the task touches an established boundary.
4. Read only the README sections needed for the task.
5. For role-based work, read `CONTRIBUTING.md` and only the selected role's workstream guide.
6. Compare documentation claims with code and tests; do not assume planned work exists.

## During a task

- Keep scratch notes outside permanent context files.
- Add a decision only after it is accepted or necessarily established by implementation.
- If scope changes, update the plan before silently building a different product.
- Preserve user changes and call out conflicts instead of overwriting them.
- Respect workstream ownership and coordinate shared-file changes with the integration owner.
- Do not store secrets, tokens, personal data, or real student data.

## Ending material work

1. Verify the outcome in proportion to its risk.
2. Update `STATUS.md` with facts: what changed, what remains, blockers, next actions, and exact verification.
3. Update `PROJECT_CONTEXT.md` only if a stable fact changed.
4. Add or supersede a `DECISIONS.md` entry only for durable tradeoffs.
5. Update README instructions if user-visible behavior or setup changed.
6. Keep dates in `YYYY-MM-DD` format and avoid “today,” “soon,” or unverified percentages.

## Status-writing rules

- Distinguish `completed`, `in progress`, `blocked`, and `planned`.
- Never list a file's existence as proof that its behavior works.
- Record the command or manual flow that was actually verified.
- Keep the next-action list ordered and small enough to execute.
- Remove stale blockers and superseded next actions rather than accumulating history.

## Decision format

```markdown
## D-NNN — Short decision title

- Date: YYYY-MM-DD
- Status: proposed | accepted | superseded
- Decision: What was chosen
- Reason: Why this option fits the constraints
- Consequence: What becomes easier, harder, or out of scope
- Supersedes: D-NNN (only when applicable)
```

## Handoff checklist

- Working tree and relevant user changes understood
- Current milestone and owner stated
- Completed versus planned behavior separated
- Tests/build/manual verification recorded accurately
- Known failures and recovery paths documented
- Next action is concrete
- No sensitive data entered into context files
