# SweetBook Studio — Developer Roadmap

> 마감: **2026-04-15 (수) 23:59** · 오늘: 2026-04-08 · 남은 기간: **7일**

---

## 현재 구현 상태

### ✅ 완료

| 영역 | 내용 |
|---|---|
| 랜딩 페이지 | Hero, Demo 섹션, 서비스 소개 |
| 스튜디오 | 템플릿 선택, BookSpec 선택, 콘텐츠 입력 마법사 |
| AI 생성 | OpenAI gpt-4o-mini 섹션 카피 자동 생성 + fallback |
| 에디터 | 스프레드 레이아웃, SectionList, PageCanvas, InspectorPanel |
| 텍스트 편집 | InspectorPanel 텍스트 draft 편집 + Zustand 저장 |
| 이미지 편집 | crop (x/y/scale) 조정, 이미지 교체 (data URL) |
| 섹션 순서 조정 | Drag-free 방향키 이동 + `/api/projects/[id]/layout` AI 재배치 |
| 3D 미리보기 | BookPreviewModal — CSS preserve-3d 표지 + 스프레드 페이지 플립 |
| 결제 흐름 | Checkout 페이지, 배송 정보 입력, `/orders/estimate` 연동 |
| 주문 완료 | Orders 확인 페이지, bookUid / orderUid 표시 |
| API 서버 | Next.js Route Handlers로 API Key 서버 사이드 보호 |
| 상태 관리 | Zustand persist — 새로고침 후에도 프로젝트 유지 |
| 중복 방지 | Idempotency-Key 헤더 (books / orders 요청) |
| Mock fallback | API Key 없어도 전체 플로우 동작 |
| SweetBook API | Books API 7개 엔드포인트 정상 연결 |
| 실제 템플릿 UID | Sandbox API에서 검증한 실제 UID 사용 |
| GitHub | https://github.com/Navv6/sweetbook 초기 커밋 완료 |

---

## 남은 7일 작업 계획

### Day 1–2 (04-08 ~ 04-09) — API 신뢰성 강화

#### [ ] E2E 실제 API 흐름 검증
- `SWEETBOOK_API_KEY` 설정 후 `npm run dev`로 전체 플로우 실행
- `/books` → `/cover` → `/contents` → `/finalization` → `/orders` 각 응답 확인
- Supabase 연동 여부 결정 (`lib/supabase.ts` 현재 미사용)

#### [ ] 이미지 업로드 실패 시 UX 처리
- 현재: `alert()`로만 에러 표시
- 개선: 토스트 알림 컴포넌트 (`components/ui/Toast.tsx`) 추가
- 파일 크기 초과 / 포맷 오류 등 구체적인 에러 메시지 제공
- 참조 파일: `app/projects/[id]/page.tsx:193` `handleImageReplace`

#### [ ] 배송 필드명 API 문서 대조
- 확인 필요: `recipientName`, `recipientPhone`, `recipientAddress` 필드명
- 참조 파일: `app/api/projects/[id]/order/route.ts`
- `POST /orders` body 구조 Sandbox 테스트로 검증

---

### Day 3–4 (04-10 ~ 04-11) — UX 완성도

#### [ ] AI 카피 생성 상태 표시
- 현재: 생성 중 로딩 상태 불명확
- 개선: `studio/new` 페이지에 AI 생성 중 스피너 + 진행 단계 표시
  - "템플릿 분석 중..." → "섹션 구성 중..." → "카피 작성 중..."
- 참조 파일: `app/studio/new/page.tsx`

#### [ ] 에디터 온보딩 UX
- 현재: InspectorPanel 사용법이 직관적이지 않을 수 있음
- 개선: 첫 진입 시 툴팁 오버레이 또는 빈 상태(empty state) 안내
  - "왼쪽 요소를 클릭하면 편집할 수 있어요"
- 참조 파일: `components/editor/InspectorPanel.tsx`

#### [ ] 페이지 네비게이션 개선
- 현재: 하단 점(dot) 최대 4개만 표시 (`pages.slice(0, 4)`)
- 개선: 전체 페이지 수 표시, 현재 위치 표시 ("3 / 12")
- 참조 파일: `app/projects/[id]/page.tsx:384`

#### [ ] 섹션 삭제 기능
- 현재: 섹션 순서 변경만 가능
- 개선: SectionList에 삭제 버튼 추가
- 참조 파일: `components/editor/SectionList.tsx`, `store/useProjectStore.ts`

---

### Day 5 (04-12) — 데모 품질

#### [ ] 더미 이미지 교체
- 현재: `/public/demo/*.svg` 단색 플레이스홀더
- 개선: Unsplash 무료 이미지 또는 AI 생성 사진으로 교체
  - 심사자가 `npm run dev` 실행 즉시 시각적으로 완성된 화면 필요
  - 추천 경로: `public/demo/` 내 6장 jpg 교체
- 참조 파일: `lib/mock.ts` `createDemoContentItems()`

#### [ ] 랜딩 DemoSection 강화
- 현재: DemoCard 3장만 표시
- 개선: 실제 스크린샷 또는 mockup 이미지로 교체
- 참조 파일: `components/landing/DemoSection.tsx`

#### [ ] 북 제목 입력 UX
- 현재: 기본 제목 "My Photo Essay Book"
- 개선: 스튜디오 마법사 첫 단계에서 제목 입력 필드 추가
- 참조 파일: `app/studio/new/page.tsx`

