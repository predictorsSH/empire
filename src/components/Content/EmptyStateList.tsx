import { useAppStore } from "../../store/useAppStore";
import { getActiveContentForYear } from "../../lib/content";
import { formatYear } from "../../lib/year";
import type { ContentEntry } from "../../types/content";

interface EmptyStateListProps {
  contentEntries: ContentEntry[];
}

/**
 * 미선택 상태(EmptyStateList): 현재 연도에 startYear~endYear가 걸치는 콘텐츠 목록.
 * kind:"overview" 항목도 포함한다 (PLAN.md §5.1, schema.md §2).
 */
export function EmptyStateList({ contentEntries }: EmptyStateListProps) {
  const selectedYear = useAppStore((s) => s.selectedYear);
  const selectRegion = useAppStore((s) => s.selectRegion);
  const active = getActiveContentForYear(contentEntries, selectedYear);

  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto p-4">
      <div>
        <p className="text-sm text-[var(--color-text-muted)]">
          지도에서 지역을 클릭해 상세 내용을 확인하세요. 아래는 {formatYear(selectedYear)} 무렵
          존재했던 주요 문명·시대 배경입니다.
        </p>
      </div>
      {active.length === 0 && (
        <p className="rounded border border-dashed border-[var(--color-border)] p-4 text-sm text-[var(--color-text-muted)]">
          이 시기에 해당하는 콘텐츠가 아직 없습니다.
        </p>
      )}
      <ul className="flex flex-col gap-2">
        {active.map((entry) => (
          <li key={entry.id}>
            <button
              type="button"
              onClick={() => selectRegion(entry.id)}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-panel)] p-3 text-left transition hover:border-[var(--color-accent-soft)] hover:shadow-sm"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-serif-heading text-base font-medium">{entry.title}</span>
                {entry.kind === "overview" && (
                  <span className="shrink-0 rounded-full bg-[var(--color-accent-soft)]/30 px-2 py-0.5 text-[10px] text-[var(--color-text-muted)]">
                    시대 배경
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                {formatYear(entry.startYear)} ~ {formatYear(entry.endYear)}
              </p>
              <p className="mt-1 text-sm text-[var(--color-text)]">{entry.summary}</p>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
