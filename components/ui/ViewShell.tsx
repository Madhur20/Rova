// Shared frame for every view: a header with a way back home, so no screen is a dead end.

import Link from "next/link";
import { ResetDemoButton } from "@/components/ui/ResetDemoButton";

export function ViewShell({
  title,
  owner,
  narrow = false,
  children,
}: {
  title: string;
  owner: string;
  narrow?: boolean; // parent view is phone-sized
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-paper text-ink">
      <header className="border-b border-rule bg-paper/95">
        <div className="mx-auto flex min-h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="group flex items-center gap-3 rounded-control text-ink no-underline"
            aria-label="Back to Rova home"
          >
            <span className="font-display text-2xl font-semibold tracking-[-0.03em] group-hover:text-accent">
              Rova
            </span>
            <span className="border-l border-rule pl-3 text-xs font-semibold text-ink-muted transition-colors group-hover:text-ink">
              All views
            </span>
          </Link>
          <div className="flex items-center gap-3 sm:gap-5">
            <span className="hidden text-xs text-ink-muted md:inline">{owner}</span>
            <ResetDemoButton />
          </div>
        </div>
      </header>
      <main
        className={`mx-auto w-full flex-1 px-4 py-8 sm:px-6 sm:py-10 lg:px-8 ${
          narrow ? "max-w-md" : "max-w-6xl"
        }`}
      >
        <h1 className="mb-6 font-display text-3xl font-semibold leading-tight tracking-[-0.025em] text-ink sm:text-4xl">
          {title}
        </h1>
        {children}
      </main>
    </div>
  );
}

export function ComingSoon({ items }: { items: string[] }) {
  return (
    <div className="rounded-panel border border-dashed border-rule bg-surface p-6 text-ink-muted">
      <p className="mb-3 font-medium">Not built yet. Planned for this view:</p>
      <ul className="list-disc space-y-1 pl-5 text-sm">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
