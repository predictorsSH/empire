import { MapPanel } from "./Map/MapPanel";
import { ContentPanel } from "./Content/ContentPanel";
import type { ContentEntry } from "../types/content";

interface MainLayoutProps {
  contentEntries: ContentEntry[];
}

/**
 * PLAN.md §5.6: 데스크톱은 좌(지도)/우(패널) 분할, 모바일(<768px, Tailwind `md` 미만)은
 * 상하 스택(지도 위, 패널 아래)으로 전환.
 */
export function MainLayout({ contentEntries }: MainLayoutProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col md:flex-row">
      <div className="min-h-[45vh] flex-1 md:min-h-0 md:basis-[62%]">
        <MapPanel contentEntries={contentEntries} />
      </div>
      <div className="min-h-[35vh] flex-1 border-t border-[var(--color-border)] md:min-h-0 md:basis-[38%] md:border-t-0 md:border-l">
        <ContentPanel contentEntries={contentEntries} />
      </div>
    </div>
  );
}
