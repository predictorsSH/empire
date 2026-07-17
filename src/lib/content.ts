import type { ContentEntry } from "../types/content";

const CONTENT_URL = "/data/content.json";

/**
 * content.json은 정적 import가 아니라 런타임 fetch로 로드한다 — 항목이 계속 늘어날 예정이라
 * (PLAN.md §6, 작업 지시) 파일만 갱신하면 코드 변경 없이 앱에 반영되어야 하기 때문.
 */
export async function loadContent(): Promise<ContentEntry[]> {
  const res = await fetch(CONTENT_URL, { cache: "no-cache" });
  if (!res.ok) {
    throw new Error(`콘텐츠 데이터를 불러오지 못했습니다 (HTTP ${res.status}): ${CONTENT_URL}`);
  }
  const data = (await res.json()) as ContentEntry[];
  if (!Array.isArray(data)) {
    throw new Error("콘텐츠 데이터 형식이 배열이 아닙니다.");
  }
  return data;
}

/** 연도 범위가 겹치는지 여부 (양끝 포함) */
export function isYearWithinRange(year: number, entry: Pick<ContentEntry, "startYear" | "endYear">): boolean {
  return year >= entry.startYear && year <= entry.endYear;
}

/**
 * EmptyStateList(미선택 상태)에 쓸 목록: 현재 연도에 startYear~endYear가 걸치는 항목.
 * kind:"overview" 항목도 포함한다 (PLAN.md §5.1, schema.md §2).
 */
export function getActiveContentForYear(entries: ContentEntry[], year: number): ContentEntry[] {
  return entries
    .filter((e) => isYearWithinRange(year, e))
    .sort((a, b) => a.startYear - b.startYear);
}

/** 연도 구간의 경계까지 최소 거리 (구간 안이면 0) */
function distanceToRange(year: number, entry: Pick<ContentEntry, "startYear" | "endYear">): number {
  if (year < entry.startYear) return entry.startYear - year;
  if (year > entry.endYear) return year - entry.endYear;
  return 0;
}

export interface MatchResult {
  entry: ContentEntry | null;
  /** 매칭된 entry의 연도 범위가 현재 연도를 포함하지 않을 때 true (PLAN.md §5.5 "당시 기준 설명" 안내용) */
  isYearMismatch: boolean;
  /** 매칭 후보가 2개 이상이었는지 (개발 편의용 콘솔 경고 트리거) */
  hadAmbiguousMatches: boolean;
}

/**
 * 지도에서 클릭된 feature.properties.NAME으로 콘텐츠를 찾는다.
 * PLAN.md §5.5 절차 그대로:
 *   1. mapEntityNames(대소문자 무관)에 클릭된 이름이 포함된 항목들을 모두 찾는다.
 *   2. 후보가 여럿이면(예: "Ur"가 sumer/ur-third-dynasty 양쪽에 쓰이는 경우, data/content.json
 *      sourceNote 참고) 현재 연도가 startYear~endYear에 포함되는 후보를 우선한다
 *      (schema.md §3 "언제(연도)+어디(mapEntityNames)의 곱집합으로 유일하게 식별" 원칙).
 *   3. 그래도 여럿이거나 하나도 연도에 맞지 않으면, 연도 구간까지의 거리가 가장 가까운 후보를
 *      선택한다. 동률이면 배열상 먼저 나온 항목 + 콘솔 경고.
 */
export function matchContentByEntityName(
  entries: ContentEntry[],
  clickedName: string | null | undefined,
  year: number
): MatchResult {
  if (!clickedName) return { entry: null, isYearMismatch: false, hadAmbiguousMatches: false };
  const normalized = clickedName.trim().toLowerCase();
  if (!normalized || normalized === "none") {
    return { entry: null, isYearMismatch: false, hadAmbiguousMatches: false };
  }

  const candidates = entries.filter((e) =>
    e.mapEntityNames.some((n) => n.trim().toLowerCase() === normalized)
  );

  if (candidates.length === 0) {
    return { entry: null, isYearMismatch: false, hadAmbiguousMatches: false };
  }

  if (candidates.length === 1) {
    const entry = candidates[0];
    return { entry, isYearMismatch: !isYearWithinRange(year, entry), hadAmbiguousMatches: false };
  }

  // 여러 후보: 연도가 범위 안에 드는 것을 우선, 그다음 거리순
  const withDistance = candidates
    .map((entry) => ({ entry, distance: distanceToRange(year, entry) }))
    .sort((a, b) => a.distance - b.distance);

  const best = withDistance[0];
  const tiedWithBest = withDistance.filter((c) => c.distance === best.distance);

  if (tiedWithBest.length > 1) {
    console.warn(
      `[matchContentByEntityName] "${clickedName}"에 대해 연도(${year}) 기준으로도 소거되지 않는 ` +
        `${tiedWithBest.length}개 후보가 있습니다. 배열상 첫 항목을 사용합니다:`,
      tiedWithBest.map((c) => c.entry.id)
    );
  }

  return {
    entry: tiedWithBest[0].entry,
    isYearMismatch: best.distance > 0,
    hadAmbiguousMatches: true,
  };
}
