import type { MapFeatureCollection, SnapshotIndex } from "../types/map";

const GEOJSON_BASE = "/data/geojson";

let indexPromise: Promise<SnapshotIndex> | null = null;

/** scripts/fetch-map-data.mjs가 생성한 public/data/geojson/index.json (연도 -> 파일명 매핑) 로드 */
export function loadSnapshotIndex(): Promise<SnapshotIndex> {
  if (!indexPromise) {
    indexPromise = fetch(`${GEOJSON_BASE}/index.json`, { cache: "force-cache" }).then((res) => {
      if (!res.ok) throw new Error(`스냅샷 인덱스를 불러오지 못했습니다 (HTTP ${res.status})`);
      return res.json() as Promise<SnapshotIndex>;
    });
  }
  return indexPromise;
}

const geojsonCache = new Map<string, Promise<MapFeatureCollection>>();

/** 특정 연도의 GeoJSON FeatureCollection 로드 (연도 -> 파일명은 index.json 기준, 메모리 캐시) */
export async function loadSnapshotGeoJson(year: number): Promise<MapFeatureCollection> {
  const index = await loadSnapshotIndex();
  const entry = index.years.find((y) => y.year === year);
  if (!entry) {
    throw new Error(`${year}년 스냅샷이 index.json에 없습니다.`);
  }
  const cached = geojsonCache.get(entry.filename);
  if (cached) return cached;

  const promise = fetch(`${GEOJSON_BASE}/${entry.filename}`, { cache: "force-cache" }).then((res) => {
    if (!res.ok) throw new Error(`GeoJSON을 불러오지 못했습니다 (HTTP ${res.status}): ${entry.filename}`);
    return res.json() as Promise<MapFeatureCollection>;
  });
  geojsonCache.set(entry.filename, promise);
  return promise;
}
