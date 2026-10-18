# Rova status

The integration owner consolidates this file after merges. During feature work, put progress in your PR or role handoff, not here.

## Role assignment

| Role | Person | GitHub | Branch |
| --- | --- | --- | --- |
| Person A — Student tutor and agent | Suvrat | suvrat23 | `feat/student-tutor` |
| Person B — Data, rules, and integration (owner) | Mohammad | moalavicodes | `feat/data-rules` |
| Person C — Teacher and parent views | Madhur | Madhur20 | `feat/adult-views` |

## Current state

- **Current app (D-009):** the grade 4 app in `components/product/` and `lib/product/`, with conversational coaching, the ratio root-cause loop, assigned lessons, and lesson reviews (PR #15).
- **PR #16 (branch `feat/teacher-insights-pr16`):**
  - Teacher overview with four intentional numbers (need you today, class momentum, reteach next, is it working), topics-by-status chart, status learner cards, and a student panel with a confidence chart, rule-based why facts, an answer timeline, and before/after for group lessons.
  - On track / behind / stagnant rule (D-010) and rule-based why insights (D-011), with a common-mistake catalog for all 21 questions now also used by the coach.
  - Progress report rebuilt: shared filters, momentum and topic charts, sortable learner table with trend lines, *Is it working?*, intervention log with filters and 5-per-page paging (export and print use all filtered rows).
  - Parent view: *This week* + *Progress* (D-012).
  - Hands-on visuals for every topic (pie charts for fractions and more); fixed a place-value picture that showed an answer.
  - Pictures for all 17 simulated classmates; slogans and repeated text removed across views.
- **Polish round 2 (branch `feat/polish-round-2`):** numbers on every bar segment, overview tiles jump to the learners table, sparklines removed from cards, scripted/demo wording removed from the UI, parent sparkle/wins/activity takeaways, subject and class selectors, kid-friendly explanations with pictures in the chat, interactive pie/grid/angle models, denser home page with a sticky header, and a teacher **Question bank** (course materials, suggested and teacher-written questions) with lesson question selection (random count, default 3, or hand-picked).
- **Blocked:** deploying to Vercel (the app writes a JSON file at runtime).

## Open questions

1. Who owns `components/product/` and `lib/product/` (the current screens)?
2. Grade 4 or 6th-grade ratios? The README's market and pilot sections still assume middle school.
3. Bring back the closed loop (root cause → alert → re-check → parent win) inside the new screens, or remove the old code?
4. Storage for Vercel: browser storage, a hosted database, or demo on a laptop only?
5. Student accounts: keep passwords, or switch to teacher-issued class codes (README privacy plan)?
6. Who owns the Vercel account, and who runs the demo and answers Q&A?

## Next actions

1. Team: answer open questions 1–4.
2. Add a Reset demo control to the new app (today: stop the server and delete `.rova/`).
3. Add tests for `lib/product/` (scoring, grading, per-role visibility) and the two API routes.
4. Fix storage, then deploy to Vercel.
5. Demo acceptance check from README §8: 3 full runs, then 5 minutes of free use.

## Verification

- 2026-10-18 on `feat/teacher-insights-pr16`: 244/244 tests, tsc and lint clean, production build succeeds. Chrome: teacher overview, classroom cards, student panel (James, Maya), report filters from the top numbers and chart segments, log pager, parent This week, student pie chart; live ratio run → Maya first in Need you today with a live root-cause fact and an answer timeline.

- 2026-10-17 `main` at 3439f5a: 151/151 tests (old code), lint clean. Chrome: student login → fractions practice (wrong answers get "Not quite yet", hints work) → teacher sees "A shared gap in fractions" and class table.

- 2026-10-17 `main` after PR #8 (0176df5): 141/141 tests, build succeeds.

- 2026-10-17 PR #8 second review fix: 141/141 tests (new: legacy resolved alert doesn't re-alert on one new mistake but does on two; open alerts untouched; store applies the migration on load), tsc, lint, and build clean.

- 2026-10-17 PR #8 review fixes: 138/138 tests (new: in-cycle mistake + one post-resolution mistake doesn't re-alert; simulated far-future re-check doesn't hide later mistakes; legacy saved state still triggers a cross-tab reset; same-tab reset and unsubscribe), tsc, lint, and build clean.

- 2026-10-17 `feat/teacher-reports` with `main` (PR #7) merged in: 134/134 tests (4 new: misconceptions cleared on verify, no re-alert on one new mistake, re-alert on two, session seed), tsc, lint, and build clean.

- 2026-10-17 on `feat/teacher-reports`: 130/130 tests (4 new report tests), tsc, lint, and build clean. Chrome: a safety concern, a question, and Maya's learning alert in the inbox; safety listed first without root cause; Done → Closed, count dropped, no parent message, loop tracker still followed the learning alert.

- 2026-10-17 `main` after PR #4 (2cdbf0d): `npm run test` 126/126 pass, `tsc --noEmit`, lint, and build clean. Before merge, the student path was checked in Chrome on PR #4 combined with PR #5: refusal → two `9`s → refresher → `12` → explain-it-back → Win.

- 2026-10-17 on `feat/data-rules`: `npm run test` 46/46 pass (new: trace, detection rules, and engine tests covering the full loop: alert → Done → Spanish parent activity → re-check → verified + win; and escalation when the re-check comes too early). `tsc --noEmit`, `npm run lint`, and `npm run build` are clean.
- 2026-10-17 browser check (production build, Chrome): with Maya's session loaded into browser storage, the Teacher view showed the live alert (root cause Equivalent fractions, 5 students share); Done → "Waiting for re-check"; fast-forward → "Mastered ✓ · parent notified"; the Parent view showed the Spanish activity and win messages; Reset demo cleared alerts, events, and messages. Not yet checked from the real Student view (needs PR #4 plus the student wiring).
- 2026-10-17 `main` after PR #3: 24/24 tests pass, build succeeds.

- 2026-10-17 (B0, now on `main`): `npm run test` 5/5 pass (`lib/llm.test.ts`), `npm run lint` clean, `npm run build` succeeds. `npm run dev`: `/`, `/student`, `/teacher`, `/parent` return 200; unknown path returns 404.
- `npm audit`: 5 high-severity advisories, all in the lint toolchain (`braces` via `eslint-config-next`), not in the app itself. The suggested fix downgrades Next's lint config, so it's left as is.
