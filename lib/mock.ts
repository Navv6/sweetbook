import { curatedThemeFamilies } from "@/lib/curated-theme-families";
import type {
  BookSpecOption,
  ContentItem,
  Estimate,
  Order,
  Project,
  TemplateOption,
} from "@/types/project";

export const mockTemplates: TemplateOption[] = curatedThemeFamilies.map(
  (template) => ({
    ...template,
    variants: [...template.variants],
  }),
);

export const mockBookSpecs: BookSpecOption[] = [
  {
    id: "PHOTOBOOK_A4_SC",
    name: "A4 Softcover",
    description: "210 x 297 mm. Balanced for image-led editorial books.",
    width: 210,
    height: 297,
    minPages: 24,
    maxPages: 130,
    pageStep: 2,
  },
  {
    id: "PHOTOBOOK_A5_SC",
    name: "A5 Softcover",
    description: "148 x 210 mm. Compact format for diaries and lighter photo books.",
    width: 148,
    height: 210,
    minPages: 50,
    maxPages: 200,
    pageStep: 2,
  },
  {
    id: "SQUAREBOOK_HC",
    name: "Square Hardcover",
    description: "243 x 248 mm. Wide format suited for portfolio-style photo books.",
    width: 243,
    height: 248,
    minPages: 24,
    maxPages: 130,
    pageStep: 2,
  },
];

export const mockDemoCards = [
  {
    title: "Collect content",
    description:
      "Start from a cover image and a small set of body photos to generate a complete draft.",
  },
  {
    title: "Edit template parameters",
    description:
      "Adjust the actual SweetBook template fields instead of editing a custom draft layout.",
  },
  {
    title: "Publish and order",
    description:
      "Run the same create, finalize, and order flow with either Sandbox APIs or the mock fallback.",
  },
];

export const mockOrderResponse = (
  project: Project,
  quantity: number,
  shipping: {
    recipientName: string;
    recipientPhone: string;
    postalCode: string;
    address1: string;
    address2: string;
    memo: string;
  },
): Order => {
  const subtotal =
    Math.max(project.generatedSections.length * 22000, 44000) * quantity;

  return {
    orderUid: `or_mock_${project.id}`,
    orderStatus: 20,
    orderStatusDisplay: "Order created",
    totalAmount: subtotal + 3000,
    totalProductAmount: subtotal,
    totalShippingFee: 3000,
    recipientName: shipping.recipientName,
    recipientPhone: shipping.recipientPhone,
    postalCode: shipping.postalCode,
    address1: shipping.address1,
    address2: shipping.address2,
    shippingMemo: shipping.memo,
    orderedAt: new Date().toISOString(),
    isTest: true,
    items: [
      {
        itemUid: `oi_mock_${project.id}`,
        bookUid: project.sweetbookBookUid ?? `bk_mock_${project.id}`,
        bookTitle: project.title,
        quantity,
        unitPrice: subtotal,
        itemAmount: subtotal,
        itemStatus: 20,
        itemStatusDisplay: "Order created",
      },
    ],
  };
};

export const buildMockEstimate = (
  project: Project,
  quantity: number,
): Estimate => {
  const pageCount = project.generatedSections.reduce(
    (accumulator, section) => accumulator + section.pages.length,
    0,
  );
  const base = 19800 + pageCount * 950;
  const subtotal = base * quantity;

  return {
    currency: "KRW",
    quantity,
    unitPrice: base,
    shippingFee: 3000,
    subtotal,
    total: subtotal + 3000,
    note:
      "Mock mode reproduces the checkout flow without creating a real payment.",
  };
};

export const createDemoContentItems = (): ContentItem[] => [
  {
    id: "demo_1",
    kind: "image",
    title: "Camera",
    imageUrl:
      "https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=800&q=80&auto=format&fit=crop",
    fileName: "demo-camera.jpg",
    createdAt: new Date().toISOString(),
  },
  {
    id: "demo_2",
    kind: "image",
    title: "Mountain",
    imageUrl:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80&auto=format&fit=crop",
    fileName: "demo-mountain.jpg",
    createdAt: new Date().toISOString(),
  },
  {
    id: "demo_3",
    kind: "image",
    title: "Portrait",
    imageUrl:
      "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800&q=80&auto=format&fit=crop",
    fileName: "demo-portrait.jpg",
    createdAt: new Date().toISOString(),
  },
  {
    id: "demo_4",
    kind: "image",
    title: "Travel",
    imageUrl:
      "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80&auto=format&fit=crop",
    fileName: "demo-travel.jpg",
    createdAt: new Date().toISOString(),
  },
  {
    id: "demo_5",
    kind: "image",
    title: "Cafe",
    imageUrl:
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80&auto=format&fit=crop",
    fileName: "demo-cafe.jpg",
    createdAt: new Date().toISOString(),
  },
  {
    id: "demo_6",
    kind: "image",
    title: "Night",
    imageUrl:
      "https://images.unsplash.com/photo-1474540412665-1cdae210ae6b?w=800&q=80&auto=format&fit=crop",
    fileName: "demo-night.jpg",
    createdAt: new Date().toISOString(),
  },
];
