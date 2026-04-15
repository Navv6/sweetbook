# SweetBook Studio — Editorial Monograph

> 흩어진 사진과 기록을 출판 가능한 한 권의 에디토리얼 포토북으로 엮어주는 1인 출판 플랫폼

[![Next.js](https://img.shields.io/badge/Next.js-16.2-black)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8)](https://tailwindcss.com)
[![Vercel](https://img.shields.io/badge/Deployed-Vercel-black)](https://sweetbook.vercel.app)

**라이브 데모: [https://sweetbook.vercel.app](https://sweetbook.vercel.app)**

---

## 서비스 소개

**SweetBook Studio**는 사진작가, 여행자, 일상 기록자가 사진과 짧은 메모를 올리면 AI가 섹션 제목·인트로·페이지 흐름을 자동으로 구성하고, SweetBook Book Print API와 연동해 실제 주문 가능한 에디토리얼 포토북 초안을 만들어주는 웹 애플리케이션입니다.

**타겟 고객**
- 사진을 취미로 찍지만 앨범을 직접 편집할 시간이 없는 1인 사진작가
- 여행·육아·일상의 기록을 책 형태로 남기고 싶은 일반 사용자
- 소량 맞춤 포토북이 필요한 1인 출판 파트너

**주요 기능**

| 기능 | 설명 |
|------|------|
| 📸 사진 수집 | 표지 이미지 + 본문 사진 다중 업로드 (12 MB 제한, JPEG/PNG/WebP/GIF) |
| 🤖 AI 큐레이션 | OpenAI로 섹션 제목·인트로·카피 자동 생성 |
| ✏️ 페이지 편집기 | 스프레드 레이아웃 미리보기, 텍스트·이미지 직접 편집, 섹션 순서 재배치 |
| 📖 3D 책 미리보기 | CSS preserve-3d 기반 입체 표지 + 페이지 플립 애니메이션 뷰어 |
| 📋 템플릿 선택 | SweetBook API 카탈로그를 우선 조회하고, 실패 시 mock 데이터로 fallback |
| 💰 견적 조회 | `POST /orders/estimate` 실시간 가격 계산 |
| 📦 원클릭 주문 | Books API 책 생성·최종화 → Orders API 주문까지 한 흐름으로 연결 |
| 🔔 웹훅 수신 | 주문·제작·배송 상태 변경 이벤트 수신, 서명 검증, 주문 상세 타임라인 반영 |
| 🎵 QR 사운드트랙 | 완성된 포토북에 QR 코드를 첨부, 스캔 시 전용 사운드트랙 페이지로 연결 |

---

## 실행 방법

### 요구사항

- Node.js 18 이상
- SweetBook Sandbox API Key ([api.sweetbook.com](https://api.sweetbook.com) 가입 후 발급)

### 1. 설치

```bash
git clone https://github.com/Navv6/sweetbook.git
cd sweetbook
npm install
```

### 2. 환경변수 설정

```bash
cp .env.example .env
```

`.env` 파일을 열어 아래 항목을 입력하세요.

```env
# 필수 — SweetBook Sandbox API Key
SWEETBOOK_API_KEY=여기에_발급받은_키_입력

# 선택 — OpenAI Key가 없으면 기본 카피로 자동 fallback
OPENAI_API_KEY=

# 선택 — 웹훅 서명 검증용 (파트너 포털 Webhook 설정에서 발급)
SWEETBOOK_WEBHOOK_SECRET=

# 선택 — Supabase (없으면 브라우저 로컬스토리지로 대체)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

> **`SWEETBOOK_API_KEY`만 입력하면 Books/Orders API 전체 플로우가 동작합니다.**
> 나머지 키가 없어도 Mock 모드로 전체 흐름을 바로 체험할 수 있습니다.

### 3. 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 열기

### 4. 검증

```bash
npm run lint
npm run test
npm run build
```

### 5. 데모 체험 (API Key 없이도 가능)

1. **첫 프로젝트 시작** 클릭
2. 프로젝트 제목 입력 → 사진 업로드 없이 더미 이미지로 바로 진행 가능
3. 템플릿·판형 선택 → **에디토리얼 초안 생성**
4. 편집기에서 텍스트·이미지 수정, 섹션 순서 조정
5. **출판 및 주문** → 배송지 입력 → 주문 완료

### 6. 제출용 빠른 확인 포인트

- 프론트엔드 UI와 백엔드 API 라우트를 하나의 Next.js 저장소에서 함께 제공합니다.
- `SWEETBOOK_API_KEY`가 있으면 실제 Sandbox Books API + Orders API까지 전체 흐름을 검증할 수 있습니다.
- API Key가 없어도 `lib/mock.ts`의 더미 데이터로 첫 화면부터 편집기, 주문 흐름까지 바로 확인할 수 있습니다.
- 환경 변수 예시는 `.env.example`에 포함되어 있고, 실제 키 값은 저장소에 커밋하지 않았습니다.

---

## 사용한 API 목록

| 메서드 | 엔드포인트 | 용도 |
|--------|------------|------|
| `GET` | `/templates` | 템플릿 목록 조회 (판형별 실제 UID 매핑) |
| `GET` | `/book-specs` | 책 사양 조회 (A4/A5 소프트커버, 스퀘어 하드커버) |
| `POST` | `/books` | 새 책 생성 (bookSpecUid, title) |
| `POST` | `/books/{bookUid}/cover` | 표지 설정 (templateUid, coverPhoto, dateRange) |
| `POST` | `/books/{bookUid}/contents` | 내지 페이지 추가 (gallery/story 템플릿 분기) |
| `POST` | `/books/{bookUid}/finalization` | 책 최종화 (인쇄 준비, 페이지 수 자동 패딩) |
| `POST` | `/orders/estimate` | 수량·사양별 실시간 가격 견적 |
| `POST` | `/orders` | 주문 생성 (배송지, bookUid, 수량) |
| `Webhook` | `/api/webhooks/sweetbook` | 주문·제작·배송 이벤트 수신 (HMAC-SHA256 검증) |

> 모든 `/books`, `/orders` 쓰기 요청에 `Idempotency-Key` 헤더를 포함해 중복 생성을 방지합니다.

---

## AI 도구 사용 내역

| AI 도구 | 활용 내용 |
|---------|----------|
| **Claude Code** | 전체 프로젝트 설계, API 연동 구조 설계, 버그 탐지 및 수정 (존재하지 않는 `/books/{uid}/photos` 엔드포인트 발견·제거, 잘못된 `gpt-5-mini` 모델명 수정, mock templateUid와 실제 API UID 불일치 발견 및 전면 교체, API 파라미터명 전수 검증) |
| **OpenAI gpt-4o-mini** | 포토북 섹션 카피(제목·인트로·커버 문구) 런타임 자동 생성. API Key 없을 시 기본 카피로 graceful fallback |

---

## 설계 의도

### 왜 이 서비스를 선택했는가

사진을 찍는 것과 그것을 "책으로 엮는 것" 사이에는 큰 간극이 있습니다. 대부분의 포토북 서비스는 사용자가 사진을 직접 드래그해 레이아웃을 맞춰야 합니다. 사진이 취미인 사람이라면 그 번거로움을 알고 있을 겁니다.

SweetBook Studio는 그 간극을 AI로 채웁니다. 사진을 올리면 AI가 섹션을 나누고 카피를 쓰고 페이지 흐름을 제안합니다. 사용자는 마음에 들지 않는 부분만 고치면 됩니다.

Book Print API는 이 서비스의 핵심 인프라입니다. 1인 개발자 파트너로서 인쇄·제본·배송이라는 물리적 생산을 혼자 해결할 수 없습니다. API가 그 부분을 전담하고, 저는 사용자 경험에 집중했습니다.

### 비즈니스 가능성

- **타겟 명확성**: 취미 사진작가, 여행 기록자, 육아 일기 사용자 — 포토북 수요가 검증된 시장
- **차별점**: 단순 사진 배열이 아닌 에디토리얼 경험 (AI 카피 + 스프레드 레이아웃 미리보기)
- **B2B 확장**: 파트너 모드로 전환 시 사진관·스튜디오가 고객에게 프리미엄 포토북 서비스를 납품하는 플랫폼으로 진화 가능. 스위트북 API 플랫폼의 파트너 생태계와 자연스럽게 연결됩니다.

### 더 시간이 있었다면 추가했을 기능

1. **이미지 EXIF 자동 태깅** — 촬영 날짜·위치를 읽어 여행 포토북 섹션 자동 구분
2. **실시간 PDF 미리보기** — 주문 전 실제 인쇄 결과물 PDF 다운로드
3. **파트너 대시보드** — 여러 고객 프로젝트를 하나의 계정에서 관리하는 B2B 모드
4. **주문 상태 Push 알림** — Webhook 이벤트를 브라우저 알림으로 연결

### 구현 결정 사항

- **프론트엔드와 백엔드를 Next.js App Router 한 저장소로 통합**  
  심사자가 실행 경로를 단순하게 따라올 수 있게 하고, API Key를 서버 라우트에서만 다루기 위해 이렇게 구성했습니다.
- **Books API와 Orders API를 실제 사용자 퍼널에 직접 연결**  
  단순 엔드포인트 호출 데모가 아니라, `프로젝트 생성 → 편집 → 출판 → 견적 → 주문` 흐름 전체가 하나의 서비스 경험으로 이어지도록 설계했습니다.
- **Mock fallback을 기본 제공**  
  Sandbox Key가 없는 상태에서도 결과 화면을 바로 볼 수 있어야 한다는 과제 요구사항 때문에, 더미 이미지와 템플릿 fallback 경로를 별도로 유지했습니다.
- **자유 편집 결과를 커스텀 템플릿으로 승격**  
  사용자가 캔버스에서 수정한 레이아웃이 실제 출판 데이터와 어긋나지 않도록, publish 시 `layoutOverrides`를 SweetBook 커스텀 템플릿으로 변환하는 방식을 택했습니다.

---

## 프로젝트 구조

```
sweetbook/
├── app/
│   ├── page.tsx                    # 랜딩 페이지
│   ├── studio/new/                 # 프로젝트 생성 마법사
│   ├── projects/[id]/              # 페이지 편집기
│   ├── checkout/[id]/              # 견적 + 배송지 입력
│   ├── orders/[id]/                # 주문 확인
│   ├── soundtrack/[id]/            # QR 사운드트랙 플레이어 (QR 공유 도달 화면)
│   └── api/
│       ├── catalog/                # 템플릿·판형 통합 카탈로그 조회
│       ├── image-proxy/            # CORS-safe 이미지 프록시 (html-to-image용)
│       ├── templates/custom/[uid]/ # 커스텀 템플릿 스키마 조회
│       ├── uploads/                # 이미지 업로드 (로컬 /public/uploads 저장)
│       ├── projects/
│       │   ├── route.ts            # 프로젝트 생성
│       │   └── [id]/
│       │       ├── route.ts        # 프로젝트 조회·수정·삭제
│       │       ├── generate/       # AI 레이아웃 생성
│       │       ├── layout/         # 섹션 순서 재배치
│       │       ├── estimate/       # 견적 조회
│       │       ├── music/          # 사운드트랙 로드
│       │       ├── publish/        # Books API 연동
│       │       └── order/          # Orders API 연동
│       └── webhooks/sweetbook/     # 웹훅 수신 (HMAC-SHA256 검증)
├── components/
│   ├── editor/                     # 페이지 캔버스, 인스펙터 패널, 섹션 목록
│   ├── landing/                    # 랜딩 페이지 섹션 컴포넌트
│   ├── layout/                     # 레이아웃 컴포넌트 (헤더 등)
│   ├── preview/                    # 3D 책 미리보기 모달
│   ├── studio/                     # 템플릿·판형 선택기
│   └── ui/                         # 공통 Button, Card, Input
├── lib/
│   ├── api.ts                      # SweetBook API + OpenAI 클라이언트
│   ├── curated-theme-families.ts   # 테마 패밀리 분류 데이터
│   ├── media.ts                    # 이미지 처리 유틸리티
│   ├── mock.ts                     # API Key 없을 때 fallback 데이터
│   ├── project-repository.ts       # 프로젝트 저장소 (Supabase / 로컬 fallback)
│   ├── spec-canvas.ts              # 판형별 캔버스 사양
│   ├── supabase.ts                 # Supabase 클라이언트
│   ├── template-catalog.ts         # 템플릿 카탈로그 빌더
│   ├── template-gallery.ts         # 템플릿 갤러리 유틸리티
│   └── webhook.ts                  # 웹훅 이벤트 처리
├── store/                          # Zustand 상태 (브라우저 persist)
├── types/                          # TypeScript 타입 정의
└── .env.example                    # 환경변수 예시
```

---

## 기술 스택

| 영역 | 선택 | 이유 |
|------|------|------|
| 프레임워크 | Next.js 16 App Router | 프론트엔드·백엔드 단일 레포, API Routes로 API Key 서버 보호 |
| 언어 | TypeScript 5 | API 응답 타입 안정성 |
| 스타일 | Tailwind CSS 4 | 에디토리얼 디자인 토큰 커스터마이징 |
| 상태 관리 | Zustand (persist) | 새로고침 후에도 편집 중인 프로젝트 유지 |
| AI | OpenAI gpt-4o-mini | 비용 효율적, 한국어 카피 생성 품질 적절 |

---

## 환경변수 전체 목록

| 변수 | 필수 여부 | 설명 |
|------|-----------|------|
| `SWEETBOOK_API_KEY` | **필수** | SweetBook Sandbox API Key |
| `SWEETBOOK_API_BASE_URL` | 선택 | 기본값: `https://api-sandbox.sweetbook.com/v1` |
| `SWEETBOOK_WEBHOOK_SECRET` | 선택 | 웹훅 서명 검증 시크릿 (파트너 포털 발급) |
| `OPENAI_API_KEY` | 선택 | 없으면 기본 카피로 fallback |
| `NEXT_PUBLIC_SUPABASE_URL` | 선택 | 없으면 로컬스토리지 사용 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 선택 | Supabase 인증 |
| `SUPABASE_SERVICE_ROLE_KEY` | 선택 | 서버 사이드 Supabase 접근 |
| `REPLICATE_API_TOKEN` | 선택 | Replicate API 토큰 (향후 AI 이미지 생성 확장용) |
| `NEXT_PUBLIC_APP_URL` | 선택 | 배포 URL (기본값: `https://sweetbook.vercel.app`) |
