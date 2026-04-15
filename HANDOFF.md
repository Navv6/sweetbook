# SweetBook — Codex Handoff

> 작성일: 2026-04-15  
> 대상: 이 프로젝트를 이어받는 Codex(또는 다른 AI 에이전트)  
> 목적: 현재 구현 상태, 아키텍처, 남은 작업을 설명한다.

---

## 1. 프로젝트 개요

SweetBook은 SweetBook Book Print API(샌드박스)를 사용하는 포토북 제작 웹앱이다.  
사용자가 사진을 업로드하고 → AI로 레이아웃 생성 → 편집 → 결제·주문 흐름으로 동작한다.

- **Next.js 16.2.2** (App Router, `app/` 디렉토리)  
  ⚠️ `node_modules/next/dist/docs/` 에 이 버전 전용 가이드가 있음. 반드시 참조.
- **React 19**, **TypeScript**, **Tailwind CSS 4**
- **Zustand 5** + `persist` 미들웨어 (로컬스토리지 영속화)
- **SweetBook Sandbox API**: `https://api-sandbox.sweetbook.com/v1`
- **OpenAI** (gpt-4o-mini, 헤드라인 자동 생성)

환경 변수:
```
SWEETBOOK_API_KEY=...
OPENAI_API_KEY=...         # optional
NEXT_PUBLIC_BASE_URL=...
```

---

## 2. 핵심 파일 지도

```
E:\sweetbook\
├── types/project.ts          # 모든 도메인 타입 (Project, GeneratedPage, TemplateSchema …)
├── lib/
│   ├── api.ts                # SweetBook API 클라이언트 + 비즈니스 로직 (서버 전용)
│   ├── spec-canvas.ts        # 판형별 캔버스 치수 + 최소 페이지 수
│   ├── template-catalog.ts   # 템플릿 정규화 헬퍼
│   └── media.ts              # 이미지 URL 유효성 검증
├── store/useProjectStore.ts  # Zustand 스토어 (클라이언트 상태)
├── app/
│   ├── page.tsx              # 랜딩
│   ├── studio/new/page.tsx   # 스튜디오 (템플릿 선택 → 프로젝트 생성)
│   ├── projects/[id]/page.tsx # 에디터
│   ├── checkout/[id]/page.tsx # 결제
│   ├── orders/[id]/page.tsx  # 주문 완료
│   └── api/
│       ├── projects/route.ts           # POST: 프로젝트 생성 + 섹션 생성
│       ├── projects/[id]/generate/     # POST: 템플릿 재생성
│       ├── projects/[id]/publish/      # POST: SweetBook 발행
│       ├── projects/[id]/estimate/     # POST: 가격 견적
│       ├── projects/[id]/order/        # POST: 주문
│       ├── projects/[id]/layout/       # POST: 섹션 순서 변경
│       ├── templates/custom/route.ts   # GET: 커스텀 템플릿 목록
│       └── templates/custom/[uid]/     # GET: 커스텀 템플릿 스키마
└── components/
    ├── editor/
    │   ├── PageCanvas.tsx          # 에디터 캔버스 (뷰/편집 모드 전환)
    │   ├── FreeLayoutEditor.tsx    # 자유 레이아웃 편집기 (드래그·리사이즈·추가·삭제)
    │   ├── InspectorPanel.tsx      # 파라미터 편집 패널
    │   ├── SectionList.tsx         # 섹션 목록 (이동·복제·삭제)
    │   └── CustomTemplateModal.tsx # 내 커스텀 템플릿 불러오기 모달
    └── preview/
        └── TemplatePageRenderer.tsx # 템플릿 렌더러 (ResizeObserver + transform:scale)
```

---

## 3. 데이터 흐름

