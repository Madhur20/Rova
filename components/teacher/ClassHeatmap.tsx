import type { Alert, Classroom, SkillMap, SkillState, Student } from "@/lib/types";

interface ClassHeatmapProps {
  alert: Alert | null; // null until a live alert exists
  classroom: Classroom;
  students: Student[];
  skillMap: SkillMap;
  skillStates: SkillState[];
}

function masteryStyle(mastery: number): string {
  if (mastery >= 0.8) return "bg-emerald-500 text-emerald-950";
  if (mastery >= 0.6) return "bg-amber-300 text-amber-950";
  return "bg-rose-400 text-rose-950";
}

function masteryLabel(mastery: number): string {
  if (mastery >= 0.8) return "Strong";
  if (mastery >= 0.6) return "Developing";
  return "Needs support";
}

export function alertGroupStudentIds(alert: Alert): string[] {
  return Array.from(new Set([alert.student_id, ...alert.others_with_gap]));
}

export function ClassHeatmap({
  alert,
  classroom,
  students,
  skillMap,
  skillStates,
}: ClassHeatmapProps) {
  const skills = Object.entries(skillMap).map(([id, skill]) => ({ id, ...skill }));
  const classroomStudents = classroom.student_ids
    .map((studentId) => students.find((student) => student.id === studentId))
    .filter((student): student is Student => Boolean(student));
  const groupStudents = (alert ? alertGroupStudentIds(alert) : [])
    .map((studentId) => students.find((student) => student.id === studentId))
    .filter((student): student is Student => Boolean(student));
  const rootCauseName = alert?.root_cause
    ? (skillMap[alert.root_cause]?.name ?? alert.root_cause)
    : "Root cause pending";

  return (
    <section aria-labelledby="class-heatmap-heading" className="mt-10">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 id="class-heatmap-heading" className="text-2xl font-bold">
              Class heatmap
            </h2>
            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-amber-900">
              Simulated class
            </span>
          </div>
          <p className="mt-2 text-sm text-slate-600">
            {classroom.name} · {classroomStudents.length} students · mastery by skill
          </p>
        </div>

        <div aria-label="Mastery legend" className="flex flex-wrap gap-3 text-xs font-semibold">
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-emerald-500" /> Strong
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-amber-300" /> Developing
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-rose-400" /> Needs support
          </span>
        </div>
      </div>

      {groupStudents.length > 1 && (
      <div className="mb-4 rounded-2xl border border-violet-200 bg-violet-50 p-4 text-violet-950">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-700">
          Small-group opportunity · Simulated
        </p>
        <p className="mt-1 font-bold">
          {groupStudents.length} students share this root cause: {rootCauseName}
        </p>
        <p className="mt-1 text-sm text-violet-800">
          {groupStudents.map((student) => student.first_name).join(", ")} can join the same 5-minute refresher.
        </p>
      </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[960px] border-collapse text-left text-sm">
          <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
            <tr>
              <th scope="col" className="sticky left-0 z-10 bg-slate-100 px-4 py-3 font-bold">
                Student
              </th>
              {skills.map((skill) => (
                <th key={skill.id} scope="col" className="px-3 py-3 text-center font-bold">
                  <span className="block normal-case tracking-normal text-slate-900">{skill.name}</span>
                  <span className="mt-0.5 block font-medium">{skill.id}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {classroomStudents.map((student) => (
              <tr key={student.id} className={student.id === "maya" ? "bg-teal-50/70" : undefined}>
                <th
                  scope="row"
                  className={`sticky left-0 px-4 py-2.5 font-semibold ${
                    student.id === "maya" ? "bg-teal-50" : "bg-white"
                  }`}
                >
                  {student.first_name}
                  {student.id === "maya" ? (
                    <span className="ml-2 text-xs font-bold text-teal-700">Demo student</span>
                  ) : null}
                </th>
                {skills.map((skill) => {
                  const state = skillStates.find(
                    (item) => item.student_id === student.id && item.skill_id === skill.id,
                  );
                  const mastery = state?.mastery ?? 0;
                  const percent = Math.round(mastery * 100);

                  return (
                    <td key={skill.id} className="px-3 py-2 text-center">
                      <span
                        className={`inline-flex min-w-14 justify-center rounded-lg px-2 py-1.5 font-bold ${masteryStyle(mastery)}`}
                        title={`${masteryLabel(mastery)} · ${percent}% mastery`}
                        aria-label={`${student.first_name}, ${skill.name}: ${masteryLabel(mastery)}, ${percent}% mastery`}
                      >
                        {percent}%
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
