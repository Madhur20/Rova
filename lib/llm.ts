// The single place Rova gets written text from (D-004).
// Template mode for now: no AI model is called. Each template id has several wordings;
// callLLM rotates through them so replies don't repeat, and fills {placeholders} from vars.
// To use a real model later, change the body of callLLM only; callers stay the same.

import type { TemplateBank } from "@/lib/types";
import { studentTemplates } from "@/content/templates";
import { adultTemplates } from "@/lib/messages/templates";

const bank: TemplateBank = { ...studentTemplates, ...adultTemplates };

// Rotation is deterministic so the demo path is repeatable after resetLLM().
const nextVariant = new Map<string, number>();

export function fillTemplate(text: string, vars: Record<string, string>): string {
  return text.replace(/\{(\w+)\}/g, (match, key: string) => vars[key] ?? match);
}

export function callLLM(
  templateId: string,
  vars: Record<string, string> = {},
  templates: TemplateBank = bank,
): string {
  const variants = templates[templateId];
  if (!variants || variants.length === 0) {
    // Never show a blank reply in the demo; a missing template is visible but harmless.
    return `[missing template: ${templateId}]`;
  }
  const i = nextVariant.get(templateId) ?? 0;
  nextVariant.set(templateId, (i + 1) % variants.length);
  return fillTemplate(variants[i], vars);
}

// Called by "Reset demo" so the next run starts from the first wording again.
export function resetLLM(): void {
  nextVariant.clear();
}
