"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { Container } from "@/components/layout/Container";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SoundtrackQR } from "@/components/ui/SoundtrackQR";
import { useProjectStore } from "@/store/useProjectStore";
import type { Project } from "@/types/project";

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const project = useProjectStore((state) => state.projects[params.id]);
  const upsertProject = useProjectStore((state) => state.upsertProject);
  const [isHydrating, setIsHydrating] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const syncProject = async () => {
      try {
        const response = await fetch(`/api/projects/${params.id}`, {
          cache: "no-store",
        });

        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as { project: Project };
        if (!cancelled) {
          upsertProject(payload.project);
        }
      } catch {
        // 로컬 데이터 우선 사용
      } finally {
        if (!cancelled) {
          setIsHydrating(false);
        }
      }
    };

    void syncProject();
    const intervalId = window.setInterval(() => {
      void syncProject();
    }, 15000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [params.id, upsertProject]);

  if (isHydrating && !project?.order) {
    return (
      <>
        <Header />
        <main className="px-6 py-16 md:px-0">
          <Container>
            <Card className="bg-surface-container-low p-10 text-center shadow-none">
              <p className="display-copy text-4xl italic text-foreground">
                주문 동기화 중
              </p>
              <p className="editorial-copy mt-4 text-sm">
                서버에서 최신 주문 데이터와 웹훅 타임라인을 가져오고 있습니다.
              </p>
            </Card>
          </Container>
        </main>
      </>
    );
  }

  if (!project?.order) {
    return (
      <>
        <Header />
        <main className="px-6 py-16 md:px-0">
          <Container>
            <Card className="bg-surface-container-low p-10 text-center shadow-none">
              <p className="display-copy text-4xl italic text-foreground">
                주문 없음
              </p>
              <p className="editorial-copy mt-4 text-sm">
                주문 기록이 없습니다. 새 프로젝트를 시작하고 스튜디오에서 처음부터 진행하세요.
              </p>
              <div className="mt-8 flex justify-center gap-3">
                <Button href="/studio/new">새 프로젝트</Button>
                <Button href="/" variant="secondary">
                  홈
                </Button>
              </div>
            </Card>
          </Container>
        </main>
      </>
    );
  }

  const { order } = project;

  return (
    <>
      <Header />
      <main className="px-6 py-12 md:px-0 md:py-16">
        <Container>
          <header className="mb-14">
            <p className="section-label">주문 상세</p>
            <h1 className="display-copy mt-4 text-5xl font-semibold md:text-6xl">
              주문이 생성되었습니다
            </h1>
            <p className="editorial-copy mt-4 max-w-2xl text-sm">
              SweetBook Sandbox 주문 응답을 요약하며, 웹훅 기반 상태 업데이트를 실시간으로 반영합니다.
            </p>
          </header>

          <div className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr]">
            <section className="space-y-6">
              <Card className="bg-surface-container-low p-8 shadow-none">
                <p className="section-label">주문 상태</p>
                <p className="display-copy mt-4 text-5xl italic text-foreground">
                  {order.orderStatusDisplay}
                </p>
                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl bg-surface-container-lowest p-5">
                    <p className="section-label">주문 UID</p>
                    <p className="mt-3 break-all text-sm font-semibold text-foreground">
                      {order.orderUid}
                    </p>
                  </div>
                  <div className="rounded-xl bg-surface-container-lowest p-5">
                    <p className="section-label">도서 UID</p>
                    <p className="mt-3 break-all text-sm font-semibold text-foreground">
                      {project.sweetbookBookUid ?? "-"}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="bg-surface-container-low p-8 shadow-none">
                <p className="section-label">배송</p>
                <div className="mt-6 space-y-4 text-sm">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted">수령인</span>
                    <span className="font-semibold text-foreground">
                      {order.recipientName}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted">연락처</span>
                    <span className="font-semibold text-foreground">
                      {order.recipientPhone}
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-muted">주소</span>
                    <span className="max-w-sm text-right font-semibold text-foreground">
                      {order.postalCode} {order.address1} {order.address2}
                    </span>
                  </div>
                </div>
              </Card>
            </section>

            <section className="space-y-6">
              <Card className="bg-surface-container-low p-8 shadow-none">
                <p className="section-label">항목</p>
                <div className="mt-6 space-y-4">
                  {order.items.map((item) => (
                    <div
                      key={item.itemUid}
                      className="rounded-xl bg-surface-container-lowest p-6"
                    >
                      <div className="flex items-start justify-between gap-6">
                        <div>
                          <p className="display-copy text-3xl leading-tight text-foreground">
                            {item.bookTitle}
                          </p>
                          <p className="mt-3 text-xs uppercase tracking-[0.18em] text-secondary">
                            {`수량 ${item.quantity} · ${item.itemStatusDisplay}`}
                          </p>
                        </div>
                        <p className="text-lg font-semibold text-foreground">
                          {item.itemAmount.toLocaleString()} KRW
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="bg-surface-container-low p-8 shadow-none">
                <div className="flex items-center justify-between">
                  <p className="section-label">합계</p>
                  <p className="text-3xl font-semibold text-foreground">
                    {order.totalAmount.toLocaleString()} KRW
                  </p>
                </div>
              </Card>

              <Card className="bg-surface-container-low p-8 shadow-none">
                <div className="flex items-center justify-between gap-4">
                  <p className="section-label">웹훅 타임라인</p>
                  <p className="text-xs uppercase tracking-[0.18em] text-secondary">
                    15초마다 자동 갱신
                  </p>
                </div>
                <div className="mt-6 space-y-4">
                  {(project.webhookEvents ?? []).length > 0 ? (
                    project.webhookEvents?.map((event) => (
                      <div
                        key={event.id}
                        className="rounded-xl bg-surface-container-lowest p-5"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-semibold text-foreground">
                              {event.label}
                            </p>
                            <p className="mt-2 text-xs uppercase tracking-[0.18em] text-secondary">
                              {event.event}
                            </p>
                          </div>
                          <p className="text-xs text-muted">
                            {new Intl.DateTimeFormat("ko-KR", {
                              dateStyle: "short",
                              timeStyle: "short",
                            }).format(new Date(event.receivedAt))}
                          </p>
                        </div>
                        {(event.orderUid || event.bookUid || event.trackingNumber) && (
                          <div className="mt-3 space-y-1 text-xs text-muted">
                            {event.orderUid && <p>{`주문: ${event.orderUid}`}</p>}
                            {event.bookUid && <p>{`도서: ${event.bookUid}`}</p>}
                            {event.trackingNumber && (
                              <p>{`운송장: ${event.trackingNumber}`}</p>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl bg-surface-container-lowest p-5 text-sm text-muted">
                      SweetBook에서 제작 또는 배송 상태 업데이트를 보내면 여기에 웹훅 이벤트가 표시됩니다.
                    </div>
                  )}
                </div>
              </Card>
            </section>
          </div>

          <section className="mt-16">
            <div className="flex flex-col items-center gap-6 rounded-2xl bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] p-10">
              <div className="text-center">
                <p className="text-xs uppercase tracking-[0.25em] text-white/40">
                  AI 사운드트랙
                </p>
                <h2 className="mt-2 text-xl font-semibold text-white/90">
                  책의 BGM을 들어보세요
                </h2>
                <p className="mt-3 text-sm text-white/50">
                  QR 코드를 스캔해 이 프로젝트의 사운드트랙 페이지를 열어보세요.
                </p>
              </div>
              <SoundtrackQR
                projectId={params.id}
                projectTitle={project.title}
                size={160}
              />
            </div>
          </section>
        </Container>
      </main>
    </>
  );
}
