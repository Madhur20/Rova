import type { ParentMessage } from "@/lib/types";

interface WeeklyLearningCardProps {
  message: ParentMessage;
  learned: string;
  workingOn: string;
  tryAtHome: string;
}

export function WeeklyLearningCard({
  message,
  learned,
  workingOn,
  tryAtHome,
}: WeeklyLearningCardProps) {
  return (
    <section
      aria-labelledby="weekly-card-heading"
      className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg"
    >
      <div className="bg-gradient-to-br from-indigo-700 to-violet-700 px-5 py-5 text-white">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-100">
            Resumen semanal
          </p>
          <span className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide">
            Simulated
          </span>
        </div>
        <h2 id="weekly-card-heading" className="mt-2 text-2xl font-black">
          La semana de Maya
        </h2>
        <p className="mt-2 text-sm leading-6 text-indigo-100">{message.text}</p>
      </div>

      <dl className="divide-y divide-slate-100 px-5">
        <div className="py-4">
          <dt className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">
            Aprendió
          </dt>
          <dd className="mt-1 font-semibold text-slate-900">{learned}</dd>
        </div>
        <div className="py-4">
          <dt className="text-xs font-bold uppercase tracking-[0.16em] text-amber-700">
            Está practicando
          </dt>
          <dd className="mt-1 font-semibold text-slate-900">{workingOn}</dd>
        </div>
        <div className="py-4">
          <dt className="text-xs font-bold uppercase tracking-[0.16em] text-teal-700">
            Prueben en casa
          </dt>
          <dd className="mt-1 text-sm leading-6 text-slate-700">{tryAtHome}</dd>
        </div>
      </dl>
    </section>
  );
}
