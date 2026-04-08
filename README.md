# SweetBook Studio — Editorial Monograph

> 흩어진 사진과 기록을 출판 가능한 한 권의 에디토리얼 포토북으로 엮어주는 1인 출판 플랫폼

[![Next.js](https://img.shields.io/badge/Next.js-16.2-black)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8)](https://tailwindcss.com)

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
| 📸 사진 수집 | 표지 이미지 + 본문 사진 다중 업로드 |
| 🤖 AI 큐레이션 | OpenAI로 섹션 제목·인트로·카피 자동 생성 |
| ✏️ 페이지 편집기 | 스프레드 레이아웃 미리보기, 텍스트·이미지 직접 편집, 섹션 순서 재배치 |
| 📖 템플릿 선택 | SweetBook API의 실제 템플릿(일기장A/B, 구글포토북 등) 연동 |
| 💰 견적 조회 | `POST /orders/estimate` 실시간 가격 계산 |
| 📦 원클릭 주문 | Books API 책 생성·최종화 → Orders API 주문까지 한 흐름으로 연결 |

---

## 실행 방법

### 요구사항

- Node.js 18 이상
- SweetBook Sandbox API Key ([api.sweetbook.com](https://api.sweetbook.com) 가입 후 발급)

### 1. 설치

```bash
git clone https://github.com/<YOUR_USERNAME>/sweetbook.git
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

### 4. 데모 체험 (API Key 없이도 가능)

1. **첫 프로젝트 시작** 클릭
2. 프로젝트 제목 입력 → 사진 업로드 없이 더미 이미지로 바로 진행 가능
3. 템플릿·판형 선택 → **에디토리얼 초안 생성**
4. 편집기에서 텍스트·이미지 수정, 섹션 순서 조정
5. **출판 및 주문** → 배송지 입력 → 주문 완료

---

## 사용한 API 목록

| 메서드 | 엔드포인트 | 용도 |
|--------|------------|------|
| `GET` | `/templates` | 템플릿 목록 조회 (판형별 실제 UID 매핑) |
| `GET` | `/book-specs` | 책 사양 조회 (A4/A5 소프트커버, 스퀘어 하드커버) |
| `POST` | `/books` | 새 책 생성 (bookSpecUid, title, externalRef) |
| `POST` | `/books/{bookUid}/cover` | 표지 설정 (templateUid, 커버 이미지 FormData) |
| `POST` | `/books/{bookUid}/contents` | 내지 페이지 추가 (gallery / story 템플릿 분기) |
| `POST` | `/books/{bookUid}/finalization` | 책 최종화 (인쇄 준비) |
| `POST` | `/orders/estimate` | 수량·사양별 실시간 가격 견적 |
| `POST` | `/orders` | 주문 생성 (배송지, bookUid, 수량) |

> 모든 `/books` 쓰기 요청에 `Idempotency-Key` 헤더를 포함해 중복 생성을 방지합니다.

---

## AI 도구 사용 내역

| AI 도구 | 활용 내용 |
|---------|----------|
| **Claude Code** | 전체 프로젝트 설계, API 연동 구조 설계, 버그 탐지 및 수정 (존재하지 않는 `/books/{uid}/photos` 엔드포인트 발견·제거, 잘못된 `gpt-5-mini` 모델명 수정, mock templateUid와 실제 API UID 불일치 발견 및 전면 교체) |
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
2. **실시간 PDF 미리보기** — 주문 전 실제 인쇄 결과에 가까운 preview 제공
3. **파트너 대시보드** — 여러 고객 프로젝트를 하나의 계정에서 관리하는 B2B 모드
4. **Webhook 연동** — 주문 상태 변경(인쇄 완료, 배송 시작) 실시간 알림

---

## 프로젝트 구조

```
sweetbook/
├── app/
│   ├── page.tsx               # 랜딩 페이지
│   ├── studio/new/            # 프로젝트 생성
│   ├── projects/[id]/         # 페이지 편집기
│   ├── checkout/[id]/         # 견적 + 배송지 입력
│   ├── orders/[id]/           # 주문 확인
│   └── api/projects/[id]/
│       ├── generate/          # AI 레이아웃 생성
│       ├── estimate/          # 견적 조회
│       ├── publish/           # Books API 연동
│       └── order/             # Orders API 연동
├── components/
│   ├── editor/                # 페이지 캔버스, 인스펙터 패널
│   ├── studio/                # 템플릿·판형 선택기
│   └── ui/                    # 공통 Button, Card, Input
├── lib/
│   ├── api.ts                 # SweetBook API + OpenAI 클라이언트
│   ├── layout.ts              # 레이아웃 생성 알고리즘
│   └── mock.ts                # API Key 없을 때 fallback 데이터
├── store/                     # Zustand 상태 (브라우저 persist)
├── types/                     # TypeScript 타입 정의
└── .env.example               # 환경변수 예시
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
| `OPENAI_API_KEY` | 선택 | 없으면 기본 카피로 fallback |
| `NEXT_PUBLIC_SUPABASE_URL` | 선택 | 없으면 로컬스토리지 사용 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 선택 | Supabase 인증 |
| `SUPABASE_SERVICE_ROLE_KEY` | 선택 | 서버 사이드 Supabase 접근 |
