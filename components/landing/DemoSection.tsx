import { Container } from "@/components/layout/Container";
import { DemoCard } from "@/components/landing/DemoCard";
import { mockDemoCards } from "@/lib/mock";

const showcaseItems = [
  {
    title: "Coastline Journal",
    image: "/demo/archive-wall.svg",
    aspect: "aspect-[3/4]",
  },
  {
    title: "Studio Notes",
    image: "/demo/editorial-desk.svg",
    aspect: "aspect-[4/5]",
  },
  {
    title: "Late Walk",
    image: "/demo/night-walk.svg",
    aspect: "aspect-[3/4]",
  },
  {
    title: "Travel Essay",
    image: "/demo/travel-note.svg",
    aspect: "aspect-[4/3]",
  },
  {
    title: "Table Archive",
    image: "/demo/dinner-table.svg",
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
              {"\uC815\uAD50\uD55C \uCD9C\uD310 \uD750\uB984"}
            </p>
            <h2 className="display-copy mt-4 text-4xl font-semibold md:text-6xl">
              {"\uCEE8\uD150\uCE20 \uC815\uB9AC\uC5D0\uC11C \uCD9C\uD310 \uC900\uBE44\uAE4C\uC9C0"}
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
              {"\uC644\uC131 \uC608\uC2DC"}
            </p>
            <h2 className="display-copy mt-4 text-4xl font-semibold md:text-6xl">
              {"\uC5D0\uB514\uD1A0\uB9AC\uC5BC \uC1FC\uCF00\uC774\uC2A4"}
            </h2>
            <p className="editorial-copy mt-4 max-w-2xl text-sm">
              {
                "\uD3C9\uB4F1\uD55C \uADF8\uB9AC\uB4DC\uBCF4\uB2E4 \uBC00\uB3C4 \uC640 \uC5EC\uBC31 \uCC28\uC774\uB97C \uD65C\uC6A9\uD574, \uAC01 \uD504\uB85C\uC81D\uD2B8\uAC00 \uD558\uB098\uC758 \uC804\uC2DC \uC791\uD488\uCC98\uB7FC \uBCF4\uC774\uB3C4\uB85D \uAD6C\uC131\uD569\uB2C8\uB2E4."
              }
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
                  {"\uB2F9\uC2E0\uC758 \uAE30\uB85D\uC744"}
                  <br />
                  <span className="italic font-normal">
                    {"\uC544\uB984\uB2F5\uAC8C \uBCF4\uC874"}
                  </span>
                  {"\uD558\uC138\uC694."}
                </p>
              </div>
            </div>
          </div>
        </Container>
      </div>
    </section>
  );
}
