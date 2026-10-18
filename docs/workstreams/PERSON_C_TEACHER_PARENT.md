# Person C — Teacher and parent views

**Mission:** The adult side of the demo (README section 8, steps 5–7). Ms. Rivera sees who is stuck and why, and acts on it. Maya's parent gets a Spanish text with a 10-minute activity. The loop tracker shows the issue verified as fixed.

**Branch:** `feat/adult-views`
**Owns:** `app/teacher/`, `app/parent/`, `components/teacher/`, `components/parent/`, `lib/messages/`
**Consumes:** `Alert`, `SkillState`, `ParentMessage`, `apply_teacher_action`, `run_recheck` (Person B), `callLLM` (integration owner)
**Produces:** `draft_parent_message`, all teacher and parent screens

## Tasks

- [x] C0 — Fixtures-first: render a hard-coded Maya `Alert` and a Spanish `ParentMessage` so the views work before B's rules land. Then switch to live data, so whatever Maya actually did shows up here (wired by B: `TeacherLiveView`, `ParentLiveView`)
- [x] C1 — Action inbox: alert cards (student · skill · evidence · root cause · suggested reteach · "4 others share this gap") with Done / Snooze / Different strategy, which call `apply_teacher_action` (wired by B via `onAction` on `TeacherAlertCard`)
- [x] C2 — Class heatmap: students × skills, with the "group of 5 share this root cause" callout, read from the alert's `others_with_gap` (D-007). Labeled Simulated
- [x] C3 — Loop tracker: open → acted → verified, average days to fix, a "fast-forward 7 days" button that calls `run_recheck(nowOverride)`, then "Mastered ✅, parent notified" (wired by B: fast-forward runs `recheck` at the alert's `recheck_at`)
- [x] C4 — `lib/messages/draftParentMessage.ts`: Spanish templates (D-004) for activity, win, and weekly messages, filled from the real alert (skill, root cause, activity) through `callLLM`. Include the recipe-ratio activity. Delivery is labeled Simulated
- [x] C5 — Parent view at phone width: SMS mock-up (labeled Simulated), weekly card (learned · working on · try at home), win message
- [ ] C6 — Review queue: held-back answers and "this seems wrong" flags (cut first if short on time)

## UI redesign (D-008)

Next: the redesign in [`PERSON_C_UI_REDESIGN.md`](PERSON_C_UI_REDESIGN.md), tasks C7–C15. Person C now also owns the design tokens, fonts, home page, and `components/ui/`.

## Rules

- Never change alert status directly. Always go through B's functions.
- Everything simulated gets a visible Simulated label.
- Alert wording lives in `lib/rules/alertTemplates.ts` (B's rules fill and trigger it); C may edit the wording there.
