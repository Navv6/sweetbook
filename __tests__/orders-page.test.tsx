import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import OrderDetailPage from "@/app/orders/[id]/page";
import { useProjectStore } from "@/store/useProjectStore";
import type { Project } from "@/types/project";

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "project-1" }),
}));

vi.mock("@/components/layout/Header", () => ({
  Header: () => <div data-testid="header" />,
}));

vi.mock("@/components/layout/Container", () => ({
  Container: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/ui/SoundtrackQR", () => ({
  SoundtrackQR: () => <div data-testid="soundtrack-qr" />,
}));

const createOrderedProject = (): Project => ({
  id: "project-1",
  title: "주문 완료 북",
  templateId: "구글포토북A",
  bookSpecId: "PHOTOBOOK_A4_SC",
  coverImageUrl: "https://example.com/cover.jpg",
  contentItems: [],
  generatedSections: [],
  status: "ordered",
  sweetbookBookUid: "book-1",
  sweetbookOrderUid: "order-1",
  createdAt: "2026-04-15T00:00:00.000Z",
  updatedAt: "2026-04-15T00:00:00.000Z",
  order: {
    orderUid: "order-1",
    orderStatus: 10,
    orderStatusDisplay: "결제 완료",
    totalAmount: 51000,
    totalProductAmount: 48000,
    totalShippingFee: 3000,
    recipientName: "홍길동",
    recipientPhone: "010-1234-5678",
    postalCode: "06101",
    address1: "서울시 강남구 테헤란로 123",
    address2: "4층 401호",
    shippingMemo: "문 앞에 놓아주세요",
    orderedAt: "2026-04-15T01:00:00.000Z",
    items: [
      {
        itemUid: "item-1",
        bookUid: "book-1",
        bookTitle: "주문 완료 북",
        quantity: 2,
        unitPrice: 24000,
        itemAmount: 48000,
        itemStatus: 10,
        itemStatusDisplay: "주문 접수",
      },
    ],
  },
  webhookEvents: [],
});

describe("OrderDetailPage", () => {
  beforeEach(() => {
    localStorage.clear();
    useProjectStore.setState({ projects: {}, currentProjectId: null });
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it(
    "shows final order prices and polls faster during the first minute",
    async () => {
      const project = createOrderedProject();
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ project }),
      });

    vi.stubGlobal("fetch", fetchMock);
    useProjectStore.getState().upsertProject(project);

    render(<OrderDetailPage />);

    expect(screen.getByText("확정 상품금액")).toBeDefined();
    expect(screen.getByText("확정 배송비")).toBeDefined();
    expect(screen.getByText("최종 결제금액")).toBeDefined();
    expect(screen.getByText("51,000 KRW")).toBeDefined();

      await Promise.resolve();
      await Promise.resolve();
      expect(fetchMock).toHaveBeenCalledTimes(1);

      await vi.advanceTimersByTimeAsync(60_000);
      expect(fetchMock.mock.calls.length).toBeGreaterThanOrEqual(13);

      const countAtMinute = fetchMock.mock.calls.length;
      await vi.advanceTimersByTimeAsync(14_000);
      expect(fetchMock.mock.calls.length).toBe(countAtMinute);

      await vi.advanceTimersByTimeAsync(1_000);
      expect(fetchMock.mock.calls.length).toBe(countAtMinute + 1);
    },
    10000,
  );
});
