import { useAppStore } from "../../store/useAppStore";
import { EmptyStateList } from "./EmptyStateList";
import { ContentDetail } from "./ContentDetail";
import type { ContentEntry } from "../../types/content";

interface ContentPanelProps {
  contentEntries: ContentEntry[];
}

export function ContentPanel({ contentEntries }: ContentPanelProps) {
  const selectedRegionId = useAppStore((s) => s.selectedRegionId);
  const lastClickedName = useAppStore((s) => s.lastClickedName);
  const selectRegion = useAppStore((s) => s.selectRegion);

  const selectedEntry = selectedRegionId
    ? contentEntries.find((e) => e.id === selectedRegionId) ?? null
    : null;

  if (selectedEntry) {
    return <ContentDetail entry={selectedEntry} contentEntries={contentEntries} />;
  }

  // PLAN.md §5.5-4: 클릭은 했지만 매칭되는 콘텐츠가 없는 경우
  if (!selectedRegionId && lastClickedName) {
    return (
      <div className="flex h-full flex-col items-start gap-3 p-4">
        <button
          type="button"
          onClick={() => selectRegion(null)}
          className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-accent)]"
        >
          ← 목록으로
        </button>
        <div className="rounded border border-dashed border-[var(--color-border)] p-4 text-sm text-[var(--color-text-muted)]">
          <p className="font-medium text-[var(--color-text)]">"{lastClickedName}"</p>
          <p className="mt-1">이 지역에 대한 콘텐츠가 아직 없습니다.</p>
        </div>
      </div>
    );
  }

  return <EmptyStateList contentEntries={contentEntries} />;
}
