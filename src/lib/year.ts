export const TIMELINE_START_YEAR = -3000;
export const TIMELINE_END_YEAR = 1920;

/** PLAN.md §4.3 — BCE는 "기원전 N년", CE는 "서기 N년" 한국어 라벨링 */
export function formatYear(year: number): string {
  if (year < 0) return `기원전 ${Math.abs(year)}년`;
  return `서기 ${year}년`;
}

/** 슬라이더 캡션 등에 쓰는 짧은 포맷 (부호 없이 BC/AD 대신 한국어 접두어만) */
export function formatYearShort(year: number): string {
  return formatYear(year);
}

/**
 * 이진 탐색으로 정렬된 스냅샷 연도 배열 중 `year` 이하의 가장 최신 값(floor)을 찾는다.
 * 미래 스냅샷으로 앞당겨 붙이면 아직 일어나지 않은 역사(예: 251년 → 300년의 사두정치)가
 * 보이므로, "그 시점까지 확정된 지도"인 과거 스냅샷을 보여준다.
 * `year`가 첫 스냅샷보다 이르면 첫 스냅샷을 반환한다.
 */
export function snapToFloorSnapshot(year: number, sortedSnapshotYears: number[]): number {
  if (sortedSnapshotYears.length === 0) {
    throw new Error("snapshotYears가 비어 있습니다.");
  }
  let lo = 0;
  let hi = sortedSnapshotYears.length - 1;

  if (year <= sortedSnapshotYears[lo]) return sortedSnapshotYears[lo];
  if (year >= sortedSnapshotYears[hi]) return sortedSnapshotYears[hi];

  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (sortedSnapshotYears[mid] === year) return sortedSnapshotYears[mid];
    if (sortedSnapshotYears[mid] < year) lo = mid;
    else hi = mid;
  }

  return sortedSnapshotYears[lo];
}
