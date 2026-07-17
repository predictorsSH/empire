import { useAppStore } from "../../store/useAppStore";
import { formatYear } from "../../lib/year";

export function Header() {
  const selectedYear = useAppStore((s) => s.selectedYear);

  return (
    <header className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-[var(--color-border)] bg-[var(--color-bg-panel)] px-4 py-3 sm:px-6">
      <h1 className="font-serif-heading text-lg font-medium tracking-tight sm:text-xl">
        지중해와 흑해 사이, 제국들의 역사
      </h1>
      <p className="font-serif-heading text-2xl font-semibold text-[var(--color-accent)] sm:text-3xl">
        {formatYear(selectedYear)}
      </p>
    </header>
  );
}
