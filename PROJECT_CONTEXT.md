# Rova project context

Stable facts and boundaries. Change this file only when a durable fact changes. Full detail lives in `README.md` (§8 demo, §17 build spec).

## Product in one line

AI made answers instant, not learning. Rova helps a 4th grader think through math with conversational hints and code-checked answers, lets teachers follow learning and assign support, and keeps families connected.

## The app today (D-009)

- **Grade 4 math, six foundations:** place value, multiplication, division, fractions, measurement, shapes & angles; 18 practice questions (`lib/product/curriculum.ts`).
- **Three workspaces behind logins:** Student (`/student`), Teacher (`/teacher`), Parent (`/parent`), plus home (`/`), `/login`, and `/signup`. Sample accounts are in `lib/product/mock-accounts.json`; sign-up needs class code `MAPLE4` (student) or family code `MAYA4` (parent).
- **Student:** a scripted conversational coach with staged hints, visual models, answer-request redirects, standard references, code grading, and safety flags for teacher review. A tall message thread preserves all history. Teacher assignments resume saved sessions and complete after every question the teacher chose is solved (three by default). Strengths and next learning opportunities appear on the dashboard.
- **Teacher:** four tiles at the top (need you today, on track, behind schedule, stagnant; the status tiles open My classroom filtered to that status), on track / behind schedule / stagnant statuses against a 70% target in a 3-week unit (D-010) with rule-based why facts (D-011), status learner cards, a student panel (confidence chart, answer timeline, before/after for group lessons), a filterable progress report with a paged intervention log, shared lessons with per-learner completion, lesson reviews, and notes to families. A **Question bank** page (`#bank`, `lib/product/bank.ts`) lists each topic’s built-in questions, lets the teacher add course handbooks/books/curriculum materials (optionally with a PDF, Word, or text file, stored under the data directory and served to the teacher only by `/api/materials/[id]`), accept rule-written suggestions referenced to those materials, or write their own questions (numeric answer, hints that may not state the answer). When sharing a lesson the teacher sees the exact questions, picks a random count (default 3, up to 10), or chooses them by hand; the coach walks the chosen set and grades every answer with `lib/math/checkAnswer.ts`.
- **Ratios root-cause loop:** a grade 6 ratios stretch challenge (6.RP.A.3) outside the six foundations. Two checked misses on one question trace the gap to equivalent fractions (4.NF.A.1) in code (`lib/product/rootCause.ts`); the student takes a three-question refresher and returns to the original question. Teachers see a learning alert with evidence, a reteach, and classmates with the same low signal; families get automatic in-app updates (no SMS). The 7-day re-check is not built.
- **Progress report:** a teacher `#report` page for principals and MTSS meetings, with counts from code-checked evidence, support tiers, and an intervention log (print and CSV).
- **Parent:** *This week* (status in plain words, why, what school is doing, wins from live practice, tonight's activity, messages) and *Progress* charts (D-012). Parent accounts do not receive coaching transcripts or safety concerns.
- **No AI model is called (D-004).** Suggested questions are number templates per topic, not model output. The coach is rule-based. Answers are checked by code (`lib/math/checkAnswer.ts`).
- **Sample pictures:** the three sample accounts (Maya, Ms. Rivera, Alex) show illustrated pictures from `public/avatars/` (drawn for this project, not real people); other accounts show initials on their chosen color.
- **Simulated:** the 18-student sample class and starting scores, including James Walker's across-topic support needs, and Maya's seeded last seven days of practice. Names are fictional. The classroom outcomes graph excludes seeded attempts.
- **Navigation:** role-specific URL fragments preserve the selected section through refresh and browser history.

## Architecture (as built)

- Next.js 16 (App Router) + React 19, Tailwind 4 and hand-written stylesheets (`app/product.css`, `app/coaching.css`).
- **Screens:** `components/product/` (`WorkspaceApp` routes each role to its dashboard).
- **Accounts:** scrypt-hashed passwords, HMAC-signed session cookie (7 days), same-origin checks on writes, per-role data visibility (`lib/product/server.ts`).
- **Data:** one JSON file at `.rova/workspace.json` (or `ROVA_DATA_DIR`), created on first run from the sample accounts and class. Writes go through a queue and an atomic rename. A new data directory starts a fresh rehearsal without removing existing work.
- **APIs:** `app/api/account` (login, sign-up, profile, logout), `app/api/learning` (coaching sessions/turns and root-cause refreshers, checked attempts, plans, notes, alert acknowledgement, parent checklist). The server owns grading, hint progression, session access, and assignment completion. Coaching turn IDs prevent duplicate attempts on retry.
- **Coaching:** `lib/product/coaching.ts` supplies deterministic replies and transitions; `lib/product/insights.ts` derives summaries and activity progression from saved evidence. No external model or key is required.

## Built but not connected to the current screens

`lib/rules/` (root-cause trace, automatic alerts, delayed re-check, legacy safety reports), `lib/data/store.ts` (browser store, reset signal), `lib/tutor/` (earlier rule-based tutor), and the earlier views in `components/{student,teacher,parent,ui}/`. These remain tested but are not used by the current routes. The new coach has its own transcript safety flags; do not confuse them with the legacy alert lifecycle. Lesson completion is not the original verified fix. The new ratios trace (`lib/product/rootCause.ts`) is a separate, simpler implementation for the new product; it does not use `lib/rules/`.

## Known conflicts to resolve

- **Storage vs. hosting:** the app writes a file on every request, including login. That works locally but not on Vercel (D-005, D-006).
- **Accounts vs. privacy plan:** students have password accounts; the README's privacy plan says no child accounts.
- **Grade:** the app is grade 4; parts of the README's business and pilot plan still assume middle school.

## Commands

Use Node 24, or a compatible modern Node version. Node 18 cannot run the current tooling.

```bash
npm install      # once
npm run dev      # http://localhost:3000
npm run test     # vitest
npm run lint
npm run build
```

Next.js 16 differs from older versions; its docs ship in `node_modules/next/dist/docs/`.

## Invariants

1. Math correctness is decided by code only.
2. Hints guide; direct answer requests are redirected. Worked hints require an attempt; explanations follow a correct answer.
3. Students and parents see only their own data. Parents receive progress and notes, not transcripts.
4. No real student data and no real secrets in the repo. The demo password in `mock-accounts.json` is for sample accounts only.
5. Label simulated data and scripted capabilities; don't present planned features as working.

## Roles and handoff

See `CONTRIBUTING.md`. Ownership of `components/product/` and `lib/product/` is not assigned yet (see `STATUS.md`). The current coaching work was explicitly requested by Person C's contributor across the new product areas. Details: `docs/workstreams/PERSON_C_CONVERSATIONAL_COACH_HANDOFF.md`; presentation: `docs/DEMO_SCRIPT.md`. Person B consolidates `STATUS.md` after merge.
