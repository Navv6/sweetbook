import { Container } from "@/components/layout/Container";
import { DemoCard } from "@/components/landing/DemoCard";
import { mockDemoCards } from "@/lib/mock";

const showcaseItems = [
  {
    title: "해안 일지",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80&auto=format&fit=crop",
    aspect: "aspect-[3/4]",
  },
  {
    title: "스튜디오 노트",
    image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80&auto=format&fit=crop",
    aspect: "aspect-[4/5]",
  },
  {
    title: "늦은 산책",
    image: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&q=80&auto=format&fit=crop",
    aspect: "aspect-[3/4]",
  },
  {
    title: "여행 에세이",
    image: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80&auto=format&fit=crop",
    aspect: "aspect-[4/3]",
  },
  {
    title: "테이블 아카이브",
    image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80&auto=format&fit=crop",
    aspect: "aspect-[4/5]",
  },
];

export function DemoSection() {
  return (
    <section id="demo" className="space-y-28 px-6 pb-24 md:px-0 md:pb-32">
      <Container>
        <div className="space-y-10">
          <div className="max-w-3xl">
            <p className="section-label">
              정교한 출판 흐름
            </p>
            <h2 className="display-copy mt-4 text-4xl font-semibold md:text-6xl">
              콘텐츠 정리에서 출판 준비까지
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {mockDemoCards.map((card, index) => (
              <DemoCard
                key={card.title}
                index={index + 1}
                title={card.title}
                description={card.description}
              />
            ))}
          </div>
        </div>
      </Container>

      <div className="bg-surface-container-low/60 py-20">
        <Container>
          <div className="mb-14">
            <p className="section-label">
              완성 예시
            </p>
            <h2 className="display-copy mt-4 text-4xl font-semibold md:text-6xl">
              에디토리얼 쇼케이스
            </h2>
            <p className="editorial-copy mt-4 max-w-2xl text-sm">
              평등한 그리드보다 밀도 와 여백 차이를 활용해, 각 프로젝트가 하나의 전시 작품처럼 보이도록 구성합니다.
            </p>
          </div>
          <div className="grid gap-10 md:grid-cols-3">
            <div className="space-y-10">
              {showcaseItems.slice(0, 2).map((item) => (
                <div key={item.title}>
                  <div
                    className={`${item.aspect} overflow-hidden rounded-sm bg-cover bg-center page-shadow`}
                    style={{ backgroundImage: `url(${item.image})` }}
                  />
                  <p className="mt-4 text-xs uppercase tracking-[0.2em] text-secondary">
                    {item.title}
                  </p>
                </div>
              ))}
            </div>
            <div className="space-y-10 pt-10">
              {showcaseItems.slice(2, 4).map((item) => (
                <div key={item.title}>
                  <div
                    className={`${item.aspect} overflow-hidden rounded-sm bg-cover bg-center page-shadow`}
                    style={{ backgroundImage: `url(${item.image})` }}
                  />
                  <p className="mt-4 text-xs uppercase tracking-[0.2em] text-secondary">
                    {item.title}
                  </p>
                </div>
              ))}
            </div>
            <div className="space-y-10">
              {showcaseItems.slice(4).map((item) => (
                <div key={item.title}>
                  <div
                    className={`${item.aspect} overflow-hidden rounded-sm bg-cover bg-center page-shadow`}
                    style={{ backgroundImage: `url(${item.image})` }}
                  />
                  <p className="mt-4 text-xs uppercase tracking-[0.2em] text-secondary">
                    {item.title}
                  </p>
                </div>
              ))}
              <div className="rounded-2xl bg-surface-container-high p-8">
                <p className="display-copy text-4xl font-semibold">
                  당신의 기록을
                  <br />
                  <span className="italic font-normal">
                    아름답게 보존
                  </span>
                  하세요.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </div>
    </section>
  );
}
