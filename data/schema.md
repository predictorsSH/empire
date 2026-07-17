# 콘텐츠 데이터 스키마 (초안 v0.1)

> **상태: 초안.** `history.md`가 "문명 등장" 절까지만 작성된 시점에서 잡은 스키마다.
> `PLAN.md` §3의 최소 요구사항(`id`, `startYear`/`endYear`, `mapEntityNames`, `approxCenter`)을
> 만족시키는 선에서, `history.md`가 실제로 쓰인 방식(문명/지역 단위로 서술, 본문 중간에 연도가
> 섞여 있음)에 맞춰 설계했다. `history.md`가 더 진행되면(예: 히타이트, 그리스 고전기, 로마 등)
> 이 스키마로 계속 항목을 추가하면 되고, 구조 자체가 안 맞는 부분이 나오면 다시 조정한다.

## 1. 최상위 형태

`content.json`은 `ContentEntry` 객체의 배열이다.

```ts
type ContentEntry = {
  id: string;                 // kebab-case 고유 id (예: "mesopotamia-sumer-and-successors")
  kind: "overview" | "civilization"; // 아래 §2 참고
  title: string;               // 우측 패널/목록에 표시될 제목
  category: string;            // history.md의 상위 소제목(H2) 그대로. 그룹핑/색상 구분용
  startYear: number;           // BCE는 음수. history.md 본문에서 가장 이른 연도(추정 포함)
  endYear: number;             // 이 항목이 "현재 진행 중"으로 간주되는 마지막 연도
  mapEntityNames: string[];    // 지도 GeoJSON의 properties.NAME과 매칭할 표기들. 빈 배열 허용(overview용)
  mapEntityNamesVerified: boolean; // true = 실제 GeoJSON에서 확인됨, false = 추정치(개발 시 재확인 필요)
  approxCenter: [number, number]; // [lon, lat] 폴백 좌표 / 지도 포커스 이동용 중심점
  summary: string;             // 목록(EmptyStateList)에 쓸 1~2문장 요약
  body: string[];              // 본문 문단 배열. history.md의 bullet을 문단 단위로 재구성
  keyEvents?: { year: number; label: string }[]; // 본문에 언급된 특정 연도 사건
  relatedIds?: string[];       // 같은 시대/인접 지역 등 연관 항목 id (지금은 비워둠, 항목이 늘면 채움)
  source: "book-excerpt" | "placeholder"; // book-excerpt = history.md 기반, placeholder = 에이전트 지식으로 채움
  sourceNote?: string;         // 근거/미검증 사항/추후 보완 필요 사항 메모
};
```

## 2. `kind` 필드: "overview" vs "civilization"

- `"civilization"`: 지도 위 특정 폴리곤(또는 폴백 마커)에 대응되는 일반적인 항목.
  `mapEntityNames`가 최소 1개 이상 있어야 하고(폴백이라도), 지도 클릭 → 이 항목 표시 흐름을 탄다.
- `"overview"`: `history.md`의 "문명 등장" 절처럼 특정 정치체가 아니라 시대적 배경/개관을 다루는
  항목. `mapEntityNames: []`로 두고 지도 클릭으로는 도달하지 않는다. 대신 `EmptyStateList`
  (미선택 상태에서 보여주는 목록, `PLAN.md` §5.1)에 연도 범위가 걸치는 동안 "시대 배경 읽기"
  카드로 고정 노출하는 방식을 제안한다. 이런 항목이 앞으로도 몇 개 더 생길 수 있다(예: "청동기
  시대 붕괴", "헬레니즘화" 같은 챕터 서두 개관).

## 3. `startYear`/`endYear`를 정하는 원칙

- `history.md` 본문에 연도가 명시된 경우 그대로 사용.
- 명시되지 않은 경우(예: 이집트 문명 종료 시점, 페니키아 문명 종료 시점) 역사적으로 통용되는
  자연스러운 종착점을 추정치로 채우고 `sourceNote`에 "history.md에 명시 안 됨, 추정치"라고
  남긴다. 사용자가 해당 절을 더 쓰면 그때 확정값으로 교체.
- 겹치는 시대/지역은 허용한다 (`PLAN.md` §3.2에서 이미 전제한 설계 — 지도 클릭이 1차 식별자,
  연도는 2차 필터).

## 4. `mapEntityNames`를 정하는 원칙

- `data/MAP_DATA_SOURCE.md` §4-1에 실측 확인된 값(Egypt, Assyria, Babylonia, Achaemenid Empire,
  Rome, Greek city-states 등)은 그대로 사용하고 `mapEntityNamesVerified: true`.
- 그 외(수메르, 크레타/미노아, 미케네, 트로이, 페니키아 등)는 이 데이터셋 특유의 명명 관습에서
  나올 법한 이름으로 **추정**해 채웠고 `mapEntityNamesVerified: false`로 표시했다. 개발 에이전트가
  실제로 `-3000`/`-2000`/`-1500` 스냅샷 GeoJSON을 열어서 `NAME` 값을 확인하고 교정해야 한다.
  해당 연도에 독립 폴리곤이 없으면(가능성 있음: 수메르 도시국가들은 개별 폴리곤이 아니라
  "Sumer" 하나로 뭉쳐 있거나, 반대로 아예 없을 수도 있음) `mapEntityNames: []` + `approxCenter`
  마커 폴백으로 전환.

## 5. 본문(`body`) 재구성 원칙

- `history.md`의 bullet point들을 그대로 나열하지 않고, 같은 소주제끼리 묶어 2~4개 문단으로
  재구성했다. 원문 bullet의 정보 손실은 없도록 했다 (표현만 문단화).
- 원문에 있던 정보 중 "다른 항목에 더 어울리는 문장"(예: 메소포타미아 절에 있던 이집트 관련
  서술)은 해당 항목으로 옮겼다.

## 6. 결정 사항 / 아직 열려있는 질문

1. **분리 원칙 확정 (사용자 지시, 2026-07-12): 구분 가능하면 최대한 나눈다.** 지리적으로
   다른 지도 개체에 대응될 여지가 있으면 텍스트 분량이 한 문장뿐이더라도 별도 항목으로
   쪼갠다. 이에 따라:
   - 에게 문명 → 미노아/미케네/트로이 3항목 유지.
   - 메소포타미아 계승 국가들 → 기존의 통합 1항목("mesopotamia-sumer-and-successors")을
     폐기하고, `sumer`(수메르 도시국가 시대) / `akkadian-empire`(사르곤의 정복) /
     `ur-third-dynasty` / `babylonia` / `assyria` / `elam` / `media` /
     `achaemenid-persia` 총 8항목으로 분리했다.
   - 단, 이 중 `ur-third-dynasty`/`babylonia`/`assyria`/`elam`/`media`/`achaemenid-persia`
     6항목은 history.md에 "계승 국가 목록"으로 이름만 언급되고 아직 개별 서술이 없어 본문이
     1문장짜리 **스텁**이다 (`sourceNote`에 "스텁 항목" 명시). history.md에 각 국가별 절이
     추가되면 그 내용으로 본문을 확장해야 한다. `achaemenid-persia`만 추후 대제국으로서
     비중이 클 것이 명백해 통설 지식 1문단을 미리 보강해뒀다.
2. 페니키아 항목의 313년 기독교 공인, 7세기 이슬람화 서술은 "페니키아 문명" 자체의 시대범위
   (대략 로마 병합 이전)를 넘어선다. 지금은 한 항목 본문에 그대로 남겨뒀지만, 나중에 로마/
   비잔티움/이슬람 칼리프국 항목이 생기면 그쪽으로 이관하는 게 자연스러울 수 있음.
