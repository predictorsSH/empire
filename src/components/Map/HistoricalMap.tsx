import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import type { Map as LeafletMap } from "leaflet";
import { GeoJsonLayer } from "./GeoJsonLayer";
import { WaterLabels } from "./WaterLabels";
import { loadSnapshotGeoJson } from "../../lib/geojson";
import { matchContentByEntityName } from "../../lib/content";
import { useAppStore, useSnappedYear } from "../../store/useAppStore";
import type { ContentEntry } from "../../types/content";
import type { MapFeatureCollection } from "../../types/map";

interface HistoricalMapProps {
  contentEntries: ContentEntry[];
}

const MEDITERRANEAN_BLACK_SEA_CENTER: [number, number] = [37.5, 28];
const DEFAULT_ZOOM = 4;

export function HistoricalMap({ contentEntries }: HistoricalMapProps) {
  const snappedYear = useSnappedYear();
  const selectedYear = useAppStore((s) => s.selectedYear);
  const selectedRegionId = useAppStore((s) => s.selectedRegionId);
  const selectRegion = useAppStore((s) => s.selectRegion);
  const setClickResult = useAppStore((s) => s.setClickResult);

  // react-leaflet의 <GeoJSON>은 data prop이 바뀌어도 key가 바뀌지 않으면 내부 Leaflet
  // 레이어를 갱신하지 않는다(리마운트로만 데이터 교체 가능). 그래서 "로딩이 끝나 실제로
  // 데이터가 세팅된 연도"를 별도로 들고 있다가 그 값을 key로 써야 한다 — key를 목표
  // snappedYear로 바로 쓰면, fetch가 끝나기 전 이전 데이터로 먼저 리마운트되어버리고
  // 정작 새 데이터가 도착했을 때는 key가 이미 같은 값이라 리마운트가 안 되는 버그가 생긴다.
  const [loaded, setLoaded] = useState<{ year: number; data: MapFeatureCollection } | null>(null);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);

  useEffect(() => {
    if (import.meta.env.DEV && mapRef.current) {
      // 개발 중 수동/자동화 검증 편의용 (프로덕션 빌드에는 포함되지 않음)
      (window as unknown as { __leafletMap?: LeafletMap }).__leafletMap = mapRef.current;
    }
  });

  useEffect(() => {
    let cancelled = false;
    setIsFetching(true);
    loadSnapshotGeoJson(snappedYear)
      .then((data) => {
        if (cancelled) return;
        setLoaded({ year: snappedYear, data });
        setError(null);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        console.error(err);
        setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setIsFetching(false);
      });
    return () => {
      cancelled = true;
    };
  }, [snappedYear]);

  function handleFeatureClick(name: string) {
    const result = matchContentByEntityName(contentEntries, name, selectedYear);
    setClickResult(result.entry?.id ?? null, name);
  }

  function handleMarkerClick(id: string) {
    selectRegion(id);
  }

  return (
    <div className="relative h-full w-full">
      <MapContainer
        ref={mapRef}
        center={MEDITERRANEAN_BLACK_SEA_CENTER}
        zoom={DEFAULT_ZOOM}
        minZoom={2}
        maxZoom={8}
        preferCanvas
        worldCopyJump={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
        />
        <WaterLabels />
        {loaded && (
          <GeoJsonLayer
            featureCollection={loaded.data}
            snapshotYear={loaded.year}
            selectedYear={selectedYear}
            contentEntries={contentEntries}
            selectedRegionId={selectedRegionId}
            onFeatureClick={handleFeatureClick}
            onMarkerClick={handleMarkerClick}
            dimmed={isFetching}
          />
        )}
      </MapContainer>
      {error && (
        <div className="absolute inset-x-0 top-0 z-[1000] bg-red-100 px-3 py-1 text-center text-xs text-red-800">
          지도 데이터를 불러오지 못했습니다: {error}
        </div>
      )}
    </div>
  );
}
