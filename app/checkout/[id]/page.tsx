"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { Container } from "@/components/layout/Container";
import { Header } from "@/components/layout/Header";
import { BookPreviewModal } from "@/components/preview/BookPreviewModal";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { StepIndicator } from "@/components/ui/StepIndicator";
import { sanitizeDisplayImageUrl } from "@/lib/media";
import { getMinimumPageCount, isBelowMinimumPageCount } from "@/lib/spec-canvas";
import { useProjectStore } from "@/store/useProjectStore";
import type { Estimate, Order, Project, ShippingInfo } from "@/types/project";

const DEFAULT_SHIPPING: ShippingInfo = {
  recipientName: "홍길동",
  recipientPhone: "010-1234-5678",
  postalCode: "06101",
  address1: "서울시 강남구 테헤란로 123",
  address2: "4층 401호",
  memo: "스위트북 테스트 주문",
};

const formatCurrency = (value?: number) =>
  value === undefined ? "- KRW" : `${value.toLocaleString()} KRW`;

export default function CheckoutPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const project = useProjectStore((state) => state.projects[params.id]);
  const upsertProject = useProjectStore((state) => state.upsertProject);
  const setOrder = useProjectStore((state) => state.setOrder);
  const setEstimate = useProjectStore((state) => state.setEstimate);
  const clearEstimate = useProjectStore((state) => state.clearEstimate);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isEstimating, setIsEstimating] = useState(false);
  const [isOrdering, setIsOrdering] = useState(false);
  const [estimateError, setEstimateError] = useState<string | null>(null);
  const [estimateRetryNonce, setEstimateRetryNonce] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [shipping, setShipping] = useState<ShippingInfo>(DEFAULT_SHIPPING);
  const isMountedRef = useRef(true);
  const lastEstimateRequestKeyRef = useRef<string | null>(null);
  const estimateSequenceRef = useRef(0);

  const derivedPageCount =
    project?.generatedSections.reduce(
      (accumulator, section) => accumulator + section.pages.length,
      0,
    ) ?? 0;
  const checkoutCoverImageUrl =
    sanitizeDisplayImageUrl(project?.coverImageUrl) ?? "/demo/cover-morning.svg";
  const minimumPageCount = project ? getMinimumPageCount(project.bookSpecId) : 0;
  const belowMinimumPages = project
    ? isBelowMinimumPageCount(derivedPageCount, project.bookSpecId)
    : false;
  const isPublished = Boolean(
    project?.status === "published" && project.sweetbookBookUid,
  );

  const estimateRequest = useMemo(() => {
    if (!project || !isPublished) {
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
        estimateRetryNonce,
        contentItems: project.contentItems,
        generatedSections: project.generatedSections,
      }),
      payload: {
        ...project,
        estimate: undefined,
        order: undefined,
      },
    };
  }, [estimateRetryNonce, isPublished, project, quantity]);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!project || !estimateRequest || !isPublished) {
      setIsEstimating(false);
      return;
    }

    const hasCurrentEstimate = project.estimate?.quantity === quantity;

    if (
      hasCurrentEstimate &&
      lastEstimateRequestKeyRef.current === null &&
      estimateRetryNonce === 0
    ) {
      lastEstimateRequestKeyRef.current = estimateRequest.requestKey;
      return;
    }

    if (lastEstimateRequestKeyRef.current === estimateRequest.requestKey) {
      return;
    }

    lastEstimateRequestKeyRef.current = estimateRequest.requestKey;
    const requestId = estimateSequenceRef.current + 1;
    estimateSequenceRef.current = requestId;

    setEstimateError(null);
    setIsEstimating(true);

    if (!hasCurrentEstimate) {
      clearEstimate(project.id);
    }

    void fetch(`/api/projects/${project.id}/estimate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project: estimateRequest.payload, quantity }),
    })
      .then(async (response) => {
        const payload = (await response.json().catch(() => null)) as
          | { estimate?: Estimate | null; message?: string }
          | null;

        if (!response.ok) {
          throw new Error(payload?.message ?? "예상 금액을 계산하지 못했습니다.");
        }

        if (!payload?.estimate) {
          throw new Error("예상 금액을 계산하지 못했습니다.");
        }

        return payload.estimate;
      })
      .then((estimate) => {
        if (!isMountedRef.current || estimateSequenceRef.current !== requestId) {
          return;
        }

        setEstimate(project.id, estimate);
      })
      .catch((error) => {
        if (!isMountedRef.current || estimateSequenceRef.current !== requestId) {
          return;
        }

        setEstimateError(
          error instanceof Error
            ? error.message
            : "예상 금액을 계산하지 못했습니다.",
        );
      })
      .finally(() => {
        if (!isMountedRef.current || estimateSequenceRef.current !== requestId) {
          return;
        }

        setIsEstimating(false);
      });
  }, [
    clearEstimate,
    estimateRequest,
    estimateRetryNonce,
    isPublished,
    project,
    quantity,
    setEstimate,
  ]);


  const handleOrder = async () => {
    if (!project || !isPublished) {
      return;
    }

    if (!project.estimate || project.estimate.quantity !== quantity) {
      alert("주문 전에 최신 금액 계산이 필요합니다.");
      return;
    }

    setIsOrdering(true);

    try {
      const orderResponse = await fetch(`/api/projects/${project.id}/order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          project,
          quantity,
          shipping,
        }),
      });

      const orderPayload = (await orderResponse.json().catch(() => null)) as
        | {
            project: Project;
            order: Order;
            message?: string;
          }
        | null;

      if (!orderResponse.ok || !orderPayload?.project || !orderPayload.order) {
        throw new Error(
          orderPayload?.message ?? "주문을 생성하지 못했습니다.",
        );
      }

      upsertProject(orderPayload.project);
      setOrder(project.id, orderPayload.order);
      router.push(`/orders/${project.id}`);
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "주문 중 오류가 발생했습니다.",
      );
    } finally {
      setIsOrdering(false);
    }
  };

  const handleEstimateRetry = () => {
    if (!project || !isPublished) {
      return;
    }

    lastEstimateRequestKeyRef.current = null;
    clearEstimate(project.id);
    setEstimateError(null);
    setEstimateRetryNonce((current) => current + 1);
  };

  if (!project) {
    return (
      <>
        <Header />
        <main className="px-6 py-16 md:px-0">
          <Container>
            <Card className="bg-surface-container-low p-10 text-center shadow-none">
              <p className="display-copy text-4xl text-foreground">
                결제 정보 없음
              </p>
              <p className="editorial-copy mt-4 text-sm">
                결제를 진행할 프로젝트를 찾지 못했습니다. 새 프로젝트를 만든 뒤
                다시 시도해 주세요.
              </p>
              <div className="mt-8 flex justify-center">
                <Button href="/studio/new">새 프로젝트 만들기</Button>
              </div>
            </Card>
          </Container>
        </main>
      </>
    );
  }

  if (belowMinimumPages) {
    return (
      <>
        <Header />
        <main className="px-6 py-16 md:px-0">
          <Container>
            <Card className="bg-surface-container-low p-10 text-center shadow-none">
              <p className="display-copy text-4xl text-foreground">
                주문 가능 페이지 수 미달
              </p>
              <p className="editorial-copy mt-4 text-sm">
                {`현재 ${derivedPageCount}페이지로, ${project.bookSpecId} 판형의 최소 주문 가능 페이지 수 ${minimumPageCount}페이지를 채우지 못했습니다.`}
              </p>
              <p className="editorial-copy mt-2 text-sm">
                에디터로 돌아가 페이지를 추가한 뒤 다시 진행해 주세요.
              </p>
              <div className="mt-8 flex justify-center gap-3">
                <Button href={`/projects/${project.id}`}>에디터로 돌아가기</Button>
              </div>
            </Card>
          </Container>
        </main>
      </>
    );
  }

  const hasCurrentEstimate = project.estimate?.quantity === quantity;
  const canOrder =
    isPublished &&
    hasCurrentEstimate &&
    !estimateError &&
    !isEstimating &&
    !isOrdering;
  const estimateStatusCopy = estimateError
    ? estimateError
    : isEstimating
      ? "최신 확정 금액을 계산 중입니다."
      : hasCurrentEstimate
        ? ""
        : "주문 전에 최신 금액 계산이 필요합니다.";

  return (
    <>
      <Header />
      <main className="px-6 py-12 md:px-0 md:py-16">
        <Container>
          <header className="mb-14">
            <div className="mb-5">
              <StepIndicator currentStep={3} projectId={params.id} />
            </div>
            <p className="section-label">최종 결제</p>
            <h1 className="display-copy mt-4 text-5xl font-semibold md:text-6xl">
              배송 정보를 확인하고 주문을 마무리하세요
            </h1>
            <p className="editorial-copy mt-4 max-w-2xl text-sm">
              확정 금액을 확인한 뒤 주문을 진행합니다.
            </p>
          </header>

          <div className="grid gap-12 lg:grid-cols-[0.92fr_0.78fr]">
            <section className="space-y-14">
              <div>
                <div className="mb-8 flex items-center gap-3">
                  <span className="display-copy text-3xl">01.</span>
                  <h2 className="section-label text-foreground">배송 정보</h2>
                </div>
                <div className="grid gap-8 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className="section-label block">받는 분</label>
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

              <div className="rounded-2xl bg-[rgba(0,104,85,0.06)] p-6">
                <p className="text-sm font-semibold text-success">
                  출판 완료
                </p>
                <p className="editorial-copy mt-2 text-sm">
                  아래 확정 금액을 확인한 뒤 주문하기를 눌러 주세요.
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
                      {`테마 ${project.templateId}`}
                    </p>
                    <ul className="mt-4 space-y-2 text-sm text-muted">
                      <li>{`${derivedPageCount}페이지`}</li>
                      <li>{project.bookSpecId}</li>
                      <li>{`${quantity}부`}</li>
                    </ul>
                  </div>
                </div>

                <div className="mt-10 rounded-2xl border border-outline/70 bg-surface-container-lowest p-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="section-label text-foreground">확정 금액</p>
                    <p className="text-xs uppercase tracking-[0.18em] text-secondary">
                      출판 완료
                    </p>
                  </div>
                  <div className="mt-5 space-y-4 text-sm">
                    <div className="flex items-center justify-between text-muted">
                      <span>상품금액</span>
                      <span>{formatCurrency(project.estimate?.subtotal)}</span>
                    </div>
                    <div className="flex items-center justify-between text-muted">
                      <span>배송비</span>
                      <span>{formatCurrency(project.estimate?.shippingFee)}</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-outline pt-4 text-2xl font-semibold text-foreground">
                      <span>합계</span>
                      <span>{formatCurrency(project.estimate?.total)}</span>
                    </div>
                  </div>
                  {estimateStatusCopy && (
                    <p className="mt-4 text-sm text-muted">{estimateStatusCopy}</p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setIsPreviewOpen(true)}
                  className="mt-8 w-full rounded-xl border border-outline py-3 text-sm font-medium text-secondary transition hover:border-primary/40 hover:text-primary"
                >
                  미리보기
                </button>

                {isPublished ? (
                  <>
                    <Button
                      type="button"
                      className="mt-3 w-full py-4 text-base"
                      onClick={handleOrder}
                      disabled={!canOrder}
                    >
                      {isOrdering
                        ? "주문 생성 중..."
                        : isEstimating
                          ? "금액 계산 중..."
                          : "주문하기"}
                    </Button>
                  </>
                ) : (
                  <Button
                    type="button"
                    className="mt-3 w-full py-4 text-base"
                    href={`/projects/${project.id}`}
                  >
                    에디터로 돌아가기
                  </Button>
                )}
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
