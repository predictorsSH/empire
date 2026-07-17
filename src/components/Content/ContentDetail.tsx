import { useAppStore } from "../../store/useAppStore";
import { isYearWithinRange } from "../../lib/content";
import { formatYear } from "../../lib/year";
import type { ContentEntry } from "../../types/content";

interface ContentDetailProps {
  entry: ContentEntry;
  contentEntries: ContentEntry[];
}

export function ContentDetail({ entry, contentEntries }: ContentDetailProps) {
  const selectedYear = useAppStore((s) => s.selectedYear);
  const selectRegion = useAppStore((s) => s.selectRegion);
  const isYearMismatch = !isYearWithinRange(selectedYear, entry);

  const relatedEntries = (entry.relatedIds ?? [])
    .map((id) => contentEntries.find((e) => e.id === id))
    .filter((e): e is ContentEntry => !!e);

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-4">
      <div>
        <button
          type="button"
          onClick={() => selectRegion(null)}
          className="mb-2 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-accent)]"
        >
          ← 목록으로
        </button>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-serif-heading text-xl font-semibold">{entry.title}</h2>
          <span className="rounded-full bg-[var(--color-accent-soft)]/30 px-2 py-0.5 text-[11px] text-[var(--color-text-muted)]">
            {entry.category}
          </span>
        </div>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          {formatYear(entry.startYear)} ~ {formatYear(entry.endYear)}
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <span
            className={
              "rounded px-2 py-0.5 text-[11px] " +
              (entry.source === "book-excerpt"
                ? "bg-emerald-700/15 text-emerald-800 dark:text-emerald-300"
                : "bg-amber-700/15 text-amber-800 dark:text-amber-300")
            }
          >
            {entry.source === "book-excerpt" ? "책 발췌 기반" : "placeholder (일반 역사 지식)"}
          </span>
          {!entry.mapEntityNamesVerified && (
            <span className="rounded bg-[var(--color-border)] px-2 py-0.5 text-[11px] text-[var(--color-text-muted)]">
              지도 매칭 미검증
            </span>
          )}
        </div>
        {isYearMismatch && (
          <p className="mt-2 rounded border border-[var(--color-accent-soft)] bg-[var(--color-accent-soft)]/10 px-2.5 py-1.5 text-xs text-[var(--color-text-muted)]">
            현재 슬라이더 연도({formatYear(selectedYear)})는 이 항목의 시대 범위를 벗어납니다 —
            당시({formatYear(entry.startYear)} ~ {formatYear(entry.endYear)}) 기준 설명입니다.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {entry.body.map((paragraph, i) => (
          <p key={i} className="text-[15px] leading-relaxed text-[var(--color-text)]">
            {paragraph}
          </p>
        ))}
      </div>

      {entry.keyEvents && entry.keyEvents.length > 0 && (
        <div>
          <h3 className="mb-1.5 text-sm font-medium text-[var(--color-text-muted)]">핵심 사건</h3>
          <ul className="flex flex-col gap-1.5 border-l-2 border-[var(--color-accent-soft)] pl-3">
            {entry.keyEvents.map((ev, i) => (
              <li key={i} className="text-sm">
                <span className="font-medium text-[var(--color-accent)]">{formatYear(ev.year)}</span>{" "}
                <span className="text-[var(--color-text)]">{ev.label}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {relatedEntries.length > 0 && (
        <div>
          <h3 className="mb-1.5 text-sm font-medium text-[var(--color-text-muted)]">관련 지역/문명</h3>
          <div className="flex flex-wrap gap-1.5">
            {relatedEntries.map((rel) => (
              <button
                key={rel.id}
                type="button"
                onClick={() => selectRegion(rel.id)}
                className="rounded-full border border-[var(--color-border)] px-2.5 py-1 text-xs hover:border-[var(--color-accent-soft)] hover:text-[var(--color-accent)]"
              >
                {rel.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {entry.sourceNote && (
        <p className="mt-2 text-[11px] leading-relaxed text-[var(--color-text-muted)]">
          참고: {entry.sourceNote}
        </p>
      )}
    </div>
  );
}