```
[스튜디오]
  POST /api/projects
    → lib/api.ts: createProjectDraft()   → POST /books (SweetBook)
    → lib/api.ts: generateProjectSections() → GET /templates (카탈로그)
    → 결과를 useProjectStore에 upsert

[에디터] app/projects/[id]/page.tsx
  useProjectStore에서 Project 읽음
  사용자 편집:
    - updatePageParameters()  → 파라미터값 변경
    - updatePageLayoutOverride() → layoutOverrides 저장 (자유 편집)
    - updateProjectTitle()    → 제목 변경

[퍼블리시] POST /api/projects/[id]/publish
  → publishProject(project)
      1. POST /books (항상 새 book 생성)
      2. 각 페이지마다 resolveUidAndTrack():
           layoutOverrides 있으면 POST /templates (커스텀 템플릿 등록)
           없으면 기존 templateUid 사용
      3. POST /books/{id}/cover
      4. POST /books/{id}/contents (표지·내지·구분·발행 전부)
      5. POST /books/{id}/finalization
      실패 시: 등록된 커스텀 templateUid 전부 DELETE (롤백)

[결제] checkout/[id]/page.tsx
  → POST /api/projects/[id]/estimate → estimateProject()
  → POST /api/projects/[id]/order   → createProjectOrder()
```

---

## 4. 핵심 타입

```typescript
// types/project.ts

type SchemaGeneratedPage = {
  id: string;
  sectionId: string;
  pageNumber: number;
  kind: "cover" | "divider" | "content" | "publish";
  templateUid: string;          // 원본 SweetBook templateUid
  templateName: string;
  schema: TemplateSchema;       // 레이아웃 스키마 전체
  parameters: Record<string, TemplateParameterValue>;
  assignedContentItemIds: string[];
  layoutOverrides?: TemplateLayoutElement[]; // 자유 편집 결과 (있으면 POST /templates)
};

type TemplateLayoutElement = {
  element_id: string;
  type: string;           // "text" | "photo" | "rectangle" | "rowGallery" | "columnGallery" | "graphic"
  text?: string;          // 리터럴 문자 또는 "$$paramName$$" 토큰
  imageSource?: string;   // URL 또는 data: URL 또는 "$$paramName$$"
  fileName?: string;      // "$$paramName$$"
  photos?: string;        // "$$paramName$$" (갤러리용)
  position: { x: number; y: number };  // 캔버스 좌표 (px)
  width?: number;
  height?: number;
  fontSize?: number;
  // ... 기타 스타일 필드
};
```

---

## 5. 캔버스 좌표계

`lib/spec-canvas.ts` 에 확정된 치수가 있다.

| 판형 | cover (W×H) | content (W×H) | 최소 페이지 |
|---|---|---|---|
| SQUAREBOOK_HC | 2073.68 × 1041.12 | 978 × 1000.8 | 24 |
| PHOTOBOOK_A4_SC | 1742 × 1216.52 | 862.6 × 1216.52 | 24 |
| PHOTOBOOK_A5_SC | 1245 × 867.22 | 616.5 × 867.22 | 50 |

- **cover**는 앞·뒤·책등을 합친 스프레드 전체 치수다.
- 모든 element 위치·크기는 이 좌표계(px)로 저장된다.
- `TemplatePageRenderer`는 `ResizeObserver`로 컨테이너 너비를 감지해  
  `transform: scale(containerW / canvasW)` 로 렌더링한다. 직접 퍼센트로 바꾸지 말 것.

---

## 6. SweetBook API 필드명 매핑

내부 스키마와 API 필드명이 다르다. `normalizeTemplateSchema`가 변환한다.

| 내부 (`TemplateSchema`) | SweetBook API JSON |
|---|---|
| `schema.name` | `templateName` |
| `schema.bookSpecId` | `bookSpecUid` |
| `schema.parameterDefinitions` | `parameters.definitions` (중첩) |
| `schema.id` | `templateUid` |

`POST /templates` 요청 시 반드시 API 필드명으로 역변환해야 한다.  
현재 구현: `lib/api.ts` → `postCustomTemplate()`.

---

## 7. 커스텀 템플릿 관리 규칙

자유 레이아웃 편집기가 `POST /templates`로 등록한 커스텀 템플릿의 이름 패턴:

