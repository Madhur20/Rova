import type { ParentMessage } from "@/lib/types";

interface ParentWinMessageProps {
  message: ParentMessage;
}

export function ParentWinMessage({ message }: ParentWinMessageProps) {
  return (
    <section
      aria-labelledby="parent-win-heading"
      className="mt-8 rounded-3xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm"
    >
      <div className="flex items-start gap-4">
        <div
          aria-hidden="true"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-2xl text-white"
        >
          ✓
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-800">
              Ciclo cerrado
            </p>
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-900">
              Simulated delivery
            </span>
          </div>
          <h2 id="parent-win-heading" className="mt-2 text-xl font-black text-emerald-950">
            ¡Maya dominó la habilidad!
          </h2>
          <p className="mt-2 text-sm leading-6 text-emerald-950">{message.text}</p>
        </div>
      </div>
    </section>
  );
}
