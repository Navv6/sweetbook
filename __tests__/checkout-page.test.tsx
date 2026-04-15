import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import CheckoutPage from "@/app/checkout/[id]/page";
import { useProjectStore } from "@/store/useProjectStore";
import type { Estimate, Project } from "@/types/project";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "project-1" }),
  useRouter: () => ({ push }),
}));

vi.mock("@/components/layout/Header", () => ({
  Header: () => <div data-testid="header" />,
}));

vi.mock("@/components/layout/Container", () => ({
  Container: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/ui/StepIndicator", () => ({
  StepIndicator: () => <div data-testid="step-indicator" />,
}));

vi.mock("@/components/preview/BookPreviewModal", () => ({
  BookPreviewModal: () => null,
}));

const createEstimate = (quantity: number): Estimate => ({
  currency: "KRW",
  quantity,
  unitPrice: 12000,
  shippingFee: 3000,
  subtotal: 12000 * quantity,
  total: 12000 * quantity + 3000,
  note: "예상 금액",
});

const createProject = (overrides: Partial<Project> = {}): Project => ({
  id: "project-1",
  title: "테스트 북",
  templateId: "구글포토북A",
  bookSpecId: "PHOTOBOOK_A4_SC",
  coverImageUrl: "https://example.com/cover.jpg",
  contentItems: [
    {
      id: "content-1",
      kind: "image",
      title: "이미지 1",
      imageUrl: "https://example.com/photo-1.jpg",
      createdAt: "2026-04-15T00:00:00.000Z",
    },
  ],
  generatedSections: Array.from({ length: 24 }, (_, index) => ({
    id: `section-${index + 1}`,
    title: `Section ${index + 1}`,
    intro: "Intro",
    coverText: "Cover text",
    pages: [
      {
        id: `page-${index + 1}`,
        sectionId: `section-${index + 1}`,
        pageNumber: index + 1,
        kind: index === 0 ? "cover" : "content",
        templateUid: `template-${index + 1}`,
        templateName: `Template ${index + 1}`,
        schema: {
          id: `schema-${index + 1}`,
          name: `Schema ${index + 1}`,
          description: "Schema",
          templateKind: index === 0 ? "cover" : "content",
          theme: "theme",
          bookSpecId: "PHOTOBOOK_A4_SC",
          parameterDefinitions: {},
          layout: {
            width: 1000,
            height: 1000,
            elements: [],
          },
        },
        parameters: {},
        assignedContentItemIds: [],
      },
    ],
  })),
  status: "draft",
  createdAt: "2026-04-15T00:00:00.000Z",
  updatedAt: "2026-04-15T00:00:00.000Z",
  ...overrides,
});

const createDeferred = <T,>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
};

describe("CheckoutPage", () => {
  beforeEach(() => {
    localStorage.clear();
    useProjectStore.setState({ projects: {}, currentProjectId: null });
    push.mockReset();
    vi.stubGlobal("alert", vi.fn());
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("publishes first, then enables ordering after estimate succeeds", async () => {
    const publishedProject = createProject({
      status: "published",
      sweetbookBookUid: "book-1",
      updatedAt: "2026-04-15T01:00:00.000Z",
    });
    const estimateDeferred = createDeferred<{ estimate: Estimate }>();
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input);

      if (url.endsWith("/publish")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ project: publishedProject }),
        });
      }

      if (url.endsWith("/estimate")) {
        return estimateDeferred.promise.then((payload) => ({
          ok: true,
          json: async () => payload,
        }));
      }

      throw new Error(`Unexpected fetch: ${url}`);
    });

    vi.stubGlobal("fetch", fetchMock);
    useProjectStore.getState().upsertProject(createProject());

    render(<CheckoutPage />);

    fireEvent.click(screen.getByRole("button", { name: "출판하기" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));

    const estimatingButton = screen.getByRole("button", {
      name: "예상 금액 계산 중...",
    });
    expect((estimatingButton as HTMLButtonElement).disabled).toBe(true);

    estimateDeferred.resolve({ estimate: createEstimate(1) });

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "주문하기" }),
      ).toBeDefined(),
    );

    const orderButton = screen.getByRole("button", { name: "주문하기" });
    expect((orderButton as HTMLButtonElement).disabled).toBe(false);
    expect(screen.getByText("15,000 KRW")).toBeDefined();
  });

  it("invalidates the current estimate when quantity changes and waits for a refresh", async () => {
    const estimateDeferred = createDeferred<{ estimate: Estimate }>();
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input);

      if (url.endsWith("/estimate")) {
        return estimateDeferred.promise.then((payload) => ({
          ok: true,
          json: async () => payload,
        }));
      }

      throw new Error(`Unexpected fetch: ${url}`);
    });

    vi.stubGlobal("fetch", fetchMock);
    useProjectStore.getState().upsertProject(
      createProject({
        status: "published",
        sweetbookBookUid: "book-1",
        estimate: createEstimate(1),
      }),
    );

    render(<CheckoutPage />);

    expect(fetchMock).toHaveBeenCalledTimes(0);

    fireEvent.change(screen.getAllByRole("spinbutton")[0], {
      target: { value: "2" },
    });

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    const estimatingButton = screen.getByRole("button", {
      name: "예상 금액 계산 중...",
    });
    expect((estimatingButton as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getAllByText("- KRW").length).toBeGreaterThan(0);

    estimateDeferred.resolve({ estimate: createEstimate(2) });

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "주문하기" }),
      ).toBeDefined(),
    );

    const orderButton = screen.getByRole("button", { name: "주문하기" });
    expect((orderButton as HTMLButtonElement).disabled).toBe(false);
    expect(screen.getByText("27,000 KRW")).toBeDefined();
  });
});