```
{원본 템플릿명}_custom_{Date.now()}
```

이 패턴으로 두 가지 필터링을 한다:

1. **카탈로그에서 제외** (`buildTemplateCatalog`): `_custom_` 포함 항목을 걸러내어  
   프로젝트 재생성 시 커스텀 템플릿이 섹션으로 섞이지 않게 한다.
2. **내 템플릿 목록** (`GET /api/templates/custom`): 반대로 `_custom_` 포함 항목만 반환.

---

## 8. 퍼블리시 주의사항

- `DELETE /books/{id}/cover` → **405 Method Not Allowed** (SweetBook 미지원)  
  → 항상 새 book을 생성(`POST /books`)해서 우회한다.
- 발행 실패 시 그 시도에서 등록된 커스텀 templateUid를 `DELETE /templates/{uid}`로 롤백.
- 페이지 카운트: cover·content·divider·publish 모두 `/contents`로 전송 (cover는 `/cover`에도 별도 전송).

---

## 9. Zustand 스토어 액션 목록

`store/useProjectStore.ts`

| 액션 | 설명 |
|---|---|
| `upsertProject(project)` | 프로젝트 저장/업데이트 |
| `replaceSections(id, sections)` | 섹션 전체 교체 |
| `duplicateSection(id, sectionId)` | 섹션 복제 |
| `deleteSection(id, sectionId)` | 섹션 삭제 |
| `updatePageParameters(id, pageId, updater)` | 페이지 파라미터 업데이트 |
| `updatePageLayoutOverride(id, pageId, elements)` | 자유 편집 레이아웃 저장 |
| `updateProjectTitle(id, title)` | 제목 변경 |
| `setEstimate(id, estimate)` | 견적 저장 |
| `setOrder(id, order)` | 주문 저장 |

persist 버전: `5`. 마이그레이션 시 반드시 버전 올릴 것.  
data URL은 persist 시 자동 제거됨 (`sanitizeProjectForPersist`).

---

## 9-1. 페이지별 제작 의도 / 플로우 / 원하는 구현

전체 사용자 플로우:

```text
/                      랜딩, 기대감 형성, 진입 CTA
  → /studio/new        템플릿/판형 선택, 프로젝트 생성
  → /projects/[id]     페이지 편집, 섹션 조정, 미리보기 확인
  → /checkout/[id]     출판 + 견적 + 배송정보 입력 + 주문
  → /orders/[id]       주문 결과 확인, 상태 추적
  → /soundtrack/[id]   책과 연결된 사운드트랙 감상
```

### `/` 랜딩

- 제작 의도:
  SweetBook이 "사진을 책으로 바꾸는 경험"이라는 점을 첫 화면에서 감성적으로 납득시키고, 사용자를 바로 제작 플로우로 밀어 넣는 페이지다.
- 핵심 사용자 행동:
  `무료로 포토북 만들기` CTA 클릭, 서비스 톤앤매너 확인, 제작 흐름의 대략적인 이해.
- 원하는 구현:
  `HeroSection`은 감성 카피 + 강한 대표 CTA + 제작 결과물 프리뷰를 담당한다.
  `DemoSection`은 실제 완성본 분위기와 편집 과정을 보강해 "이 서비스로 무엇이 만들어지는지"를 빠르게 보여준다.
  랜딩은 기능 설명보다 전환이 우선이며, 스크롤 하단으로 갈수록 "지금 바로 시작" 의지가 강해지도록 구성한다.

### `/studio/new` 스튜디오 시작

- 제작 의도:
  사용자가 처음으로 제품을 "내 책"으로 구체화하는 단계다. 템플릿과 판형 선택이 곧 책의 성격을 정하는 순간이어야 한다.
- 핵심 사용자 행동:
  테마 선택 → 판형 선택 → 미리보기 확인 → 프로젝트 생성.
