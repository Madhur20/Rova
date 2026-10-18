---
name: maintaining-rova-context
description: Maintain shared Rova project context while planning, implementing, debugging, reviewing, or handing off work. Use when a task may change project status, architecture, accepted decisions, shared contracts, risks, or next actions.
---

# Maintaining Rova Context

Three teammates each work with their own AI agent. The agents coordinate only through files in this repository, so keep those files accurate without turning every task into a documentation exercise.

## Start work

1. Read the user's request and inspect the files it affects.
2. Read `PROJECT_CONTEXT.md` and `STATUS.md` for any task that changes behavior, architecture, dependencies, milestones, or handoff state.
3. Read `docs/INTEGRATION_CONTRACTS.md` (or `lib/types.ts` once it exists) before touching anything that crosses a role boundary.
4. Read `DECISIONS.md` when the task touches an existing tradeoff or needs a new durable choice.
5. Read only the relevant parts of `README.md`. Section 17 is the build spec; don't load the whole pitch for a narrow edit.
6. When working as Person A, B, or C, read `CONTRIBUTING.md` and only the selected guide under `docs/workstreams/`.
7. Follow `docs/AI_WORKFLOW.md` when recording or handing off material work.

The repository is the source of truth. If documentation conflicts with verified code or tests, surface the conflict and fix the stale document when it's in scope.

## While working

- Keep to the weekend MVP in `PROJECT_CONTEXT.md` unless the user explicitly changes scope.
- Math correctness is decided by code only; the LLM only writes text.
- Record accepted decisions, not speculative options.
- Respect role ownership. Changes to shared contracts or shared files go to the integration owner as a proposal.
- Don't mark work complete until the relevant verification has actually passed.
- Never put API keys, credentials, or real student data in the repo.

## Finish material work

Update only the files affected by the outcome:

- PR description or role handoff: what changed, verification, and integration notes for the other roles (this is how you tell the other agents).
- `STATUS.md`: integration owner only, after merge.
- `PROJECT_CONTEXT.md`: stable scope, architecture, commands, or constraints that changed.
- `DECISIONS.md`: a new or superseded durable decision with reason and consequences.
- `docs/INTEGRATION_CONTRACTS.md`: integration owner only, after agreement.
- Role workstream guide: tick finished tasks; change it only when its responsibility or contract changes.

A typo, formatting-only edit, exploratory read, or failed experiment usually needs no context update.
