import { useEffect, useState } from "react";
import { Header } from "./components/Header/Header";
import { MainLayout } from "./components/MainLayout";
import { TimelineSlider } from "./components/Timeline/TimelineSlider";
import { Footer } from "./components/Footer";
import { loadContent } from "./lib/content";
import { loadSnapshotIndex } from "./lib/geojson";
import { useAppStore } from "./store/useAppStore";
import type { ContentEntry } from "./types/content";

function App() {
  const setSnapshotYears = useAppStore((s) => s.setSnapshotYears);
  const [contentEntries, setContentEntries] = useState<ContentEntry[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([loadContent(), loadSnapshotIndex()])
      .then(([content, index]) => {
        if (cancelled) return;
        setContentEntries(content);
        setSnapshotYears(index.years.map((y) => y.year));
        setStatus("ready");
      })
      .catch((err: Error) => {
        if (cancelled) return;
        console.error(err);
        setErrorMessage(err.message);
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [setSnapshotYears]);

  return (
    <div className="flex h-screen min-h-0 flex-col">
      <Header />
      {status === "error" && (
        <div className="bg-red-100 px-4 py-2 text-sm text-red-800">
          데이터를 불러오는 중 오류가 발생했습니다: {errorMessage}
        </div>
      )}
      {status === "loading" ? (
        <div className="flex flex-1 items-center justify-center text-[var(--color-text-muted)]">
          불러오는 중...
        </div>
      ) : (
        <MainLayout contentEntries={contentEntries} />
      )}
      <TimelineSlider />
      <Footer />
    </div>
  );
}

export default App;
