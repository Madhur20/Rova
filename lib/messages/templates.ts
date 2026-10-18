// Owner: Person C. Parent message and teacher alert templates (D-004), Spanish for the demo parent.
// Each id maps to several wordings; callLLM in lib/llm.ts rotates them and fills {placeholders}.
// Created empty by the integration owner so lib/llm.ts compiles; Person C fills it in.

import type { TemplateBank } from "@/lib/types";

export const adultTemplates: TemplateBank = {
  "parent.activity.es": [
    "Hola, familia de {student}. Esta semana {student} está practicando {skill}. Vimos que conviene reforzar {rootCause}. Actividad de 10 minutos: {activity} No hace falta darle la respuesta; pídanle que muestre cómo pensó.",
    "Una idea para acompañar a {student}: practiquen {skill} durante 10 minutos con esta actividad: {activity} Esto también ayudará con {rootCause}. Pregúntenle cómo sabe que su respuesta tiene sentido.",
  ],
  "parent.win.es": [
    "¡Buenas noticias! {student} volvió a practicar {skill} y mostró que ya domina esta habilidad. Gracias por acompañarle en casa.",
    "¡Meta lograda! {student} demostró dominio de {skill} en la revisión. Su apoyo en casa ayudó a cerrar el ciclo de aprendizaje.",
  ],
  "parent.weekly.es": [
    "Resumen semanal de {student}: aprendió {learned}; sigue trabajando en {workingOn}. Para practicar en casa: {activity}",
    "Esta semana, {student} avanzó en {learned}. Ahora está reforzando {workingOn}. Pueden ayudar con esta actividad corta: {activity}",
  ],
};