- 원하는 구현:
  좌측은 템플릿 선택, 우측은 미리보기와 판형 정보를 보여주는 2단 구성을 유지한다.
  사용자는 여기서 복잡한 입력을 하지 않고, "어떤 분위기의 책을 만들지"만 결정해야 한다.
  `/api/catalog` 결과를 기반으로 live catalog를 불러오되, 실패 시에도 왜 막혔는지 안내가 명확해야 한다.
  `생성하기` 이후에는 바로 `/projects/[id]`로 이동해 작업 맥락이 끊기지 않게 한다.

### `/projects/[id]` 편집기

- 제작 의도:
  SweetBook의 핵심 가치가 드러나는 화면이다. 자동 생성된 책을 사용자가 자기 취향으로 다듬는 "실제 제작 공간"이어야 한다.
- 핵심 사용자 행동:
  제목 수정, 섹션 순서 조정, 텍스트/이미지 파라미터 편집, 자유 레이아웃 편집, 미리보기 확인, 결제로 이동.
- 원하는 구현:
  좌측 `SectionList`는 책의 구조를 보여주는 네비게이션이고, 가운데 `PageCanvas`는 현재 페이지 작업면, 우측 `InspectorPanel`은 속성 편집 영역으로 역할을 분리한다.
  사용자는 항상 "지금 어느 섹션/페이지를 편집 중인지"를 잃지 않아야 하며, 선택 상태가 시각적으로 명확해야 한다.
  에디터 상단에는 제목, 단계 표시, 템플릿/판형/페이지 수 같은 제작 메타정보가 보여야 한다.
  최소 페이지 경고, 스키마 누락, 프로젝트 없음 같은 상태는 작업 불가 이유와 복귀 경로를 같이 제시한다.
  자유 편집은 단순 데모가 아니라 실제 퍼블리시 데이터(`layoutOverrides`)로 이어지는 작업이라는 점을 전제로 설계한다.

### `/checkout/[id]` 결제/주문

- 제작 의도:
  편집 결과를 실제 출판 가능한 주문으로 전환하는 단계다. 사용자는 여기서 "내 책이 정말 만들어진다"는 확신을 받아야 한다.
- 핵심 사용자 행동:
  배송 정보 입력, 수량 조정, 미리보기 재확인, 출판 및 주문 실행.
- 원하는 구현:
  이 페이지는 단순 결제 폼이 아니라 `publish → estimate → order`를 묶는 최종 실행 단계다.
  이미 출판된 프로젝트면 재출판 없이 견적과 주문만 진행하고, 아니면 publish를 먼저 수행해야 한다.
  배송 정보 영역과 주문 요약 영역은 명확히 분리하고, 버튼 클릭 시 어떤 서버 작업이 발생하는지 사용자에게 모호하지 않아야 한다.
  실패 시에는 `출판 실패`인지 `주문 실패`인지 구분된 메시지가 필요하다.

### `/orders/[id]` 주문 완료/상태 추적

- 제작 의도:
  결제가 끝난 뒤 불안감을 줄이고, 사용자가 주문이 정상 접수되었음을 확인하도록 하는 안심 페이지다.
- 핵심 사용자 행동:
  주문 상태 확인, 수령 정보 재확인, webhook 이벤트 확인, 사운드트랙 진입.
- 원하는 구현:
  주문 정보가 local state에만 의존하지 않도록 `/api/projects/[id]` 재동기화가 유지되어야 한다.
  이 화면은 "완료" 배너만 보여주는 페이지가 아니라 주문 이후 상태 추적 허브여야 한다.
  webhook 이벤트는 시간순으로 보이고, 주문/책/송장 정보가 들어오면 바로 읽을 수 있어야 한다.
  하단 QR 영역은 포토북 경험을 디지털로 확장하는 장치이므로, 부가 기능이 아니라 후속 감성 경험으로 다뤄야 한다.

### `/soundtrack/[id]` 사운드트랙

- 제작 의도:
  책을 다 본 뒤에도 감정이 이어지도록 만드는 애프터 경험 페이지다. 기능보다 분위기와 몰입이 더 중요하다.
