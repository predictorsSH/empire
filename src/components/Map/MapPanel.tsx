import { HistoricalMap } from "./HistoricalMap";
import { MapCaption } from "./MapCaption";
import type { ContentEntry } from "../../types/content";

interface MapPanelProps {
  contentEntries: ContentEntry[];
}

export function MapPanel({ contentEntries }: MapPanelProps) {
  return (
    <div className="relative h-full min-h-[280px] w-full overflow-hidden">
      <HistoricalMap contentEntries={contentEntries} />
      <MapCaption />
    </div>
  );
}
