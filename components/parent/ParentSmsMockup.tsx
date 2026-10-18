import type { ParentMessage } from "@/lib/types";

interface ParentSmsMockupProps {
  message: ParentMessage;
}

export function ParentSmsMockup({ message }: ParentSmsMockupProps) {
  const sentTime = new Intl.DateTimeFormat("es-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
  }).format(new Date(message.sent_at));

  return (
    <section
      aria-label="Vista simulada del mensaje de texto"
      className="overflow-hidden rounded-[2.25rem] border-[8px] border-slate-950 bg-white shadow-2xl"
    >
      <div className="flex items-center justify-between bg-slate-950 px-5 pb-3 text-xs font-semibold text-white">
        <span>{sentTime}</span>
        <span>Mensajes</span>
      </div>

      <div className="border-b border-slate-200 px-5 py-4 text-center">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-teal-700 text-sm font-black text-white">
          R
        </div>
        <p className="mt-2 font-bold">Rova</p>
        <p className="text-xs text-slate-500">Mensaje de aprendizaje</p>
      </div>

      <div className="min-h-[440px] bg-slate-50 px-4 py-6">
        <div className="mb-3 text-center">
          <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-amber-900">
            Simulated · SMS no enviado
          </span>
        </div>

        <div className="max-w-[90%] rounded-2xl rounded-bl-md bg-slate-200 px-4 py-3 text-[15px] leading-6 text-slate-900">
          {message.text}
        </div>

        <p className="mt-2 pl-2 text-xs text-slate-500">{sentTime}</p>

        <div className="mt-5 rounded-2xl border border-teal-200 bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-800">
            Meta de hoy
          </p>
          <p className="mt-1 font-bold text-slate-900">10 minutos juntos</p>
          <p className="mt-1 text-sm leading-5 text-slate-600">
            Usen una receta, una taza y una pregunta. Rova hará el seguimiento del aprendizaje.
          </p>
        </div>
      </div>
    </section>
  );
}
