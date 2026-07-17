import { useState } from "react";
import { Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";

/**
 * 바다·강·해협 등 수역 이름 라벨.
 * 베이스맵 타일(light_nolabels)에는 라벨이 없으므로(현대 지명 오염 방지),
 * 역사 서술에 자주 등장하는 주요 수역만 직접 고정 라벨로 표시한다.
 * minZoom: 이 줌 레벨 이상에서만 표시 (큰 바다는 낮게, 좁은 해협·강은 높게).
 */
interface WaterLabel {
  name: string;
  position: [number, number]; // [lat, lng]
  minZoom: number;
}

const WATER_LABELS: WaterLabel[] = [
  { name: "지중해", position: [34.5, 18.0], minZoom: 3 },
  { name: "흑해", position: [43.3, 34.0], minZoom: 3 },
  { name: "카스피해", position: [41.5, 50.5], minZoom: 3 },
  { name: "홍해", position: [20.5, 38.5], minZoom: 4 },
  { name: "에게해", position: [38.6, 25.2], minZoom: 5 },
  { name: "아드리아해", position: [42.7, 15.5], minZoom: 5 },
  { name: "이오니아해", position: [37.8, 18.3], minZoom: 5 },
  { name: "티레니아해", position: [39.8, 12.2], minZoom: 5 },
  { name: "페르시아만", position: [27.2, 51.0], minZoom: 5 },
  { name: "나일강", position: [25.5, 31.6], minZoom: 5 },
  { name: "티그리스강", position: [34.3, 44.3], minZoom: 6 },
  { name: "유프라테스강", position: [35.7, 39.3], minZoom: 6 },
  { name: "다뉴브강", position: [44.4, 24.5], minZoom: 6 },
  { name: "마르마라해", position: [40.72, 28.2], minZoom: 7 },
  { name: "다르다넬스 해협", position: [40.2, 26.4], minZoom: 7 },
  { name: "보스포루스 해협", position: [41.2, 29.1], minZoom: 7 },
];

function waterIcon(name: string): L.DivIcon {
  return L.divIcon({
    className: "map-water-label",
    html: `<div>${name}</div>`,
    iconSize: undefined,
    iconAnchor: [0, 0],
  });
}

export function WaterLabels() {
  const map = useMap();
  const [zoom, setZoom] = useState(() => map.getZoom());
  useMapEvents({
    zoomend: () => setZoom(map.getZoom()),
  });

  return (
    <>
      {WATER_LABELS.filter((w) => zoom >= w.minZoom).map((w) => (
        <Marker
          key={w.name}
          position={w.position}
          icon={waterIcon(w.name)}
          interactive={false}
          zIndexOffset={-2000}
        />
      ))}
    </>
  );
}
