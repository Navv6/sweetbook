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
    recipientName: "Hong Gildong",
    recipientPhone: "010-1234-5678",
    postalCode: "06101",
    address1: "123 Teheran-ro, Gangnam-gu, Seoul",
    address2: "4F 401",
    memo: "Sandbox test order",
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
          throw new Error(errBody?.message ?? "Failed to publish the book.");
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
        throw new Error(errBody?.message ?? "Failed to create the order.");
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
          : "An unexpected error occurred during checkout.",
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
                Checkout Missing
              </p>
              <p className="editorial-copy mt-4 text-sm">
                There is no generated project to check out. Create a new project
                and generate the template pages first.
              </p>
              <div className="mt-8 flex justify-center">
                <Button href="/studio/new">New Project</Button>
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
            <p className="section-label">Final Checkout</p>
            <h1 className="display-copy mt-4 text-5xl font-semibold md:text-6xl">
              Confirm shipping and place the order
            </h1>
            <p className="editorial-copy mt-4 max-w-2xl text-sm">
              This screen runs the publish and order sequence against the
              SweetBook Sandbox API.
            </p>
          </header>

          <div className="grid gap-12 lg:grid-cols-[0.92fr_0.78fr]">
            <section className="space-y-14">
              <div>
                <div className="mb-8 flex items-center gap-3">
                  <span className="display-copy text-3xl italic">01.</span>
                  <h2 className="section-label text-foreground">Shipping</h2>
                </div>
                <div className="grid gap-8 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className="section-label block">Recipient</label>
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
                    <label className="section-label block">Address</label>
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
                    <label className="section-label block">Postal Code</label>
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
                    <label className="section-label block">Address 2</label>
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
                    <label className="section-label block">Phone</label>
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
                    <label className="section-label block">Quantity</label>
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
                    <label className="section-label block">Memo</label>
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
                  <h2 className="section-label text-foreground">Execution</h2>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl bg-surface-container-lowest p-6 shadow-[0_20px_40px_rgba(13,27,52,0.04)]">
                    <p className="text-sm font-semibold text-foreground">
                      Publish
                    </p>
                    <p className="editorial-copy mt-2 text-sm">
                      The schema-driven pages are sent directly to the SweetBook
                      cover and contents endpoints.
                    </p>
                  </div>
                  <div className="rounded-xl bg-surface-container-low p-6">
                    <p className="text-sm font-semibold text-foreground">
                      Sandbox
                    </p>
                    <p className="editorial-copy mt-2 text-sm">
                      API credentials are required to estimate, publish, and order.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-[rgba(0,104,85,0.06)] p-6">
                <p className="text-sm font-semibold text-success">
                  Template Schema Ready
                </p>
                <p className="editorial-copy mt-2 text-sm">
                  The project is using schema-generated pages and will publish those
                  exact template instances.
                </p>
              </div>
            </section>

            <aside className="lg:sticky lg:top-28 lg:h-fit">
              <div className="rounded-[2rem] bg-surface-container-low p-8">
                <h2 className="display-copy text-4xl font-semibold">
                  Order Summary
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
                      {`Theme family · ${project.templateId}`}
                    </p>
                    <ul className="mt-4 space-y-2 text-sm text-muted">
                      <li>{`${derivedPageCount} pages`}</li>
                      <li>{project.bookSpecId}</li>
                      <li>{`${quantity} copy${quantity === 1 ? "" : "ies"}`}</li>
                    </ul>
                  </div>
                </div>

                <div className="mt-10 space-y-4 border-t border-outline pt-8 text-sm">
                  <div className="flex items-center justify-between text-muted">
                    <span>Subtotal</span>
                    <span>{project.estimate?.subtotal.toLocaleString() ?? "-"} KRW</span>
                  </div>
                  <div className="flex items-center justify-between text-muted">
                    <span>Shipping</span>
                    <span>{project.estimate?.shippingFee.toLocaleString() ?? "-"} KRW</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-outline pt-4 text-2xl font-semibold text-foreground">
                    <span>Total</span>
                    <span>{project.estimate?.total.toLocaleString() ?? "-"} KRW</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsPreviewOpen(true)}
                  className="mt-8 w-full rounded-xl border border-outline py-3 text-sm font-medium text-secondary transition hover:border-primary/40 hover:text-primary"
                >
                  Open Preview
                </button>

                <Button
                  type="button"
                  className="mt-3 w-full py-4 text-base"
                  onClick={handleCheckout}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Publishing and ordering..." : "Publish and Order"}
                </Button>

                <p className="mt-5 text-center text-[11px] uppercase tracking-[0.2em] text-secondary">
                  Powered by SweetBook Sandbox
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
