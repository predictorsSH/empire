import { useMemo } from "react";
import { GeoJSON as GeoJSONLayer, Marker } from "react-leaflet";
import L, { type Layer, type PathOptions } from "leaflet";
import type { Feature } from "geojson";
import type { MapFeatureCollection, MapFeatureProperties } from "../../types/map";
import type { ContentEntry } from "../../types/content";
import { isYearWithinRange } from "../../lib/content";

interface GeoJsonLayerProps {
  featureCollection: MapFeatureCollection;
  /** GeoJSON 레이어를 강제 리마운트시키기 위한 key (스냅샷 연도) */
  snapshotYear: number;
  /** 콘텐츠 필터링에 쓰는 실제 슬라이더 연도 (스냅샷과 다를 수 있음) */
  selectedYear: number;
  contentEntries: ContentEntry[];
  selectedRegionId: string | null;
  onFeatureClick: (name: string) => void;
  /** 마커(폴리곤 없는 폴백)는 이름 매칭이 아니라 콘텐츠 id를 직접 선택한다 */
  onMarkerClick: (id: string) => void;
  /** 다음 스냅샷을 fetch하는 동안 이전 스냅샷을 유지한 채 살짝 흐리게 (PLAN.md §5.6) */
  dimmed?: boolean;
}

const FILL_MATCHED = "#c9a35a";
const FILL_UNMATCHED = "#9aa0a6";
const STROKE_DEFAULT = "#5b5346";
const STROKE_SELECTED = "#8a3324";

function markerIcon() {
  return L.divIcon({
    className: "",
    html: `<div style="
      width:14px;height:14px;border-radius:50% 50% 50% 0;
      background:${STROKE_SELECTED};transform:rotate(-45deg);
      border:2px solid #fffdf8;box-shadow:0 1px 3px rgba(0,0,0,0.4);
    "></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 14],
  });
}

export function GeoJsonLayer({
  featureCollection,
  snapshotYear,
  selectedYear,
  contentEntries,
  selectedRegionId,
  onFeatureClick,
  onMarkerClick,
  dimmed = false,
}: GeoJsonLayerProps) {
  // 이 스냅샷에 실제로 존재하는 NAME 집합 (대소문자 무관) — 마커 폴백 판단에 사용
  const namesInSnapshot = useMemo(() => {
    const set = new Set<string>();
    for (const f of featureCollection.features) {
      const name = f.properties?.NAME;
      if (name) set.add(name.trim().toLowerCase());
    }
    return set;
  }, [featureCollection]);

  // 어떤 콘텐츠든 매칭되는 mapEntityNames 전체 집합 (폴리곤 강조색 판단용)
  const allMappedNames = useMemo(() => {
    const set = new Set<string>();
    for (const entry of contentEntries) {
      for (const n of entry.mapEntityNames) set.add(n.trim().toLowerCase());
    }
    return set;
  }, [contentEntries]);

  // 현재 선택된 콘텐츠의 mapEntityNames (폴리곤 선택 강조용)
  const selectedEntry = useMemo(
    () => contentEntries.find((e) => e.id === selectedRegionId) ?? null,
    [contentEntries, selectedRegionId]
  );
  const selectedNames = useMemo(
    () => new Set((selectedEntry?.mapEntityNames ?? []).map((n) => n.trim().toLowerCase())),
    [selectedEntry]
  );

  // PLAN.md §5.5 / MAP_DATA_SOURCE.md §7: 폴리곤이 없는(또는 이번 스냅샷에 없는) 콘텐츠는
  // approxCenter에 마커로 폴백해 "지도 클릭 -> 패널 갱신" UX를 100% 보장한다.
  const fallbackMarkerEntries = useMemo(() => {
    return contentEntries.filter((entry) => {
      if (entry.kind !== "civilization") return false;
      if (!isYearWithinRange(selectedYear, entry)) return false;
      if (entry.mapEntityNames.length === 0) return true;
      const hasPolygonThisSnapshot = entry.mapEntityNames.some((n) =>
        namesInSnapshot.has(n.trim().toLowerCase())
      );
      return !hasPolygonThisSnapshot;
    });
  }, [contentEntries, selectedYear, namesInSnapshot]);

  function style(feature?: Feature): PathOptions {
    const props = feature?.properties as MapFeatureProperties | undefined;
    const name = props?.NAME?.trim().toLowerCase();
    const isMatched = !!name && allMappedNames.has(name);
    const isSelected = !!name && selectedNames.has(name);
    const dimFactor = dimmed ? 0.6 : 1;
    return {
      fillColor: isMatched ? FILL_MATCHED : FILL_UNMATCHED,
      fillOpacity: (isMatched ? 0.55 : 0.25) * dimFactor,
      color: isSelected ? STROKE_SELECTED : STROKE_DEFAULT,
      weight: isSelected ? 2.5 : 0.6,
      opacity: 0.9 * dimFactor,
    };
  }

  function onEachFeature(feature: Feature, layer: Layer) {
    const props = feature.properties as MapFeatureProperties | null;
    const name = props?.NAME;
    if (!name || name.trim().toLowerCase() === "none") return;
    layer.bindTooltip(name, { sticky: true, className: "text-xs" });
    layer.on("click", () => onFeatureClick(name));
  }

  return (
    <>
      <GeoJSONLayer
        key={snapshotYear}
        data={featureCollection}
        style={style}
        onEachFeature={onEachFeature}
      />
      {fallbackMarkerEntries.map((entry) => (
        <Marker
          key={entry.id}
          position={[entry.approxCenter[1], entry.approxCenter[0]]}
          icon={markerIcon()}
          eventHandlers={{
            click: () => onMarkerClick(entry.id),
          }}
        >
        </Marker>
      ))}
    </>
  );
}
