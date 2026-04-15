import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden px-6 py-20 md:px-0 md:py-28">
      {/* 배경 블러 오브 */}
      <div className="pointer-events-none absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />

      <Container>
        <div className="grid items-center gap-14 lg:grid-cols-[1.1fr_0.9fr]">
          {/* 왼쪽: 카피 */}
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-soft px-4 py-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                나만의 포토북 제작 서비스
              </span>
            </div>

            <div className="space-y-5">
              <h1 className="display-copy max-w-2xl text-5xl leading-[1.15] font-semibold text-foreground md:text-[4.25rem]">
                사랑하는 사람에게
                <br />
                건넬 수 있는
                <br />
                <em className="not-italic font-normal text-primary">
                  단 한 권의 선물
                </em>
              </h1>
              <p className="editorial-copy max-w-xl text-lg">
                가족 사진, 여행 기록, 아이의 성장. 직접 만든 포토북으로 마음을 전하세요.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <Button href="/studio/new">
                포토북 만들기
              </Button>
              <Button href="#how-it-works" variant="secondary">
                어떻게 만드나요?
              </Button>
            </div>

          </div>

          {/* 오른쪽: 제품 미리보기 카드 */}
          <div className="relative">
            <div className="absolute -left-8 top-12 hidden h-56 w-56 rounded-full bg-primary/6 blur-3xl lg:block" />
            <div className="relative mx-auto max-w-[30rem]">
              <div className="canvas-shadow rounded-[2rem] bg-surface-container-high p-4">
                <div className="rounded-[1.5rem] bg-surface-container-lowest">
                  {/* 카드 헤더 */}
                  <div className="flex items-center justify-between border-b border-outline/50 px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-3 w-3 rounded-full bg-surface-container-highest" />
                      <div className="h-3 w-3 rounded-full bg-surface-container-highest" />
                      <div className="h-3 w-3 rounded-full bg-primary/40" />
                    </div>
                    <span className="rounded-full bg-surface-container-low px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-secondary">
                      SweetBook Studio
                    </span>
                  </div>

                  <div className="p-5">
                    {/* 스텝 뱃지 */}
                    <div className="mb-4 flex gap-2">
                      {["템플릿", "에디터", "결제"].map((s, i) => (
                        <span
                          key={s}
                          className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${
                            i === 1
                              ? "bg-primary text-white"
                              : "bg-surface-container-low text-secondary"
                          }`}
                        >
                          {s}
                        </span>
                      ))}
                    </div>

                    {/* 에디터 미리보기 */}
                    <div className="grid gap-3 md:grid-cols-[0.85fr_1.15fr]">
                      {/* 섹션 리스트 */}
                      <div className="space-y-2 rounded-xl bg-surface-container-low p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-secondary">
                          페이지
                        </p>
                        {["표지", "목차", "섹션 01", "섹션 02", "본문 A", "마무리"].map((s, i) => (
                          <div
                            key={s}
                            className={`rounded-lg px-3 py-2 text-xs font-medium ${
                              i === 2
                                ? "bg-primary/10 text-primary"
                                : "text-secondary"
                            }`}
                          >
                            {s}
                          </div>
                        ))}
                      </div>

                      {/* 페이지 캔버스 미리보기 */}
                      <div className="rounded-xl bg-surface-container-low p-3">
                        <div
                          className="relative overflow-hidden rounded-lg bg-cover bg-center"
                          style={{
                            aspectRatio: "210/297",
                            backgroundImage:
                              "url('https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&q=80&auto=format&fit=crop')",
                          }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[rgba(13,27,52,0.55)]" />
                          <div className="absolute bottom-3 left-3 right-3">
                            <p className="display-copy text-sm font-semibold leading-tight text-white">
                              기억을 정리하는
                              <br />
                              충분한 여백
                            </p>
                          </div>
                        </div>
                        <div className="mt-3 flex justify-between text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary">
                          <span>섹션 01 · 표지</span>
                          <span>36p</span>
                        </div>
                      </div>
                    </div>

                    {/* 하단 액션 바 */}
                    <div className="mt-4 flex items-center justify-between rounded-xl bg-surface-container-low px-4 py-3">
                      <span className="text-xs text-secondary">
                        구글포토북A · A4 소프트커버
                      </span>
                      <span className="rounded-full bg-primary px-3 py-1 text-[10px] font-semibold text-white">
                        결제하기 →
                      </span>
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
