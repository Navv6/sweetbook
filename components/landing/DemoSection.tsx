import Link from "next/link";
import { Container } from "@/components/layout/Container";

const usecases = [
  {
    emoji: "👶",
    title: "육아 포토북",
    desc: "아이의 성장 기록을 한 권에 담아 가족과 함께 간직하세요.",
  },
  {
    emoji: "✈️",
    title: "여행 앨범",
    desc: "여행지의 순간들을 날짜별로 정리해 추억을 영원히 남기세요.",
  },
  {
    emoji: "🎓",
    title: "졸업 앨범",
    desc: "반 친구들과의 소중한 1년을 한 권의 졸업 앨범으로 만드세요.",
  },
  {
    emoji: "🐾",
    title: "반려동물 앨범",
    desc: "사랑스러운 반려동물의 성장을 월별로 모아 연간 앨범으로.",
  },
  {
    emoji: "💍",
    title: "웨딩 포토북",
    desc: "특별한 날의 행복한 순간을 고급스러운 포토북으로 간직하세요.",
  },
  {
    emoji: "📖",
    title: "나만의 책",
    desc: "글과 사진을 올려 세상에 하나뿐인 나만의 책을 만들어보세요.",
  },
];

const steps = [
  {
    number: "01",
    title: "테마 & 판형 선택",
    description:
      "9개 테마 패밀리와 A4·A5·스퀘어 판형 중 원하는 조합을 고릅니다. 오른쪽 프리뷰에서 실시간으로 결과물을 확인하세요.",
    tags: ["다양한 템플릿", "3 판형", "실시간 프리뷰"],
    accent: "bg-primary/8 border-primary/15",
    badge: "bg-primary text-white",
  },
  {
    number: "02",
    title: "자유 레이아웃 편집",
    description:
      "기본으로 준비된 표지·내지·마무리 섹션을 필요한 만큼 복제하고, 자유 레이아웃 모드에서 텍스트·이미지·갤러리 슬롯을 원하는 위치로 옮기며 크기를 조정합니다.",
    tags: ["자유 레이아웃", "섹션 복제", "이미지 업로드"],
    accent: "bg-surface-container border-outline/50",
    badge: "bg-surface-container-highest text-foreground",
  },
  {
    number: "03",
    title: "주문 & 집까지 배송",
    description:
      "결제하면 인쇄·제본을 거쳐 완성된 포토북이 집까지 배송됩니다. 진행 상태는 실시간으로 확인할 수 있습니다.",
    tags: ["고품질 인쇄", "안전한 배송", "주문 추적"],
    accent: "bg-surface-container border-outline/50",
    badge: "bg-surface-container-highest text-foreground",
  },
];

export function DemoSection() {
  return (
    <section id="how-it-works" className="px-6 pb-24 pt-4 md:px-0 md:pb-32">
      <Container>
        <div className="space-y-20">

          {/* ── usecase 섹션 ── */}
          <div className="space-y-10">
            <div className="max-w-2xl">
              <p className="section-label">이런 분들께 추천해요</p>
              <h2 className="display-copy mt-4 text-4xl font-semibold md:text-5xl">
                어떤 추억이든
                <br />
                <em className="font-normal not-italic text-primary">나만의 포토북</em>으로
              </h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {usecases.map((item) => (
                <div
                  key={item.title}
                  className="flex flex-col gap-4 rounded-2xl border border-outline/50 bg-surface-container-lowest p-6"
                >
                  <span className="text-3xl">{item.emoji}</span>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {item.title}
                    </h3>
                    <p className="mt-1.5 text-sm text-secondary leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── 작동 방식 ── */}
        <div className="space-y-12">
          {/* 헤더 */}
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <p className="section-label">작동 방식</p>
              <h2 className="display-copy mt-4 text-4xl font-semibold md:text-5xl">
                사진 올리고
                <br />
                <em className="font-normal not-italic text-primary">3단계면 집으로 배송</em>
              </h2>
            </div>
            <Link
              href="/studio/new"
              className="inline-flex items-center gap-2 rounded-full border border-outline px-5 py-2.5 text-sm font-semibold text-secondary transition hover:border-primary/30 hover:text-primary"
            >
              포토북 만들러 가기
              <span>→</span>
            </Link>
          </div>

          {/* 스텝 그리드 */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {steps.map((step) => (
              <div
                key={step.number}
                className={`relative rounded-3xl border p-10 ${step.accent}`}
              >
                <span
                  className={`inline-flex items-center justify-center rounded-full px-4 py-1.5 text-sm font-bold ${step.badge}`}
                >
                  {step.number}
                </span>

                <h3 className="mt-7 text-2xl font-semibold text-foreground">
                  {step.title}
                </h3>
                <p className="editorial-copy mt-4 text-base leading-relaxed">
                  {step.description}
                </p>

                <div className="mt-7 flex flex-wrap gap-2">
                  {step.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-surface-container-lowest px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-secondary"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

        </div>

        </div>{/* space-y-20 */}
      </Container>
    </section>
  );
}
