# 지도 데이터 소스 조사 결과

작성일: 2026-07-12
작성자: 기획 담당 에이전트

이 문서는 "지도 데이터 조사" 작업(과업 1)의 결과다. 실제로 접근 가능함을 curl/API 호출로
직접 검증했고(다운로드 성공, 파일 크기, 라이선스, 스키마 확인), 그 근거를 아래에 남긴다.

## 1. 채택 소스

**저장소**: [`aourednik/historical-basemaps`](https://github.com/aourednik/historical-basemaps)
(사용자가 예시로 지목한 바로 그 프로젝트)

- **설명**: 세계 각국/문화권의 georeferenced 경계를 연도별 GeoJSON 스냅샷으로 제공하는
  프로젝트. 약 5,000년(사실은 -123,000년부터)의 정치적 조직을 다룸.
- **라이선스**: **GPL-3.0** (GitHub API로 확인: `license.spdx_id = "GPL-3.0"`,
  저장소 루트의 `LICENSE` 파일이 GNU GPL v3 전문임을 직접 다운로드해서 확인함).
  - ⚠️ **주의**: GPL-3.0은 코드용 카피레프트 라이선스이며 지리 데이터에 적용된 것이 다소
    이례적이다. 이 앱이 데이터를 "링크"가 아니라 런타임에 별도 GeoJSON 파일로 fetch/표시만
    한다면(정적 애셋으로 취급) 카피레프트 전파 리스크는 낮다고 보는 게 일반적 해석이지만,
    법적으로 확정된 판단은 아니다. 권고:
    1. 출처/라이선스 표기(footer에 "지도 경계 데이터: aourednik/historical-basemaps,
       GPL-3.0" + 링크)를 반드시 넣는다.
    2. 이 데이터셋을 앱 코드베이스에 소스 형태로 "포함(vendor)"할 경우에도 데이터 파일
       자체는 GPL-3.0으로 유지하고, 앱 코드(React/TS)와는 별도 디렉토리·별도 라이선스임을
       README에 명시한다.
    3. 상업적 배포를 고려하게 되면 재차 법률 검토를 권장한다(이번 조사는 기술적 가용성
       확인이 목적).

## 2. 실제 접근성 검증 (2026-07-12 기준)

- `index.json` 다운로드 성공: `https://raw.githubusercontent.com/aourednik/historical-basemaps/master/index.json`
  (235KB, HTTP 200). 구조: `{ "years": [ { "year": <int>, "filename": "world_XXXX.geojson", "countries": [<string>, ...] }, ... ] }`
  총 **53개 연도 스냅샷**이 존재 (아래 3번 참고).
- 개별 GeoJSON 스냅샷 다운로드 성공 예시 (raw.githubusercontent.com):
  - `world_bc2000.geojson` — 858,843 bytes
  - `world_bc1500.geojson` — 874,760 bytes
  - `world_bc500.geojson` — 915,849 bytes
  - `world_100.geojson` — 1,182,428 bytes
  - `world_700.geojson` — 966,987 bytes
  - `world_1300.geojson` — 1,021,649 bytes
  - `world_1500.geojson` — 1,339,178 bytes
  - `world_1800.geojson` — 1,883,014 bytes (가장 큰 편, 부족·부족연맹까지 세분화되어 있음)
  - `world_1900.geojson` — 1,296,946 bytes
  - 대체로 **연도당 0.8MB ~ 1.9MB** 범위. 서비스 전체 41개 연도(3번 참고)를 모두 받아도
    합계 약 45~55MB 수준으로, 정적 애셋으로 다루기에 무리 없는 크기다.
- CORS: `raw.githubusercontent.com`과 `cdn.jsdelivr.net` 모두
  `access-control-allow-origin: *` 헤더를 반환함을 직접 확인 → 브라우저에서 fetch 가능
  (별도 프록시 서버 불필요).
- 저장소 전체 크기: GitHub API 기준 약 134MB(`size: 134674` KB) — 전체를 클론할 필요는
  없고, 필요한 연도 파일만 개별 다운로드하면 됨.
- 안정적 참조를 위한 pinned commit SHA (조사 시점 master HEAD):
  `62d8f1a03a71f2d3ff17f2d166f7553f256bce68` (2026-01-26 커밋).

## 3. 제공되는 연도 스냅샷 (전체 53개, index.json에서 직접 파싱)

```
-123000, -10000, -8000, -5000, -4000, -3000, -2000, -1500, -1000, -700, -500, -400,
-323, -300, -200, -100, -1, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100,
1200, 1279, 1300, 1400, 1492, 1500, 1530, 1600, 1650, 1700, 1715, 1783, 1800, 1815,
1880, 1900, 1914, 1920, 1930, 1938, 1945, 1960, 1994, 2000, 2010
```

(음수 = 기원전. astronomical year numbering이 아니라 "연도 0 없음" 표기 관용 — 즉 `-1`은
기원전 1년, 그다음이 `100`으로 건너뜀. 이 프로젝트는 자체적으로도 1~99 CE 구간 스냅샷이 없다.)

### 3-1. 이 앱이 실제로 사용할 부분집합 (지중해-흑해 권역 타임라인, 41개 연도)

`PLAN.md`에서 확정한 타임라인 범위(기원전 3000년 ~ 서기 1920년)에 맞춰 아래 41개 연도만
사용한다 (선사시대 스냅샷과 1920년 이후 스냅샷은 이 프로젝트 범위 밖이라 제외):

```
-3000, -2000, -1500, -1000, -700, -500, -400, -323, -300, -200, -100, -1,
100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200, 1279, 1300,
1400, 1492, 1500, 1530, 1600, 1650, 1700, 1715, 1783, 1800, 1815, 1880, 1900, 1914, 1920
```

## 4. 데이터 스키마 (실제 다운로드한 파일에서 직접 확인)

표준 GeoJSON `FeatureCollection`. 각 `Feature`는 `Polygon`/`MultiPolygon` geometry +
`properties`:

```json
{
  "type": "Feature",
  "properties": {
    "NAME": "Ottoman Empire",
    "ABBREVN": "Ottoman Empire",
    "SUBJECTO": null,
    "PARTOF": null,
    "BORDERPRECISION": 1,
    "TYPE": null
  },
  "geometry": { "type": "Polygon", "coordinates": [...] }
}
```

- **`NAME`**: 국가/문명/부족의 표시 명칭. 지도에서 지역을 식별하는 **1차 키**로 사용.
  값이 `null`이거나 문자열 `"None"`인 feature가 존재한다(무주지·불명확 지역·바다 여백
  등을 표시하는 것으로 추정) — 렌더링 시 이런 feature는 클릭 비활성/스타일 다르게 처리 권장.
- **`ABBREVN`**: 대체로 `NAME`과 동일하거나 축약형. 보조 라벨용.
- **`SUBJECTO`**: 종주국/식민 지배국(있는 경우). 예: 식민지 시대에 유용, 고대~중세엔 대개 null.
- **`PARTOF`**: 상위 문화권/연방 소속(있는 경우).
- **`BORDERPRECISION`**: 1~3 척도로 국경의 정확도(신뢰도) 등급. UI에서 "이 경계는
  근사치입니다" 같은 안내에 활용 가능.
- 좌표계는 WGS84 (EPSG:4326), 별도 변환 불필요 (Leaflet/D3-geo 모두 기본 지원).
- **주의 — `NAME` 값이 연도마다 바뀐다**: 같은 정치체라도 스냅샷마다 표기가 다르다.
  실사용 확인 예시:
  - 로마: `world_bc100` → `"Rome"`, `world_100` → `"Roman Empire"`
  - 비잔티움: `world_700` → `"Eastern Roman Empire"`, `world_900`~`world_1400` →
    `"Byzantine Empire"`
  - 셀주크: `world_1100` → `"Seljuk Empire"`, `world_1300`/`world_1400` →
    `"Seljuk Caliphate"`
  - 불가리아: `world_700` → `"Bulgars"`/`"Danube Bulgars"`, `world_900` → `"Bulgars"`,
    `world_1000`/`world_1300` → `"Bulgar Khanate"`
  - 조지아: `world_700` → `"Georgian Kingdom"`, `world_1000`/`world_1300` →
    `"Kingdom of Georgia"`/`"Georgia"`
  - 이런 이유로, 향후 콘텐츠 스키마를 설계할 때 지도 개체와 연결하는 필드는 **단일
    문자열이 아니라 문자열 배열(예: `mapEntityNames: string[]`)** 이어야 한다 (여러 연도에
    걸친 표기 변형을 모두 담기 위함). 이 제약은 `PLAN.md`의 "콘텐츠 스키마 요구사항" 절에도
    명시해 두었다.

### 4-1. 지중해-흑해 권역 관련 실제 확인된 개체명 (일부 발췌, 실측)

| 스냅샷 연도 | 관련 `NAME` 값 (실측) |
|---|---|
| -1500 | Hittites, Egypt, Assyria, Babylonia, Kingdom of David and Solomon, Urartu, Greek city-states, Phrygians |
| -500 | Achaemenid Empire, Carthaginian Empire, Rome, Greek city-states, Etrurians |
| 100 | Roman Empire, Parthian Empire, Armenia, Bosporian Kingdom, Dacia |
| 700 | Eastern Roman Empire, Sasanian Empire, Umayyad Caliphate, Khazars, Bulgars, Danube Bulgars, Georgian Kingdom |
| 900 | Byzantine Empire, Abbasid Caliphate, Khazars, Kyivan Rus (`"Kyivan Rus"`), Bulgars |
| 1000/1100 | Byzantine Empire, Kyivan Rus, Seljuk Empire, Kingdom of Georgia, Venice, Bulgar Khanate |
| 1300/1400 | Byzantine Empire, Seljuk Caliphate, Trebizond, Venice, Mamluke Sultanate |
| 1500/1600 | Ottoman Empire, Venice, Genoa(1600부터 등장), Mamluke Sultanate(1500), Crimean Khanate(1600) |
| 1800/1900 | Ottoman Empire, Russian Empire, Austrian Empire→Austria Hungary(1900), Greece(1900), Serbia, Bulgaria, Romania, Montenegro, Bosnia-Herzegovina |

⚠️ **주의**: 십자군 국가들(예루살렘 왕국, 에데사 백국 등)과 폰투스 왕국, 프리기아/리디아,
헬레니즘 개별 왕국(셀레우코스·프톨레마이오스·안티고노스를 세분화한 명칭) 등 일부는 이
데이터셋에서 독립된 `NAME`으로 확인되지 않았다(더 큰 상위 개체나 "Islamic city-states" 같은
포괄 범주에 흡수되어 있을 가능성이 높음). 이런 항목은 향후 콘텐츠 데이터에서
지도 개체명 필드를 빈 배열로 두고 대신 대표 좌표(수도/핵심 지역 좌표)로 지도 위에 근사
마커를 표시하는 **폴백 전략**이 필요하다 (7번 참고). 개발 시 해당 연도 GeoJSON을 열어 실제로
매칭되는 `NAME`이 있는지 재확인하는 것을 권장.

## 5. 슬라이더 "1년 단위 이동" ↔ "이산적 스냅샷" 절충 전략

요구사항: 슬라이더는 연속적으로(1년 단위 클릭/드래그) 움직여야 하지만, 실제 국경 데이터는
41개의 이산적 스냅샷 연도만 존재. 전략:

1. **슬라이더 자체의 값(연도)은 연속적**이다. `-3000` ~ `1920` 사이 모든 정수 연도를
   `year` 상태값으로 가질 수 있다 (드래그 중에는 매 프레임 갱신, 우측 패널 "현재 연도"
   표시도 실시간 갱신).
2. **지도 렌더링에 쓰는 GeoJSON만 "가장 가까운 스냅샷 연도"로 스냅**한다.
   - `snapToNearestSnapshot(year, SNAPSHOT_YEARS)` 유틸: 이진 탐색으로 O(log n) 처리.
   - 예: 슬라이더가 `-650`이면 스냅샷 목록 중 `-700`과 `-500` 중 더 가까운 `-700`을 선택.
     동률(정확히 중간)이면 더 이른 연도(과거)를 우선 — 국경 변화가 시작 시점 기준이라는
     암묵적 규칙으로 일관성 유지.
3. **지도 갱신에는 디바운스/스로틀을 건다.** 드래그 중 매 픽셀마다 GeoJSON을 다시 그리면
   비용이 크므로, 스냅샷 연도가 실제로 바뀌는 시점에만 지도 레이어를 교체한다
   (= "스냅샷 연도가 바뀔 때만" fetch/리렌더, 그 사이 프레임에서는 연도 숫자 라벨만 갱신).
4. **현재 스냅샷 연도와 실제 슬라이더 연도가 다를 수 있음을 UI로 알려준다.** 예: 슬라이더가
   `기원전 1720년`을 가리키는데 지도는 `기원전 1500년 스냅샷` 기준이면, 지도 상단에
   "표시 중: 기원전 1500년 국경 (근사)" 같은 캡션을 작게 보여준다.
5. **우측 콘텐츠 패널은 스냅샷이 아니라 슬라이더의 실제 연도로 필터링**하는 것을 원칙으로
   한다 — 콘텐츠는 스냅샷 제약을 받지 않으므로 1년 단위 정밀도를 그대로 살릴 수 있다
   (예: "카데시 전투(기원전 1274년)"처럼 특정 연도 이벤트도 정확히 표현 가능). 콘텐츠
   스키마의 최종 확정은 사용자의 `history.md` 정리 이후로 미뤄졌지만, 이 필터링 방식이
   가능하려면 콘텐츠 항목마다 연도 범위(시작/종료 연도) 필드가 반드시 있어야 한다는 제약을
   `PLAN.md`에 요구사항으로 남겨두었다.
6. **지도-패널 연동 시점 차이 처리**: 사용자가 지도에서 지역(폴리곤)을 클릭하면 클릭된
   `feature.properties.NAME`을 읽어 콘텐츠 데이터의 지도 개체명 배열에서 매칭되는 콘텐츠를
   찾고, 그 콘텐츠의 연도 범위가 현재 슬라이더 연도를 정확히 포함하지 않아도(예: 스냅샷
   연도 기준으로는 존재하는데 슬라이더가 그 경계 부근일 때) 가장 가까운 시기의 콘텐츠를
   보여주고 "당시(기원전 OOO년) 기준 설명"이라고 안내한다.

## 6. 데이터 로딩/호스팅 전략 (구현 권고)

두 가지 옵션을 조사했고 **옵션 B(부분 벤더링)**를 권장한다.

- **옵션 A: 런타임에 CDN에서 직접 fetch.**
  `https://cdn.jsdelivr.net/gh/aourednik/historical-basemaps@62d8f1a03a71f2d3ff17f2d166f7553f256bce68/geojson/world_XXXX.geojson`
  형태로 커밋 해시를 pin해서 사용. jsDelivr는 `access-control-allow-origin: *`,
  `cache-control: public, max-age=604800`(7일 캐시)를 반환함을 직접 확인했다. 장점: 저장소
  용량 부담 없음. 단점: 오프라인 개발 불가, 외부 서비스 장애에 의존.
- **옵션 B (권장): 빌드 시 다운로드 스크립트로 41개 연도 파일만 `public/data/geojson/`에
  벤더링(vendor)해서 리포지토리에 커밋.** 총 용량 약 45~55MB. 장점: 오프라인 개발 가능,
  외부 의존성 없음, 렌더링 성능 예측 가능. 단점: 저장소 용량 증가(git 이력에 계속 남음 →
  Git LFS 사용을 고려할 수 있으나 필수는 아님, 41개 파일 총합 50MB 내외는 일반 git으로도
  허용 가능한 수준).
  - 다운로드 스크립트 예시 (개발 에이전트가 그대로 구현하면 됨, `scripts/fetch-map-data.mjs`):
    `SNAPSHOT_YEARS` 배열을 순회하며 raw.githubusercontent.com의 `index.json`에서
    `year`→`filename` 매핑을 조회한 뒤 그대로 다운로드 (파일명 규칙을 직접 재현할 필요
    없음: 예) `-1500` → `world_bc1500.geojson`, `100` → `world_100.geojson`).
  - 각 파일은 이후 앱에서 `/data/geojson/world_1500.geojson`처럼 정적 애셋으로 fetch.
- 두 옵션 모두 `index.json`(연도→파일명 매핑)을 함께 로컬에 저장해두면 파일명 규칙을
  하드코딩하지 않아도 된다.

## 7. 매칭 안 되는(폴리곤 없는) 콘텐츠 처리 — 폴백 전략

일부 콘텐츠(십자군 국가, 폰투스 왕국 등, 4-1절 참고)는 이 데이터셋에서 독립 폴리곤으로
존재하지 않을 수 있다. 이 경우 권고하는 처리 방식:

- 콘텐츠 항목에 대표 좌표(수도 또는 핵심 지역의 `[lon, lat]`)를 채워둔다.
- 지도 위에 해당 연도 구간에서 폴리곤 매칭이 안 되는 콘텐츠는 **작은 마커(핀) 아이콘**으로
  표시하고, 클릭 시 동일하게 우측 패널이 열리도록 한다.
- 이렇게 하면 폴리곤 유무와 무관하게 "지도에서 클릭 → 우측 패널 갱신" UX를 100% 항목에서
  보장할 수 있다.

## 8. 대안으로 검토했으나 채택하지 않은 데이터셋 (참고용)

- **Cliopatria** (Zenodo, 3400 BCE–2024 CE, `cliopatria.geojson` 단일 파일): 시간 커버리지는
  넓지만 단일 대용량 파일 + 오픈 라이선스 여부·스키마를 직접 검증하지 않았음. 향후 국경
  정확도 보완용 2차 소스로 고려 가능.
- **CShapes 2.0**: 1886–2019만 커버(우리 타임라인의 극히 일부), CC BY-NC-SA 4.0(비영리 한정)
  이라 상업적 확장성 낮음. 채택 안 함.
- **geoBoundaries**: 현재(2020년대) 국경만 제공, 역사 지도 용도에 부적합. 채택 안 함.

## 9. 출처 (조사 중 참고한 링크)

- https://github.com/aourednik/historical-basemaps
- https://github.com/aourednik/historical-basemaps/blob/master/README.md
- https://github.com/aourednik/historical-basemaps/blob/master/index.json
- https://raw.githubusercontent.com/aourednik/historical-basemaps/master/geojson/ (개별 연도 파일들)
- https://cdn.jsdelivr.net/gh/aourednik/historical-basemaps@master/geojson/world_1500.geojson (CDN 미러 검증)
- https://api.github.com/repos/aourednik/historical-basemaps (라이선스/크기/커밋 SHA 확인)
