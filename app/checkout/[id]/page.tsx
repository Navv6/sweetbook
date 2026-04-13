"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { Container } from "@/components/layout/Container";
import { Header } from "@/components/layout/Header";
import { BookPreviewModal } from "@/components/preview/BookPreviewModal";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { sanitizeDisplayImageUrl } from "@/lib/media";
import { useProjectStore } from "@/store/useProjectStore";
import type { Order, Project, ShippingInfo } from "@/types/project";

export default function CheckoutPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const project = useProjectStore((state) => state.projects[params.id]);
  const upsertProject = useProjectStore((state) => state.upsertProject);
  const setOrder = useProjectStore((state) => state.setOrder);
  const setEstimate = useProjectStore((state) => state.setEstimate);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const lastEstimateRequestKeyRef = useRef<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [shipping, setShipping] = useState<ShippingInfo>({
    recipientName: "홍길동",
    recipientPhone: "010-1234-5678",
    postalCode: "06101",
    address1: "서울특별시 강남구 테헤란로 123",
    address2: "4층 401호",
    memo: "샌드박스 테스트 주문",
  });

  const derivedPageCount =
    project?.generatedSections.reduce(
      (accumulator, section) => accumulator + section.pages.length,
      0,
    ) ?? 0;
  const checkoutCoverImageUrl =
    sanitizeDisplayImageUrl(project?.coverImageUrl) ?? "/demo/cover-morning.svg";

  const estimateRequest = useMemo(() => {
    if (!project) {
      return null;
    }

    return {
      requestKey: JSON.stringify({
        id: project.id,
        title: project.title,
        templateId: project.templateId,
        bookSpecId: project.bookSpecId,
        coverImageUrl: project.coverImageUrl,
        status: project.status,
        sweetbookBookUid: project.sweetbookBookUid,
        quantity,
        contentItems: project.contentItems,
        generatedSections: project.generatedSections,
      }),
      payload: {
        ...project,
        estimate: undefined,
        order: undefined,
      },
    };
  }, [project, quantity]);

  useEffect(() => {
    if (
      !project ||
      !estimateRequest ||
      !project.sweetbookBookUid ||
      project.status !== "published"
    ) {
      return;
    }

    if (lastEstimateRequestKeyRef.current === estimateRequest.requestKey) {
      return;
    }

    lastEstimateRequestKeyRef.current = estimateRequest.requestKey;

    let cancelled = false;

    void fetch(`/api/projects/${project.id}/estimate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project: estimateRequest.payload, quantity }),
    })
      .then((response) => response.json())
      .then((payload: { estimate: Project["estimate"] }) => {
        if (!cancelled && payload.estimate) {
          setEstimate(project.id, payload.estimate);
        }
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [estimateRequest, project, quantity, setEstimate]);

  const handleCheckout = async () => {
    if (!project) {
      return;
    }

    setIsSubmitting(true);

    try {
      let publishPayload: {
        project: Project;
        publish: { sweetbookBookUid: string };
      };

      if (project.status === "published" && project.sweetbookBookUid) {
        publishPayload = {
          project,
          publish: { sweetbookBookUid: project.sweetbookBookUid },
        };
      } else {
        const publishResponse = await fetch(`/api/projects/${project.id}/publish`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ project }),
        });

        if (!publishResponse.ok) {
          const errBody = (await publishResponse.json().catch(() => null)) as
            | { message?: string }
            | null;
          throw new Error(errBody?.message ?? "책 출판에 실패했습니다.");
        }

        publishPayload = (await publishResponse.json()) as {
          project: Project;
          publish: { sweetbookBookUid: string };
        };
      }

      upsertProject(publishPayload.project);

      const orderResponse = await fetch(`/api/projects/${project.id}/order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          project: publishPayload.project,
          quantity,
          shipping,
        }),
      });

      if (!orderResponse.ok) {
        const errBody = (await orderResponse.json().catch(() => null)) as
          | { message?: string }
          | null;
        throw new Error(errBody?.message ?? "주문 생성에 실패했습니다.");
      }

      const orderPayload = (await orderResponse.json()) as {
        project: Project;
        order: Order;
      };

      upsertProject(orderPayload.project);
      setOrder(project.id, orderPayload.order);
      router.push(`/orders/${project.id}`);
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "결제 진행 중 오류가 발생했습니다.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!project) {
    return (
      <>
        <Header />
        <main className="px-6 py-16 md:px-0">
          <Container>
            <Card className="bg-surface-container-low p-10 text-center shadow-none">
              <p className="display-copy text-4xl italic text-foreground">
                결제 정보 없음
              </p>
              <p className="editorial-copy mt-4 text-sm">
                결제할 프로젝트가 없습니다. 새 프로젝트를 시작하고 템플릿 페이지를 먼저 생성하세요.
              </p>
              <div className="mt-8 flex justify-center">
                <Button href="/studio/new">새 프로젝트</Button>
              </div>
            </Card>
          </Container>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="px-6 py-12 md:px-0 md:py-16">
        <Container>
          <header className="mb-14">
            <p className="section-label">최종 결제</p>
            <h1 className="display-copy mt-4 text-5xl font-semibold md:text-6xl">
              배송 정보를 확인하고 주문을 완료하세요
            </h1>
            <p className="editorial-copy mt-4 max-w-2xl text-sm">
              SweetBook Sandbox API를 통해 출판 및 주문 절차를 진행합니다.
            </p>
          </header>

          <div className="grid gap-12 lg:grid-cols-[0.92fr_0.78fr]">
            <section className="space-y-14">
              <div>
                <div className="mb-8 flex items-center gap-3">
                  <span className="display-copy text-3xl italic">01.</span>
                  <h2 className="section-label text-foreground">배송 정보</h2>
                </div>
                <div className="grid gap-8 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className="section-label block">수령인</label>
                    <Input
                      value={shipping.recipientName}
                      onChange={(event) =>
                        setShipping((current) => ({
                          ...current,
                          recipientName: event.target.value,
                        }))
                      }
                      className="mt-3"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="section-label block">주소</label>
                    <Input
                      value={shipping.address1}
                      onChange={(event) =>
                        setShipping((current) => ({
                          ...current,
                          address1: event.target.value,
                        }))
                      }
                      className="mt-3"
                    />
                  </div>
                  <div>
                    <label className="section-label block">우편번호</label>
                    <Input
                      value={shipping.postalCode}
                      onChange={(event) =>
                        setShipping((current) => ({
                          ...current,
                          postalCode: event.target.value,
                        }))
                      }
                      className="mt-3"
                    />
                  </div>
                  <div>
                    <label className="section-label block">상세 주소</label>
                    <Input
                      value={shipping.address2}
                      onChange={(event) =>
                        setShipping((current) => ({
                          ...current,
                          address2: event.target.value,
                        }))
                      }
                      className="mt-3"
                    />
                  </div>
                  <div>
                    <label className="section-label block">연락처</label>
                    <Input
                      value={shipping.recipientPhone}
                      onChange={(event) =>
                        setShipping((current) => ({
                          ...current,
                          recipientPhone: event.target.value,
                        }))
                      }
                      className="mt-3"
                    />
                  </div>
                  <div>
                    <label className="section-label block">수량</label>
                    <Input
                      value={String(quantity)}
                      onChange={(event) =>
                        setQuantity(Math.max(Number(event.target.value) || 1, 1))
                      }
                      type="number"
                      min={1}
                      className="mt-3"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="section-label block">메모</label>
                    <Input
                      value={shipping.memo}
                      onChange={(event) =>
                        setShipping((current) => ({
                          ...current,
                          memo: event.target.value,
                        }))
                      }
                      className="mt-3"
                    />
                  </div>
                </div>
              </div>

              <div>
                <div className="mb-8 flex items-center gap-3">
                  <span className="display-copy text-3xl italic">02.</span>
                  <h2 className="section-label text-foreground">주문 실행</h2>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl bg-surface-container-lowest p-6 shadow-[0_20px_40px_rgba(13,27,52,0.04)]">
                    <p className="text-sm font-semibold text-foreground">
                      출판
                    </p>
                    <p className="editorial-copy mt-2 text-sm">
                      스키마 기반 페이지가 SweetBook 표지 및 내지 엔드포인트로 전송됩니다.
                    </p>
                  </div>
                  <div className="rounded-xl bg-surface-container-low p-6">
                    <p className="text-sm font-semibold text-foreground">
                      샌드박스
                    </p>
                    <p className="editorial-copy mt-2 text-sm">
                      견적, 출판, 주문 처리에 API 키가 필요합니다.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-[rgba(0,104,85,0.06)] p-6">
                <p className="text-sm font-semibold text-success">
                  템플릿 스키마 준비 완료
                </p>
                <p className="editorial-copy mt-2 text-sm">
                  프로젝트가 스키마 생성 페이지를 사용하며 해당 템플릿 인스턴스 그대로 출판됩니다.
                </p>
              </div>
            </section>

            <aside className="lg:sticky lg:top-28 lg:h-fit">
              <div className="rounded-[2rem] bg-surface-container-low p-8">
                <h2 className="display-copy text-4xl font-semibold">
                  주문 요약
                </h2>
                <div className="mt-8 flex gap-6">
                  <div className="w-28 shrink-0 overflow-hidden rounded-sm bg-surface-container-highest">
                    <div
                      className="aspect-[3/4] bg-cover bg-center"
                      style={{
                        backgroundImage: `url(${checkoutCoverImageUrl})`,
                      }}
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="display-copy text-3xl leading-tight">
                      {project.title}
                    </p>
                    <p className="mt-3 text-xs uppercase tracking-[0.18em] text-secondary">
                      {`테마 패밀리 · ${project.templateId}`}
                    </p>
                    <ul className="mt-4 space-y-2 text-sm text-muted">
                      <li>{`${derivedPageCount}페이지`}</li>
                      <li>{project.bookSpecId}</li>
                      <li>{`${quantity}부`}</li>
                    </ul>
                  </div>
                </div>

                <div className="mt-10 space-y-4 border-t border-outline pt-8 text-sm">
                  <div className="flex items-center justify-between text-muted">
                    <span>소계</span>
                    <span>{project.estimate?.subtotal.toLocaleString() ?? "-"} KRW</span>
                  </div>
                  <div className="flex items-center justify-between text-muted">
                    <span>배송비</span>
                    <span>{project.estimate?.shippingFee.toLocaleString() ?? "-"} KRW</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-outline pt-4 text-2xl font-semibold text-foreground">
                    <span>합계</span>
                    <span>{project.estimate?.total.toLocaleString() ?? "-"} KRW</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsPreviewOpen(true)}
                  className="mt-8 w-full rounded-xl border border-outline py-3 text-sm font-medium text-secondary transition hover:border-primary/40 hover:text-primary"
                >
                  미리보기
                </button>

                <Button
                  type="button"
                  className="mt-3 w-full py-4 text-base"
                  onClick={handleCheckout}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "출판 및 주문 중..." : "출판 및 주문"}
                </Button>

                <p className="mt-5 text-center text-[11px] uppercase tracking-[0.2em] text-secondary">
                  SweetBook Sandbox 환경
                </p>
              </div>
            </aside>
          </div>
        </Container>
      </main>

      <BookPreviewModal
        project={project}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
      />
    </>
  );
}
