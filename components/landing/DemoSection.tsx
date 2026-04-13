import { Container } from "@/components/layout/Container";
import { DemoCard } from "@/components/landing/DemoCard";
import { mockDemoCards } from "@/lib/mock";

export function DemoSection() {
  return (
    <section id="demo" className="px-6 pb-24 md:px-0 md:pb-32">
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
    </section>
  );
}
