# SweetBook Studio

> 사랑하는 사람에게 건넬 수 있는 단 한 권의 선물 — 나만의 포토북 제작 서비스

[![Next.js](https://img.shields.io/badge/Next.js-16.2-black)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8)](https://tailwindcss.com)
[![Vercel](https://img.shields.io/badge/Deployed-Vercel-black)](https://sweetbook.vercel.app)

**라이브 데모: [https://sweetbook.vercel.app](https://sweetbook.vercel.app)**

---

## 서비스 소개

**SweetBook Studio**는 육아·여행·웨딩 등 일상의 소중한 순간을 담은 사진을 올려 9개 테마 패밀리와 3가지 판형(A4·A5 소프트커버 / 스퀘어 하드커버) 중에서 고르고, 자유 레이아웃 편집기로 페이지를 직접 꾸민 뒤 SweetBook Book Print API를 통해 **실제 인쇄·제본·배송까지 한 번에 이어주는** 나만의 포토북 제작 웹 서비스입니다.

정해진 레이아웃을 고르기만 하는 기존 포토북 서비스와 달리, SweetBook Studio는 사용자가 캔버스 위에서 텍스트와 이미지를 자유롭게 배치하고, 그 결과를 실제 출판용 커스텀 템플릿으로 승격시켜 주문까지 이어지게 설계했습니다.

**타겟 고객**

| 대상 | 사용 예시 |
|------|-----------|
| 👶 **부모** | 아이의 성장 기록을 한 권에 담아 가족과 공유 |
| ✈️ **여행자** | 여행지의 순간들을 날짜별로 정리해 여행기로 |
| 🎓 **학생·졸업생** | 반 친구들과의 1년을 졸업 앨범으로 |
| 🐾 **반려인** | 반려동물의 성장을 월별로 모아 연간 앨범으로 |
| 💍 **신혼부부** | 결혼식 순간을 고급스러운 하드커버로 |
| 📖 **창작자** | 자신의 사진과 글을 모아 세상에 하나뿐인 책으로 |

**주요 기능**

| 기능 | 설명 |
|------|------|
| 🎨 테마·판형 선택 | 공용/구글포토북/알림장/일기장 등 9개 테마 패밀리 × A4·A5·스퀘어 판형 실시간 프리뷰 |
| 📸 이미지 업로드 | 표지·본문 이미지 다중 업로드 (12 MB 제한, JPEG/PNG/WebP/GIF) |
| ✏️ 페이지 편집기 | 섹션 단위 순서 변경·복제, 텍스트·이미지 인스펙터 편집 |
| 🖐️ 자유 레이아웃 편집 | 편집 모드에서 캔버스 위 텍스트·이미지를 원하는 위치·크기로 자유 배치 |
| 📖 책 Preview | 편집 중인 표지·내지를 바로 확인할 수 있는 뷰어 |
| 🧩 커스텀 템플릿 승격 | 사용자가 자유 편집한 레이아웃을 SweetBook 커스텀 템플릿으로 저장·재사용 |
| 💰 실시간 견적 | `POST /orders/estimate` 로 수량·사양별 가격을 주문 직전에 확인 |
| 📦 원클릭 주문 | Books API 책 생성·최종화 → Orders API 주문까지 단일 플로우로 연결 |
| 🔔 웹훅 수신 | 주문·제작·배송 상태 변경 이벤트 수신, HMAC-SHA256 서명 검증, 주문 상세 타임라인 반영 |
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

# 선택 — 웹훅 서명 검증용 (파트너 포털 Webhook 설정에서 발급)
SWEETBOOK_WEBHOOK_SECRET=

```

> **`SWEETBOOK_API_KEY`만 입력하면 Books/Orders API 전체 플로우가 동작합니다.**

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

### 5. 플로우

1. **포토북 만들기** 클릭
2. 템플릿·판형 선택 → **포토북 초안 생성**
3. 편집기에서 텍스트·이미지 첨부, 섹션 순서 조정
4. **출판 및 주문** → 배송지 입력 → 주문 완료

### 6. 빠른 확인 포인트

- 프론트엔드 UI와 백엔드 API 라우트를 하나의 Next.js 저장소에서 함께 제공합니다.
- `SWEETBOOK_API_KEY`만 입력하면 카탈로그 조회부터 Books/Orders API 주문까지 전체 흐름을 검증할 수 있습니다.
- 환경 변수 예시는 `.env.example`에 포함되어 있고, 실제 키 값은 저장소에 커밋하지 않았습니다.
- API Key는 브라우저에 절대 노출되지 않으며, 모든 외부 호출은 Next.js 서버 라우트를 통해서만 이루어집니다.

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
| **Claude Code** | 전체 프로젝트 설계, API 연동 구조 설계, 버그 탐지 및 수정  |
| **OpenAI Codex** | Claude Code 토큰 사용량이 90%에 도달한 이후 handoff 문서를 이어받아 후속 작업을 계속 진행 |
| **Google Stitch**| 초기 브랜딩 페이지와 UI/UX 초안을 제작 |

---

## 설계 의도

### 왜 이 서비스를 선택했는가

Book Print API는 이 서비스의 핵심 인프라입니다.
기존의 서비스는 레이아웃이 정해져있거나 직관적인 수정이 힘들었습니다.
그래서 API를 이용해 템플릿과 레이아웃을 그대로 가져오되 사용자 입장에서 자신만의 레이아웃을 구성하고
자신만의 포토북을 만들어 나가는 것에 집중하였습니다.
저 또한 포토북을 제가 직접 찍은 사진들을 가지고 제작을 고려해보았던 경험을 살려 사용자 입장에서 어떤 점들이 더 이용하기에 편하고,
담고자하는 느낌을 충분히 반영할 수 있는지를 생각해보았습니다.


### 비즈니스 가능성

- **타겟 명확성**: 육아·여행·졸업·웨딩·반려동물 등 "한 권으로 남기고 싶은 순간"을 가진 일반 사용자 — 포토북 수요가 이미 검증된 시장
- **차별점**: 정해진 레이아웃만 고르는 기존 서비스와 달리, 자유 레이아웃 편집기로 사용자가 직접 배치한 결과를 실제 출판용 커스텀 템플릿으로 승격

### 더 시간이 있었다면 추가했을 기능

1. **AI 기능 추가** — 자신의 포토북에 맞는 음원을 생성해주는 AI나 이미지 배치,배열, 문장 생성 등 간단한 기능을 추가해보고싶었습니다.
2. **개인화 기능 확장** - 현재는 사이트 가입 후 API를 발급받아 사용하는 방식이지만, 실제 웹 서비스에서는 개인회원과 기업회원의 로그인 체계를 두고 DB 기반으로 프로젝트, 주문, 고객 정보를 관리하는 맞춤형 운영 구조로 확장할 수 있다고 판단했습니다.


### 구현 결정 사항

- **프론트엔드와 백엔드를 Next.js App Router 한 저장소로 통합**  
  심사자가 실행 경로를 단순하게 따라올 수 있게 하고, API Key를 서버 라우트에서만 다루기 위해 이렇게 구성했습니다.
- **Books API와 Orders API를 실제 사용자 퍼널에 직접 연결**  
  단순 엔드포인트 호출 데모가 아니라, `프로젝트 생성 → 편집 → 출판 → 견적 → 주문` 흐름 전체가 하나의 서비스 경험으로 이어지도록 설계했습니다.
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
│       │       ├── generate/       # 템플릿 스키마 기반 레이아웃 생성
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
│   ├── api.ts                      # SweetBook API 클라이언트 (카탈로그·Books·Orders)
│   ├── curated-theme-families.ts   # 테마 패밀리 분류 데이터
│   ├── media.ts                    # 이미지 처리 유틸리티
│   ├── mock.ts                     # 로컬 개발용 샘플 데이터
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

---

## 환경변수 전체 목록

| 변수 | 필수 여부 | 설명 |
|------|-----------|------|
| `SWEETBOOK_API_KEY` | **필수** | SweetBook Sandbox API Key |
| `SWEETBOOK_API_BASE_URL` | 선택 | 기본값: `https://api-sandbox.sweetbook.com/v1` |
| `SWEETBOOK_WEBHOOK_SECRET` | 선택 | 웹훅 서명 검증 시크릿 (파트너 포털 발급) |
| `NEXT_PUBLIC_APP_URL` | 선택 | 배포 URL (기본값: `https://sweetbook.vercel.app`) |
