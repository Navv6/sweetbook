import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden px-6 py-20 md:px-0 md:py-28">
      <Container>
        <div className="grid items-center gap-16 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-8">
            <p className="section-label">
              AI 포토북 출판 플랫폼
            </p>
            <div className="space-y-6">
              <h1 className="display-copy max-w-4xl text-5xl leading-[0.94] font-semibold text-foreground md:text-7xl">
                흩어진 장면을
                <br />
                출판 가능한 한 권의
                <br />
                <span className="italic font-normal">
                  모노그래프
                </span>
                로 엮습니다.
              </h1>
              <p className="editorial-copy max-w-2xl text-lg">
                사진, 짧은 기록, 작은 메모를 모아 에디토리얼 포토북 초안으로 정리하고, SweetBook Sandbox 주문까지 한 흐름으로 연결합니다.
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <Button href="/studio/new">
                첫 프로젝트 시작
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
                        에디토리얼 표지 미리보기
                      </p>
                      <p className="display-copy mt-3 text-2xl italic">
                        모노그래프 No. 04
                      </p>
                    </div>
                    <div className="rounded-full bg-surface-container-low px-3 py-1 text-xs font-semibold text-secondary">
                      샌드박스
                    </div>
                  </div>
                  <div className="mt-8 grid gap-6 md:grid-cols-[0.9fr_1.1fr]">
                    <div className="space-y-4">
                      <div className="aspect-[3/4] overflow-hidden rounded-sm bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600&q=80&auto=format&fit=crop')" }} />
                      <p className="text-xs uppercase tracking-[0.18em] text-secondary">
                        컬렉터스 에디션
                      </p>
                    </div>
                    <div className="flex flex-col justify-between rounded-[1.5rem] bg-surface-container-low p-6">
                      <div>
                        <p className="display-copy text-3xl leading-tight font-semibold">
                          기억을 정리하는
                          <br />
                          충분한 여백
                        </p>
                        <p className="editorial-copy mt-4 text-sm">
                          커버, 섹션 제목, 페이지 흐름, 주문 요약까지 하나의 에디토리얼 경험으로 설계한 출판 스튜디오 입니다.
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="aspect-[4/3] rounded-[1rem] bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80&auto=format&fit=crop')" }} />
                        <div className="aspect-[4/3] rounded-[1rem] bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80&auto=format&fit=crop')" }} />
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
