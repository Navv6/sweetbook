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
    name: "A4 소프트커버",
    description: "210 x 297 mm. 이미지 중심 에디토리얼 책에 균형 잡힌 판형.",
    width: 210,
    height: 297,
    minPages: 24,
    maxPages: 130,
    pageStep: 2,
  },
  {
    id: "PHOTOBOOK_A5_SC",
    name: "A5 소프트커버",
    description: "148 x 210 mm. 다이어리와 가벼운 포토북에 적합한 소형 판형.",
    width: 148,
    height: 210,
    minPages: 50,
    maxPages: 200,
    pageStep: 2,
  },
  {
    id: "SQUAREBOOK_HC",
    name: "정사각 하드커버",
    description: "243 x 248 mm. 포트폴리오형 포토북에 어울리는 와이드 판형.",
    width: 243,
    height: 248,
    minPages: 24,
    maxPages: 130,
    pageStep: 2,
  },
];

export const mockDemoCards = [
  {
    title: "콘텐츠 수집",
    description:
      "표지 이미지와 본문 사진 몇 장으로 시작해 완성된 초안을 자동 생성합니다.",
  },
  {
    title: "템플릿 파라미터 편집",
    description:
      "자체 레이아웃이 아닌 실제 SweetBook 템플릿 필드를 직접 조정합니다.",
  },
  {
    title: "출판 및 주문",
    description:
      "Sandbox API 또는 목 모드로 생성·확정·주문 흐름을 동일하게 실행합니다.",
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
    orderStatusDisplay: "주문 생성됨",
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
        itemStatusDisplay: "주문 생성됨",
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
      "목 모드: 실제 결제 없이 결제 흐름을 재현합니다.",
  };
};

export const createDemoContentItems = (): ContentItem[] => [
  {
    id: "demo_1",
    kind: "image",
    title: "카메라",
    imageUrl:
      "https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=800&q=80&auto=format&fit=crop",
    fileName: "demo-camera.jpg",
    createdAt: new Date().toISOString(),
  },
  {
    id: "demo_2",
    kind: "image",
    title: "산",
    imageUrl:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80&auto=format&fit=crop",
    fileName: "demo-mountain.jpg",
    createdAt: new Date().toISOString(),
  },
  {
    id: "demo_3",
    kind: "image",
    title: "인물",
    imageUrl:
      "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800&q=80&auto=format&fit=crop",
    fileName: "demo-portrait.jpg",
    createdAt: new Date().toISOString(),
  },
  {
    id: "demo_4",
    kind: "image",
    title: "여행",
    imageUrl:
      "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80&auto=format&fit=crop",
    fileName: "demo-travel.jpg",
    createdAt: new Date().toISOString(),
  },
  {
    id: "demo_5",
    kind: "image",
    title: "카페",
    imageUrl:
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80&auto=format&fit=crop",
    fileName: "demo-cafe.jpg",
    createdAt: new Date().toISOString(),
  },
  {
    id: "demo_6",
    kind: "image",
    title: "야경",
    imageUrl:
      "https://images.unsplash.com/photo-1474540412665-1cdae210ae6b?w=800&q=80&auto=format&fit=crop",
    fileName: "demo-night.jpg",
    createdAt: new Date().toISOString(),
  },
];
