import { useMemo, useState } from "react";
import { Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import type { Geometry, Position } from "geojson";
import type { MapFeatureCollection } from "../../types/map";
import type { ContentEntry } from "../../types/content";
import { matchContentByEntityName } from "../../lib/content";

interface FeatureLabelsProps {
  featureCollection: MapFeatureCollection;
  /** 콘텐츠가 매칭되는 폴리곤은 데이터셋 NAME 대신 연도에 맞는 한국어 라벨(mapLabel)을 표시 */
  contentEntries: ContentEntry[];
  selectedYear: number;
  dimmed?: boolean;
}

interface LabelCandidate {
  name: string;
  center: [number, number]; // [lat, lng]
  bounds: L.LatLngBounds;
  /** 위도 보정된 근사 면적 (deg²) — 같은 NAME이 여러 feature일 때 가장 큰 것 선택용 */
  approxArea: number;
}

/**
 * 라벨 표시 최소 크기 (화면 픽셀 기준).
 * 영토의 bbox가 현재 줌에서 이보다 작으면 라벨을 생략한다 (요구사항: 영토가 작을 땐 안 적음).
 * 줌인하면 픽셀 크기가 커지므로 자연스럽게 라벨이 나타난다.
 */
const MIN_LABEL_AREA_PX = 5000;
const MIN_LABEL_DIMENSION_PX = 28;

function collectOuterRings(geometry: Geometry): Position[][] {
  if (geometry.type === "Polygon") {
    return geometry.coordinates.length > 0 ? [geometry.coordinates[0]] : [];
  }
  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates.filter((poly) => poly.length > 0).map((poly) => poly[0]);
  }
  return [];
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function labelIcon(name: string): L.DivIcon {
  return L.divIcon({
    className: "map-feature-label",
    html: `<div>${escapeHtml(name)}</div>`,
    iconSize: undefined,
    iconAnchor: [0, 0],
  });
}

export function FeatureLabels({
  featureCollection,
  contentEntries,
  selectedYear,
  dimmed = false,
}: FeatureLabelsProps) {
  const map = useMap();
  const [zoom, setZoom] = useState(() => map.getZoom());
  useMapEvents({
    zoomend: () => setZoom(map.getZoom()),
  });

  // 스냅샷별로 한 번만: NAME마다 가장 큰 feature의 bbox 중심을 라벨 위치로 계산
  const candidates = useMemo(() => {
    const byName = new Map<string, LabelCandidate>();
    for (const feature of featureCollection.features) {
      const rawName = feature.properties?.NAME;
      if (!rawName) continue;
      const name = rawName.trim();
      if (!name || name.toLowerCase() === "none") continue;

      let west = Infinity;
      let east = -Infinity;
      let south = Infinity;
      let north = -Infinity;
      for (const ring of collectOuterRings(feature.geometry)) {
        for (const [lng, lat] of ring) {
          if (lng < west) west = lng;
          if (lng > east) east = lng;
          if (lat < south) south = lat;
          if (lat > north) north = lat;
        }
      }
      if (!Number.isFinite(west)) continue;

      const midLat = (south + north) / 2;
      const approxArea =
        (east - west) * (north - south) * Math.cos((midLat * Math.PI) / 180);
      const existing = byName.get(name);
      if (existing && existing.approxArea >= approxArea) continue;
      byName.set(name, {
        name,
        center: [midLat, (west + east) / 2],
        bounds: L.latLngBounds([south, west], [north, east]),
        approxArea,
      });
    }
    return [...byName.values()];
  }, [featureCollection]);

  // 현재 줌에서 화면상 충분히 큰 영토만 라벨 표시
  const visible = useMemo(() => {
    return candidates.filter((c) => {
      const sw = map.project(c.bounds.getSouthWest(), zoom);
      const ne = map.project(c.bounds.getNorthEast(), zoom);
      const w = Math.abs(ne.x - sw.x);
      const h = Math.abs(sw.y - ne.y);
      return w * h >= MIN_LABEL_AREA_PX && Math.min(w, h) >= MIN_LABEL_DIMENSION_PX;
    });
  }, [candidates, zoom, map]);

  // 콘텐츠가 매칭되는 폴리곤은 한국어 라벨로 교체.
  // 같은 NAME이 시대별로 다른 항목에 매칭될 수 있으므로(예: 'Parthian Empire'가
  // 224년 이전엔 파르티아, 이후엔 사산조 — 데이터셋이 300년 스냅샷까지 옛 표기를 유지)
  // 반드시 연도 기반 매칭(matchContentByEntityName)을 거친다.
  const labelTexts = useMemo(() => {
    const texts = new Map<string, string>();
    for (const c of visible) {
      const { entry, isYearMismatch } = matchContentByEntityName(
        contentEntries,
        c.name,
        selectedYear
      );
      texts.set(
        c.name,
        entry && !isYearMismatch ? (entry.mapLabel ?? entry.title) : c.name
      );
    }
    return texts;
  }, [visible, contentEntries, selectedYear]);

  return (
    <>
      {visible.map((c) => (
        <Marker
          key={c.name}
          position={c.center}
          icon={labelIcon(labelTexts.get(c.name) ?? c.name)}
          interactive={false}
          opacity={dimmed ? 0.4 : 1}
          zIndexOffset={-1000}
        />
      ))}
    </>
  );
}