- 핵심 사용자 행동:
  오디오 재생, 책 제목과 연결된 감정선 확인, 모바일에서 QR 유입 후 즉시 감상.
- 원하는 구현:
  화면은 단일 목적이어야 하며, 불필요한 네비게이션 없이 재생 경험에 집중한다.
  `project`가 없더라도 URL query의 제목 정도는 받아서 완전히 비어 보이지 않게 한다.
  `loading`, `audioUrl 없음`, `생성 가능`, `재생 가능` 상태를 명확히 나눠야 한다.
  데스크톱보다는 QR 진입 모바일 사용성을 우선해 레이아웃과 문구를 단순하게 유지한다.

### 공통 구현 원칙

- 각 페이지는 "이전 단계의 결정을 다음 단계에서 이어받는 경험"이어야 한다. 페이지 전환 시 맥락이 초기화되면 안 된다.
- 단계형 서비스이므로 `StepIndicator`와 상단 메타 정보는 단순 장식이 아니라 현재 위치를 알려주는 핵심 UI다.
- 에러/빈 상태/복귀 CTA는 모든 단계에서 일관된 톤으로 제공한다.
- 문서나 후속 작업을 할 때는 "이 페이지가 제품 퍼널에서 어떤 역할을 하는가"를 먼저 적고, 그다음 UI나 API 작업을 붙이는 방식이 좋다.

---

## 10. 남은 작업 / 알려진 이슈

### 높은 우선순위
- [ ] **A5 최소 50페이지**: 현재 UI 경고가 24페이지 기준 하드코딩됨  
  (`app/projects/[id]/page.tsx` 의 `pageCount < 24` 부분)  
  → `MIN_PAGES[project.bookSpecId]`로 동적으로 읽도록 수정 필요
- [ ] **자유 편집 시 data URL 이미지**: `layoutOverrides` 안에 data URL이 있으면  
  `sanitizeProjectForPersist`가 제거하지 않아 localStorage 과부하 가능  
  → `sanitizeProjectForPersist`에서 `layoutOverrides` 내 `imageSource`가 data:이면 제거하거나 별도 저장 필요
- [ ] **커스텀 템플릿 photo element**: `POST /templates`의 `elements[].imageSource`에  
  data URL을 직접 넣으면 API가 거부할 수 있음 (미검증)  
  → 먼저 S3/CDN에 업로드 후 URL로 교체하는 흐름 필요

### 중간 우선순위
- [ ] **FreeLayoutEditor 터치 지원**: 현재 mousemove/mouseup만 구현, 모바일 미지원
- [ ] **레이아웃 되돌리기 (Undo)**: 자유 편집에 Ctrl+Z 없음
- [ ] **내 템플릿 썸네일**: `CustomTemplateModal`에 미리보기 없음 (이름만 표시)
- [ ] **프로젝트 목록 페이지**: 현재 없음 — 로컬스토리지의 모든 프로젝트를 나열하는 `/projects` 페이지

### 낮은 우선순위
- [ ] **카탈로그 캐시 무효화**: `templateCatalogPromise`가 서버 재시작 전까지 유지됨  
  → 커스텀 템플릿 삭제 후 즉시 반영 안 됨
- [ ] **webhook 이벤트 표시**: `ProjectWebhookEvent[]` 타입 정의됨, UI 미구현
- [ ] **다크모드**: Tailwind CSS 4 다크모드 설정 검토

---

## 11. 코드 스타일 규칙

- `"use client"` — 클라이언트 컴포넌트에 필수 (hooks, 브라우저 API 사용 시)
- API 라우트는 `lib/api.ts` 서버 함수를 호출하는 thin wrapper
- 에러는 `NextResponse.json({ message }, { status: 500 })`
- 동적 라우트 params: `const { id } = await context.params` (Next.js 16 비동기 params)
- 타입 검사: `npx tsc --noEmit` 통과 필수

---

## 12. 빠른 시작

