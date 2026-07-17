import { useAppStore, useSnappedYear } from "../../store/useAppStore";
import { formatYear } from "../../lib/year";

/**
 * "표시 중: 기원전 1500년 국경 (근사)" 캡션. 슬라이더 연도와 실제 스냅샷 연도가 다를 수
 * 있음을 사용자에게 알려준다 (data/MAP_DATA_SOURCE.md §5-4).
 */
export function MapCaption() {
  const selectedYear = useAppStore((s) => s.selectedYear);
  const snappedYear = useSnappedYear();
  const isApproximate = selectedYear !== snappedYear;

  return (
    <div className="pointer-events-none absolute left-2 top-2 z-[1000] rounded bg-[var(--color-bg-panel)]/90 px-2.5 py-1 text-xs text-[var(--color-text-muted)] shadow-sm">
      표시 중: {formatYear(snappedYear)} 국경{isApproximate ? " (근사)" : ""}
    </div>
  );
}
