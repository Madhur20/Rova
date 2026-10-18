# Person C — UI redesign brief

**Owner:** Person C (Madhur). **Decision:** D-008 (Person C owns the visual design system).
**Goal:** Rova should look like a product a school would pay for, not a generated template. The teacher view matters most: it's where judges see the "why not ChatGPT" answer.

**Start your agent with:**

```text
Use maintaining-rova-context. I am Person C — Teacher and Parent Views, working on the UI redesign. Read PROJECT_CONTEXT.md, STATUS.md, CONTRIBUTING.md, docs/INTEGRATION_CONTRACTS.md, and docs/workstreams/PERSON_C_UI_REDESIGN.md. Implement the next unchecked task (C7 first) only within Person C's owned files. Follow the design direction and the "Avoid" list exactly. Keep the demo behavior unchanged and read and act only through lib/data/store.ts. Verify with tests, lint, build, and before/after screenshots, and give me a PR-ready handoff.
```

## What's wrong today (observed 2026-10-17)

- **Everything has the same weight.** Every section is a rounded white card with a tiny uppercase label, so the eye has nowhere to land.
- **The teacher page is one long scroll.** One big alert card, then the loop tracker, then the heatmap. With 3 alerts the heatmap is far below the fold, and the alert and its loop sit far apart.
- **The heatmap is a wall of percentage pills.** 125 bold colored numbers, all equally loud. The interesting pattern (5 students with the same gap) doesn't jump out of the grid itself.
- **Little to do.** The only interactions are three buttons and a fast-forward. Nothing responds to hover or selection, and there's no sense of "live".
- **The home page is three plain boxes.** It doesn't explain the product or guide a judge through the demo.
- **Badge overload.** NEEDS ACTION, LIVE, SIMULATED CLASS DATA, SIMULATED CLASS, Small-group opportunity · SIMULATED all compete.

## Design direction: "the teacher's desk at 7:30 a.m."

Calm, dense, confident. A tool for someone with 120 students and five minutes.

- **Paper and ink, one accent.** Warm off-white background (not pure white), deep ink-navy text, and **one** accent color used only for "act on this" (pick one: marigold, or a deep teal). Red only for safety concerns. Green only for "verified".
- **Real typography.** A characterful display face for headings and the student's name (e.g. Fraunces or Instrument Serif via `next/font/google`), a sturdy sans for UI (e.g. IBM Plex Sans or Public Sans, not Inter or Geist), and tabular numerals for all numbers. The type should carry the hierarchy, not boxes.
- **Fewer containers.** Use whitespace, rules (1px lines), and alignment instead of a card around everything. At most one elevated surface per screen: the thing you're acting on.
- **Labels in sentence case.** Drop most uppercase micro-labels. One "Simulated" marker per area, small and consistent, not a badge on every element.

### Avoid (these read as AI-generated)

Purple-to-blue gradients, glassmorphism and blur, emoji as icons, sparkle icons, gradient text, every section in a rounded-2xl card with shadow, uppercase tracking-wide labels everywhere, generic hero blobs, random stock illustration, filler copy. If a style is there only because it "looks modern", remove it.

## Teacher view (priority 1)

Make it a two-pane workspace at laptop width (≥1024px); stack the panes on tablets.

1. **Inbox rail (left, ~340px).** Compact rows: student name, what happened in 6–8 words, time. Open safety concerns are pinned at the top in calm red. Selected row is highlighted. Closed items collapse into a "Done today (n)" group at the bottom. Keyboard: `j`/`k` move, `d` Done, `s` Snooze; show the shortcuts subtly.
2. **Detail pane (right).** For the selected alert:
   - The student's name large, the skill, and a one-line summary.
   - **Evidence timeline built from real events:** the student's events on the alert's skill, plus their refresher events on the root-cause skill, in order. For example: `9 ✕ added across` → `9 ✕ added across` → `alert` → `refresher ✓ ✓ ✓` → `12 ✓` → `explained`. This is the strongest visual proof that Rova found *why*. Build it as a pure helper with tests.
   - **Root cause as a short trail** through the skill map: Ratio tables (6th) → Equivalent fractions (4th grade), so the "went back two grades" story is visible.
   - **The group:** "4 classmates share this gap" with name chips (from `others_with_gap`) and a **Copy group plan** button (copies "Small group: Maya, Student 4, … · 5-min fraction strips" to the clipboard, with a quiet "Copied" confirmation).
   - **Actions:** Done / Snooze / Different strategy as a clear primary/secondary group.
   - **Loop:** an inline 3-step stepper (Detected → Acted → Verified) inside this pane, with "Simulate 7 days later" as a deliberate secondary control marked Simulated. Animate the step change (CSS, respect `prefers-reduced-motion`).
   - Safety concerns and questions: what the student wrote, the suggested next step, Done. No root cause, timeline, or group.
