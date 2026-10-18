import { draftParentMessage } from "@/lib/messages/draftParentMessage";

export const recipeRatioActivity =
  "Al preparar una receta, comparen 1/2 taza con 2/4 de taza y pregunten: ‘¿Cómo sabes que representan la misma cantidad?’";

export const mayaActivityMessageFixture = draftParentMessage(
  "maya",
  recipeRatioActivity,
  "es",
  {
    kind: "activity",
    sentAt: "2026-10-17T19:00:00-04:00",
  },
);

export const mayaWeeklyMessageFixture = draftParentMessage(
  "maya",
  recipeRatioActivity,
  "es",
  {
    kind: "weekly",
    learned: "comparar fracciones simples",
    workingOn: "usar fracciones equivalentes en tablas de razones",
    sentAt: "2026-10-18T09:00:00-04:00",
  },
);

export const mayaWinMessageFixture = draftParentMessage(
  "maya",
  recipeRatioActivity,
  "es",
  {
    kind: "win",
    skill: "razones equivalentes",
    sentAt: "2026-10-24T19:00:00-04:00",
  },
);
