import { describe, expect, it } from "vitest";

import { applyWebhookEventToProject } from "@/lib/webhook";
import type { Project } from "@/types/project";

const baseProject: Project = {
  id: "project-1",
  title: "Sweet Memories",
  templateId: "tpl-1",
  bookSpecId: "PHOTOBOOK_A4_SC",
  contentItems: [],
  generatedSections: [],
  status: "ordered",
  sweetbookBookUid: "book-1",
  sweetbookOrderUid: "order-1",
  createdAt: "2026-04-09T00:00:00.000Z",
  updatedAt: "2026-04-09T00:00:00.000Z",
  order: {
    orderUid: "order-1",
    orderStatus: 20,
    orderStatusDisplay: "Order created",
    totalAmount: 23000,
    totalProductAmount: 20000,
    totalShippingFee: 3000,
    recipientName: "Tester",
    recipientPhone: "010-0000-0000",
    postalCode: "06101",
    address1: "Seoul",
    address2: "101",
    shippingMemo: "",
    orderedAt: "2026-04-09T00:00:00.000Z",
    items: [
      {
        itemUid: "item-1",
        bookUid: "book-1",
        bookTitle: "Sweet Memories",
        quantity: 1,
        unitPrice: 20000,
        itemAmount: 20000,
        itemStatus: 20,
        itemStatusDisplay: "Order created",
      },
    ],
  },
};

describe("applyWebhookEventToProject", () => {
  it("updates the order display status and timeline", () => {
    const nextProject = applyWebhookEventToProject(baseProject, {
      event: "shipping.departed",
      deliveryId: "delivery-1",
      timestamp: 1_775_664_000,
      data: {
        orderUid: "order-1",
        bookUid: "book-1",
        trackingNumber: "TRACK-1234",
      },
    });

    expect(nextProject.order?.orderStatusDisplay).toBe("Shipping departed");
    expect(nextProject.order?.items[0]?.itemStatusDisplay).toBe("Shipping departed");
    expect(nextProject.webhookEvents).toHaveLength(1);
    expect(nextProject.webhookEvents?.[0]?.trackingNumber).toBe("TRACK-1234");
  });
});
