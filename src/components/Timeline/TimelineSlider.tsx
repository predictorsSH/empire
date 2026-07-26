import { useMemo, useState, type KeyboardEvent } from "react";
import { useAppStore } from "../../store/useAppStore";
import { formatYear, TIMELINE_START_YEAR, TIMELINE_END_YEAR } from "../../lib/year";

const BIG_STEP_INDEX = 5;

/** 사용자가 입력한 임의 연도를 실제 스냅샷 목록 중 가장 가까운 값으로 반올림 (동률이면 이전 연도 우선) */
function nearestSnapshotIndex(year: number, snapshotYears: number[]): number {
  let best = 0;
  let bestDist = Infinity;
  for (let i = 0; i < snapshotYears.length; i++) {
    const dist = Math.abs(snapshotYears[i] - year);
    if (dist < bestDist) {
      bestDist = dist;
      best = i;
    }
  }
  return best;
}

export function TimelineSlider() {
  const selectedYear = useAppStore((s) => s.selectedYear);
  const snapshotYears = useAppStore((s) => s.snapshotYears);
  const setYear = useAppStore((s) => s.setYear);
  const setDragging = useAppStore((s) => s.setDragging);
  const [yearInputValue, setYearInputValue] = useState("");

  // 슬라이더는 연속된 연도가 아니라 실제 지도 스냅샷 목록 위의 "인덱스"를 이동한다.
  // 이렇게 하면 슬라이더가 항상 정확히 지도가 표시 중인 연도를 가리켜 불일치가 생기지 않는다.
  const currentIndex = useMemo(() => {
    if (snapshotYears.length === 0) return 0;
    const idx = snapshotYears.indexOf(selectedYear);
    return idx >= 0 ? idx : nearestSnapshotIndex(selectedYear, snapshotYears);
  }, [selectedYear, snapshotYears]);

  const lastIndex = Math.max(0, snapshotYears.length - 1);

  function goToIndex(index: number) {
    const clamped = Math.min(lastIndex, Math.max(0, index));
    const year = snapshotYears[clamped];
    if (year !== undefined) setYear(year);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      const delta = e.shiftKey ? BIG_STEP_INDEX : 1;
      const sign = e.key === "ArrowLeft" ? -1 : 1;
      e.preventDefault();
      goToIndex(currentIndex + sign * delta);
    } else if (e.key === "Home") {
      e.preventDefault();
      goToIndex(0);
    } else if (e.key === "End") {
      e.preventDefault();
      goToIndex(lastIndex);
    }
  }

  function handleYearInputSubmit() {
    const parsed = Number.parseInt(yearInputValue, 10);
    if (!Number.isNaN(parsed) && snapshotYears.length > 0) {
      goToIndex(nearestSnapshotIndex(parsed, snapshotYears));
    }
    setYearInputValue("");
  }

  const trackPercent = lastIndex === 0 ? 0 : (currentIndex / lastIndex) * 100;

  return (
    <div className="border-t border-[var(--color-border)] bg-[var(--color-bg-panel)] px-4 py-3 sm:px-6">
      <div className="mb-1 flex items-center justify-between text-xs text-[var(--color-text-muted)]">
        <span>{formatYear(TIMELINE_START_YEAR)}</span>
        <span className="font-medium text-[var(--color-text)]">{formatYear(selectedYear)}</span>
        <span>{formatYear(TIMELINE_END_YEAR)}</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="이전 시점으로"
          onClick={() => goToIndex(currentIndex - 1)}
          className="shrink-0 rounded border border-[var(--color-border)] px-2 py-1 text-sm hover:border-[var(--color-accent-soft)]"
        >
          ◀
        </button>

        <div className="relative flex-1">
          <input
            type="range"
            className="timeline-range"
            min={0}
            max={lastIndex}
            step={1}
            value={currentIndex}
            aria-label="타임라인 시점"
            aria-valuetext={formatYear(selectedYear)}
            onInput={(e) => goToIndex(Number(e.currentTarget.value))}
            onKeyDown={handleKeyDown}
            onPointerDown={() => setDragging(true)}
            onPointerUp={() => setDragging(false)}
            onBlur={() => setDragging(false)}
          />
          {/* 현재 값 위치를 보여주는 보조 마커 */}
          <div
            className="pointer-events-none absolute -top-1 h-1 w-0.5 bg-[var(--color-accent)]"
            style={{ left: `calc(${trackPercent}% - 1px)` }}
          />
        </div>

        <button
          type="button"
          aria-label="다음 시점으로"
          onClick={() => goToIndex(currentIndex + 1)}
          className="shrink-0 rounded border border-[var(--color-border)] px-2 py-1 text-sm hover:border-[var(--color-accent-soft)]"
        >
          ▶
        </button>

        <form
          className="ml-2 hidden shrink-0 items-center gap-1 sm:flex"
          onSubmit={(e) => {
            e.preventDefault();
            handleYearInputSubmit();
          }}
        >
          <input
            type="number"
            placeholder="연도로 이동"
            value={yearInputValue}
            onChange={(e) => setYearInputValue(e.target.value)}
            className="w-28 rounded border border-[var(--color-border)] bg-transparent px-2 py-1 text-xs"
          />
          <button
            type="submit"
            className="rounded border border-[var(--color-border)] px-2 py-1 text-xs hover:border-[var(--color-accent-soft)]"
          >
            이동
          </button>
        </form>
      </div>
    </div>
  );
}
