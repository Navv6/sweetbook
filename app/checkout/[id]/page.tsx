"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Container } from "@/components/layout/Container";
import { Header } from "@/components/layout/Header";
import { BookPreviewModal } from "@/components/preview/BookPreviewModal";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
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
  const [quantity, setQuantity] = useState(1);
  const [shipping, setShipping] = useState<ShippingInfo>({
    recipientName: "\uD64D\uAE38\uB3D9",
    recipientPhone: "010-1234-5678",
    postalCode: "06101",
    address1: "\uC11C\uC6B8\uC2DC \uAC15\uB0A8\uAD6C \uD14C\uD5E4\uB780\uB85C 123",
    address2: "4\uCE35 401\uD638",
    memo: "Sandbox \uD14C\uC2A4\uD2B8 \uC8FC\uBB38",
  });

  const derivedPageCount =
    project?.generatedSections.reduce(
      (accumulator, section) => accumulator + section.pages.length,
      0,
    ) ?? 0;

  // project.id와 quantity가 바뀔 때만 견적 재계산 (setEstimate는 안정적 참조이지만 deps에서 제외)
  useEffect(() => {
    if (!project) {
      return;
    }

    let cancelled = false;

    void fetch(`/api/projects/${project.id}/estimate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project, quantity }),
    })
      .then((r) => r.json())
      .then((payload: { estimate: Project["estimate"] }) => {
        if (!cancelled && payload.estimate) {
          setEstimate(project.id, payload.estimate);
        }
      })
      .catch(() => undefined);

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.id, quantity]);

  const handleCheckout = async () => {
    if (!project) {
      return;
    }

    setIsSubmitting(true);

    try {
      const publishResponse = await fetch(`/api/projects/${project.id}/publish`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ project }),
      });

      if (!publishResponse.ok) {
        const errBody = await publishResponse.json().catch(() => null) as { message?: string } | null;
        throw new Error(errBody?.message ?? "\uCC45 \uBC1C\uD589\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.");
      }

      const publishPayload = (await publishResponse.json()) as {
        project: Project;
        publish: { sweetbookBookUid: string };
      };
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
        const errBody = await orderResponse.json().catch(() => null) as { message?: string } | null;
        throw new Error(errBody?.message ?? "\uC8FC\uBB38 \uC0DD\uC131\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.");
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
          : "\uACB0\uC81C \uCC98\uB9AC \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4.",
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
                {"Checkout Missing"}
              </p>
              <p className="editorial-copy mt-4 text-sm">
                {
                  "\uCCB4\uD06C\uC544\uC6C3 \uD560 \uD504\uB85C\uC81D\uD2B8\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4. \uC0C8 \uD504\uB85C\uC81D\uD2B8\uB97C \uB9CC\uB4E4\uC5B4 \uCD9C\uD310 \uC900\uBE44\uB97C \uC774\uC5B4\uAC00 \uC8FC\uC138\uC694."
                }
              </p>
              <div className="mt-8 flex justify-center">
                <Button href="/studio/new">
                  {"\uC0C8 \uD504\uB85C\uC81D\uD2B8"}
                </Button>
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
            <p className="section-label">
              {"\uD30C\uC774\uB110 \uCCB4\uD06C\uC544\uC6C3"}
            </p>
            <h1 className="display-copy mt-4 text-5xl font-semibold md:text-6xl">
              {"\uCD9C\uD310 \uC900\uBE44\uB97C \uC644\uB8CC\uD558\uC138\uC694"}
            </h1>
            <p className="editorial-copy mt-4 max-w-2xl text-sm">
              {
                "\uC1A1\uC7A5 \uC815\uBCF4\uC640 \uC8FC\uBB38 \uC694\uC57D\uC744 \uD655\uC778\uD558\uACE0, SweetBook Sandbox \uAE30\uC900\uC73C\uB85C \uCC45 \uC0DD\uC131\uACFC \uC8FC\uBB38 \uD750\uB984\uC744 \uC2E4\uD589\uD569\uB2C8\uB2E4."
              }
            </p>
          </header>

          <div className="grid gap-12 lg:grid-cols-[0.92fr_0.78fr]">
            <section className="space-y-14">
              <div>
                <div className="mb-8 flex items-center gap-3">
                  <span className="display-copy text-3xl italic">{"01."}</span>
                  <h2 className="section-label text-foreground">
                    {"\uBC30\uC1A1\uC9C0 \uC785\uB825"}
                  </h2>
                </div>
                <div className="grid gap-8 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className="section-label block">
                      {"\uC218\uB839\uC778 \uC131\uD568"}
                    </label>
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
                    <label className="section-label block">
                      {"\uC8FC\uC18C"}
                    </label>
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
                    <label className="section-label block">
                      {"\uC6B0\uD3B8\uBC88\uD638"}
                    </label>
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
                    <label className="section-label block">
                      {"\uC0C1\uC138 \uC8FC\uC18C"}
                    </label>
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
                    <label className="section-label block">
                      {"\uC5F0\uB77D\uCC98"}
                    </label>
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
                    <label className="section-label block">
                      {"\uC218\uB7C9"}
                    </label>
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
                    <label className="section-label block">
                      {"\uBC30\uC1A1 \uBA54\uBAA8"}
                    </label>
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
                  <span className="display-copy text-3xl italic">{"02."}</span>
                  <h2 className="section-label text-foreground">
                    {"\uACB0\uC81C \uBC0F \uC804\uC1A1 \uC900\uBE44"}
                  </h2>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl bg-surface-container-lowest p-6 shadow-[0_20px_40px_rgba(13,27,52,0.04)]">
                    <p className="text-sm font-semibold text-foreground">
                      {"\uC2E0\uC6A9\uCE74\uB4DC"}
                    </p>
                    <p className="editorial-copy mt-2 text-sm">
                      {"Visa, Mastercard, Amex"}
                    </p>
                  </div>
                  <div className="rounded-xl bg-surface-container-low p-6">
                    <p className="text-sm font-semibold text-foreground">
                      {"\uC0CC\uB4DC\uBC15\uC2A4 \uD14C\uC2A4\uD2B8"}
                    </p>
                    <p className="editorial-copy mt-2 text-sm">
                      {
                        "\uC2E4\uC81C \uACB0\uC81C\uB294 \uBC1C\uC0DD\uD558\uC9C0 \uC54A\uACE0 \uC8FC\uBB38 \uD750\uB984\uB9CC \uAC80\uC99D\uD569\uB2C8\uB2E4."
                      }
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-[rgba(0,104,85,0.06)] p-6">
                <p className="text-sm font-semibold text-success">
                  {"API Readiness Verified"}
                </p>
                <p className="editorial-copy mt-2 text-sm">
                  {
                    "SweetBook API \uC5F0\uB3D9 \uACBD\uB85C\uAC00 \uC900\uBE44\uB418\uC5B4 \uC788\uC2B5\uB2C8\uB2E4. \uC124\uC815\uB41C \uD0A4\uAC00 \uC5C6\uC73C\uBA74 mock \uC751\uB2F5\uC73C\uB85C \uB3D9\uC77C \uD750\uB984\uC744 \uC7AC\uD604\uD569\uB2C8\uB2E4."
                  }
                </p>
              </div>
            </section>

            <aside className="lg:sticky lg:top-28 lg:h-fit">
              <div className="rounded-[2rem] bg-surface-container-low p-8">
                <h2 className="display-copy text-4xl font-semibold">
                  {"\uC8FC\uBB38 \uC694\uC57D"}
                </h2>
                <div className="mt-8 flex gap-6">
                  <div className="w-28 shrink-0 overflow-hidden rounded-sm bg-surface-container-highest">
                    <div
                      className="aspect-[3/4] bg-cover bg-center"
                      style={{
                        backgroundImage: `url(${project.coverImageUrl ?? "/demo/cover-morning.svg"})`,
                      }}
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="display-copy text-3xl leading-tight">
                      {project.title}
                    </p>
                    <p className="mt-3 text-xs uppercase tracking-[0.18em] text-secondary">
                      {project.templateId}
                    </p>
                    <ul className="mt-4 space-y-2 text-sm text-muted">
                      <li>{`${derivedPageCount}\uD398\uC774\uC9C0`}</li>
                      <li>{project.bookSpecId}</li>
                      <li>{`${quantity}\uAD8C \uC8FC\uBB38`}</li>
                    </ul>
                  </div>
                </div>

                <div className="mt-10 space-y-4 border-t border-outline pt-8 text-sm">
                  <div className="flex items-center justify-between text-muted">
                    <span>{"\uC0C1\uD488 \uAE08\uC561"}</span>
                    <span>{project.estimate?.subtotal.toLocaleString() ?? "-"}원</span>
                  </div>
                  <div className="flex items-center justify-between text-muted">
                    <span>{"\uBC30\uC1A1\uBE44"}</span>
                    <span>{project.estimate?.shippingFee.toLocaleString() ?? "-"}원</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-outline pt-4 text-2xl font-semibold text-foreground">
                    <span>{"\uCD1D\uC561"}</span>
                    <span>{project.estimate?.total.toLocaleString() ?? "-"}원</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsPreviewOpen(true)}
                  className="mt-8 w-full rounded-xl border border-outline py-3 text-sm font-medium text-secondary transition hover:border-primary/40 hover:text-primary"
                >
                  {"📖 책 미리보기"}
                </button>

                <Button
                  type="button"
                  className="mt-3 w-full py-4 text-base"
                  onClick={handleCheckout}
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? "출판 및 주문 처리 중..."
                    : "출판하고 주문 생성"}
                </Button>

                <p className="mt-5 text-center text-[11px] uppercase tracking-[0.2em] text-secondary">
                  {"Powered by SweetBook Sandbox"}
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