---

### Day 6 (04-13) — 안정성 & 성능

#### [ ] `npm run build` 통과
- TypeScript 에러 / ESLint 경고 모두 해소
- `next build` 성공 → 심사자 빌드 테스트 대비
- `'use client'` / `'use server'` 경계 점검

#### [ ] 로딩 스켈레톤
- 현재: 프로젝트 없을 때 "Missing Project" 카드만 표시
- 개선: 로딩 중 스켈레톤 UI 추가
- 참조 파일: `app/projects/[id]/page.tsx:268`

#### [ ] 모바일 반응형 점검
- 현재: `xl:grid-cols-[...]` 레이아웃이 모바일에서 단일 컬럼으로 내려오는지 확인
- 에디터 3-컬럼 레이아웃이 tablet(md) 이하에서 올바르게 스택되는지 검증

---

### Day 7 (04-14) — 제출 전 최종 점검

#### [ ] README 최종 업데이트
- 스크린샷 추가 (`![에디터 화면](docs/screenshot-editor.png)` 등)
- Sandbox Key 없이 실행하는 방법 명확히 기술
- 구현 결정 사항(Design Decision) 섹션 추가

#### [ ] 환경 변수 최종 확인
- `.env.example` 내용이 README와 일치하는지 확인
- `OPENAI_API_KEY` 없을 때 graceful fallback 동작 재확인

#### [ ] 브라우저 크로스 테스트
- Chrome, Safari, Edge에서 3D 미리보기 `preserve-3d` 렌더링 확인
- Firefox에서 `backdrop-filter` 지원 여부 확인

#### [ ] 마지막 커밋 & 태그
```bash
git tag v1.0.0-submission
git push origin master --tags
```

---

## 우선순위 매트릭스

| 항목 | 임팩트 | 난이도 | 우선순위 |
|---|---|---|---|
| E2E API 검증 | 높음 | 낮음 | **P0** |
| 에러 토스트 UI | 중간 | 낮음 | **P1** |
| 더미 이미지 교체 | 높음 | 낮음 | **P1** |
| AI 생성 진행 표시 | 중간 | 낮음 | **P1** |
| `npm run build` 통과 | 높음 | 중간 | **P1** |
| 섹션 삭제 기능 | 중간 | 중간 | **P2** |
| 에디터 온보딩 툴팁 | 낮음 | 중간 | **P2** |
| 모바일 반응형 | 중간 | 중간 | **P2** |
| 랜딩 DemoSection 강화 | 낮음 | 낮음 | **P3** |
| Supabase DB 연동 | 낮음 | 높음 | **❌ 스코프 아웃** |

---

## 파일 위치 레퍼런스

```
sweetbook/
├── app/
│   ├── page.tsx                        # 랜딩 페이지
│   ├── studio/new/page.tsx             # 프로젝트 생성 마법사
│   ├── projects/[id]/page.tsx          # 에디터 메인
│   ├── checkout/[id]/page.tsx          # 결제 / 배송 입력
│   ├── orders/[id]/page.tsx            # 주문 완료
│   └── api/projects/
│       ├── route.ts                    # POST /api/projects (생성)
│       └── [id]/
│           ├── generate/route.ts       # AI 섹션 생성
│           ├── layout/route.ts         # 섹션 순서 재배치
│           ├── estimate/route.ts       # 가격 견적
│           ├── publish/route.ts        # SweetBook API 발행
│           └── order/route.ts          # 주문 생성
├── components/
│   ├── editor/
│   │   ├── PageCanvas.tsx              # 스프레드 캔버스
│   │   ├── InspectorPanel.tsx          # 텍스트/이미지 편집 패널
│   │   └── SectionList.tsx             # 섹션 목록 + 순서 조정
│   ├── preview/
│   │   └── BookPreviewModal.tsx        # 3D 책 + 페이지 플립 뷰어
│   ├── studio/
│   │   ├── TemplateSelector.tsx        # 템플릿 선택 (썸네일)
│   │   ├── BookSpecSelector.tsx        # 판형 선택
│   │   └── PreviewPanel.tsx            # 실시간 미리보기
│   └── ui/
│       ├── Button.tsx
│       ├── Card.tsx
│       └── Input.tsx
├── lib/
│   ├── api.ts                          # SweetBook / OpenAI API 클라이언트
│   ├── mock.ts                         # Mock 데이터 (실제 UID 사용)
│   └── layout.ts                       # AI 레이아웃 로직
├── store/
│   ├── useProjectStore.ts              # 프로젝트 상태 (Zustand persist)
│   └── useEditorStore.ts               # 에디터 UI 상태
└── types/
    ├── project.ts                      # Project, Section, Page, Element 타입
    └── editor.ts                       # 에디터 전용 타입
```

---

## 기술 스택

| 레이어 | 기술 |
|---|---|
| 프레임워크 | Next.js 16.2.2 (App Router) |
| 언어 | TypeScript 5 |
| UI | React 19 + Tailwind CSS 4 |
| 상태 관리 | Zustand 5 + persist middleware |
| AI | OpenAI SDK 6 (gpt-4o-mini) |
| 외부 API | SweetBook Book Print API (Sandbox) |
| DB (미사용) | Supabase (향후 확장용) |
| 배포 | Vercel (권장) |

---

*Last updated: 2026-04-08*
