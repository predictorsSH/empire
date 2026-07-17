// data/MAP_DATA_SOURCE.md §4에서 확인한 실제 GeoJSON 스키마.
// Geometry/Feature/FeatureCollection 자체는 'geojson' 패키지(@types/geojson) 타입을 그대로 써서
// react-leaflet의 <GeoJSON data={...}> prop(GeoJsonObject)과 구조적으로 호환되게 한다.
import type { Feature, FeatureCollection, Geometry } from "geojson";

export interface MapFeatureProperties {
  NAME: string | null;
  ABBREVN?: string | null;
  SUBJECTO?: string | null;
  PARTOF?: string | null;
  BORDERPRECISION?: number | null;
  TYPE?: string | null;
}

export type MapFeature = Feature<Geometry, MapFeatureProperties>;

export type MapFeatureCollection = FeatureCollection<Geometry, MapFeatureProperties>;

export interface SnapshotIndexEntry {
  year: number;
  filename: string;
}

export interface SnapshotIndex {
  commitSha: string;
  years: SnapshotIndexEntry[];
}
