/**
 * 지도 경계 데이터 출처/라이선스 표기 (data/MAP_DATA_SOURCE.md §1 권고사항).
 * GPL-3.0 데이터셋을 사용하므로 출처를 footer에 명시한다.
 */
export function Footer() {
  return (
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-bg-panel)] px-4 py-1.5 text-center text-[11px] text-[var(--color-text-muted)] sm:px-6">
      지도 경계 데이터:{" "}
      <a
        href="https://github.com/aourednik/historical-basemaps"
        target="_blank"
        rel="noreferrer"
        className="underline hover:text-[var(--color-accent)]"
      >
        aourednik/historical-basemaps
      </a>{" "}
      (GPL-3.0)
    </footer>
  );
}
