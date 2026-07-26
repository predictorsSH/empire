import { useAppStore } from "../../store/useAppStore";
import { formatYear } from "../../lib/year";

/** "표시 중: 기원전 1500년 국경" 캡션. 슬라이더가 스냅샷 연도 위만 이동하므로 항상 정확히 일치한다. */
export function MapCaption() {
  const selectedYear = useAppStore((s) => s.selectedYear);

  return (
    <div className="pointer-events-none absolute left-2 top-2 z-[1000] rounded bg-[var(--color-bg-panel)]/90 px-2.5 py-1 text-xs text-[var(--color-text-muted)] shadow-sm">
      표시 중: {formatYear(selectedYear)} 국경
    </div>
  );
}
