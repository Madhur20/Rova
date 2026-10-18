"use client";

// Parent view on live data (integration owner wiring, at Person C's request): the activity text
// arrives when the teacher acts on Maya's alert, and the win message when the re-check passes.
// The weekly card stays a Simulated fixture.

import { ParentSmsMockup } from "@/components/parent/ParentSmsMockup";
import { ParentWinMessage } from "@/components/parent/ParentWinMessage";
import { WeeklyLearningCard } from "@/components/parent/WeeklyLearningCard";
import {
  mayaWeeklyMessageFixture,
  recipeRatioActivity,
} from "@/components/parent/mayaActivityMessageFixture";
import { useRovaState } from "@/lib/data/store";

export function ParentLiveView({ studentId }: { studentId: string }) {
  const state = useRovaState();
  const mine = state.parentMessages.filter((m) => m.student_id === studentId);
  const activity = mine.filter((m) => m.kind === "activity").at(-1);
  const win = mine.filter((m) => m.kind === "win").at(-1);

  return (
    <>
      {activity ? (
        <ParentSmsMockup message={activity} />
      ) : (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-6 text-slate-600">
          <p className="font-semibold text-slate-900">Todavía no hay mensajes.</p>
          <p className="mt-1 text-sm">
            Recibirá una actividad para hacer en casa cuando la maestra actúe sobre una alerta.
          </p>
        </div>
      )}

      <WeeklyLearningCard
        message={mayaWeeklyMessageFixture}
        learned="Comparar fracciones simples"
        workingOn="Usar fracciones equivalentes en tablas de razones"
        tryAtHome={recipeRatioActivity}
      />

      {win && <ParentWinMessage message={win} />}
    </>
  );
}
