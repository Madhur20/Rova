# Rova decisions

Accepted tradeoffs only. Format is in `docs/AI_WORKFLOW.md`. Entries marked `proposed` come from the README and become `accepted` at the contract freeze.

## D-001 — Web app, not a phone app

- Date: 2026-10-17
- Status: proposed
- Decision: A responsive web app with Student, Teacher, and Parent views at one URL.
- Reason: Schools use Chromebooks, which run websites, and parents open links from texts (README section 17).
- Consequence: No app store build. The Parent view must look right at phone width.

## D-002 — Code decides correctness and timing; the LLM only writes

- Date: 2026-10-17
- Status: proposed
- Decision: Math checks, detection rules, prerequisite tracing, and verification are deterministic code. The LLM writes hints, alert text, and parent messages.
- Reason: Consistent, explainable, and testable (README sections 6 and 17).
- Consequence: `check_answer` and the rules engine need real unit tests. Prompts are never trusted to grade math.

## D-003 — Three workstreams with one integration owner

- Date: 2026-10-17
- Status: proposed
- Decision: Person A = student tutor and agent, Person B = data, rules, and integration owner, Person C = teacher and parent views. Only the integration owner edits shared contracts and `STATUS.md`.
- Reason: Three people, each paired with an AI agent, can work in parallel without editing the same files.
- Consequence: Contract changes go through Person B. Everyone builds against fixtures until upstream work lands.

## D-004 — No AI model for now: a free-flowing app driven by rules in code

- Date: 2026-10-17
- Status: accepted (Person B, integration owner)
- Decision: The prototype calls no AI model. It is still a free-flowing app, not a fixed script: Maya can type anything or tap quick-reply buttons, solve problems in any order, and move freely between screens. A rule-based responder (`lib/tutor/responder.ts`) decides each reply from what she typed and her current state: numeric answers go through `check_answer` and get a reply for that exact mistake type; "just tell me" gets a refusal plus a guiding question; "stuck", "help", "idk" open the next hint; an explain-back is checked for key ideas; unsafe words flag the teacher; anything else gets "Great question for your teacher!". Replies come from a bank of pre-written templates (several variants each), filled with her name, buddy name, and interests. Alerts, the teacher views, and parent messages are built from the real events she produced, not canned screens. All text still goes through `callLLM` in `lib/llm.ts` (templates for now), so a real model can be swapped in later without changing callers.
- Reason: The app runs the same way every time, with no API key, cost, or network risk, but judges can still use it freely and it never hits a dead end.
- Consequence: Tutor replies are real but rule-based, so on screen and in the pitch they are labeled "rule-based (AI planned)", never called AI. Off-script inputs work only as well as the rules: anything unrecognized falls back to the teacher redirect. The 120-question AI test set in README section 17 is replaced by a responder test set (typed inputs → expected reply type) and the math-check tests. A "Reset demo" control restores the seeded state so the README section 8 demo path can be rerun any time.

## D-005 — Data: JSON seed files, live state in the browser

- Date: 2026-10-17
- Status: accepted (Person B, integration owner)
- Decision: Seed data (skill map, Maya, the simulated class) lives in JSON files committed to the repo. While the app runs, changes (events, skill states, alerts, parent messages) live in the browser's storage, starting from the seed. "Reset demo" clears them back to the seed. No database and no SQLite.
- Reason: No setup, and the demo is one student on one laptop. Vercel can't save changes to files in the repo while the app runs, so a server-side JSON file wouldn't keep its changes.
- Consequence: The Student, Teacher, and Parent views share state only within the same browser, so the demo runs all three views on one laptop (tabs or the home switcher). Data is lost if browser storage is cleared, which is fine for a prototype. A real database is needed before any multi-device use.

## D-006 — Hosting on Vercel

- Date: 2026-10-17
- Status: accepted (Person B, integration owner)
- Decision: Deploy the app to Vercel as one URL.
- Reason: Free tier, built for Next.js, and it deploys straight from GitHub.
- Consequence: Someone needs a Vercel account connected to the repo (still to decide who). Nothing in the app may depend on writing files at runtime (see D-005).

## D-007 — The demo's "group of 5" is shown on Maya's alert, not as a class-gap alert

