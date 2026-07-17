// data/schema.md 에 정의된 ContentEntry 스키마 그대로.
// 필드 구조는 임의로 바꾸지 않는다 — 값(mapEntityNames 등)은 개발 단계에서 실측 검증해 교정할 수 있다.

export type ContentKind = "overview" | "civilization";

export type ContentSource = "book-excerpt" | "placeholder";

export interface KeyEvent {
  year: number; // BCE는 음수
  label: string;
}

export interface ContentEntry {
  id: string;
  kind: ContentKind;
  title: string;
  category: string;
  startYear: number; // BCE는 음수
  endYear: number;
  mapEntityNames: string[]; // 지도 GeoJSON properties.NAME과 매칭할 표기들 (빈 배열 허용)
  mapEntityNamesVerified: boolean;
  approxCenter: [number, number]; // [lon, lat]
  summary: string;
  body: string[];
  keyEvents?: KeyEvent[];
  relatedIds?: string[];
  source: ContentSource;
  sourceNote?: string;
}

/**
 * PLAN.md §3.1 최소 요구사항만 뽑아낸 부분 인터페이스.
 * 지도 연동 로직(GeoJsonLayer, 매칭 유틸)은 ContentEntry 전체가 아니라
 * 이 최소 형태에만 의존하도록 해서 콘텐츠 스키마가 커져도 지도 연동 코드가 흔들리지 않게 한다.
 */
export type MapLinkableContent = Pick<
  ContentEntry,
  "id" | "startYear" | "endYear" | "mapEntityNames" | "approxCenter"
>;
