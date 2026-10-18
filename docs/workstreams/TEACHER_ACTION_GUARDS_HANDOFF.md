# Teacher action guards handoff

- Date: 2026-10-17
- Branch: `fix/teacher-action-guards`, based on `origin/main` at `b50cef0`.

## Outcome

Done and Snooze accept only open alerts. For alerts waiting for re-check, both buttons are disabled with a "Waiting for re-check" tooltip, and D/S keyboard shortcuts are ignored. The rules also reject these actions on acted alerts, protecting against stale UI events and direct store calls: a repeated Done cannot send another Simulated Spanish parent activity, and Snooze cannot replace the seven-day re-check with a one-day reminder.

Different strategy keeps its existing behavior and remains available while waiting for re-check. Closed-alert behavior is unchanged.

## Contract impact

No types or function signatures changed. The rules guard is isolated in `lib/rules/engine.ts` (Person B); button and shortcut changes are in the teacher components (Person C).

## Verification

- `npm.cmd run test`: 151/151 pass, including two rules regressions and five button-state tests.
- `npm.cmd run lint`: passes.
- `npm.cmd run build`: passes, including TypeScript checks.
- No manual browser verification performed.

## Integration notes

Review the rules guard with Person B and teacher UI changes with Person C. The fix does not remove duplicate messages already in saved demo state; Reset demo clears that state. C9–C12 remain outside this fix. `STATUS.md` is reserved for the integration owner's update after merge.
