import { useMemo } from "react";
import { create } from "zustand";
import { snapToFloorSnapshot, TIMELINE_START_YEAR } from "../lib/year";

interface AppState {
  /** 슬라이더의 연속값. -3000 ~ 1920 (PLAN.md §5.3) */
  selectedYear: number;
  /** 지도에서 클릭된 콘텐츠 id. null이면 EmptyStateList 표시 */
  selectedRegionId: string | null;
  /**
   * 가장 최근에 클릭된 폴리곤/마커의 원본 이름. selectedRegionId가 null인데 이 값이 있으면
   * "매칭되는 콘텐츠가 없는 지역을 클릭함" 상태 — ContentPanel이 EmptyStateList 대신
   * "콘텐츠 없음" 안내를 보여주는 데 쓴다 (PLAN.md §5.5-4).
   */
  lastClickedName: string | null;
  /** 드래그 중 여부 (지도 리렌더 디바운스 트리거용) */
  isDragging: boolean;
  /** data/MAP_DATA_SOURCE.md §3-1의 41개 스냅샷 연도 (오름차순). 로드 전에는 빈 배열 */
  snapshotYears: number[];

  setYear: (year: number) => void;
  setDragging: (isDragging: boolean) => void;
  /** 콘텐츠 id로 직접 선택 (마커 클릭, 목록 클릭 등) */
  selectRegion: (id: string | null) => void;
  /** 지도 폴리곤/마커 클릭 결과 반영 (매칭 실패 시 id=null, name은 유지) */
  setClickResult: (id: string | null, name: string | null) => void;
  setSnapshotYears: (years: number[]) => void;
}

export const useAppStore = create<AppState>((set) => ({
  selectedYear: TIMELINE_START_YEAR,
  selectedRegionId: null,
  lastClickedName: null,
  isDragging: false,
  snapshotYears: [],

  setYear: (year) => set({ selectedYear: year }),
  setDragging: (isDragging) => set({ isDragging }),
  selectRegion: (id) => set({ selectedRegionId: id, lastClickedName: null }),
  setClickResult: (id, name) => set({ selectedRegionId: id, lastClickedName: name }),
  setSnapshotYears: (years) => set({ snapshotYears: [...years].sort((a, b) => a - b) }),
}));

/**
 * snappedYear는 selectedYear의 파생값 — 별도 상태로 이중 관리하지 않는다 (PLAN.md §5.3).
 * snapshotYears가 아직 로드되지 않았으면 selectedYear를 그대로 반환한다.
 */
export function useSnappedYear(): number {
  const selectedYear = useAppStore((s) => s.selectedYear);
  const snapshotYears = useAppStore((s) => s.snapshotYears);
  return useMemo(() => {
    if (snapshotYears.length === 0) return selectedYear;
    return snapToFloorSnapshot(selectedYear, snapshotYears);
  }, [selectedYear, snapshotYears]);
}
