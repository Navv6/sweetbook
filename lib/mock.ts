import { generateLayout } from "@/lib/layout";
import type {
  BookSpecOption,
  ContentItem,
  Estimate,
  Order,
  Project,
  TemplateOption,
} from "@/types/project";

export const mockTemplates: TemplateOption[] = [
  {
    id: "31LOxBQzsVwo",
    name: "일기장A — A4 소프트커버",
    description: "따뜻한 Taupe 배경, 세리프 서체. 사진과 일기 감성이 어우러지는 에세이 포토북.",
    accentColor: "#9A9088",
    coverLabel: "표지 (A4 소프트커버)",
    thumbnailUrl: "https://api-sandbox.sweetbook.com/templates_thumb/31LOxBQzsVwo/layout.jpg",
  },
  {
    id: "4QNiQs0CmBNZ",
    name: "일기장B — A4 소프트커버",
    description: "깔끔한 모던 레이아웃. 전체 사진과 날짜·제목·본문이 한 화면에 담기는 구성.",
    accentColor: "#2d3748",
    coverLabel: "표지 (A4 소프트커버)",
    thumbnailUrl: "https://api-sandbox.sweetbook.com/templates_thumb/4QNiQs0CmBNZ/layout.jpg",
  },
  {
    id: "41U3TvRGNqyU",
    name: "구글포토북B — A4 소프트커버",
    description: "사진 중심의 깔끔한 포토북 스타일. 넓은 여백과 심플한 타이포그래피.",
    accentColor: "#4a5568",
    coverLabel: "표지 (A4 소프트커버)",
    thumbnailUrl: "https://api-sandbox.sweetbook.com/templates_thumb/41U3TvRGNqyU/layout.jpg",
  },
];

export const mockBookSpecs: BookSpecOption[] = [
  {
    id: "PHOTOBOOK_A4_SC",
    name: "A4 소프트커버 포토북",
    description: "210×297mm. 매거진처럼 텍스트와 페이지 흐름이 살아나는 판형. 24~130페이지.",
    width: 210,
    height: 297,
    minPages: 24,
    maxPages: 130,
    pageStep: 2,
  },
  {
    id: "PHOTOBOOK_A5_SC",
    name: "A5 소프트커버 포토북",
    description: "148×210mm. 손에 쥐기 좋은 소형 포토북. 50~200페이지.",
    width: 148,
    height: 210,
    minPages: 50,
    maxPages: 200,
    pageStep: 2,
  },
  {
    id: "SQUAREBOOK_HC",
    name: "고화질 스퀘어북 (하드커버)",
    description: "243×248mm. 정사각형 하드커버. 사진을 큰 면으로 보여주는 기념 포토북에 적합. 24~130페이지.",
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
    description: "표지 이미지와 본문 사진을 수집하면 기본 프로젝트가 즉시 생성됩니다.",
  },
  {
    title: "AI 큐레이션",
    description: "섹션 제목, 인트로, 페이지 흐름을 정리해 편집 가능한 초안을 만듭니다.",
  },
  {
    title: "출판 및 주문",
    description: "SweetBook Sandbox와 연동해 책 생성, 최종화, 주문 흐름까지 연결합니다.",
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
    orderStatusDisplay: "결제 완료",
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
        itemStatusDisplay: "결제 완료",
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
    note: "Sandbox 또는 mock 모드에서는 실제 결제가 발생하지 않습니다.",
  };
};

export const createDemoContentItems = (): ContentItem[] => [
  {
    id: "demo_1",
    kind: "image",
    title: "일기장A 표지",
    imageUrl: "https://api-sandbox.sweetbook.com/templates_thumb/31LOxBQzsVwo/layout.jpg",
    fileName: "demo-cover-diary-a.jpg",
    createdAt: new Date().toISOString(),
  },
  {
    id: "demo_2",
    kind: "image",
    title: "일기장A 내지",
    imageUrl: "https://api-sandbox.sweetbook.com/templates_thumb/3nWJ4wtPSQOb/layout.jpg",
    fileName: "demo-content-diary-a.jpg",
    createdAt: new Date().toISOString(),
  },
  {
    id: "demo_3",
    kind: "image",
    title: "일기장A 갤러리",
    imageUrl: "https://api-sandbox.sweetbook.com/templates_thumb/msFsr6Ult7qw/layout.jpg",
    fileName: "demo-gallery-diary-a.jpg",
    createdAt: new Date().toISOString(),
  },
  {
    id: "demo_4",
    kind: "image",
    title: "일기장B 표지",
    imageUrl: "https://api-sandbox.sweetbook.com/templates_thumb/4QNiQs0CmBNZ/layout.jpg",
    fileName: "demo-cover-diary-b.jpg",
    createdAt: new Date().toISOString(),
  },
  {
    id: "demo_5",
    kind: "image",
    title: "구글포토북B 표지",
    imageUrl: "https://api-sandbox.sweetbook.com/templates_thumb/41U3TvRGNqyU/layout.jpg",
    fileName: "demo-cover-google-b.jpg",
    createdAt: new Date().toISOString(),
  },
  {
    id: "demo_6",
    kind: "image",
    title: "일기장B 내지",
    imageUrl: "https://api-sandbox.sweetbook.com/templates_thumb/58edh76I0rYa/layout.jpg",
    fileName: "demo-content-diary-b.jpg",
    createdAt: new Date().toISOString(),
  },
];

export const createMockGeneratedLayout = (project: Project) =>
  generateLayout(
    project,
    project.contentItems.length > 0
      ? project.contentItems
      : createDemoContentItems(),
  );