3. **Class map (below the panes, or a tab next to the inbox).**
   - Small square cells colored by mastery band, number shown on hover/focus (tooltip), not printed in every cell. Keep a text alternative (each cell has an accessible label; never color alone).
   - Rows: Maya first, then the alert's group, then everyone else. A "Show only this group" toggle.
   - Click a column header to sort by that skill. Click a row to open a side drawer with that student's five skill bars and their recent events (if any).
   - When an alert is selected, outline its group's rows and its root-cause column.
4. **Live feel.** When an alert arrives from the student tab (the store syncs tabs), the new row slides in and the page title shows the count, e.g. `(1) Rova · Teacher`. No polling: `useRovaState()` already re-renders.
5. **Empty state** that teaches: "No alerts yet. Open the Student view in another tab and make the same mistake twice", with a link.

## Parent view (priority 2)

- A believable phone screen (390px): status bar, contact header "Rova · Clase de Ms. Rivera", and a **message thread**: the activity text, then (after verification) the win message as the next message in the same thread, with timestamps.
- Tapping the activity reveals the 3 steps as a small checklist the parent can tick (local UI state only).
- Keep "Simulated · SMS no enviado" as one small line under the thread.
- The weekly card becomes a quiet section below the phone, not a gradient card.

## Home page (priority 2)

- One sentence on what Rova does, then the **loop as an interactive strip**: Learn → Detect → Diagnose → Alert → Act → Verify. Hovering or focusing a step shows one line on what happens there and which view shows it.
- **Run the demo** guide: a short numbered path (1 Student: make the same mistake twice → 2 Teacher: open Maya's alert, Done → 3 Simulate 7 days → 4 Parent: see the win), each step a link, with a check mark once the store shows it happened (e.g. step 1 is checked when an alert exists). Read-only use of `useRovaState()`.
- The three entry points (Student, Teacher, Parent) as clear doors, plus Reset demo.

## Student view (priority 3, after Person A's current PR merges)

The student page belongs to Person A, and Person A is changing it right now. Don't edit `components/student/` until Person A's PR is merged. Then apply the shared tokens and type to it together with Person A, keeping all behavior the same.

## Technical rules

- **Tokens first.** Define colors, type, radii, and spacing as Tailwind v4 theme variables in `app/globals.css` (`@theme`). Components use the tokens, not one-off hex values.
- **Fonts** via `next/font/google` in `app/layout.tsx`.
- **Icons:** `lucide-react` is fine (pin an exact version that's at least two weeks old). No other UI libraries; animation with CSS transitions.
- **Data:** read through `useRovaState()` and act through the store (`teacherAction`, `recheck`, `resetDemo`). Don't change `lib/types.ts`, `lib/rules/`, or `lib/data/`; if you need data the store doesn't give you, ask Person B.
- **Pure helpers with tests** for anything with logic: the evidence timeline, heatmap row ordering and sorting, the "Run the demo" step detection, keyboard shortcut mapping.
- **Accessibility:** everything works by keyboard with visible focus; contrast meets WCAG AA; no information by color alone; respect `prefers-reduced-motion`.
- **Responsive:** teacher at 1280 and 768 wide; parent at 390; nothing scrolls sideways except the class map.
- **Keep the demo working.** The README section 8 demo path and Reset demo must behave exactly as they do today.

## Tasks

- [x] C7 — Design tokens and fonts (`app/globals.css`, `app/layout.tsx`), restyled `components/ui/ViewShell` header
- [x] C8 — Teacher two-pane workspace: inbox rail with keyboard shortcuts, detail pane, inline loop stepper
- [ ] C9 — Evidence timeline and root-cause trail (pure helpers + tests)
- [ ] C10 — Group chips + Copy group plan
- [ ] C11 — Class map: compact cells, tooltips, sorting, group-first ordering, "only this group", student drawer
- [ ] C12 — Live feel: slide-in for new alerts, count in the page title, teaching empty state
- [ ] C13 — Parent phone thread with the activity checklist
- [ ] C14 — Home page: interactive loop strip and "Run the demo" guide
- [ ] C15 — Student view styling with Person A (after Person A's PR merges)

Ship in small PRs: C7 first (everyone builds on the tokens), then C8–C10, then C11–C12, then C13–C14.

## Done means

- Before/after screenshots of each changed view in the PR (laptop width, plus 390px for parent).
- `npm run test`, `npm run lint`, and `npm run build` pass.
- The full demo runs from Reset demo: Student → Teacher → Parent, with no change in behavior.
- Keyboard-only run of the teacher flow works (select alert, Done, simulate, open a student).
