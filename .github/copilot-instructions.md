# Rova agent guidance

Rova is a three-person HackATL 2026 weekend project: a grade 4 math app with Student, Teacher, and Parent workspaces behind logins (D-009). Students practice six topics with hints and code-checked answers; the teacher sees the class's shared gap, assigns small-group plans, and writes notes to families; parents see progress and at-home activities. The current screens live in `components/product/` and `lib/product/`. The earlier closed-loop engine (`lib/rules/`, `lib/data/store.ts`, `lib/tutor/`) is tested but not connected; don't present it as working. Protect the demo in README §8.

Use the `maintaining-rova-context` skill for material planning, implementation, debugging, review, or handoff work. Read only the documentation relevant to the task:

- `PROJECT_CONTEXT.md` for stable project facts and boundaries
- `STATUS.md` for current progress, blockers, and next actions
- `DECISIONS.md` for accepted tradeoffs
- `README.md` for the full product, pitch, and build spec (section 17 is the build spec)
- `CONTRIBUTING.md` to choose Person A, B, or C and follow ownership rules
- `docs/INTEGRATION_CONTRACTS.md` for the shared types and function signatures between roles
- `docs/TEAM_WORKFLOW.md` for checkpoint integration
- the selected file under `docs/workstreams/` for role-specific work
- `docs/AI_WORKFLOW.md` when updating shared context

Do not claim planned features are implemented. Math answers are always checked by code, never by the LLM. Label anything simulated as Simulated. Never commit API keys or real student data.

When a contributor identifies as Person A, B, or C, remain within that workstream's owned areas unless a coordinated shared-contract change is required. The integration owner (Person B by default) consolidates `STATUS.md` after merges.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
