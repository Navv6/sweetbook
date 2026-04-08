"use client";

import { useParams } from "next/navigation";

import { Container } from "@/components/layout/Container";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useProjectStore } from "@/store/useProjectStore";

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const project = useProjectStore((state) => state.projects[params.id]);

  if (!project?.order) {
    return (
      <>
        <Header />
        <main className="px-6 py-16 md:px-0">
          <Container>
            <Card className="bg-surface-container-low p-10 text-center shadow-none">
              <p className="display-copy text-4xl italic text-foreground">
                {"Order Missing"}
              </p>
              <p className="editorial-copy mt-4 text-sm">
                {
                  "\uC8FC\uBB38 \uC815\uBCF4\uAC00 \uC874\uC7AC\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uC0C8 \uD504\uB85C\uC81D\uD2B8\uB97C \uB9CC\uB4E4\uC5B4 \uD750\uB984\uC744 \uB2E4\uC2DC \uC2DC\uC791\uD574 \uC8FC\uC138\uC694."
                }
              </p>
              <div className="mt-8 flex justify-center gap-3">
                <Button href="/studio/new">
                  {"\uC0C8 \uD504\uB85C\uC81D\uD2B8"}
                </Button>
                <Button href="/" variant="secondary">
                  {"\uB79C\uB529 \uC774\uB3D9"}
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
            <p className="section-label">
              {"\uC8FC\uBB38 \uC0C1\uC138"}
            </p>
            <h1 className="display-copy mt-4 text-5xl font-semibold md:text-6xl">
              {"\uC8FC\uBB38\uC774 \uC0DD\uC131\uB418\uC5C8\uC2B5\uB2C8\uB2E4"}
            </h1>
            <p className="editorial-copy mt-4 max-w-2xl text-sm">
              {
                "\uC774 \uD398\uC774\uC9C0\uB294 SweetBook Sandbox \uAE30\uC900 \uC8FC\uBB38 \uC751\uB2F5\uC744 \uC694\uC57D\uD574 \uBCF4\uC5EC\uC8FC\uB294 \uD30C\uC774\uB110 \uC544\uCE74\uC774\uBE0C \uD654\uBA74\uC785\uB2C8\uB2E4."
              }
            </p>
          </header>

          <div className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr]">
            <section className="space-y-6">
              <Card className="bg-surface-container-low p-8 shadow-none">
                <p className="section-label">
                  {"\uC8FC\uBB38 \uC0C1\uD0DC"}
                </p>
                <p className="display-copy mt-4 text-5xl italic text-foreground">
                  {order.orderStatusDisplay}
                </p>
                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl bg-surface-container-lowest p-5">
                    <p className="section-label">{"Order UID"}</p>
                    <p className="mt-3 break-all text-sm font-semibold text-foreground">
                      {order.orderUid}
                    </p>
                  </div>
                  <div className="rounded-xl bg-surface-container-lowest p-5">
                    <p className="section-label">{"Book UID"}</p>
                    <p className="mt-3 break-all text-sm font-semibold text-foreground">
                      {project.sweetbookBookUid ?? "-"}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="bg-surface-container-low p-8 shadow-none">
                <p className="section-label">
                  {"\uBC30\uC1A1 \uC815\uBCF4"}
                </p>
                <div className="mt-6 space-y-4 text-sm">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted">
                      {"\uC218\uB839\uC778"}
                    </span>
                    <span className="font-semibold text-foreground">
                      {order.recipientName}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted">
                      {"\uC5F0\uB77D\uCC98"}
                    </span>
                    <span className="font-semibold text-foreground">
                      {order.recipientPhone}
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-muted">
                      {"\uC8FC\uC18C"}
                    </span>
                    <span className="max-w-sm text-right font-semibold text-foreground">
                      {order.postalCode} {order.address1} {order.address2}
                    </span>
                  </div>
                </div>
              </Card>
            </section>

            <section className="space-y-6">
              <Card className="bg-surface-container-low p-8 shadow-none">
                <p className="section-label">
                  {"\uC8FC\uBB38 \uD56D\uBAA9"}
                </p>
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
                            {`\uC218\uB7C9 ${item.quantity}\uAD8C \u00B7 ${item.itemStatusDisplay}`}
                          </p>
                        </div>
                        <p className="text-lg font-semibold text-foreground">
                          {item.itemAmount.toLocaleString()}원
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="bg-surface-container-low p-8 shadow-none">
                <div className="flex items-center justify-between">
                  <p className="section-label">
                    {"\uCD1D \uACB0\uC81C \uAE08\uC561"}
                  </p>
                  <p className="text-3xl font-semibold text-foreground">
                    {order.totalAmount.toLocaleString()}원
                  </p>
                </div>
              </Card>
            </section>
          </div>
        </Container>
      </main>
    </>
  );
}