```bash
cd E:\sweetbook
cp .env.example .env.local   # SWEETBOOK_API_KEY, OPENAI_API_KEY 입력
npm install
npm run dev
```

변경 후 항상:
```bash
npx tsc --noEmit
```

---

## 13. 2026-04-15 Recent Progress Update

### Completed

- Minimum page warning now uses `lib/spec-canvas.ts`
  - `PHOTOBOOK_A5_SC`: minimum `50`
  - `PHOTOBOOK_A4_SC`, `SQUAREBOOK_HC`: minimum `24`
  - editor warning text is dynamic
  - checkout entry is blocked when the project is still below the minimum page count

- Zustand persist sanitization now strips `data:` URLs from:
  - `coverImageUrl`
  - `contentItems[].imageUrl`
  - parameter-level `file` / gallery values
  - `layoutOverrides[].imageSource`

- Soundtrack route is temporarily simplified
  - `/api/projects/[id]/music` returns a shared MP3 asset
  - current fallback asset path: `public/soundtrack/The_Shutter_s_Pause.mp3`
  - personalized audio generation is intentionally deferred

- Gallery support in the editor was expanded
  - `rowGallery` is the real gallery type currently used by live SweetBook templates
  - `columnGallery` exists in code but no live sandbox template currently uses it
  - `collageGallery` was newly added as an internal supported binding/type
  - gallery parameters can add/remove image slots directly in `InspectorPanel`
  - `rowGallery`: recommended `4`, max `4`
  - `collageGallery`: recommended `4`, max `4`

- Free layout editor can now create gallery elements
  - `+ Row Gallery`
  - `+ Collage Gallery`
  - new gallery elements are only enabled when the page still has an unused matching gallery parameter key
  - created element is bound to the actual parameter token, not a disconnected custom field

- Template/gallery detection utilities were added
  - `lib/template-gallery.ts`
  - detects gallery fields from schema/page
  - finds unused `rowGallery` / `collageGallery` binding keys for editor insertion

- Editor UI was improved for parameter-to-canvas mapping
  - `TemplatePageRenderer` now shows small parameter badges on canvas elements
  - selectable elements highlight based on the currently selected parameter key
  - `FreeLayoutEditor` shows element labels and has a `Show Labels / Hide Labels` toggle
  - `InspectorPanel` was redesigned into compact parameter cards
  - right-side cards now show binding/type/required metadata first, and only expand full input UI for the selected field

### Live Catalog Findings

- Checked live SweetBook sandbox templates directly
- Current live gallery templates are all `rowGallery`
- No live `columnGallery` template was found
- Themes/book specs with gallery templates were confirmed in:
  - `구글포토북A`
  - `구글포토북B`
  - `알림장A`
  - `알림장B`
  - `알림장C`

### Key Files Touched Recently

- `lib/spec-canvas.ts`
- `store/useProjectStore.ts`
- `app/projects/[id]/page.tsx`
- `app/api/projects/[id]/music/route.ts`
- `lib/template-gallery.ts`
- `components/editor/FreeLayoutEditor.tsx`
- `components/editor/InspectorPanel.tsx`
- `components/editor/PageCanvas.tsx`
- `components/preview/TemplatePageRenderer.tsx`
- `types/project.ts`
- `lib/template-catalog.ts`
- `lib/api.ts`

### Tests Added / Updated

- `__tests__/spec-canvas.test.ts`
- `__tests__/use-project-store.test.ts`
- `__tests__/template-gallery.test.ts`
- `__tests__/inspector-panel.test.tsx`
- `__tests__/free-layout-editor.test.tsx`

### Current Open Follow-ups

- make canvas parameter markers even closer to the visual style of the reference editor
- decide whether `columnGallery` should remain as dormant code support or be removed entirely
- decide whether `collageGallery` should become a real SweetBook-side template convention or remain editor-side custom support
- add more explicit 1:1 color linking between selected parameter cards and canvas markers
- add undo/redo for free layout editing
