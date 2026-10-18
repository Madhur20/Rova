import type { Alert } from "@/lib/types";

export const mayaAlertFixture = {
  id: "alert-maya-equivalent-fractions",
  student_id: "maya",
  skill_id: "6.RP.A.3",
  signal: "repeated_misconception",
  evidence:
    "Maya added across the ratio table twice instead of scaling both quantities by the same factor.",
  root_cause: "4.NF.A.1",
  action:
    "Use fraction strips for a 5-minute refresher: match 1/2, 2/4, and 3/6, then connect the same scaling move to the ratio table.",
  others_with_gap: ["s04", "s12", "s15", "s24"],
  status: "open",
  recheck_at: null,
} satisfies Alert;
