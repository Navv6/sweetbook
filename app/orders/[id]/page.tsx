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
        // local-first fallback
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
                Order Syncing
              </p>
              <p className="editorial-copy mt-4 text-sm">
                Syncing the latest order data and webhook timeline from the server.
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
                Order Missing
              </p>
              <p className="editorial-copy mt-4 text-sm">
                No order record is available. Start a new project and run the flow
                again from the studio.
              </p>
              <div className="mt-8 flex justify-center gap-3">
                <Button href="/studio/new">New Project</Button>
                <Button href="/" variant="secondary">
                  Home
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
            <p className="section-label">Order Detail</p>
            <h1 className="display-copy mt-4 text-5xl font-semibold md:text-6xl">
              The order has been created
            </h1>
            <p className="editorial-copy mt-4 max-w-2xl text-sm">
              This page summarizes the SweetBook Sandbox order response and keeps
              listening for webhook-driven status updates.
            </p>
          </header>

          <div className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr]">
            <section className="space-y-6">
              <Card className="bg-surface-container-low p-8 shadow-none">
                <p className="section-label">Order Status</p>
                <p className="display-copy mt-4 text-5xl italic text-foreground">
                  {order.orderStatusDisplay}
                </p>
                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl bg-surface-container-lowest p-5">
                    <p className="section-label">Order UID</p>
                    <p className="mt-3 break-all text-sm font-semibold text-foreground">
                      {order.orderUid}
                    </p>
                  </div>
                  <div className="rounded-xl bg-surface-container-lowest p-5">
                    <p className="section-label">Book UID</p>
                    <p className="mt-3 break-all text-sm font-semibold text-foreground">
                      {project.sweetbookBookUid ?? "-"}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="bg-surface-container-low p-8 shadow-none">
                <p className="section-label">Shipping</p>
                <div className="mt-6 space-y-4 text-sm">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted">Recipient</span>
                    <span className="font-semibold text-foreground">
                      {order.recipientName}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted">Phone</span>
                    <span className="font-semibold text-foreground">
                      {order.recipientPhone}
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-muted">Address</span>
                    <span className="max-w-sm text-right font-semibold text-foreground">
                      {order.postalCode} {order.address1} {order.address2}
                    </span>
                  </div>
                </div>
              </Card>
            </section>

            <section className="space-y-6">
              <Card className="bg-surface-container-low p-8 shadow-none">
                <p className="section-label">Items</p>
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
                            {`Qty ${item.quantity} · ${item.itemStatusDisplay}`}
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
                  <p className="section-label">Total</p>
                  <p className="text-3xl font-semibold text-foreground">
                    {order.totalAmount.toLocaleString()} KRW
                  </p>
                </div>
              </Card>

              <Card className="bg-surface-container-low p-8 shadow-none">
                <div className="flex items-center justify-between gap-4">
                  <p className="section-label">Webhook Timeline</p>
                  <p className="text-xs uppercase tracking-[0.18em] text-secondary">
                    Auto refresh every 15s
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
                            {event.orderUid && <p>{`Order: ${event.orderUid}`}</p>}
                            {event.bookUid && <p>{`Book: ${event.bookUid}`}</p>}
                            {event.trackingNumber && (
                              <p>{`Tracking: ${event.trackingNumber}`}</p>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl bg-surface-container-lowest p-5 text-sm text-muted">
                      Webhook events will appear here after SweetBook sends status
                      updates for production or shipping.
                    </div>
                  )}
                </div>
              </Card>
            </section>
          </div>

          <section className="mt-16">
            <div
              className="rounded-2xl p-10 flex flex-col items-center gap-6"
              style={{
                background:
                  "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
              }}
            >
              <div className="text-center">
                <p
                  className="text-xs uppercase tracking-[0.25em]"
                  style={{ color: "rgba(255,255,255,0.4)" }}
                >
                  AI Soundtrack
                </p>
                <h2
                  className="mt-2 text-xl font-semibold"
                  style={{ color: "rgba(255,255,255,0.9)" }}
                >
                  Listen to the book
                </h2>
                <p
                  className="mt-3 text-sm"
                  style={{ color: "rgba(255,255,255,0.5)" }}
                >
                  Scan the QR code to open the lightweight soundtrack page for this
                  project.
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
