import { useState, type KeyboardEvent } from "react";
import { useAppStore, useSnappedYear } from "../../store/useAppStore";
import { formatYear, TIMELINE_START_YEAR, TIMELINE_END_YEAR } from "../../lib/year";

const STEP_YEAR = 1;
const BIG_STEP_YEAR = 10;

function clamp(year: number) {
  return Math.min(TIMELINE_END_YEAR, Math.max(TIMELINE_START_YEAR, year));
}

export function TimelineSlider() {
  const selectedYear = useAppStore((s) => s.selectedYear);
  const snapshotYears = useAppStore((s) => s.snapshotYears);
  const setYear = useAppStore((s) => s.setYear);
  const setDragging = useAppStore((s) => s.setDragging);
  const snappedYear = useSnappedYear();
  const [yearInputValue, setYearInputValue] = useState("");

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    // PLAN.md §5.4: ←/→ 1년, Shift+←/→ 10년, Home/End 시작/끝
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      const delta = e.shiftKey ? BIG_STEP_YEAR : STEP_YEAR;
      const sign = e.key === "ArrowLeft" ? -1 : 1;
      e.preventDefault();
      setYear(clamp(selectedYear + sign * delta));
    } else if (e.key === "Home") {
      e.preventDefault();
      setYear(TIMELINE_START_YEAR);
    } else if (e.key === "End") {
      e.preventDefault();
      setYear(TIMELINE_END_YEAR);
    }
  }

  function handleYearInputSubmit() {
    const parsed = Number.parseInt(yearInputValue, 10);
    if (!Number.isNaN(parsed)) {
      setYear(clamp(parsed));
    }
    setYearInputValue("");
  }

  const trackPercent = ((selectedYear - TIMELINE_START_YEAR) / (TIMELINE_END_YEAR - TIMELINE_START_YEAR)) * 100;

  return (
    <div className="border-t border-[var(--color-border)] bg-[var(--color-bg-panel)] px-4 py-3 sm:px-6">
      <div className="mb-1 flex items-center justify-between text-xs text-[var(--color-text-muted)]">
        <span>{formatYear(TIMELINE_START_YEAR)}</span>
        <span className="font-medium text-[var(--color-text)]">
          슬라이더: {formatYear(selectedYear)}
          {selectedYear !== snappedYear && (
            <span className="ml-1 text-[var(--color-text-muted)]">
              (지도: {formatYear(snappedYear)})
            </span>
          )}
        </span>
        <span>{formatYear(TIMELINE_END_YEAR)}</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="1년 전으로"
          onClick={() => setYear(clamp(selectedYear - STEP_YEAR))}
          className="shrink-0 rounded border border-[var(--color-border)] px-2 py-1 text-sm hover:border-[var(--color-accent-soft)]"
        >
          ◀
        </button>

        <div className="relative flex-1">
          <input
            type="range"
            className="timeline-range"
            list="snapshot-ticks"
            min={TIMELINE_START_YEAR}
            max={TIMELINE_END_YEAR}
            step={STEP_YEAR}
            value={selectedYear}
            aria-label="타임라인 연도"
            aria-valuetext={formatYear(selectedYear)}
            onInput={(e) => setYear(Number(e.currentTarget.value))}
            onKeyDown={handleKeyDown}
            onPointerDown={() => setDragging(true)}
            onPointerUp={() => setDragging(false)}
            onBlur={() => setDragging(false)}
          />
          <datalist id="snapshot-ticks">
            {snapshotYears.map((y) => (
              <option key={y} value={y} />
            ))}
          </datalist>
          {/* 현재 값 위치를 보여주는 보조 마커(브라우저별 datalist tick 렌더 편차 보완) */}
          <div
            className="pointer-events-none absolute -top-1 h-1 w-0.5 bg-[var(--color-accent)]"
            style={{ left: `calc(${trackPercent}% - 1px)` }}
          />
        </div>

        <button
          type="button"
          aria-label="1년 후로"
          onClick={() => setYear(clamp(selectedYear + STEP_YEAR))}
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