- Date: 2026-10-17
- Status: accepted (Person B, integration owner)
- Decision: The class-gap rule keeps its README threshold (≥30% of a class shares a root cause). The demo's 5 students with the `4.NF.A.1` gap (20% of 25) appear as `others_with_gap` on Maya's alert ("4 others share this gap → small-group refresher"), not as a separate class-gap alert.
- Reason: Matches the README's example teacher card (section 5), and keeps the 30% rule for real class-wide problems.
- Consequence: In the demo seed the class-gap rule does not fire. `create_alert` must fill `others_with_gap` from students whose `4.NF.A.1` mastery shows the same gap. The teacher heatmap callout ("group of 5 share this root cause") reads from that list.

## D-008 — Person C owns the visual design system and leads the UI redesign

- Date: 2026-10-17
- Status: accepted (Person B, integration owner)
- Decision: Person C takes over `app/globals.css` (design tokens), `app/layout.tsx` (fonts), `app/page.tsx` (home), and `components/ui/` from the integration owner, and leads the redesign in `docs/workstreams/PERSON_C_UI_REDESIGN.md`. The student view's styling follows after Person A's in-flight PR, together with Person A.
- Reason: The prototype works end to end but looks like a generic template. One person owning the visual system keeps the three views consistent.
- Consequence: Person B still owns data, rules, the store, and `lib/types.ts`; the redesign must not change behavior and reads and acts only through `lib/data/store.ts`. `ResetDemoButton` must keep calling `resetDemo()`.

## D-009 — Keep the new app

- Date: 2026-10-17
- Status: accepted (team, via Person B)
- Decision: Keep the app pushed to `main` in commit 3439f5a ("new UI"): a grade 4 math product with Student, Teacher, and Parent workspaces behind logins, in `components/product/` and `lib/product/`. The README, `PROJECT_CONTEXT.md`, and `STATUS.md` describe it as the current app.
- Reason: It looks and feels like a real product, which the team preferred for the pitch.
- Consequence: The earlier closed loop (root cause, alerts, re-check, safety reports, reset) and the earlier views are no longer on screen; they stay in the repo, tested, until reconnected or removed. It conflicts with D-005 and D-006 (the app writes a JSON file at runtime, which Vercel can't do) and with the README's "no child accounts" privacy plan; both must be resolved before deploying. The D-008 redesign brief (C7–C15) targeted the earlier screens and no longer applies as written.

## D-010 — On track / behind schedule / stagnant, against a 70% target in a 3-week unit

- Date: 2026-10-18
- Status: accepted (Person B, with the team's go-ahead)
- Decision: Per topic: at or above 70% → on track; below but on pace to reach 70% by the unit's end → on track; rising at least 2 points a week but too slowly → behind schedule; otherwise → stagnant; fewer than 5 answers without history → not enough data. A learner's overall status is their most urgent topic. The unit started a week before today and runs three weeks. The seeded class gets a labeled, deterministic simulated history so trends exist before live practice (`lib/product/progress.ts`).
- Reason: Teachers asked for a status they can trust and check; every label shows the numbers that produced it.
- Consequence: Before today, trends for sample learners are simulated and shown as hollow points. The target and unit length are constants, not yet teacher settings.

## D-011 — "Why" insights are rule-based, not AI-written

- Date: 2026-10-18
- Status: accepted (Person B)
- Decision: The reasons behind a status come from code over saved evidence (root-cause traces, a common-mistake catalog for every question, hint reliance, answer requests, trends, and skill-map links), each tagged with its source (`lib/product/why.ts`, `lib/product/mistakes.ts`).
- Reason: Reliable, explainable, free, and consistent with D-004; no claim is made that evidence doesn't support.
- Consequence: Insights are only as deep as the mistake catalog and the skill map; a model could later reword the same facts.

## D-012 — The parent view answers five questions on one page

- Date: 2026-10-18
- Status: accepted (Person B)
- Decision: Parents get *This week* (how my child is doing, why, what school is doing, wins, tonight's activity, messages) and *Progress* (charts only), replacing four overlapping tabs. Wins use live practice only. Safety concerns are not shown to families.
- Reason: The old tabs repeated each other; parents need a clear status and one action.
- Consequence: Links to the old parent tabs fall back to *This week*.
