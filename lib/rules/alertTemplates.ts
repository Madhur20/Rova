// Teacher-alert and home-activity wording (D-004: templates through callLLM, no AI model).
// Owner: Person B for now; Person C may edit the wording. Keyed by root-cause skill.

import type { TemplateBank } from "@/lib/types";

export const alertTemplates: TemplateBank = {
  "alert.action.4.NF.A.1": [
    "Use fraction strips for a 5-minute refresher: match 1/2, 2/4, and 3/6, then connect the same scaling move to the ratio table.",
  ],
  "alert.action.6.RP.A.1": [
    "Read three ratios aloud in order (\"2 red for every 5 blue\") and have students say which number belongs to which quantity.",
  ],
  "alert.action.3.OA.C.7": [
    "Two minutes of multiplication-fact practice with arrays, then use those facts to scale one ratio-table row.",
  ],
  "alert.action.3.NF.A.3": [
    "Compare two fractions on a number line, then rename one so both have the same denominator.",
  ],
  "alert.action.none": [
    "Sit with {student} for 5 minutes and ask them to talk through one problem out loud.",
  ],
  "alert.action.safety_concern": [
    "Check in with {student} privately today, and follow your school's safety procedure if needed.",
  ],
  "alert.action.student_question": [
    "Answer {student}'s question at the start of the next class, or reply when you have a minute.",
  ],
  "alert.different_strategy": [
    "Try a different model: draw a double number line with the student and scale both rows by the same number.",
  ],
};

// 10-minute home activity for the parent message, by root-cause skill and home language.
export const homeActivities: Record<string, Record<string, string>> = {
  "4.NF.A.1": {
    es: "Al preparar una receta, comparen 1/2 taza con 2/4 de taza y pregunten: ‘¿Cómo sabes que representan la misma cantidad?’",
  },
};

// Spanish skill names for parent messages; other languages fall back to the skill map name.
export const skillNamesEs: Record<string, string> = {
  "6.RP.A.3": "razones con tablas",
  "6.RP.A.1": "entender razones",
  "4.NF.A.1": "fracciones equivalentes",
  "3.NF.A.3": "comparar fracciones",
  "3.OA.C.7": "tablas de multiplicar",
};
