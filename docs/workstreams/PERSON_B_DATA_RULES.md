# Person B — Data, rules, and integration (owner)

**Mission:** The memory and the "brain" between the student and the adults: what Rova knows about Maya, when a struggle becomes an alert, where it started, and whether the fix worked (README section 6, steps 2, 3, 4, and 6). Also keeps `main` working and deployed.

**Branch:** `feat/data-rules`
**Owns:** `lib/data/`, `lib/rules/`, `fixtures/`, `app/api/events/`, `app/api/alerts/`. As integration owner also: `lib/types.ts`, `lib/llm.ts`, `app/layout.tsx`, `app/page.tsx`, `components/ui/`, package and config files, `STATUS.md`
**Produces:** `get_learner_profile`, `log_event`, `trace_prerequisites`, `create_alert`, `apply_teacher_action`, `schedule_recheck`, `run_recheck`, `callLLM`

## Tasks

- [x] B0 — Contract freeze. Initialize Next.js + Tailwind without deleting the docs. Add `lib/types.ts` from `docs/INTEGRATION_CONTRACTS.md`, `lib/llm.ts` in template mode (D-004: `callLLM(templateId, vars)` fills a pre-written template variant, no AI model), and a view switcher (Student / Teacher / Parent) on `app/page.tsx`. Push to `main` quickly so A and C can branch
- [x] B1 — Seed data (D-005) in `lib/data/seed/*.json`, typed through `lib/data/seed.ts`: skill map (README section 17), Ms. Rivera's class of 25 incl. Maya (Simulated), exactly 5 sharing the `4.NF.A.1` gap (Maya, s04, s12, s15, s24), plus a separate `3.OA.C.7` gap (s14, s18). Classmates have generic labels ("Student 2"…"Student 25"), no person names. Regenerate with `scripts/gen_class_seed.py`. Interests still empty
- [x] B2 — Store (D-005): `lib/data/store.ts` loads the JSON seeds and keeps students, skill states, events, alerts, and parent messages in browser storage, synced across tabs, with `resetDemo()`. Hook: `useRovaState()`
- [x] B3 — `lib/rules/trace.ts`: `trace_prerequisites` (nearest first), `find_root_cause` (the earliest-grade weak prerequisite, i.e. where the gap started), `students_with_gap`
- [x] B4 — `lib/rules/detect.ts`: stuck, answer-seeking, repeated misconception, class gap (drop and disengagement cut). Answer-seeking counts level-3 hints reached within 20 s, since events carry no problem id
- [x] B5 — `log_event` → rules → `create_alert`, with root cause and `others_with_gap` filled in (D-007: the demo's 4 classmates come from this list, not from a class-gap alert). Alert text comes from `lib/rules/alertTemplates.ts` through `callLLM` (Person C may edit the wording); evidence is plain English built from the events; the rules decide when
- [x] B6 — Alert lifecycle: `apply_teacher_action`, `schedule_recheck`, `run_recheck(nowOverride)` for the simulated 7-day jump. Done / Different strategy → parent activity message; verified → parent win message (both through C's `draftParentMessage`). Mastery for the re-check: ≥2 correct root-cause refresher answers after the alert and the latest attempt on the skill correct; otherwise escalated
- [x] B7 — Profile update after a session (mastery, misconceptions, last_seen)
- [x] B8 — "Reset demo" control that restores the seeded state, so the README section 8 demo path can be rerun any time (`components/ui/ResetDemoButton.tsx`, in every page header)
- [ ] B9 — Deploy to one URL. Keep `STATUS.md` current after each merge
