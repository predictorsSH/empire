#!/usr/bin/env node
/**
 * 지도 데이터(historical-basemaps) 벤더링 스크립트
 *
 * data/MAP_DATA_SOURCE.md §6 "옵션 B"를 그대로 구현한다:
 *   - aourednik/historical-basemaps 저장소의 index.json(연도→파일명 매핑)을 받아온다.
 *   - MAP_DATA_SOURCE.md §3-1에 정리된 41개 스냅샷 연도 파일만 골라 public/data/geojson/에
 *     다운로드한다 (전체 53개 중 이 앱의 타임라인 범위(-3000~1920)에 해당하는 부분집합).
 *   - pinned commit SHA를 사용해 저장소가 나중에 바뀌어도 재현 가능하게 한다.
 *   - public/data/geojson/index.json에 "이 앱이 실제로 쓰는" 연도→파일명 매핑만 추려서
 *     저장해둔다 (앱 코드가 파일명 규칙을 하드코딩하지 않도록).
 *
 * 사용법: node scripts/fetch-map-data.mjs
 * 이미 받은 파일은 건너뛴다(재실행 시 이어받기 가능). 강제로 다시 받으려면 --force 옵션.
 */

import { mkdir, writeFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "public", "data", "geojson");

// pinned commit SHA — data/MAP_DATA_SOURCE.md §2
const COMMIT_SHA = "62d8f1a03a71f2d3ff17f2d166f7553f256bce68";
const RAW_BASE = `https://raw.githubusercontent.com/aourednik/historical-basemaps/${COMMIT_SHA}`;
const INDEX_URL = `${RAW_BASE}/index.json`;

// data/MAP_DATA_SOURCE.md §3-1 — 이 앱의 타임라인 범위(-3000~1920)에 해당하는 41개 스냅샷 연도
const SNAPSHOT_YEARS = [
  -3000, -2000, -1500, -1000, -700, -500, -400, -323, -300, -200, -100, -1,
  100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200, 1279, 1300,
  1400, 1492, 1500, 1530, 1600, 1650, 1700, 1715, 1783, 1800, 1815, 1880,
  1900, 1914, 1920,
];

const FORCE = process.argv.includes("--force");
const CONCURRENCY = 5;
const MAX_RETRIES = 3;

async function fetchWithRetry(url, { retries = MAX_RETRIES, asJson = false } = {}) {
  let lastErr;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
      return asJson ? await res.json() : await res.arrayBuffer();
    } catch (err) {
      lastErr = err;
      console.warn(`  재시도 ${attempt}/${retries} 실패 (${url}): ${err.message}`);
      await new Promise((r) => setTimeout(r, 500 * attempt));
    }
  }
  throw lastErr;
}

async function fileExists(p) {
  try {
    const s = await stat(p);
    return s.isFile() && s.size > 0;
  } catch {
    return false;
  }
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  console.log(`index.json 다운로드 중... (${INDEX_URL})`);
  const remoteIndex = await fetchWithRetry(INDEX_URL, { asJson: true });
  const yearToEntry = new Map(remoteIndex.years.map((e) => [e.year, e]));

  const missingYears = SNAPSHOT_YEARS.filter((y) => !yearToEntry.has(y));
  if (missingYears.length > 0) {
    console.warn(
      `경고: index.json에 없는 연도가 있습니다 (건너뜀): ${missingYears.join(", ")}`
    );
  }

  const targets = SNAPSHOT_YEARS.filter((y) => yearToEntry.has(y)).map((y) => {
    const entry = yearToEntry.get(y);
    return { year: y, filename: entry.filename };
  });

  console.log(`총 ${targets.length}개 스냅샷 파일을 받습니다 (동시 ${CONCURRENCY}개).`);

  let done = 0;
  let skipped = 0;
  let failed = [];

  async function worker(queue) {
    while (queue.length > 0) {
      const target = queue.shift();
      const outPath = path.join(OUT_DIR, target.filename);
      if (!FORCE && (await fileExists(outPath))) {
        skipped++;
        done++;
        console.log(`  [스킵] ${target.year} -> ${target.filename} (이미 존재)`);
        continue;
      }
      const url = `${RAW_BASE}/geojson/${target.filename}`;
      try {
        const buf = await fetchWithRetry(url);
        await writeFile(outPath, Buffer.from(buf));
        done++;
        console.log(
          `  [완료 ${done}/${targets.length}] ${target.year} -> ${target.filename} (${(
            buf.byteLength / 1024
          ).toFixed(0)} KB)`
        );
      } catch (err) {
        failed.push(target);
        console.error(`  [실패] ${target.year} -> ${target.filename}: ${err.message}`);
      }
    }
  }

  const queue = [...targets];
  await Promise.all(
    Array.from({ length: CONCURRENCY }, () => worker(queue))
  );

  // 앱이 쓸 "연도 -> 파일명" 매핑만 정리해서 저장 (파일명 규칙 하드코딩 방지)
  const appIndex = {
    commitSha: COMMIT_SHA,
    years: targets
      .filter((t) => !failed.includes(t))
      .sort((a, b) => a.year - b.year)
      .map((t) => ({ year: t.year, filename: t.filename })),
  };
  await writeFile(
    path.join(OUT_DIR, "index.json"),
    JSON.stringify(appIndex, null, 2)
  );

  console.log(`\n완료: ${done - skipped}개 신규 다운로드, ${skipped}개 스킵(이미 존재).`);
  if (failed.length > 0) {
    console.error(
      `실패한 연도(${failed.length}개): ${failed.map((f) => f.year).join(", ")}`
    );
    console.error("스크립트를 다시 실행하면 실패분만 재시도합니다.");
    process.exitCode = 1;
  } else {
    console.log(`public/data/geojson/index.json 작성 완료 (${appIndex.years.length}개 항목).`);
  }
}

main().catch((err) => {
  console.error("치명적 오류:", err);
  process.exit(1);
});
