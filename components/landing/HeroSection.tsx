import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden px-6 py-20 md:px-0 md:py-28">
      <Container>
        <div className="grid items-center gap-16 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-8">
            <p className="section-label">
              {"AI Assisted Photobook Publishing"}
            </p>
            <div className="space-y-6">
              <h1 className="display-copy max-w-4xl text-5xl leading-[0.94] font-semibold text-foreground md:text-7xl">
                {"\uD761\uC5B4\uC9C4 \uC7A5\uBA74\uC744"}
                <br />
                {"\uCD9C\uD310 \uAC00\uB2A5\uD55C \uD55C \uAD8C\uC758"}
                <br />
                <span className="italic font-normal">
                  {"\uBAA8\uB178\uADF8\uB798\uD504"}
                </span>
                {"\uB85C \uC5EE\uC2B5\uB2C8\uB2E4."}
              </h1>
              <p className="editorial-copy max-w-2xl text-lg">
                {
                  "\uC0AC\uC9C4, \uC9E7\uC740 \uAE30\uB85D, \uC791\uC740 \uBA54\uBAA8\uB97C \uBAA8\uC544 \uC5D0\uB514\uD1A0\uB9AC\uC5BC \uD3EC\uD1A0\uBD81 \uCD08\uC548\uC73C\uB85C \uC815\uB9AC\uD558\uACE0, SweetBook Sandbox \uC8FC\uBB38\uAE4C\uC9C0 \uD55C \uD750\uB984\uC73C\uB85C \uC5F0\uACB0\uD569\uB2C8\uB2E4."
                }
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <Button href="/studio/new">
                {"\uCCAB \uD504\uB85C\uC81D\uD2B8 \uC2DC\uC791"}
              </Button>
              <Button href="#demo" variant="secondary">
                {"\uC1FC\uCF00\uC774\uC2A4 \uBCF4\uAE30"}
              </Button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -left-10 top-14 hidden h-44 w-44 rounded-full bg-primary-soft blur-3xl lg:block" />
            <div className="relative mx-auto max-w-[32rem]">
              <div className="canvas-shadow rounded-[2rem] bg-surface-container-high p-6">
                <div className="rounded-[1.5rem] bg-surface-container-lowest p-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="section-label">
                        {"Editorial Cover Preview"}
                      </p>
                      <p className="display-copy mt-3 text-2xl italic">
                        {"Monograph No. 04"}
                      </p>
                    </div>
                    <div className="rounded-full bg-surface-container-low px-3 py-1 text-xs font-semibold text-secondary">
                      {"Sandbox Ready"}
                    </div>
                  </div>
                  <div className="mt-8 grid gap-6 md:grid-cols-[0.9fr_1.1fr]">
                    <div className="space-y-4">
                      <div className="aspect-[3/4] overflow-hidden rounded-sm bg-[url('/demo/cover-morning.svg')] bg-cover bg-center" />
                      <p className="text-xs uppercase tracking-[0.18em] text-secondary">
                        {"Collector's Edition"}
                      </p>
                    </div>
                    <div className="flex flex-col justify-between rounded-[1.5rem] bg-surface-container-low p-6">
                      <div>
                        <p className="display-copy text-3xl leading-tight font-semibold">
                          {"\uAE30\uC5B5\uC744 \uC815\uB9AC\uD558\uB294"}
                          <br />
                          {"\uCDA9\uBD84\uD55C \uC5EC\uBC31"}
                        </p>
                        <p className="editorial-copy mt-4 text-sm">
                          {
                            "\uCEE4\uBC84, \uC139\uC158 \uC81C\uBAA9, \uD398\uC774\uC9C0 \uD750\uB984, \uC8FC\uBB38 \uC694\uC57D\uAE4C\uC9C0 \uD558\uB098\uC758 \uC5D0\uB514\uD1A0\uB9AC\uC5BC \uACBD\uD5D8\uC73C\uB85C \uC124\uACC4\uD55C \uCD9C\uD310 \uC2A4\uD29C\uB514\uC624 \uC785\uB2C8\uB2E4."
                          }
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="aspect-[4/3] rounded-[1rem] bg-[url('/demo/editorial-desk.svg')] bg-cover bg-center" />
                        <div className="aspect-[4/3] rounded-[1rem] bg-[url('/demo/archive-wall.svg')] bg-cover bg-center" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
