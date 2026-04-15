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

const formatCurrency = (value: number) => `${value.toLocaleString()} KRW`;

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const project = useProjectStore((state) => state.projects[params.id]);
  const upsertProject = useProjectStore((state) => state.upsertProject);
  const [isHydrating, setIsHydrating] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let timeoutId: number | null = null;
    const startedAt = Date.now();

    const scheduleNextSync = () => {
      if (cancelled) {
        return;
      }

      const elapsed = Date.now() - startedAt;
      const nextDelay = elapsed < 60_000 ? 5_000 : 15_000;
      timeoutId = window.setTimeout(() => {
        void syncProject();
      }, nextDelay);
    };

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
        // 로컬 상태를 유지하고 다음 주기에 다시 동기화한다.
      } finally {
        if (!cancelled) {
          setIsHydrating(false);
          scheduleNextSync();
        }
      }
    };

    void syncProject();

    return () => {
      cancelled = true;
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [params.id, upsertProject]);

  if (isHydrating && !project?.order) {
    return (
      <>
        <Header />
        <main className="px-6 py-16 md:px-0">
          <Container>
            <Card className="bg-surface-container-low p-10 text-center shadow-none">
              <p className="display-copy text-4xl text-foreground">
                주문 상태 불러오는 중
              </p>
              <p className="editorial-copy mt-4 text-sm">
                서버에서 최신 주문 정보를 확인하고 있습니다.
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
              <p className="display-copy text-4xl text-foreground">
                주문 정보 없음
              </p>
              <p className="editorial-copy mt-4 text-sm">
                아직 주문 기록을 찾지 못했습니다. 프로젝트 생성부터 다시
                진행해 주세요.
              </p>
              <div className="mt-8 flex justify-center gap-3">
                <Button href="/studio/new">새 프로젝트 만들기</Button>
                <Button href="/" variant="secondary">
                  홈으로
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
            <p className="section-label">주문 확인</p>
            <h1 className="display-copy mt-4 text-5xl font-semibold md:text-6xl">
              주문이 정상적으로 접수되었습니다
            </h1>
            <p className="editorial-copy mt-4 max-w-2xl text-sm">
              이 화면의 금액은 실제 주문 기준 확정 금액입니다. 주문 상태와
              배송 진행 상황도 아래에서 계속 확인할 수 있습니다.
            </p>
          </header>

          <div className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr]">
            <section className="space-y-6">
              <Card className="bg-surface-container-low p-8 shadow-none">
                <p className="section-label">주문 상태</p>
                <p className="display-copy mt-4 text-5xl text-foreground">
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
                    <p className="section-label">책 UID</p>
                    <p className="mt-3 break-all text-sm font-semibold text-foreground">
                      {project.sweetbookBookUid ?? "-"}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="bg-surface-container-low p-8 shadow-none">
                <p className="section-label">배송 정보</p>
                <div className="mt-6 space-y-4 text-sm">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted">받는 분</span>
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
                <p className="section-label">주문 상품</p>
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
                          {formatCurrency(item.itemAmount)}
                        </p>
                      </div>
                      <div className="mt-4 flex items-center justify-between text-sm text-muted">
                        <span>상품 금액</span>
                        <span>{formatCurrency(item.itemAmount)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="bg-surface-container-low p-8 shadow-none">
                <div className="flex items-center justify-between">
                  <p className="section-label">확정 금액</p>
                  <p className="text-xs uppercase tracking-[0.18em] text-secondary">
                    주문 기준
                  </p>
                </div>
                <div className="mt-6 space-y-4 text-sm">
                  <div className="flex items-center justify-between text-muted">
                    <span>확정 상품금액</span>
                    <span>{formatCurrency(order.totalProductAmount)}</span>
                  </div>
                  <div className="flex items-center justify-between text-muted">
                    <span>확정 배송비</span>
                    <span>{formatCurrency(order.totalShippingFee)}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-outline pt-4 text-2xl font-semibold text-foreground">
                    <span>최종 결제금액</span>
                    <span>{formatCurrency(order.totalAmount)}</span>
                  </div>
                </div>
              </Card>

              <Card className="bg-surface-container-low p-8 shadow-none">
                <div className="flex items-center justify-between gap-4">
                  <p className="section-label">상태 업데이트</p>
                  <p className="text-xs uppercase tracking-[0.18em] text-secondary">
                    첫 1분 5초 · 이후 15초 자동 갱신
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
                            {event.bookUid && <p>{`책: ${event.bookUid}`}</p>}
                            {event.trackingNumber && (
                              <p>{`송장: ${event.trackingNumber}`}</p>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl bg-surface-container-lowest p-5 text-sm text-muted">
                      SweetBook에서 상태 이벤트를 보내면 여기에서 시간 순서대로
                      확인할 수 있습니다.
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
                  사운드트랙
                </p>
                <h2 className="mt-2 text-xl font-semibold text-white/90">
                  책의 BGM을 함께 들어보세요
                </h2>
                <p className="mt-3 text-sm text-white/50">
                  QR 코드를 스캔하면 사운드트랙 MP3를 바로 재생할 수 있습니다.
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
